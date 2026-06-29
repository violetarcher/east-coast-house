'use client';

import { useState, useEffect } from 'react';
import type { LogEntry } from './FGALogger';

interface DelegateCardProps {
  propertyId: string;
  propertyLabel: string;
  grantingPersonaName: string;
  onLog: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
}

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

export default function DelegateCard({ propertyId, propertyLabel, grantingPersonaName, onLog }: DelegateCardProps) {
  const [tupleExists, setTupleExists] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiry, setExpiry] = useState(defaultExpiry());
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Check if a tuple already exists for Michael on this property
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/fga/read?user=user:michael&relation=authorized_rep&object=${encodeURIComponent(propertyId)}`
      );
      const data = await res.json();
      const tuples: Array<{ key: { condition?: { context?: { grant_expires_at?: string } } } }> = data.tuples ?? [];
      if (tuples.length > 0) {
        setTupleExists(true);
        const exp = tuples[0]?.key?.condition?.context?.grant_expires_at ?? null;
        setExpiresAt(exp);
      } else {
        setTupleExists(false);
      }
    })();
  }, [propertyId]);

  const handleGrant = async () => {
    setLoading(true);
    const expiresAtValue = `${expiry}T23:59:59Z`;
    const res = await fetch('/api/fga/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: 'user:michael',
        relation: 'authorized_rep',
        object: propertyId,
        condition: { name: 'time_bound', context: { grant_expires_at: expiresAtValue } },
      }),
    });
    if (res.ok) {
      const ts = new Date().toLocaleTimeString();
      onLog({
        user: 'user:michael',
        relation: 'authorized_rep',
        object: propertyId,
        allowed: true,
        note: `granted by ${grantingPersonaName} @ ${ts} · expires ${expiry}`,
      });
      setTupleExists(true);
      setExpiresAt(expiresAtValue);
    }
    setLoading(false);
  };

  const handleRevoke = async () => {
    setLoading(true);
    const res = await fetch('/api/fga/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: 'user:michael', relation: 'authorized_rep', object: propertyId }),
    });
    if (res.ok) {
      const ts = new Date().toLocaleTimeString();
      onLog({
        user: 'user:michael',
        relation: 'authorized_rep',
        object: propertyId,
        allowed: false,
        note: `revoked by ${grantingPersonaName} @ ${ts}`,
      });
      setTupleExists(false);
      setExpiresAt(null);
    }
    setLoading(false);
  };

  if (tupleExists === null) return null; // still loading

  return (
    <div className="border-t border-dashed border-amber-200 bg-amber-50/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-amber-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">⚖️</span>
          <span className="text-xs font-semibold text-amber-800">Authorized Representative</span>
          {tupleExists ? (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">ACTIVE</span>
          ) : (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-semibold">NONE</span>
          )}
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {tupleExists ? (
            <>
              {/* Active delegation */}
              <div className="bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs mb-3">
                <p className="text-gray-500 mb-1">// Active tuple · {propertyLabel}</p>
                <p><span className="text-yellow-300">user</span><span className="text-gray-400">:      </span><span className="text-cyan-300">user:michael</span></p>
                <p><span className="text-yellow-300">relation</span><span className="text-gray-400">:  </span><span className="text-purple-300">authorized_rep</span></p>
                <p><span className="text-yellow-300">object</span><span className="text-gray-400">:    </span><span className="text-green-300">{propertyId}</span></p>
                {expiresAt && (
                  <p><span className="text-yellow-300">condition</span><span className="text-gray-400">: </span>
                    <span className="text-orange-300">time_bound</span>
                    <span className="text-gray-400"> › </span>
                    <span className="text-pink-300">grant_expires_at: {expiresAt}</span>
                  </p>
                )}
                <p className="text-gray-500 mt-1">// granted by: {grantingPersonaName}</p>
              </div>
              <button
                onClick={handleRevoke}
                disabled={loading}
                className="w-full text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? '…' : 'Revoke Access'}
              </button>
            </>
          ) : (
            <>
              {/* Grant form */}
              <p className="text-xs text-amber-700 mb-3">
                Grant <strong>Michael Torres</strong> time-bound legal delegation on {propertyLabel}.
                This writes a conditional FGA tuple in real-time.
              </p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expires</label>
                  <input
                    type="date"
                    value={expiry}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full text-sm font-medium text-gray-900 border border-amber-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button
                  onClick={handleGrant}
                  disabled={loading || !expiry}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? '…' : 'Grant'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
