'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LogEntry } from './FGALogger';
import { PROPERTY_LABELS } from '@/lib/personas';
import DelegateCard from './DelegateCard';

interface PermissionResult {
  label: string;
  relation: string;
  object: string;
  correlationId: string;
  allowed: boolean | null;
  icon: string;
}

interface PropertyDashboardProps {
  userId: string;
  property: string;
  isAuthorizedRep?: boolean;
  grantingPersonaName?: string; // when set, shows the delegate card
  onLog: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
}

const PERMISSION_CHECKS = (property: string, projectId: string, quoteId: string): Omit<PermissionResult, 'allowed'>[] => [
  { label: 'View property',     relation: 'can_view',             object: property,   icon: '👁',  correlationId: 'prop-view'   },
  { label: 'Book consultation', relation: 'can_book_consultation', object: property,   icon: '📅', correlationId: 'prop-book'   },
  { label: 'View financials',   relation: 'can_view_financials',  object: property,   icon: '💰',  correlationId: 'prop-fin'    },
  { label: 'Approve work',      relation: 'can_approve_work',     object: property,   icon: '✅',  correlationId: 'prop-appr'   },
  { label: 'Cancel project',    relation: 'can_cancel_project',   object: property,   icon: '🚫',  correlationId: 'prop-cancel' },
  { label: 'Manage users',      relation: 'can_manage_users',     object: property,   icon: '👥',  correlationId: 'prop-users'  },
  { label: 'Delete account',    relation: 'can_delete',           object: property,   icon: '🗑',  correlationId: 'prop-del'    },
  { label: 'View project',      relation: 'can_view',             object: projectId,  icon: '🔨',  correlationId: 'proj-view'   },
  { label: 'Manage project',    relation: 'can_manage',           object: projectId,  icon: '⚙️', correlationId: 'proj-manage' },
  { label: 'View quote',        relation: 'can_view',             object: quoteId,    icon: '📄',  correlationId: 'quote-view'  },
  { label: 'Approve quote',     relation: 'can_approve',          object: quoteId,    icon: '📝',  correlationId: 'quote-appr'  },
];

const PROPERTY_PROJECTS: Record<string, { projectId: string; quoteId: string; label: string }> = {
  'property:oak-street': { projectId: 'project:oak-bathroom-remodel', quoteId: 'quote:oak-bathroom-q1', label: 'Bathroom Remodel' },
  'property:elm-ave':    { projectId: 'project:elm-window-replace',   quoteId: 'quote:elm-windows-q1',  label: 'Window Replacement' },
};

export default function PropertyDashboard({ userId, property, isAuthorizedRep, grantingPersonaName, onLog }: PropertyDashboardProps) {
  const [results, setResults] = useState<PermissionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [simExpired, setSimExpired] = useState(false);

  const proj = PROPERTY_PROJECTS[property] ?? null;

  const runChecks = useCallback(async () => {
    setLoading(true);
    const checkDefs = proj
      ? PERMISSION_CHECKS(property, proj.projectId, proj.quoteId)
      : PERMISSION_CHECKS(property, '', '').slice(0, 7);
    const context = isAuthorizedRep
      ? { current_time: simExpired ? '2026-10-01T10:00:00Z' : '2026-07-01T10:00:00Z' }
      : undefined;

    const checks = checkDefs.map((c) => ({
      user: `user:${userId}`,
      relation: c.relation,
      object: c.object,
      correlationId: c.correlationId,
      ...(context ? { context } : {}),
    }));

    try {
      const res = await fetch('/api/fga/batchcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checks }),
      });
      const data = await res.json();
      const byId = data.results as Record<string, { allowed: boolean }>;
      const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const batchLabel = PROPERTY_LABELS[property] ?? property;

      const settled = checkDefs.map((c) => {
        const allowed = byId[c.correlationId]?.allowed ?? null;
        onLog({ user: `user:${userId}`, relation: c.relation, object: c.object, allowed: allowed ?? false, context, batchId, batchLabel });
        return { ...c, allowed };
      });
      setResults(settled);
    } catch {
      setResults(checkDefs.map((c) => ({ ...c, allowed: null })));
    } finally {
      setLoading(false);
    }
  }, [userId, property, isAuthorizedRep, simExpired, proj, onLog]);

  useEffect(() => { runChecks(); }, [runChecks]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-900">{PROPERTY_LABELS[property] ?? property}</h3>
          {proj && <p className="text-xs text-gray-500 mt-0.5">Active project: {proj.label}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isAuthorizedRep && (
            <button
              onClick={() => setSimExpired((v) => !v)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${
                simExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {simExpired ? '⏱ Expired' : '⏱ Active'}
            </button>
          )}
          <button
            onClick={runChecks}
            disabled={loading}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Re-check'}
          </button>
        </div>
      </div>

      {isAuthorizedRep && (
        <div className={`px-4 py-2 text-xs border-b ${simExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {simExpired
            ? '⚠ context.current_time = 2026-10-01 — past grant_expires_at, condition evaluates false'
            : '⏰ context.current_time = 2026-07-01 — within valid delegation window'}
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {loading
          ? Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-100 rounded w-32" />
                <div className="ml-auto h-5 bg-gray-100 rounded w-16" />
              </div>
            ))
          : results.map((r) => (
              <div key={r.correlationId} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-base w-5 text-center">{r.icon}</span>
                <span className="text-sm text-gray-700 flex-1">{r.label}</span>
                <span className="text-xs text-gray-400 font-mono mr-2 hidden sm:block">{r.relation}</span>
                {r.allowed === null ? (
                  <span className="text-xs text-gray-400">error</span>
                ) : (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    r.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {r.allowed ? 'allowed' : 'denied'}
                  </span>
                )}
              </div>
            ))}
      </div>

      {grantingPersonaName && (
        <DelegateCard
          propertyId={property}
          propertyLabel={PROPERTY_LABELS[property] ?? property}
          grantingPersonaName={grantingPersonaName}
          onLog={onLog}
        />
      )}
    </div>
  );
}
