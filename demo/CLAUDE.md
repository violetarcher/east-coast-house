@AGENTS.md

# Project: Remodeling Services FGA Demo

A customer-facing Auth0 FGA demo built for sales engineering. No authentication — a persona picker replaces login. The entire authorization story is driven by FGA tuple reads and checks against a live Auth0 FGA store.

## What this demos

- **Soft → hard customer conversion**: writing a `homeowner` tuple in real-time via `ConversionModal`
- **Property-scoped role hierarchy**: homeowner / co_homeowner / authorized_rep / property_manager / renter
- **Authorized Rep temporal access**: conditional `time_bound` tuple with real-time grant/revoke from the delegating persona's view
- **Multi-property scoping**: David (property_manager) shows that permissions are evaluated per property
- **Owner-scoped resources**: home assessments are accessible to soft customers with no property relationship

## Key architecture decisions

- All property access is **derived from FGA at runtime** — no hardcoded role → property mappings in UI state
- `batchCheck` API is used everywhere multiple permissions are checked at once
- `client.read` without an `object` param does **not work** on the hosted Auth0 FGA API — always include the full object when reading tuples
- `batchCheck` correlationIds must not contain colons — use `safeId()` in `page.tsx` to sanitize

## File map

```
fga/
  model.fga              # Authorization model (deployed)
  tests.fga.yaml         # 32 tests, 103 checks — run with: fga model test
  seed-tuples.json       # Seed data (static roles, service categories, property relationships)
  seed-michael-tuple.json # Michael's conditional tuple — deleted from store; he starts with no access
  diagrams.md            # Mermaid diagrams: ER, permissions matrix, flow sequences

demo/
  app/page.tsx           # Main page — persona state, FGA discovery, render routing
  app/api/fga/
    batchcheck/          # Wraps client.batchCheck(), returns results keyed by correlationId
    check/               # Single check
    write/               # Writes tuples (supports conditional tuples via `any` type)
    delete/              # Deletes tuples
    read/                # Reads tuples (requires object param for hosted API)
    reset/               # Deletes all demo-written tuples and resets to seed state
  components/
    PersonaPicker.tsx    # Dropdown with colored card preview
    PropertyDashboard.tsx # 11-permission batchCheck, ⏱ expired toggle, DelegateCard slot
    DelegateCard.tsx     # Grant/revoke Michael's authorized_rep from the property owner's view
    ServiceCatalog.tsx   # Batch check by category or all at once
    HomeAssessments.tsx  # Discovers accessible assessments via batchCheck on mount
    ConversionModal.tsx  # Writes homeowner tuple for Maya's soft→hard conversion
    FGALogger.tsx        # Real-time check log — batches collapse to single rows
  lib/
    fga.ts               # Singleton OpenFGA client (ClientCredentials)
    personas.ts          # PERSONAS, PROPERTY_LABELS, HOME_ASSESSMENTS, SERVICE_CATALOG
```

## FGA store

- Store ID: `01KWA8T50MV62YTHNZV10ABG8B`
- Model ID: `01KWA9TGBGNFM0C8PT0VPT3GEE`
- API URL: `https://api.us1.fga.dev`
- Credentials in `.env` / `demo/.env.local` (never committed)

## Resetting demo state

The ↺ Reset Demo button calls `POST /api/fga/reset` which deletes:
- `user:maya | homeowner | property:maple-drive`
- `user:michael | authorized_rep | property:oak-street`
- `user:michael | authorized_rep | property:elm-ave`
- `user:michael | authorized_rep | property:maple-drive`

Seed tuples (static roles, service categories, Maya's home assessment) are **not** deleted on reset.

## Running

```bash
cd demo
npm install
npm run dev -- -p 3020
```
