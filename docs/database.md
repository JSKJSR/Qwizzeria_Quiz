# Database & Security Documentation

Qwizzeria uses **Supabase (PostgreSQL)** for data storage, authentication, and row-level security. The schema is designed for relational integrity and granular access control.

---

## 📊 Core Tables

### `questions_master`
The central question bank.
- `id` (UUID): Primary key.
- `question_text` (TEXT): The question.
- `answer_text` (TEXT): The correct answer.
- `category` (TEXT): For grouping and Jeopardy layout.
- `media_url` (TEXT): Link to images/audio.
- `points` (INT): Default point value.
- `status` (TEXT): `active`, `draft`, or `archived`.
- `is_public` (BOOL): Visible to non-admin users.

### `quiz_packs`
Curated collections of questions.
- `id` (UUID): Primary key.
- `title` (TEXT): Pack name.
- `is_premium` (BOOL): Gated by RBAC.
- `is_public` (BOOL): Visibility toggle.
- `question_count` (INT): Calculated total questions.

### `quiz_sessions`
Tracks player progress.
- `user_id` (UUID): FK to auth.users.
- `score` (INT): Current session score.
- `status` (TEXT): `in_progress`, `completed`, `abandoned`.
- `metadata` (JSONB): Stores remaining question IDs and play format.

### `host_tournaments`
Tournament bracket state for Host Quiz tournament mode.
- `id` (UUID): Primary key.
- `host_user_id` (UUID): FK to auth.users.
- `pack_id` (UUID): FK to quiz_packs.
- `participants` (JSONB): Team names and seeding.
- `bracket` (JSONB): Full bracket structure.
- `status` (TEXT): `in_progress`, `completed`.

### `host_tournament_matches`
Individual matches within a tournament.
- `id` (UUID): Primary key.
- `tournament_id` (UUID): FK to host_tournaments.
- `round` (INT): Round number (0-indexed).
- `match_index` (INT): Position within the round.
- `team_a`, `team_b` (TEXT): Team names.
- `winner` (TEXT): Winning team name (null until complete).
- `scores` (JSONB): Match scores.
- `status` (TEXT): `pending`, `in_progress`, `completed`.
- `claimed_by` (UUID): Optimistic lock for multi-tab play.

### `subscriptions`
Stripe subscription tracking for billing.
- `user_id` (UUID): FK to auth.users (UNIQUE).
- `tier` (TEXT): `basic` or `pro`.
- `status` (TEXT): `trialing`, `active`, `past_due`, `canceled`, `expired`.
- `stripe_customer_id` (TEXT): Stripe customer ID.
- `stripe_subscription_id` (TEXT): Stripe subscription ID (UNIQUE).
- `current_period_start`, `current_period_end` (TIMESTAMPTZ): Billing period.
- `cancel_at_period_end` (BOOL): Whether subscription cancels at period end.

---

## 🛡️ Security & RBAC Tables

### `user_profiles`
Extends user data with roles.
- `id` (UUID): FK to auth.users.
- `role` (TEXT): `user`, `premium`, `editor`, `admin`, `superadmin`.
- `display_name` (TEXT): Public-facing name.

### `feature_access` (Gate 1)
- `feature_key`: e.g., `admin_cms`, `host_quiz`.
- `grantee_id`: UUID of user or group.

### `content_permissions` (Gate 2)
- `resource_type`: `pack` or `category`.
- `resource_id`: The ID of the pack or category name.
- `access_level`: `read`, `write`, or `manage`.

---

## ⚡ Postgres RPC Functions (Key APIs)

We use database functions for performance-critical logic:

- **`get_user_stats(user_id)`**: Aggregates total plays, highest score, and accuracy.
- **`get_global_leaderboard(time_filter, limit)`**: Calculates rankings for the platform.
- **`get_admin_analytics()`**: Admin-only metrics (Total users, 7-day churn, avg sessions).
- **`increment_pack_play_count(pack_id)`**: Securely increments metrics on quiz start.
- **`get_all_users_admin(search, role)`**: Paginated user management for Superadmins. Joins `user_profiles` with `auth.users` to provide emails safely (SECURITY DEFINER).
- **`get_subscription_state(user_id)`**: Single source of truth for subscription/trial state. Computes trial from `created_at + 14 days`, returns status/tier/gating. Staff roles bypass.
- **`get_subscription_analytics()`**: Admin-only metrics — trialing, active, canceled counts, trial conversion rate.

---

## 🔒 Security Policies (RLS)

Every table has **Row-Level Security (RLS)** enabled:

- **Pack Visibility**: `quiz_packs` allows `SELECT` for all active packs (`status = 'active'`) to everyone, including anonymous users. This enables the landing page showcase carousel. Admin/superadmin can see all packs (including drafts). **Playback is gated at the app layer** by role checks (premium, host, public filters in `browsePublicPacks` / `fetchPublicPackById`).
- **Question Access**: `questions_master` allows `SELECT` only where `is_public = true` and `status = 'active'`. Question content remains protected even though pack metadata is public.
- **Admin Bypass**: Policies use helper functions like `is_admin()` and `is_superadmin()` to allow full access to authorized accounts.
- **Editor Grants**: Users with the `editor` role can only `UPDATE` resources where an explicit row exists in `content_permissions`.

### Pack Access Matrix (App-Layer Enforcement)

| Role | Public Packs | Premium Packs | Host Packs |
|------|-------------|---------------|------------|
| anonymous | See metadata only | See metadata only | See metadata only |
| user | Play | See only | See only |
| premium | Play | Play | See only |
| editor/admin/superadmin | Play | Play | Play |

### Subscription RLS

- **`subscriptions`**: Users can `SELECT` their own row. Admins can `SELECT` all. Only service role (Stripe webhook) can `INSERT`/`UPDATE`/`DELETE`.

---

## 🏆 Tournament Tables RLS

- **`host_tournaments`**: Users can read/write their own tournaments. Admins can read all.
- **`host_tournament_matches`**: Readable if user owns the parent tournament. `claimed_by` column provides optimistic locking for multi-tab match play.

---

© 2026 Qwizzeria Security Team.
