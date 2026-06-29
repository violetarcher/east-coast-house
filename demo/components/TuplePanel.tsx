'use client';

import { useState } from 'react';

interface TuplePanelProps {
  onTupleWrite: (user: string, relation: string, object: string, condition?: Record<string, unknown>) => Promise<void>;
  onTupleDelete: (user: string, relation: string, object: string) => Promise<void>;
}

export default function TuplePanel({ onTupleWrite, onTupleDelete }: TuplePanelProps) {
  const [user, setUser] = useState('');
  const [relation, setRelation] = useState('');
  const [object, setObject] = useState('');
  const [loading, setLoading] = useState<'write' | 'delete' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const flash = (type: 'ok' | 'err', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleWrite = async () => {
    if (!user || !relation || !object) return;
    setLoading('write');
    try {
      await onTupleWrite(user.trim(), relation.trim(), object.trim());
      flash('ok', `Wrote: ${user} | ${relation} | ${object}`);
      setUser(''); setRelation(''); setObject('');
    } catch {
      flash('err', 'Write failed — check the console');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!user || !relation || !object) return;
    setLoading('delete');
    try {
      await onTupleDelete(user.trim(), relation.trim(), object.trim());
      flash('ok', `Deleted: ${user} | ${relation} | ${object}`);
      setUser(''); setRelation(''); setObject('');
    } catch {
      flash('err', 'Delete failed — check the console');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tuple Management</span>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">User</label>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="user:james"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Relation</label>
          <input
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="homeowner"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Object</label>
          <input
            value={object}
            onChange={(e) => setObject(e.target.value)}
            placeholder="property:oak-street"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleWrite}
          disabled={!user || !relation || !object || loading !== null}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {loading === 'write' ? '…' : 'Write Tuple'}
        </button>
        <button
          onClick={handleDelete}
          disabled={!user || !relation || !object || loading !== null}
          className="flex-1 bg-red-50 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 text-red-700 text-sm font-medium py-2 rounded-lg border border-red-200 transition-colors"
        >
          {loading === 'delete' ? '…' : 'Delete Tuple'}
        </button>
      </div>

      {feedback && (
        <div className={`mt-3 text-xs px-3 py-2 rounded-lg font-mono ${
          feedback.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.type === 'ok' ? '✓ ' : '✗ '}{feedback.msg}
        </div>
      )}
    </div>
  );
}
