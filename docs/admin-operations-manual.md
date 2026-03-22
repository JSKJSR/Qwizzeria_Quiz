# Qwizzeria Admin Operations Manual

A comprehensive guide for Admin and Superadmin users to manage the Qwizzeria platform. Covers web administration (Admin CMS) and system administration (database, security, Stripe).

---

## Table of Contents

1. [Role Overview & Access Matrix](#1-role-overview--access-matrix)
2. [Accessing the Admin Panel](#2-accessing-the-admin-panel)
3. [Dashboard & Analytics](#3-dashboard--analytics)
4. [Question Management](#4-question-management)
5. [Quiz Pack Management](#5-quiz-pack-management)
6. [Pack Questions Manager](#6-pack-questions-manager)
7. [Bulk Import](#7-bulk-import)
8. [User Management](#8-user-management)
9. [Role Assignment & Staff Access](#9-role-assignment--staff-access)
10. [Subscription & Tier Management](#10-subscription--tier-management)
11. [Content Permissions (Editor Grants)](#11-content-permissions-editor-grants)
12. [Audit Logging](#12-audit-logging)
13. [Database Administration](#13-database-administration)
14. [Stripe & Billing Administration](#14-stripe--billing-administration)
15. [Security & RLS Policies](#15-security--rls-policies)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Role Overview & Access Matrix

### Role Hierarchy

| Role | Level | Description |
|---|---|---|
| `user` | 1 | Standard customer — access controlled by subscription tier |
| `editor` | 2 | Content creator — CMS access for granted packs/categories |
| `admin` | 3 | Team lead — full CMS, analytics, user list (read-only) |
| `superadmin` | 4 | Platform owner — everything, including role assignment |

### Access Matrix

| Capability | User | Editor | Admin | Superadmin |
|---|:---:|:---:|:---:|:---:|
| Access Admin Panel | - | Yes | Yes | Yes |
| Create/Edit Questions | - | Granted* | Yes | Yes |
| Delete Questions | - | - | Yes | Yes |
| Create/Edit Packs | - | Granted* | Yes | Yes |
| Delete Packs | - | - | Yes | Yes |
| Manage Pack Questions | - | Granted* | Yes | Yes |
| Bulk Import Questions | - | Yes | Yes | Yes |
| View Dashboard Analytics | - | - | Yes | Yes |
| View Subscription Analytics | - | - | Yes | Yes |
| View Pack Performance | - | - | Yes | Yes |
| View Hardest Questions | - | - | Yes | Yes |
| List All Users | - | - | Yes | Yes |
| Export Users CSV | - | - | Yes | Yes |
| Change User Roles | - | - | - | Yes |
| View Roles & Tiers Guide | - | Yes | Yes | Yes |
| Bypass Subscription Tiers | - | Yes | Yes | Yes |

\* Editors require explicit `content_permissions` grants for specific packs or categories (see [Section 11](#11-content-permissions-editor-grants)).

---

## 2. Accessing the Admin Panel

### From the Quiz App

1. Log in with an `editor`, `admin`, or `superadmin` account.
2. In the sidebar, click **Admin Panel** (visible only to staff roles).
3. You are taken to `/admin` — the Admin CMS.

### Admin Sidebar Navigation

| Link | Route | Visible To |
|---|---|---|
| Dashboard | `/admin` | `admin`+ |
| Questions | `/admin/questions` | `editor`+ |
| Bulk Import | `/admin/import` | `admin`+ |
| Quiz Packs | `/admin/packs` | `editor`+ |
| Users | `/admin/users` | `superadmin` only |
| Roles & Tiers | `/admin/guide` | `editor`+ |
| Quiz App | `/dashboard` | All (back link) |

### Route Guard

All `/admin/*` routes are wrapped in `AdminRoute`, which checks `useAuth().isEditor`. Non-staff users are redirected to `/dashboard`.

---

## 3. Dashboard & Analytics

**Route:** `/admin`
**Required Role:** `admin`+

The Admin Dashboard provides platform-wide metrics across four sections:

### 3.1 Question Stats

| Metric | Description |
|---|---|
| Total Questions | Count of all questions in the database |
| Active Questions | Questions with `status='active'` |
| Draft Questions | Questions with `status='draft'` |
| Categories | Distinct category count |

### 3.2 Platform Analytics

Data from `get_admin_analytics()` RPC:

| Metric | Description |
|---|---|
| Total Users | All registered users |
| Total Sessions | Completed quiz sessions |
| Avg Score | Average score across all completed sessions |
| Active Users (7d) | Distinct users with activity in the last 7 days |

### 3.3 Subscription Analytics

Data from `get_subscription_analytics()` RPC:

| Metric | Description |
|---|---|
| Trialing | Users currently in 14-day trial |
| Active (Basic) | Paying Basic subscribers |
| Active (Pro) | Paying Pro subscribers |
| Conversion Rate | Trial-to-paid conversion percentage |
| Canceled | Canceled subscriptions |
| Expired Trials | Trials that ended without conversion |

### 3.4 Pack Performance

Data from `get_pack_performance()` RPC:

| Column | Description |
|---|---|
| Pack Title | Name of the quiz pack |
| Plays | Total play count |
| Avg Score | Average score for this pack |
| Completion Rate | Percentage of sessions completed (vs. abandoned) |

Sorted by play count (most popular first).

### 3.5 Hardest Questions

Data from `get_hardest_questions(limit)` RPC:

| Column | Description |
|---|---|
| Question | Truncated question text (100 chars) |
| Category | Question category |
| Attempts | Total attempts (minimum 3 to qualify) |
| Accuracy | Correct answer percentage (sorted lowest first) |

### Quick Actions

- **Add Question** → `/admin/questions/new`
- **Bulk Import** → `/admin/import`

---

## 4. Question Management

**Route:** `/admin/questions`
**Required Role:** `editor`+ (editors limited to granted categories)

### 4.1 Listing Questions

The question list supports filtering and pagination:

| Filter | Options |
|---|---|
| Category | Dropdown (merged from DB + standard list) |
| Status | `active`, `draft`, `archived` |
| Search | Full-text search on question/answer text |
| Tag | Client-side search after fetch |
| Page Size | 20 per page (default) |

### 4.2 Creating a Question

**Route:** `/admin/questions/new`

| Field | Required | Description |
|---|---|---|
| `question_text` | Yes | The question to display |
| `answer_text` | Yes | The correct answer |
| `answer_explanation` | No | Additional context or explanation |
| `category` | No | Category (validated against standard list) |
| `sub_category` | No | Sub-category (depends on category) |
| `display_title` | No | Custom card label (overrides category on grid) |
| `points` | No | Point value (auto-assigned if empty) |
| `media_url` | No | Image or video URL |
| `tags` | No | Comma-separated tags |
| `status` | Yes | `active` / `draft` / `archived` |
| `is_public` | Yes | Whether visible to non-admin users |

**Workflow:**
1. Navigate to `/admin/questions/new`
2. Fill in required fields (question + answer)
3. Set status to `draft` for review, or `active` to publish immediately
4. Click **Save**
5. Success banner appears; redirects to question list

### 4.3 Editing a Question

**Route:** `/admin/questions/:id/edit`

Same form as create. All fields are editable. `updated_at` timestamp is auto-updated.

### 4.4 Deleting a Question

- Click the delete button on a question row
- Confirmation dialog appears
- **Non-recoverable** — the question is permanently deleted
- Also removes from any pack associations (`pack_questions`)
- Only `admin`+ can delete (editors cannot)

### 4.5 Exporting Questions

- **Export All** — exports all questions matching current filters to CSV
- **Export Selected** — exports only checked rows
- Columns: Question, Answer, Explanation, Category, Tags, Points, Status, Public, Media URL, Updated

---

## 5. Quiz Pack Management

**Route:** `/admin/packs`
**Required Role:** `editor`+ (editors limited to granted packs)

### 5.1 Listing Packs

| Filter | Options |
|---|---|
| Category | Dropdown |
| Status | `draft`, `active`, `archived` |
| Search | Title/description text search |
| Page Size | 20 per page |

Columns: Title, Category, Questions, Type (badges: Host/Premium/Public), Status, Plays, Updated.

### 5.2 Creating a Pack

**Route:** `/admin/packs/new`

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Pack name |
| `description` | No | Pack description |
| `cover_image_url` | No | Cover image URL |
| `category` | No | Category (autocomplete from existing) |
| `status` | Yes | `draft` / `active` / `archived` |
| `is_premium` | No | Requires paid subscription tier to play |
| `is_public` | No | Visible to non-editors in browse |
| `is_host` | No | Available only in Host Quiz mode |
| `config` | No | JSONB extensible configuration |

**Workflow:**
1. Create the pack (starts as draft by default)
2. After save, go to **Pack Questions Manager** to add questions
3. When ready, edit the pack and set `status='active'` to publish
4. Set `is_public=true` for the pack to appear in browse/carousel

### 5.3 Pack Publication Lifecycle

```
draft → active → archived
  │        │
  │        └── Visible to players (if is_public=true)
  │
  └── Only visible to admin/editor in CMS
```

**Important defaults:** New packs are `is_public=false, status='draft'`. You must explicitly set both `status='active'` AND `is_public=true` for the pack to be visible to players.

### 5.4 Deleting a Pack

- Deletes the pack and all `pack_questions` associations
- Does NOT delete the questions themselves
- Confirmation required
- Only `admin`+ can delete

---

## 6. Pack Questions Manager

**Route:** `/admin/packs/:id/questions`
**Required Role:** `editor`+ (with grant for this pack)

### Layout

- **Left panel:** Current pack questions with sort order
- **Right panel:** Browse all questions (searchable, filterable by category)

### Actions

| Action | Function | Description |
|---|---|---|
| Add question | `addQuestionToPack()` | Add a single question to the pack |
| Bulk add | `bulkAddQuestionsToPack()` | Add multiple questions at once |
| Remove question | `removeQuestionFromPack()` | Remove from pack (question still exists in DB) |
| Reorder | `updatePackQuestionOrder()` | Change sort order (drag-drop or input) |

**Auto-sync:** Adding or removing questions automatically updates `pack.question_count` via the `update_pack_question_count()` RPC.

**Sort order matters for:**
- **Sequential play** — questions appear in `sort_order` sequence
- **Jeopardy play** — questions grouped by category, ordered within groups

---

## 7. Bulk Import

**Route:** `/admin/import`
**Required Role:** `admin`+

### Workflow

1. **Download template** — Excel file with headers and sample data
2. **Fill in questions** — one question per row

   | Column | Required | Description |
   |---|---|---|
   | question | Yes | Question text |
   | answer | Yes | Answer text |
   | explanation | No | Answer explanation |
   | category | No | Category name |
   | sub_category | No | Sub-category |
   | display_title | No | Custom display title |
   | points | No | Point value |
   | media_url | No | Media URL |
   | tags | No | Comma-separated tags |
   | status | No | `active` / `draft` (defaults to `draft`) |
   | is_public | No | `true` / `false` (defaults to `true`) |

3. **Upload** — drag-drop or file picker (`.xlsx` or `.xls`)
4. **Validate** — client-side parsing shows errors and warnings
   - Non-standard categories highlighted in orange (still importable)
   - Missing required fields block import
5. **Import** — `bulkCreateQuestions()` batch inserts all valid questions
6. **Post-import** — option to create a new pack or add to an existing pack

---

## 8. User Management

**Route:** `/admin/users`
**Required Role:** `admin`+ (read), `superadmin` (role changes)

### 8.1 User KPIs

| Metric | Description |
|---|---|
| Total Users | All registered accounts |
| Active (24h) | Users with activity in last 24 hours |
| Premium/Staff | Users with paid subscription or staff role |
| Tournament % | Percentage of users who have participated in tournaments |

### 8.2 User Table

| Column | Description |
|---|---|
| User | Avatar + display name + email |
| Subscription | Tier badge (free/basic/pro/staff) |
| Quizzes | Completed quiz count |
| Tournaments | Tournament creation count |
| Avg Score | Average quiz score |
| Last Active | Relative time ("5h ago", "2d ago") |
| Status | Active (last 30d) / Inactive badge |
| Actions | Role dropdown (superadmin only) |

### 8.3 Filters

- **Search** — by display name or email (debounced 400ms)
- **Role filter** — dropdown: all, user, editor, admin, superadmin
- **Pagination** — 20 per page

### 8.4 Export

CSV export with columns: Name, Email, Role, Quizzes, Tournaments, Avg Score, Last Active, Joined.

---

## 9. Role Assignment & Staff Access

**Required Role:** `superadmin` only

### Workflow

1. Go to **Admin > Users** (`/admin/users`)
2. Find the user by name or email
3. Click the role dropdown in the Actions column
4. Select the new role: `user`, `editor`, `admin`, or `superadmin`
5. A confirmation modal appears showing:
   - Current role badge
   - New role badge
   - Warning if promoting to `superadmin`
6. Click **Confirm** to apply

### What Happens When You Change a Role

| Change | Effect |
|---|---|
| `user` → `editor` | Gains CMS access + all tier gates bypassed (full Pro access) |
| `user` → `admin` | Same as editor + analytics dashboard + user list read access |
| `user` → `superadmin` | Full system access including role assignment |
| `editor` → `user` | Loses CMS access; falls back to subscription tier (or Free) |
| Any → `superadmin` | Shows explicit warning modal |

### Key Rules

- **Staff bypass:** All staff roles (`editor`+) automatically bypass subscription tier gates. They get full Pro access without paying.
- **No separate tier assignment:** You do not assign a tier to staff — the role IS the bypass.
- **Immediate effect:** Role changes take effect on the user's next page load (no logout required).
- **Stripe untouched:** Changing roles never modifies the user's Stripe subscription. If they have a paid subscription and you promote them to editor, the subscription continues separately.
- **Demotion:** Setting a staff user back to `user` removes their CMS access and tier bypass. They fall back to whatever subscription they have.

---

## 10. Subscription & Tier Management

### Tier Structure

| Tier | Price | Features |
|---|---|---|
| **Free** | $0 | Free Quiz (Gamified), Dashboard, Profile, Guide |
| **Basic** | $9.99/mo | + Packs, History, Leaderboard, Resume |
| **Pro** | $99.99/mo | + Doubles, Host Quiz, Tournaments, AI Generate, Buzzer, Export, Certificates |

### How Subscriptions Work

1. User visits **Pricing** page and clicks Subscribe
2. Redirected to Stripe Checkout
3. After payment, returned to dashboard with success banner
4. Tier active immediately (webhook updates `subscriptions` table)

### Subscription Statuses

| Status | Meaning |
|---|---|
| `trialing` | Within 14-day free trial (auto-computed, no Stripe) |
| `active` | Paying subscriber |
| `past_due` | Payment failed |
| `canceled` | Canceled but period not expired |
| `expired` | Trial ended, no subscription |
| `staff` | Staff role bypass (not a real subscription) |

### Admin Actions for Subscriptions

Admins **cannot** directly modify subscriptions from the Admin CMS. Subscription management is handled through:

- **Stripe Dashboard** — cancel, refund, apply coupons, extend trials
- **Stripe Billing Portal** — users self-manage (upgrade, downgrade, cancel, update payment)
- **Role promotion** — promote to `editor`+ to bypass tiers entirely (no Stripe involved)

### Changing Tier Configuration

Edit `apps/quiz-app/src/config/tiers.js` — the single source of truth:

- **Change pricing/names:** Edit `TIERS` object + update Stripe Dashboard prices
- **Move a feature between tiers:** Edit `FEATURE_TIERS` — all UI auto-adapts
- **Add a new tier:** Add to `TIER_HIERARCHY` + `TIERS` + create Stripe product + DB migration for CHECK constraint

---

## 11. Content Permissions (Editor Grants)

Content permissions control which specific packs and categories an editor can access. **Currently requires manual SQL** (no admin UI).

### How It Works

The `content_permissions` table grants granular access:

| Column | Description |
|---|---|
| `user_id` | The editor's user ID |
| `resource_type` | `pack` or `category` |
| `resource_id` | Pack UUID or category name |
| `access_level` | `read`, `write`, or `manage` |

### Access Level Hierarchy

`manage` > `write` > `read`

A `write` grant includes `read`. A `manage` grant includes both.

### Granting Access (SQL)

```sql
-- Grant an editor write access to a specific pack
INSERT INTO content_permissions (user_id, resource_type, resource_id, access_level)
VALUES ('editor-user-uuid', 'pack', 'pack-uuid', 'write');

-- Grant an editor write access to all questions in a category
INSERT INTO content_permissions (user_id, resource_type, resource_id, access_level)
VALUES ('editor-user-uuid', 'category', 'Science', 'write');
```

### Revoking Access (SQL)

```sql
DELETE FROM content_permissions
WHERE user_id = 'editor-user-uuid'
  AND resource_type = 'pack'
  AND resource_id = 'pack-uuid';
```

### RLS Enforcement

These permissions are enforced at the database level via RLS policies. Editors automatically see only the packs/categories they have been granted access to. Admins and superadmins bypass these checks entirely.

---

## 12. Audit Logging

All admin CMS actions are logged to the `admin_audit_log` table.

### Logged Actions

| Action | Triggered By |
|---|---|
| `create_question` | Creating a new question |
| `update_question` | Editing an existing question |
| `delete_question` | Deleting a question |
| `bulk_create_questions` | Bulk import |
| `create_pack` | Creating a new pack |
| `update_pack` | Editing pack metadata |
| `delete_pack` | Deleting a pack |
| `add_question_to_pack` | Adding a question to a pack |
| `bulk_add_questions_to_pack` | Bulk adding questions to a pack |
| `remove_question_from_pack` | Removing a question from a pack |
| `update_pack_question_order` | Reordering questions in a pack |
| `update_user_role` | Changing a user's role |

### Log Entry Fields

| Field | Description |
|---|---|
| `id` | UUID primary key |
| `user_id` | Who performed the action |
| `action` | Action type (see table above) |
| `table_name` | Affected table (`questions_master`, `quiz_packs`, etc.) |
| `record_id` | PK of the affected record (NULL for bulk ops) |
| `payload` | JSONB with mutation data |
| `created_at` | Timestamp |

### Viewing Audit Logs (SQL)

```sql
-- Recent actions by a specific admin
SELECT action, table_name, record_id, payload, created_at
FROM admin_audit_log
WHERE user_id = 'admin-user-uuid'
ORDER BY created_at DESC
LIMIT 50;

-- All role changes
SELECT * FROM admin_audit_log
WHERE action = 'update_user_role'
ORDER BY created_at DESC;
```

---

## 13. Database Administration

### Key Tables

| Table | Purpose |
|---|---|
| `questions_master` | All quiz questions |
| `quiz_packs` | Curated question sets |
| `pack_questions` | Junction: pack ↔ question with sort_order |
| `quiz_sessions` | Player quiz sessions |
| `question_attempts` | Per-question results |
| `user_profiles` | Display names, roles, avatars, XP/badges |
| `subscriptions` | Stripe subscription state |
| `stripe_webhook_log` | Webhook idempotency + audit |
| `content_permissions` | Editor pack/category grants |
| `admin_audit_log` | CMS action audit trail |
| `ai_generation_log` | AI quiz generation audit |
| `buzzer_rooms` | Buzzer room state |
| `buzzer_participants` | Buzzer room participants |
| `host_tournaments` | Tournament brackets |
| `host_tournament_matches` | Tournament match state |

### Helper Functions (RLS)

| Function | Returns | Used By |
|---|---|---|
| `get_role()` | Current user's role | RLS policies |
| `is_admin()` | `true` if admin/superadmin | RLS policies, RPCs |
| `is_superadmin()` | `true` if superadmin | RLS policies |
| `has_content_permission(type, id, level)` | `true` if user has grant | RLS policies for editors |

### RPC Functions

| RPC | Required Role | Description |
|---|---|---|
| `get_admin_analytics()` | admin+ | Platform-wide stats |
| `get_pack_performance()` | admin+ | Pack play metrics |
| `get_hardest_questions(limit)` | admin+ | Lowest accuracy questions |
| `get_subscription_analytics()` | admin+ | Subscription/trial metrics |
| `get_user_management_kpis()` | admin+ | User KPI dashboard |
| `get_all_users_admin(search, role, limit, offset)` | admin+ | Paginated user list with stats |
| `get_subscription_state(user_id)` | any | Tier/trial state (staff bypass) |
| `get_user_stats(user_id)` | any | Aggregated quiz stats |
| `get_global_leaderboard(filter, limit)` | any | Global leaderboard |
| `get_pack_leaderboard(pack_id, limit)` | any | Per-pack top scores |
| `increment_pack_play_count(pack_id)` | any | Increment plays (SECURITY DEFINER) |
| `update_pack_question_count(pack_id)` | any | Sync question count |

### Running Migrations

Migrations are in `packages/supabase-client/migrations/`. They must be run manually in the **Supabase SQL Editor**:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste the migration SQL
4. Click **Run**

Migrations are numbered sequentially (e.g., `006_rbac.sql`, `011_tournaments.sql`, `020_buzzer_rooms.sql`, `021_doubles_config.sql`).

---

## 14. Stripe & Billing Administration

### Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Create/update subscription row |
| `customer.subscription.updated` | Update tier, status, period dates |
| `customer.subscription.deleted` | Mark subscription expired |
| `invoice.paid` | Confirm active status |
| `charge.refunded` | Flag for manual review |
| `charge.dispute.created` | Flag for manual review |

### Webhook Security

- **Signature verification:** All webhooks verified against Stripe signing secret
- **Idempotency:** `stripe_webhook_log` table prevents duplicate processing (unique `event_id`)
- **Unknown prices rejected:** Webhook rejects events with unrecognized Stripe price IDs
- **Customer fallback:** If `customer_id` lookup fails, falls back to `client_reference_id`

### Stripe Dashboard Tasks

These cannot be done from the Admin CMS — use the Stripe Dashboard:

| Task | Where |
|---|---|
| Refund a payment | Stripe > Payments > find charge > Refund |
| Cancel a subscription | Stripe > Subscriptions > find sub > Cancel |
| Apply a coupon/promo | Stripe > Coupons > create > share checkout link |
| Extend a trial | Not supported (trial is app-computed from `created_at`) |
| View payment history | Stripe > Payments |
| Update product pricing | Stripe > Products > edit price + update env vars |

### Environment Variables (Stripe)

| Variable | Description |
|---|---|
| `VITE_STRIPE_BASIC_PRICE_ID` | Stripe price ID for Basic tier |
| `VITE_STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro tier |
| `STRIPE_SECRET_KEY` | Server-side Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |

---

## 15. Security & RLS Policies

### Row-Level Security Summary

| Table | Public (anonymous) | Authenticated `user` | `editor` | `admin`+ |
|---|---|---|---|---|
| `questions_master` | Read active+public | Read active+public | Read/write granted categories | Full CRUD |
| `quiz_packs` | Read active+public | Read active+public | Read/write granted packs | Full CRUD (including drafts) |
| `pack_questions` | Read via active pack | Read via active pack | Manage granted packs | Full CRUD |
| `user_profiles` | - | Read own | Read own | Read all, superadmin update any |
| `subscriptions` | - | Read own | Read own | Read all |
| `content_permissions` | - | Read own grants | Read own grants | Read all, superadmin manage |
| `admin_audit_log` | - | Insert own | Insert own | Read all |
| `stripe_webhook_log` | - | - | - | Read (admin+) |

### Security Checklist for Admins

- [ ] Never share Stripe secret keys or webhook secrets
- [ ] Run new migrations in Supabase SQL Editor before deploying code that depends on them
- [ ] Review audit logs periodically for unexpected role changes
- [ ] Keep superadmin count to a minimum (1-2 people)
- [ ] When demoting staff, verify their subscription state (they may lose access to in-progress work)

---

## 16. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|---|---|---|
| Editor can't see a pack | Missing `content_permissions` grant | Add a grant via SQL (see [Section 11](#11-content-permissions-editor-grants)) |
| Pack not visible to players | `status='draft'` or `is_public=false` | Edit pack in CMS, set `status='active'` and `is_public=true` |
| Questions blank for non-admin | RLS policy missing or migration 019 not applied | Run migration `019_questions_via_active_pack.sql` |
| User still has access after role demotion | Cached auth state | User needs to refresh the page or sign out/in |
| Webhook not processing | Signature mismatch or duplicate event | Check `stripe_webhook_log` for errors; verify `STRIPE_WEBHOOK_SECRET` |
| Subscription not updating after payment | Webhook delay or failure | Check Stripe Dashboard > Webhooks for failed deliveries |
| Trial banner showing for staff | Role not yet synced | Verify `user_profiles.role` is set correctly in DB |
| Bulk import fails | Invalid file format or missing required fields | Use `.xlsx` format; ensure `question` and `answer` columns exist |
| Pack question count wrong | Out of sync after manual DB edit | Run `SELECT update_pack_question_count('pack-uuid')` |

### Useful SQL Queries

```sql
-- Check a user's role and subscription state
SELECT up.display_name, up.role, s.tier, s.status
FROM user_profiles up
LEFT JOIN subscriptions s ON s.user_id = up.id
WHERE up.id = 'user-uuid';

-- List all staff users
SELECT id, display_name, role FROM user_profiles
WHERE role IN ('editor', 'admin', 'superadmin');

-- Check recent audit activity
SELECT action, table_name, created_at
FROM admin_audit_log
ORDER BY created_at DESC LIMIT 20;

-- Check webhook processing status
SELECT event_id, event_type, status, error_message, created_at
FROM stripe_webhook_log
ORDER BY created_at DESC LIMIT 10;

-- Check active packs visible to players
SELECT id, title, status, is_public, is_premium, question_count
FROM quiz_packs
WHERE status = 'active' AND is_public = true;
```
