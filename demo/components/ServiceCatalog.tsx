'use client';

import { useState } from 'react';
import { SERVICE_CATALOG } from '@/lib/personas';
import type { LogEntry } from './FGALogger';

interface ServiceCatalogProps {
  userId: string;
  onLog: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
}

type ResultMap = Record<string, boolean>;

// FGA correlationId must not contain colons. Strip them and keep a reverse map.
function safeCorrelationId(objectId: string): string {
  return objectId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function runBatchCheck(
  checks: Array<{ user: string; relation: string; object: string; context?: object }>
): Promise<Record<string, boolean>> {
  // Build safe correlation IDs and a map back to original object IDs
  const safeToObject: Record<string, string> = {};
  const safeChecks = checks.map((c) => {
    const cid = safeCorrelationId(c.object);
    safeToObject[cid] = c.object;
    return { ...c, correlationId: cid };
  });

  const res = await fetch('/api/fga/batchcheck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checks: safeChecks }),
  });
  const data = await res.json();
  if (!data.results) throw new Error(data.error ?? 'batchCheck failed');

  // Remap safe correlation IDs back to original object IDs
  return Object.fromEntries(
    Object.entries(data.results as Record<string, { allowed: boolean }>).map(
      ([cid, v]) => [safeToObject[cid] ?? cid, v.allowed]
    )
  );
}

export default function ServiceCatalog({ userId, onLog }: ServiceCatalogProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checking, setChecking] = useState<'all' | string | null>(null);
  const [results, setResults] = useState<ResultMap>({});

  const logResults = (newResults: Record<string, boolean>, batchId: string, batchLabel: string) => {
    Object.entries(newResults).forEach(([serviceId, allowed]) =>
      onLog({ user: `user:${userId}`, relation: 'can_view', object: serviceId, allowed, batchId, batchLabel })
    );
  };

  const checkCategory = async (categoryId: string, services: typeof SERVICE_CATALOG[0]['services'], categoryLabel: string) => {
    setChecking(categoryId);
    const checks = services.map((s) => ({
      user: `user:${userId}`,
      relation: 'can_view',
      object: s.id,
    }));
    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newResults = await runBatchCheck(checks);
    logResults(newResults, batchId, categoryLabel);
    setResults((prev) => ({ ...prev, ...newResults }));
    setChecking(null);
  };

  const checkAll = async () => {
    setChecking('all');
    const checks = SERVICE_CATALOG.flatMap((cat) =>
      cat.services.map((s) => ({
        user: `user:${userId}`,
        relation: 'can_view',
        object: s.id,
      }))
    );
    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newResults = await runBatchCheck(checks);
    logResults(newResults, batchId, 'All Services');
    setResults(newResults);
    setChecking(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={checkAll}
          disabled={checking !== null}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          {checking === 'all' ? '…checking all' : 'Check All Services'}
        </button>
      </div>

      {SERVICE_CATALOG.map((cat) => {
        const isCatChecking = checking === cat.id || checking === 'all';
        const allChecked = cat.services.every((s) => results[s.id] !== undefined);

        return (
          <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                className="flex items-center gap-2 flex-1 text-left hover:opacity-75 transition-opacity"
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="font-semibold text-gray-900">{cat.label}</span>
                <span className="text-gray-400 text-xs ml-1">{expanded === cat.id ? '▲' : '▼'}</span>
              </button>
              <button
                onClick={() => checkCategory(cat.id, cat.services, cat.label)}
                disabled={checking !== null}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors shrink-0 disabled:opacity-40 ${
                  allChecked
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
              >
                {isCatChecking ? '…' : allChecked ? '✓ Re-check' : `Check ${cat.services.length}`}
              </button>
            </div>

            {expanded === cat.id && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {cat.services.map((svc) => {
                  const result = results[svc.id];
                  return (
                    <div key={svc.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{svc.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{svc.desc}</p>
                      </div>
                      {isCatChecking && result === undefined ? (
                        <span className="text-xs text-gray-400 animate-pulse shrink-0">checking…</span>
                      ) : result !== undefined ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                          result ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {result ? 'allowed' : 'denied'}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
