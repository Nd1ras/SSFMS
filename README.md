# SSFMS
 SmartSeason Field Monitoring System

A Field tracker for crop control and management 
SsFMS is an interface that will enable one to simplify the farming process by keeping track of Stages and Statuses and acting on fields based on data returned.

## Architecture Overview

```
crop-tracker/
├── backend/          # Node.js + Express + PostgreSQL
│   ├── config/       # Database configuration
│   ├── middleware/   # Auth middleware (JWT)
│   ├── routes/       # API routes (auth, fields, dashboard)
│   ├── server.js     # Entry point
│   └── init-db.js    # Database schema initialization
└── frontend/         # Svelte + Vite
    └── src/
        ├── components/   # Svelte components
        ├── api.js        # API client
        ├── stores.js     # Svelte stores
        └── App.svelte    # Root component
```

## Tech Stack

- **Frontend:** Svelte 4 + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** JWT (JSON Web Tokens) + bcryptjs

## Status Logic Approach

Field status is **computed dynamically** based on field data rather than stored statically. This ensures status is always current without manual updates.

**Rules:**
1. **Completed** — Field stage is `Harvested`
2. **At Risk** — Either:
   - No update recorded in the last 14 days, OR
   - Planted more than 120 days ago and not yet harvested (likely overdue)
3. **Active** — All other cases (field is progressing normally)

This approach keeps the system simple while providing meaningful operational insights. Admins can immediately identify fields needing attention.

## Roles & Permissions

| Feature | Admin | Field Agent |
|---------|-------|-------------|
| View all fields | ✅ | ❌ (assigned only) |
| Create fields | ✅ | ❌ |
| Delete fields | ✅ | ❌ |
| Update field stage | ✅ | ✅ (assigned only) |
| Add notes/observations | ✅ | ✅ (assigned only) |
| View dashboard | ✅ (all) | ✅ (assigned only) |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
# Create database
createdb croptracker

# Set environment variable (or create .env)
export DATABASE_URL="postgresql://user:password@localhost:5432/croptracker"
export JWT_SECRET="your-secret-key"
```

### 2. Backend

```bash
cd backend
npm install
npm run init-db    # Creates tables
npm start          # Starts server on port 3000
```

### 3. Seed Demo Users (optional)

```bash
npm run seed
# Creates: admin/admin123 and agent1/agent123
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev        # Starts dev server on port 5173
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/auth/seed` | No | Create demo users |
| GET | `/api/fields` | Yes | List fields (role-filtered) |
| POST | `/api/fields` | Admin | Create new field |
| GET | `/api/fields/:id` | Yes | Get field detail + history |
| POST | `/api/fields/:id/updates` | Yes | Add progress update |
| DELETE | `/api/fields/:id` | Admin | Delete field |
| GET | `/api/dashboard` | Yes | Dashboard summary |

## Key Design Decisions

1. **Computed Status:** Status is derived from timestamps and stage, not stored. This eliminates stale data and sync issues.

2. **Stage Progression Lock:** Agents cannot revert a field to an earlier stage. This maintains data integrity and audit trail reliability.

3. **Role-Based Filtering:** All list endpoints automatically filter by user role at the database query level, not just UI-level hiding.

4. **Audit Trail:** Every stage change is recorded in `field_updates` with who made the change and when. The field's `current_stage` is always the latest update.

5. **Simple Auth:** JWT stored in localStorage. In production, consider httpOnly cookies + refresh tokens.

## Trade-offs & Future Improvements

- **No pagination:** Kept simple for demo. Add `LIMIT/OFFSET` for production scale.
- **No image uploads:** Notes are text-only. Could extend with file storage (S3/local).
- **Agent assignment by ID:** Currently uses raw user IDs. A dropdown with agent names would be more user-friendly.
- **No email notifications:** "At Risk" fields are visible in dashboard but not actively alerted.
- **Single JWT secret:** In production, use asymmetric keys (RS256) and key rotation.

## License

MIT