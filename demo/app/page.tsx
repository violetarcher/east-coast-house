'use client';

import { useState, useCallback, useId, useEffect } from 'react';
import PersonaPicker from '@/components/PersonaPicker';
import FGALogger, { type LogEntry } from '@/components/FGALogger';
import ServiceCatalog from '@/components/ServiceCatalog';
import PropertyDashboard from '@/components/PropertyDashboard';
import ConversionModal from '@/components/ConversionModal';
import HomeAssessments from '@/components/HomeAssessments';
import { PERSONAS, PROPERTY_LABELS, type Persona } from '@/lib/personas';

function safeId(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export default function Home() {
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConversion, setShowConversion] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const idPrefix = useId();

  // Restore saved persona after hydration
  useEffect(() => {
    const saved = localStorage.getItem('ech-demo-persona');
    if (saved) {
      const found = PERSONAS.find((p) => p.id === saved);
      if (found) setPersona(found);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ech-demo-persona', persona.id);
  }, [persona.id]);

  const isMichael = persona.isAuthorizedRep === true;
  const isMaya = persona.id === 'maya';

  // ── Property access: discovered from FGA for all non-Michael personas ──
  const [personaProperties, setPersonaProperties] = useState<string[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    if (isMichael) return;
    setLoadingProperties(true);
    setPersonaProperties([]);

    const allProps = Object.keys(PROPERTY_LABELS);
    const checks = allProps.map((propId) => ({
      user: `user:${persona.id}`,
      relation: 'can_view',
      object: propId,
      correlationId: safeId(propId),
    }));

    fetch('/api/fga/batchcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checks }),
    })
      .then((r) => r.json())
      .then((data) => {
        setPersonaProperties(
          allProps.filter((propId) => data.results?.[safeId(propId)]?.allowed ?? false)
        );
      })
      .finally(() => setLoadingProperties(false));
  }, [persona.id, isMichael, refreshKey]);

  // ── Michael's delegated properties: discovered from FGA tuple reads ──
  const [michaelGrantedProperties, setMichaelGrantedProperties] = useState<string[]>([]);
  const [loadingMichaelProps, setLoadingMichaelProps] = useState(false);

  useEffect(() => {
    if (!isMichael) return;
    setLoadingMichaelProps(true);
    Promise.all(
      Object.keys(PROPERTY_LABELS).map((propId) =>
        fetch(`/api/fga/read?user=user:michael&relation=authorized_rep&object=${encodeURIComponent(propId)}`)
          .then((r) => r.json())
          .then((data) => ({ propId, exists: (data.tuples ?? []).length > 0 }))
      )
    )
      .then((results) => setMichaelGrantedProperties(results.filter((r) => r.exists).map((r) => r.propId)))
      .finally(() => setLoadingMichaelProps(false));
  }, [isMichael, refreshKey]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'ts'>) => {
    const id = `${idPrefix}-${Date.now()}-${Math.random()}`;
    const ts = new Date().toISOString().split('T')[1].replace('Z', '').slice(0, 11);
    setLogs((prev) => [...prev.slice(-199), { ...entry, id, ts }]);
  }, [idPrefix]);

  const writeTuple = async (user: string, relation: string, object: string) => {
    const res = await fetch('/api/fga/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, relation, object }),
    });
    if (!res.ok) throw new Error('Write failed');
    addLog({ user, relation, object, allowed: true, note: 'tuple written' });
  };

  const handleConvert = async (userId: string, newProperty: string) => {
    await writeTuple(`user:${userId}`, 'homeowner', newProperty);
    setRefreshKey((k) => k + 1);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/fga/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) console.error('Reset errors:', data.errors);
      setLogs([]);
      setPersona(PERSONAS[0]);
      setMichaelGrantedProperties([]);
      setRefreshKey((k) => k + 1);
    } finally {
      setResetting(false);
    }
  };

  const isMayaConverted = isMaya && !loadingProperties && personaProperties.length > 0;
  const multiProperty = !isMichael && personaProperties.length > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div> */}
          <div>
            <h1 className="font-bold text-gray-900 leading-none">Remodeling Services</h1>
            {/* <p className="text-xs text-gray-500 leading-none mt-0.5">FGA Demo</p> */}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-xs text-gray-500 font-mono">Store: 01KWA8T50MV62YTHNZV10ABG8B</span>
          </div> */}
          <button
            onClick={handleReset}
            disabled={resetting}
            className="text-xs bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {resetting ? 'Resetting…' : '↺ Reset'}
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left sidebar */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 space-y-4">
          <PersonaPicker selected={persona} onSelect={setPersona} />

          {isMaya && !isMayaConverted && !loadingProperties && (
            <button
              onClick={() => setShowConversion(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              🏠 Convert Maya to Customer →
            </button>
          )}
          {isMayaConverted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
              <p className="font-semibold">✓ Maya converted!</p>
              <p className="mt-0.5 font-mono">
                homeowner on {PROPERTY_LABELS[personaProperties[0]] ?? personaProperties[0]}
              </p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Persona banner */}
          <div className={`${persona.color} rounded-xl px-5 py-4 text-white flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                {persona.avatar}
              </span>
              <div>
                <p className="font-bold text-lg leading-none">{persona.name}</p>
                <p className="text-white/80 text-sm mt-0.5">{persona.role} · {persona.description}</p>
              </div>
            </div>
            {isMichael && (
              <div className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-mono text-right">
                relation: authorized_rep<br />
                condition: time_bound
              </div>
            )}
          </div>

          {/* Service catalog — visible to everyone */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Service Catalog
              <span className="ml-2 font-normal normal-case text-gray-400">
                — visible to everyone · batch check by category or all at once
              </span>
            </h2>
            <ServiceCatalog userId={persona.id} onLog={addLog} />
          </section>

          {/* Home assessments — owner-scoped, visible to soft customers too */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Home Assessments
              <span className="ml-2 font-normal normal-case text-gray-400">
                — owner-scoped · no property relationship required
              </span>
            </h2>
            <HomeAssessments userId={persona.id} onLog={addLog} />
          </section>

          {/* Michael — delegated properties from FGA */}
          {isMichael && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Delegated Property Access
                <span className="ml-2 font-normal normal-case text-gray-400">
                  — grant access from a homeowner&apos;s property view
                </span>
              </h2>
              {loadingMichaelProps ? (
                <div className="text-xs text-gray-400 animate-pulse px-1">Checking delegations…</div>
              ) : michaelGrantedProperties.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-5 text-center">
                  <span className="text-2xl block mb-2">⚖️</span>
                  <p className="text-sm font-semibold text-amber-800 mb-1">No active delegations</p>
                  <p className="text-xs text-amber-700">
                    Switch to a homeowner persona and expand the <strong>⚖️ Authorized Representative</strong> section on their property to grant Michael access.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {michaelGrantedProperties.map((propId) => (
                    <PropertyDashboard
                      key={propId}
                      userId="michael"
                      property={propId}
                      isAuthorizedRep={true}
                      onLog={addLog}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* All other personas — properties discovered from FGA */}
          {!isMichael && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Property Access
                {!loadingProperties && personaProperties.length > 0 && (
                  <span className="ml-2 font-normal normal-case text-gray-400">
                    — {personaProperties.map((p) => PROPERTY_LABELS[p] ?? p).join(' · ')}
                  </span>
                )}
              </h2>

              {loadingProperties ? (
                <div className="text-xs text-gray-400 animate-pulse px-1">Checking property access…</div>
              ) : personaProperties.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
                  <span className="text-4xl mb-3 block">🔒</span>
                  <h3 className="font-semibold text-gray-700 mb-1">No property access</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    {persona.name} has no property relationship in FGA.
                    {isMaya && ' Use the Convert button to write the homeowner tuple.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {multiProperty && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <strong>Multi-property scoping:</strong> {persona.name} has access to {personaProperties.length} properties.
                      Permissions are evaluated independently per property.
                    </p>
                  )}
                  {personaProperties.map((propId) => (
                    <PropertyDashboard
                      key={propId}
                      userId={persona.id}
                      property={propId}
                      isAuthorizedRep={false}
                      grantingPersonaName={persona.role === 'Homeowner' ? persona.name : undefined}
                      onLog={addLog}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* Right sidebar — FGA logger */}
        <aside className="w-96 shrink-0 border-l border-gray-200 p-4 flex flex-col min-h-0">
          <FGALogger entries={logs} onClear={() => setLogs([])} />
        </aside>
      </div>

      {showConversion && (
        <ConversionModal
          userId={persona.id}
          onConvert={handleConvert}
          onClose={() => setShowConversion(false)}
        />
      )}
    </div>
  );
}
