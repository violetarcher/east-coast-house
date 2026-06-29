'use client';

import { useState, useEffect } from 'react';
import { HOME_ASSESSMENTS } from '@/lib/personas';
import type { LogEntry } from './FGALogger';

interface HomeAssessmentsProps {
  userId: string;
  onLog: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
}

type Assessment = typeof HOME_ASSESSMENTS[number];
type Results = Record<string, { can_view: boolean; can_manage: boolean }>;

function safeId(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export default function HomeAssessments({ userId, onLog }: HomeAssessmentsProps) {
  const [visible, setVisible] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Results>({});

  // Discover accessible assessments via batch check, then persist results
  useEffect(() => {
    setLoading(true);
    setVisible([]);
    setResults({});

    const checks = HOME_ASSESSMENTS.flatMap((a) => [
      { user: `user:${userId}`, relation: 'can_view',   object: a.id, correlationId: `${safeId(a.id)}_view`   },
      { user: `user:${userId}`, relation: 'can_manage', object: a.id, correlationId: `${safeId(a.id)}_manage` },
    ]);

    fetch('/api/fga/batchcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checks }),
    })
      .then((r) => r.json())
      .then((data) => {
        const next: Results = {};
        const accessible: Assessment[] = [];
        const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        HOME_ASSESSMENTS.forEach((a) => {
          const canView   = data.results?.[`${safeId(a.id)}_view`]?.allowed   ?? false;
          const canManage = data.results?.[`${safeId(a.id)}_manage`]?.allowed ?? false;
          next[a.id] = { can_view: canView, can_manage: canManage };
          if (canView) {
            accessible.push(a);
            onLog({ user: `user:${userId}`, relation: 'can_view',   object: a.id, allowed: true,     batchId, batchLabel: 'Home Assessments' });
            onLog({ user: `user:${userId}`, relation: 'can_manage', object: a.id, allowed: canManage, batchId, batchLabel: 'Home Assessments' });
          }
        });

        setResults(next);
        setVisible(accessible);
      })
      .finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <p className="text-xs text-gray-400 animate-pulse px-1">Checking assessments…</p>;
  }

  if (visible.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center">
        <p className="text-sm text-gray-400">No home assessments accessible for <span className="font-mono">user:{userId}</span></p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((assessment) => {
        const r = results[assessment.id];
        return (
          <div key={assessment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-lg">{assessment.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{assessment.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{assessment.summary}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{assessment.id}</p>
              </div>
              {r && (
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge label="can_view"   allowed={r.can_view}   />
                  <Badge label="can_manage" allowed={r.can_manage} />
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
              <p className="text-[11px] font-mono text-gray-400">
                <span className="text-gray-500">relation:</span>{' '}
                <span className="text-purple-600">owner</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-500">grants:</span>{' '}
                <span className="text-blue-600">can_view, can_manage</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Badge({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold font-mono ${
      allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      {label}: {allowed ? '✓' : '✗'}
    </span>
  );
}
