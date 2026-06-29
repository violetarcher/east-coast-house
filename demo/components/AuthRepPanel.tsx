'use client';

import { useState, useEffect, useCallback } from 'react';
import { AUTH_REP_PROPERTIES } from '@/lib/personas';
import PropertyDashboard from './PropertyDashboard';
import type { LogEntry } from './FGALogger';

interface DelegationState {
  hasAccess: boolean;
  expiresAt: string | null;
  loading: boolean;
}

interface AuthRepPanelProps {
  userId: string;
  grantingPersonaName: string; // the currently active persona who performs the grant
  onLog: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
}

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

export default function AuthRepPanel({ userId, grantingPersonaName, onLog }: AuthRepPanelProps) {
  const [delegation, setDelegation] = useState<Record<string, DelegationState>>({});
  const [expiryInputs, setExpiryInputs] = useState<Record<string, string>>({});
  const [grantedBy, setGrantedBy] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const checkAccess = useCallback(async (propertyId: string) => {
    const now = new Date().toISOString();
    const res = await fetch('/api/fga/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: `user:${userId}`,
        relation: 'can_view',
        object: propertyId,
        context: { current_time: now },
      }),
    });
    const data = await res.json();
    return data.allowed as boolean;
  }, [userId]);

  // On mount: check current access for each property
  useEffect(() => {
    AUTH_REP_PROPERTIES.forEach(async (prop) => {
      const hasAccess = await checkAccess(prop.id);
      setDelegation((prev) => ({
        ...prev,
        [prop.id]: { hasAccess, expiresAt: null, loading: false },
      }));
      setExpiryInputs((prev) => ({ ...prev, [prop.id]: defaultExpiry() }));
      if (hasAccess) setExpanded(prop.id);
    });
  }, [userId, checkAccess]);

  const handleGrant = async (propertyId: string) => {
    const expiry = expiryInputs[propertyId] ?? defaultExpiry();
    const expiresAt = `${expiry}T23:59:59Z`;

    setDelegation((prev) => ({ ...prev, [propertyId]: { ...prev[propertyId], loading: true } }));

    const res = await fetch('/api/fga/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: `user:${userId}`,
        relation: 'authorized_rep',
        object: propertyId,
        condition: { name: 'time_bound', context: { grant_expires_at: expiresAt } },
      }),
    });

    if (res.ok) {
      const writtenAt = new Date().toLocaleTimeString();
      onLog({
        user: `user:${userId}`,
        relation: 'authorized_rep',
        object: propertyId,
        allowed: true,
        note: `granted by ${grantingPersonaName} @ ${writtenAt} · expires ${expiry}`,
      });
      const hasAccess = await checkAccess(propertyId);
      setGrantedBy((prev) => ({ ...prev, [propertyId]: grantingPersonaName }));
      setDelegation((prev) => ({ ...prev, [propertyId]: { hasAccess, expiresAt, loading: false } }));
      setExpanded(propertyId);
    } else {
      setDelegation((prev) => ({ ...prev, [propertyId]: { ...prev[propertyId], loading: false } }));
    }
  };

  const handleRevoke = async (propertyId: string) => {
    setDelegation((prev) => ({ ...prev, [propertyId]: { ...prev[propertyId], loading: true } }));

    const res = await fetch('/api/fga/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: `user:${userId}`, relation: 'authorized_rep', object: propertyId }),
    });

    if (res.ok) {
      const revokedAt = new Date().toLocaleTimeString();
      onLog({
        user: `user:${userId}`,
        relation: 'authorized_rep',
        object: propertyId,
        allowed: false,
        note: `tuple deleted @ ${revokedAt} · access revoked`,
      });
      setGrantedBy((prev) => { const n = { ...prev }; delete n[propertyId]; return n; });
      setDelegation((prev) => ({ ...prev, [propertyId]: { hasAccess: false, expiresAt: null, loading: false } }));
      if (expanded === propertyId) setExpanded(null);
    } else {
      setDelegation((prev) => ({ ...prev, [propertyId]: { ...prev[propertyId], loading: false } }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">Legal Delegation Panel</p>
        <p className="text-xs mt-0.5 text-amber-700">
          Michael has no active property access. Grant time-bound delegation — FGA writes a conditional
          tuple in real-time with your chosen expiry.
        </p>
      </div>

      {AUTH_REP_PROPERTIES.map((prop) => {
        const state = delegation[prop.id];
        const isLoading = state?.loading ?? false;
        const hasAccess = state?.hasAccess ?? false;
        const expiresAt = state?.expiresAt;
        const expiry = expiryInputs[prop.id] ?? defaultExpiry();
        const isExpanded = expanded === prop.id && hasAccess;

        return (
          <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Property header */}
            <div className="px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🏠</span>
                  <span className="font-semibold text-gray-900">{prop.label}</span>
                  {hasAccess && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 ml-6">
                  {prop.owner} · {prop.ownerRole}
                </p>
              </div>

              {hasAccess ? (
                <button
                  onClick={() => handleRevoke(prop.id)}
                  disabled={isLoading}
                  className="shrink-0 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? '…' : 'Revoke'}
                </button>
              ) : (
                <span className="shrink-0 text-xs text-gray-500 italic">No access</span>
              )}
            </div>

            {/* Tuple detail when active */}
            {hasAccess && expiresAt && (
              <div className="mx-4 mb-3 bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs">
                <p className="text-gray-500 mb-1">// Active tuple in FGA store</p>
                <p><span className="text-yellow-300">user</span><span className="text-gray-400">:      </span><span className="text-cyan-300">user:{userId}</span></p>
                <p><span className="text-yellow-300">relation</span><span className="text-gray-400">:  </span><span className="text-purple-300">authorized_rep</span></p>
                <p><span className="text-yellow-300">object</span><span className="text-gray-400">:    </span><span className="text-green-300">{prop.id}</span></p>
                <p><span className="text-yellow-300">condition</span><span className="text-gray-400">: </span>
                  <span className="text-orange-300">time_bound</span>
                  <span className="text-gray-400"> › </span>
                  <span className="text-pink-300">grant_expires_at: {expiresAt}</span>
                </p>
                {grantedBy[prop.id] && (
                  <p className="text-gray-500 mt-1">// granted by: {grantedBy[prop.id]}</p>
                )}
              </div>
            )}

            {/* Grant form when no access */}
            {!hasAccess && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Delegation expires
                    </label>
                    <input
                      type="date"
                      value={expiry}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) =>
                        setExpiryInputs((prev) => ({ ...prev, [prop.id]: e.target.value }))
                      }
                      className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <button
                    onClick={() => handleGrant(prop.id)}
                    disabled={isLoading || !expiry}
                    className="shrink-0 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {isLoading ? '…' : 'Grant Access'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  Writes a conditional tuple with <code className="bg-gray-100 px-1 rounded">time_bound</code> condition to the live FGA store
                </p>
              </div>
            )}

            {/* Permissions matrix when active */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setExpanded(null)}
                  className="w-full text-xs text-center text-gray-400 hover:text-gray-600 py-2 hover:bg-gray-50 transition-colors"
                >
                  ▲ Hide permissions
                </button>
                <PropertyDashboard
                  userId={userId}
                  property={prop.id}
                  isAuthorizedRep={true}
                  onLog={onLog}
                />
              </div>
            )}

            {/* Show permissions toggle when active but collapsed */}
            {hasAccess && !isExpanded && (
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setExpanded(prop.id)}
                  className="w-full text-xs text-center text-blue-600 hover:text-blue-700 py-2 hover:bg-blue-50 transition-colors font-medium"
                >
                  ▼ Show permissions matrix
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
