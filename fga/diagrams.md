# West Shore Home — FGA Data Model Diagrams

---

## 1. Entity Relationship & Relation Traversal

How FGA types relate to one another. Arrows show `define X: [Y]` (direct) or `from` traversals (computed).

```mermaid
erDiagram
    USER ||--o{ PROPERTY : "homeowner / co_homeowner / property_manager / renter"
    USER ||--o{ PROPERTY : "authorized_rep (time_bound condition)"
    USER ||--o{ HOME_ASSESSMENT : "owner"

    SERVICE_CATEGORY ||--o{ SERVICE : "category"

    PROPERTY ||--o{ CONSULTATION : "property"
    PROPERTY ||--o{ PROJECT : "property"

    PROJECT ||--o{ QUOTE : "project"

    USER {
        string id
    }
    PROPERTY {
        string id
        string address
        string city
        string state
    }
    SERVICE_CATEGORY {
        string id
        string name "bathroom | windows | doors | flooring"
    }
    SERVICE {
        string id
        string name
        string description
        string category_id
    }
    HOME_ASSESSMENT {
        string id
        string user_id
        string notes
        string created_at
    }
    CONSULTATION {
        string id
        string property_id
        string service_category
        string scheduled_date
    }
    PROJECT {
        string id
        string property_id
        string service_type
        string status "pending | active | complete"
    }
    QUOTE {
        string id
        string project_id
        number amount
        string status "draft | sent | approved"
    }
```

---

## 2. Property Role Permissions Matrix

Which roles can perform which actions on a property and its resources.

```mermaid
block-beta
  columns 6

  block:roles:1
    R["Role"]
  end
  block:h1:1
    H["Homeowner"]
  end
  block:h2:1
    CH["Co-Homeowner"]
  end
  block:h3:1
    AR["Auth Rep"]
  end
  block:h4:1
    PM["Prop Manager"]
  end
  block:h5:1
    RN["Renter"]
  end
```

> The table below maps FGA computed permissions to each property role.

| Permission | Homeowner | Co-Homeowner | Auth Rep | Prop Manager | Renter |
|---|:---:|:---:|:---:|:---:|:---:|
| `can_view` (property/project/consult) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `can_book_consultation` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `can_manage` (project scheduling) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `can_view_financials` (quotes) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `can_approve_work` (authorize project) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `can_cancel_project` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `can_manage_users` (add/remove roles) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `can_delete` (close account) | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Auth Rep note:** Tuple carries a `time_bound` condition with `grant_expires_at`. Access auto-denies after expiry even if tuple is not deleted. Revocation = tuple delete.

---

## 3. Soft → Hard Customer Conversion Flow

The moment a soft customer converts, a single FGA tuple write creates the property relationship.

```mermaid
sequenceDiagram
    actor Maya as Maya (Soft Customer)
    participant App as West Shore Home App
    participant FGA as Auth0 FGA

    Maya->>App: Browse services (no auth check needed)
    App->>FGA: check(user:maya, can_view, service:bathroom-remodel)
    FGA-->>App: ✅ allowed (user:* wildcard)

    Maya->>App: Try to view property dashboard
    App->>FGA: check(user:maya, can_view, property:oak-street)
    FGA-->>App: ❌ denied (no property tuple)
    App-->>Maya: "Sign up to manage your home"

    Maya->>App: Completes conversion / signs contract
    App->>FGA: write tuple →  user:maya | homeowner | property:oak-street
    FGA-->>App: ✅ tuple written

    Maya->>App: View property dashboard
    App->>FGA: check(user:maya, can_view, property:oak-street)
    FGA-->>App: ✅ allowed (homeowner ⊆ can_view)
    App-->>Maya: Full homeowner dashboard
```

---

## 4. Multi-Property Scoping (David the Property Manager)

Demonstrates that a role on Property A grants zero access to Property B.

```mermaid
sequenceDiagram
    actor David as David (Property Manager)
    participant App as West Shore Home App
    participant FGA as Auth0 FGA

    Note over FGA: Tuples in store:<br/>user:david | property_manager | property:oak-street<br/>user:david | property_manager | property:elm-ave

    David->>App: View Oak Street project schedule
    App->>FGA: check(user:david, can_manage, project:oak-bathroom)
    FGA-->>App: ✅ allowed (property_manager on oak-street)

    David->>App: View Oak Street quote
    App->>FGA: check(user:david, can_view_financials, project:oak-bathroom)
    FGA-->>App: ❌ denied (property_manager excluded from financials)

    David->>App: Try to view Elm Ave quote (different owner's property)
    App->>FGA: check(user:david, can_view_financials, project:elm-windows)
    FGA-->>App: ❌ denied (property_manager excluded from financials)

    Note over David,FGA: Property scoping is automatic —<br/>no application-level tenant filtering needed
```

---

## 5. Authorized Rep Temporal Access

Time-bound delegation with condition context passed at check time.

```mermaid
sequenceDiagram
    actor Michael as Michael (Auth Rep)
    participant App as West Shore Home App
    participant FGA as Auth0 FGA

    Note over FGA: Tuple:<br/>user:michael | authorized_rep | property:oak-street<br/>condition: grant_expires_at = 2026-09-30T23:59:59Z

    Michael->>App: Approve quote (within valid period)
    App->>FGA: check(user:michael, can_approve, quote:oak-bathroom-q1)<br/>context: { current_time: "2026-07-01T10:00:00Z" }
    FGA-->>App: ✅ allowed (time_bound condition satisfied)

    Note over Michael,FGA: Time advances past expiry...

    Michael->>App: Approve quote (after expiry)
    App->>FGA: check(user:michael, can_approve, quote:oak-bathroom-q1)<br/>context: { current_time: "2026-10-01T10:00:00Z" }
    FGA-->>App: ❌ denied (grant_expires_at exceeded)

    Note over App,FGA: Homeowner revokes early via tuple delete

    App->>FGA: delete tuple → user:michael | authorized_rep | property:oak-street
    FGA-->>App: ✅ tuple deleted
    Michael->>App: Any access attempt
    App->>FGA: check(user:michael, can_view, property:oak-street)
    FGA-->>App: ❌ denied (tuple no longer exists)
```
