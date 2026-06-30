'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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
  const [wide, setWide] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  useEffect(() => {
    if (!wide) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setWide(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [wide]);

  const toggle = useCallback((batchId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(batchId) ? next.delete(batchId) : next.add(batchId);
      return next;
    }), []);

  const items = groupEntries(entries);

  const panel = (
    <div className="bg-gray-950 border border-gray-800 flex flex-col h-full min-h-0 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 shrink-0">
        {/* Expand/collapse button — left side */}
        <button
          onClick={() => setWide((v) => !v)}
          className="text-gray-500 hover:text-gray-200 transition-colors shrink-0"
          title={wide ? 'Collapse (Esc)' : 'Expand log'}
        >
          {wide ? (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 2h3v3M8 6l4-4M5 12H2v-3M6 8l-4 4" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 5V2h3M6 6L2 2M12 9v3H9M8 8l4 4" />
            </svg>
          )}
        </button>

        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
        <span className="text-xs font-mono font-semibold text-gray-300">FGA Check Log</span>
        {entries.length > 0 && (
          <span className="text-xs text-gray-600 font-mono">({entries.length})</span>
        )}
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
        >
          clear
        </button>
      </div>

      {/* Log entries */}
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
                <div className={wide ? 'break-all' : 'min-w-0'}>
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
                <span className={`text-gray-400 flex-1 ${wide ? '' : 'truncate'}`}>{item.label}</span>
                <span className="shrink-0 text-gray-500">{item.entries.length} checks</span>
                <span className="shrink-0 text-green-400">{allowed}✓</span>
                <span className="shrink-0 text-red-400">{denied}✗</span>
              </button>
              {isOpen && (
                <div className="divide-y divide-gray-800/50">
                  {item.entries.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-950">
                      <span className={`shrink-0 font-bold ${e.allowed ? 'text-green-400' : 'text-red-400'}`}>
                        {e.allowed ? '✓' : '✗'}
                      </span>
                      {wide ? (
                        <span className="break-all flex-1">
                          <span className="text-purple-300">{e.relation}</span>
                          <span className="text-gray-600 mx-1.5">·</span>
                          <span className="text-green-300">{e.object}</span>
                          <span className="text-yellow-300/50 ml-2">{e.user}</span>
                        </span>
                      ) : (
                        <>
                          <span className="text-purple-300 truncate">{e.relation}</span>
                          <span className="text-gray-600">·</span>
                          <span className="text-green-300 truncate flex-1">{e.object}</span>
                        </>
                      )}
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

  if (wide) {
    return (
      <div
        className="fixed top-[65px] right-0 bottom-0 z-40 flex flex-col"
        style={{ width: 720, boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}
      >
        {panel}
      </div>
    );
  }

  return panel;
}
