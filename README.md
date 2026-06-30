# Remodeling Services — Auth0 FGA Demo

A Next.js demo application showing fine-grained authorization for a home remodeling platform. No authentication — a persona picker drives the experience. All access decisions are live FGA checks against an Auth0 FGA store.

## What it demonstrates

| Concept | How |
|---|---|
| Soft → hard customer | Write `homeowner` tuple in real-time via conversion modal |
| Property-scoped roles | homeowner / co_homeowner / authorized_rep / property_manager / renter |
| Temporal delegation | Authorized Rep gets `time_bound` conditional tuple with expiry |
| Grant / revoke | Delegate access from the property owner's view, revoke instantly |
| Multi-property scoping | David (property_manager) shows permissions evaluated per property |
| Owner-scoped resources | Home assessments accessible without a property relationship |
| batchCheck | All permission checks use a single API call, logged in real-time |

## Prerequisites

- Node.js 18+
- An Auth0 FGA store with the model and seed tuples already deployed (see `../fga/`)

## Setup

1. Copy credentials into `demo/.env.local`:

```
FGA_API_URL=https://api.us1.fga.dev
FGA_STORE_ID=<your-store-id>
FGA_MODEL_ID=<your-model-id>
FGA_API_TOKEN_ISSUER=auth.fga.dev
FGA_API_AUDIENCE=https://api.us1.fga.dev/
FGA_CLIENT_ID=<your-client-id>
FGA_CLIENT_SECRET=<your-client-secret>
```

2. Install and run:

```bash
npm install
npm run dev -- -p 3020
```

## Seeding the FGA store

```bash
# Deploy the model
fga model write --store-id <store-id> --file ../fga/model.fga

# Write seed tuples (static roles, service categories, Maya's home assessment)
fga tuple write --store-id <store-id> --file ../fga/seed-tuples.json
```

Michael Torres starts with **no** delegated access — grant it live during the demo from a homeowner's property view.

## Demo flow

1. **Select Maya** — soft customer, can browse services and view her home assessment, no property access
2. **Convert Maya** — writes `homeowner` tuple, property dashboard unlocks immediately
3. **Select Sarah** — homeowner on 123 Oak Street, expand ⚖️ Authorized Representative to delegate Michael
4. **Select Michael** — sees delegated properties; toggle ⏱ Active/Expired to show time-bound condition
5. **Select David** — property_manager on two properties, demonstrating multi-property scoping
6. **Reset** — deletes all demo-written tuples, returns to seed state

## FGA model

Authorization model lives in `../fga/model.fga`. Run tests with:

```bash
fga model test --store-id <store-id> --tests ../fga/tests.fga.yaml
```
