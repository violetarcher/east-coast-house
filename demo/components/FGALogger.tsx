'use client';

import { useEffect, useRef, useState } from 'react';

export interface LogEntry {
  id: string;
  ts: string;
  user: string;
  relation: string;
  object: string;
  allowed: boolean;
  context?: Record<string, unknown>;
  note?: string;
  batchId?: string;
  batchLabel?: string;
}

type BatchGroup = { type: 'batch'; batchId: string; label: string; ts: string; entries: LogEntry[] };
type SingleItem = { type: 'single'; entry: LogEntry };
type LogItem = BatchGroup | SingleItem;

function groupEntries(entries: LogEntry[]): LogItem[] {
  const items: LogItem[] = [];
  let i = 0;
  while (i < entries.length) {
    const e = entries[i];
    if (!e.batchId) {
      items.push({ type: 'single', entry: e });
      i++;
    } else {
      const batch: LogEntry[] = [];
      const batchId = e.batchId;
      while (i < entries.length && entries[i].batchId === batchId) {
        batch.push(entries[i++]);
      }
      items.push({ type: 'batch', batchId, label: e.batchLabel ?? batchId, ts: e.ts, entries: batch });
    }
  }
  return items;
}

interface FGALoggerProps {
  entries: LogEntry[];
  onClear: () => void;
}

export default function FGALogger({ entries, onClear }: FGALoggerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const toggle = (batchId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(batchId) ? next.delete(batchId) : next.add(batchId);
      return next;
    });

  const items = groupEntries(entries);

  return (
    <div className="bg-gray-950 rounded-xl border border-gray-800 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono font-semibold text-gray-300">FGA Check Log</span>
        </div>
        <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 min-h-0">
        {items.length === 0 && (
          <p className="text-gray-600 italic">Waiting for authorization checks…</p>
        )}

        {items.map((item) => {
          if (item.type === 'single') {
            const e = item.entry;
            return (
              <div key={e.id} className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 font-bold ${e.allowed ? 'text-green-400' : 'text-red-400'}`}>
                  {e.allowed ? '✓' : '✗'}
                </span>
                <div className="min-w-0">
                  <span className="text-gray-500">{e.ts} </span>
                  <span className="text-cyan-400">check</span>
                  <span className="text-gray-300">
                    ({' '}<span className="text-yellow-300">{e.user}</span>,{' '}
                    <span className="text-purple-300">{e.relation}</span>,{' '}
                    <span className="text-green-300">{e.object}</span>
                    {e.context && <span className="text-gray-400">, ctx</span>}
                    {' '}) → <span className={e.allowed ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{e.allowed ? 'ALLOWED' : 'DENIED'}</span>
                  </span>
                  {e.note && <span className="text-gray-500 italic"> // {e.note}</span>}
                </div>
              </div>
            );
          }

          // Batch group
          const isOpen = expanded.has(item.batchId);
          const allowed = item.entries.filter((e) => e.allowed).length;
          const denied = item.entries.length - allowed;

          return (
            <div key={item.batchId} className="border border-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(item.batchId)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
              >
                <span className="text-gray-500 text-[10px]">{isOpen ? '▼' : '▶'}</span>
                <span className="text-gray-500">{item.ts}</span>
                <span className="text-cyan-400">batchCheck</span>
                <span className="text-gray-400 truncate flex-1">{item.label}</span>
                <span className="shrink-0 text-gray-500">{item.entries.length} checks</span>
                <span className="shrink-0 text-green-400">{allowed}✓</span>
                <span className="shrink-0 text-red-400">{denied}✗</span>
              </button>

              {isOpen && (
                <div className="divide-y divide-gray-800/50">
                  {item.entries.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 px-3 py-1 bg-gray-950">
                      <span className={`shrink-0 font-bold ${e.allowed ? 'text-green-400' : 'text-red-400'}`}>
                        {e.allowed ? '✓' : '✗'}
                      </span>
                      <span className="text-purple-300 truncate">{e.relation}</span>
                      <span className="text-gray-600 mx-0.5">·</span>
                      <span className="text-green-300 truncate flex-1">{e.object}</span>
                      {e.context && <span className="text-gray-600 shrink-0 text-[10px]">ctx</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
