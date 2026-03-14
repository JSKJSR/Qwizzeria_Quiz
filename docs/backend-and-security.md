# Backend & Security Documentation

This document covers data storage, access control, and the shared backend utilities for the Qwizzeria WebApp. Qwizzeria relies on **Supabase (PostgreSQL)**.

---

## 📊 Core Tables & Schema

### Content & Play
- **`questions_master`**: The central question bank (UUID, text, answer, category, media_url, points, status).
- **`quiz_packs`**: Curated collections of questions (is_premium, is_public, statuses).
- **`quiz_sessions`**: Tracks player progress for resumable usage (score, status, metadata JSONB).

### Real-time Buzzer
- **`buzzer_rooms`**: Manages volatile state for the real-time Buzzer System. Tracks open rooms, status (`waiting` / `active` / `closed`), host user, and session reference.
- **`buzzer_participants`**: Tracks who has joined a buzzer room. One row per `(room_id, user_id)`. Deleted when a participant leaves or closes the browser. **Not** deleted on host reset — participants stay in the room across the full session.

### Tournaments
- **`host_tournaments`**: Bracket state and participants (JSONB).
- **`host_tournament_matches`**: Isolated individual match states. Uses `claimed_by` for optimistic locking in multi-tab play.

### Billing
- **`subscriptions`**: Stripe subscription states mapped to user UUIDs. Supports `player`, `host`, and `pass` tier structures.

---

## 🛡️ Security Model: Two-Gate RBAC

Qwizzeria implements a **Two-Gate security model**.

### Gate 1: Feature Access (`feature_access` table)
Controls module entry. Examples: `host_quiz`, `admin_cms`, `pack_premium`.

### Gate 2: Content Permissions (`content_permissions` table)
Controls granular access. Examples: `read`, `write`, `manage` specific categories or packs.

### Role Hierarchy (`user_profiles` table)
1. **`superadmin`**: Full system control. Manages roles via the UI.
2. **`admin`**: Bypasses Gate 1, platform-wide management.
3. **`editor`**: Gate 1 access. Gate 2 specifies their content.
4. **`player` / `host`**: Gate 1 access to premium features depending on subscription plan or purchased passes.
5. **`user`**: Base role.

### Row-Level Security (RLS)
- **Pack Visibility**: App layer gating handles playback. Active pack *metadata* is public for the landing page carousel.
- **Admin Bypass**: Policies utilize custom Postgres functions `is_admin()` and `is_superadmin()`.

#### Buzzer RLS Policies (`buzzer_participants`)

Migration `021_buzzer_rls_fix.sql` corrected a missing `UPDATE` policy that caused the error:
> *"new row violates row-level security policy (USING expression) for table buzzer_participants"*

| Operation | Policy | Rule |
|---|---|---|
| `SELECT` | `buzzer_participants_select` | User is authenticated AND room is `waiting`/`active` or owned by user |
| `INSERT` | `buzzer_participants_insert` | `user_id = auth.uid()` AND room is `waiting`/`active` |
| `UPDATE` | `buzzer_participants_update_own` *(added 021)* | `user_id = auth.uid()` AND room is `waiting`/`active` |
| `DELETE` | `buzzer_participants_delete` | Own row OR host of the room |
| `ALL` | `buzzer_participants_admin` | `is_admin()` |

> **Note:** `joinBuzzerRoom()` in `buzzer.js` uses INSERT-or-fetch (not upsert) to avoid triggering the UPDATE path unnecessarily. See [`docs/buzzer-bugfixes.md`](./buzzer-bugfixes.md) for the full fix history.

---

## ⚡ Postgres RPC Functions

High-performance aggregation and security checks are pushed to the database:
- `get_user_stats(user_id)`: Aggregated user stats.
- `get_global_leaderboard(...)`: Rankings.
- `get_admin_analytics()`: Admin insights.
- `get_subscription_state(user_id)`: Source of truth for trials and tier statuses.

---

## 📦 Supabase Client Package (`@qwizzeria/supabase-client`)

The monorepo includes a shared SDK wrapper package (`packages/supabase-client`) for consistent backend interaction across apps.

- **`auth.js`**: Auth state listeners and role fetching.
- **`packs.js` / `questions.js`**: Content CRUD.
- **`tournaments.js` / `realtime.js`**: Bracket logic, match claiming, and Phoenix-style channel subscriptions for instant UI sync.
- **`users.js` / `leaderboard.js`**: Profiles and RPC endpoints.
- **`buzzer.js`**: Room creation, participant join (insert-or-fetch pattern), broadcast channel subscription, and event helpers for the real-time buzzer feature.

*Note: SQL Migrations live inside this package at `packages/supabase-client/migrations` and must be applied sequentially via Supabase SQL Editor.*
