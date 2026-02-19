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
- **`get_all_users_admin(search, role)`**: Paginated user management for Superadmins.

---

## 🔒 Security Policies (RLS)

Every table has **Row-Level Security (RLS)** enabled:

- **Public Access**: Tables like `quiz_packs` and `questions_master` allow `SELECT` only where `is_public = true` and `status = 'active'`.
- **Admin Bypass**: Policies use helper functions like `is_admin()` and `is_superadmin()` to allow full access to authorized accounts.
- **Editor Grants**: Users with the `editor` role can only `UPDATE` resources where an explicit row exists in `content_permissions`.

---

© 2026 Qwizzeria Security Team.
