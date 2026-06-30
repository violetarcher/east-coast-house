export type PersonaId = 'maya' | 'james' | 'sarah' | 'michael' | 'david' | 'emma' | 'lisa';

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  description: string;
  property: string | null;
  avatar: string;
  color: string;
  isSoftCustomer: boolean;
  isAuthorizedRep?: boolean;
}

export const PERSONAS: Persona[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    role: 'Soft Customer',
    description: 'Exploring bathroom remodel options, no property yet',
    property: null,
    avatar: 'MC',
    color: 'bg-slate-500',
    isSoftCustomer: true,
  },
  {
    id: 'sarah',
    name: 'Sarah Whitmore',
    role: 'Homeowner',
    description: '123 Oak Street — full access, primary owner',
    property: 'property:oak-street',
    avatar: 'SW',
    color: 'bg-indigo-500',
    isSoftCustomer: false,
  },
  {
    id: 'james',
    name: 'James Whitmore',
    role: 'Co-Homeowner',
    description: '123 Oak Street — secondary owner, no delete/cancel/manage users',
    property: 'property:oak-street',
    avatar: 'JW',
    color: 'bg-blue-600',
    isSoftCustomer: false,
  },
  {
    id: 'michael',
    name: 'Michael Torres',
    role: 'Authorized Rep',
    description: 'Legal representative — no delegation yet, grant access to a property',
    property: null,
    avatar: 'MT',
    color: 'bg-amber-600',
    isSoftCustomer: false,
    isAuthorizedRep: true,
  },
  {
    id: 'david',
    name: 'David Park',
    role: 'Property Manager',
    description: 'Oak Street & Elm Ave — operational only, no financial access',
    property: 'property:oak-street',
    avatar: 'DP',
    color: 'bg-emerald-600',
    isSoftCustomer: false,
  },
  {
    id: 'emma',
    name: 'Emma Rivera',
    role: 'Renter',
    description: '123 Oak Street — view-only tenant',
    property: 'property:oak-street',
    avatar: 'ER',
    color: 'bg-rose-500',
    isSoftCustomer: false,
  },
  {
    id: 'lisa',
    name: 'Lisa Johnson',
    role: 'Homeowner',
    description: '456 Elm Ave — full access on her property only',
    property: 'property:elm-ave',
    avatar: 'LJ',
    color: 'bg-purple-600',
    isSoftCustomer: false,
  },
];

export const PROPERTY_LABELS: Record<string, string> = {
  'property:oak-street': '123 Oak Street',
  'property:elm-ave': '456 Elm Ave',
  'property:maple-drive': '789 Maple Drive',
};

export const AUTH_REP_PROPERTIES = [
  { id: 'property:oak-street', label: '123 Oak Street', owner: 'Sarah Whitmore', ownerRole: 'Homeowner' },
  { id: 'property:elm-ave',    label: '456 Elm Ave',    owner: 'Lisa Johnson',   ownerRole: 'Homeowner' },
];

export const HOME_ASSESSMENTS = [
  {
    id: 'home_assessment:maya-scan-1',
    label: 'Bathroom Assessment',
    date: '2026-03-15',
    summary: 'Master bath · 58 sq ft · tub + single vanity',
    icon: '🛁',
    owner: 'maya',
  },
];

export const SERVICE_CATALOG = [
  {
    id: 'service_category:bathroom',
    label: 'Bathroom Remodeling',
    icon: '🛁',
    services: [
      { id: 'service:full-bathroom-remodel', label: 'Full Bathroom Remodel', desc: 'Complete gut renovation with vanity, toilet & ECH waterproof wall system' },
      { id: 'service:bathtub-replacement', label: 'Bathtub Replacement', desc: 'New tub with surround, completed in 1 day' },
      { id: 'service:shower-replacement', label: 'Shower Replacement', desc: 'Custom shower with exclusive waterproof panels' },
      { id: 'service:walk-in-conversion', label: 'Walk-In Conversion', desc: 'Convert tub to walk-in shower for accessibility' },
    ],
  },
  {
    id: 'service_category:windows',
    label: 'Window Replacement',
    icon: '🪟',
    services: [
      { id: 'service:double-hung-windows', label: 'Double-Hung Windows', desc: 'Energy-efficient double-hung with easy cleaning' },
      { id: 'service:casement-windows', label: 'Casement Windows', desc: 'Crank-style with superior seal and ventilation' },
      { id: 'service:bay-bow-windows', label: 'Bay & Bow Windows', desc: 'Expand your space and improve curb appeal' },
    ],
  },
  {
    id: 'service_category:doors',
    label: 'Door Replacement',
    icon: '🚪',
    services: [
      { id: 'service:fiberglass-entry-door', label: 'Fiberglass Entry Door', desc: 'Energy-efficient, dent and damp resistant' },
      { id: 'service:steel-entry-door', label: 'Steel Entry Door', desc: 'Maximum security with thermal insulation' },
      { id: 'service:patio-french-door', label: 'Patio & French Doors', desc: 'Elegant sliding or hinged glass doors' },
    ],
  },
  {
    id: 'service_category:flooring',
    label: 'Flooring Installation',
    icon: '🏠',
    services: [
      { id: 'service:lvp-flooring', label: 'Luxury Vinyl Plank (LVP)', desc: '100% waterproof, perfect for kitchens & baths' },
      { id: 'service:engineered-hardwood', label: 'Engineered Hardwood', desc: 'Classic look with superior durability' },
    ],
  },
];
