'use client';

import { PERSONAS, type Persona } from '@/lib/personas';

interface PersonaPickerProps {
  selected: Persona;
  onSelect: (persona: Persona) => void;
}

export default function PersonaPicker({ selected, onSelect }: PersonaPickerProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Persona
      </label>

      {/* Selected persona card */}
      <div className={`${selected.color} rounded-lg p-3 mb-2 text-white`}>
        <div className="flex items-center gap-2.5">
          <span className="bg-white/25 text-white text-sm font-bold w-9 h-9 rounded-full flex items-center justify-center shrink-0">
            {selected.avatar}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-base leading-tight">{selected.name}</p>
            <p className="text-white/80 text-xs mt-0.5">{selected.role}</p>
          </div>
        </div>
        <p className="text-white/70 text-xs mt-2 leading-relaxed">{selected.description}</p>
      </div>

      {/* Dropdown */}
      <div className="relative">
        <select
          value={selected.id}
          onChange={(e) => {
            const p = PERSONAS.find((p) => p.id === e.target.value);
            if (p) onSelect(p);
          }}
          className="w-full text-sm font-medium text-gray-800 border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
        >
          {PERSONAS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.role}{p.isSoftCustomer ? ' (soft)' : ''}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
      </div>
    </div>
  );
}
