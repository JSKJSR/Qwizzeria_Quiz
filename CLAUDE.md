# Qwizzeria WebApp - Development Guidelines

## Pre-Completion Checklist

Before completing any task, run these checks:

- Scan for hardcoded secrets, API keys, passwords
- Check for SQL injection, shell injection, path traversal
- Verify all user inputs are validated
- Run the test suite
- Check for type errors

## Project Structure

Turborepo monorepo with npm workspaces:

```
apps/
  quiz-app/          — Main Vite + React 19 quiz app (user-facing)
  admin-cms/         — Admin CMS for managing questions & packs
packages/
  shared-types/      — Shared type definitions
  supabase-client/   — Supabase SDK wrapper (auth, questions, packs, users, leaderboard)
    migrations/      — SQL migrations (run manually in Supabase SQL Editor)
```

## Quiz App Routes (apps/quiz-app)

All authenticated routes use `ProtectedRoute` + `DashboardLayout` (sidebar). Unauthenticated users see the Landing page.

| Route                      | Page/Component      | Description                            |
|----------------------------|---------------------|----------------------------------------|
| `/`                        | AuthRedirect        | Landing (unauthenticated) or redirect to /dashboard (authenticated) |
| `/dashboard`               | DashboardHome       | Welcome, quick actions, resumable sessions |
| `/play/free`               | FreeQuizPage        | Flat card grid, random questions        |
| `/play/resume/:sessionId`  | ResumePlay          | Resume an in-progress quiz session     |
| `/packs`                   | PackBrowse          | Grid of public packs, category filter  |
| `/packs/:id`               | PackDetail          | Pack info, premium gate, pack leaderboard, "Start Quiz" |
| `/packs/:id/play`          | PackPlay            | Format selection → Jeopardy or Sequential |
| `/profile`                 | Profile             | User stats, display name, resumable sessions |
| `/history`                 | History             | Paginated session history with expandable details |
| `/leaderboard`             | Leaderboard         | Global leaderboard with time filters   |
| `/host`                    | HostQuizPage        | Host multiplayer quiz: pack select → setup → grid → score → results |

## Admin CMS Routes (apps/admin-cms)

| Route                    | Page                  | Description                     |
|--------------------------|-----------------------|---------------------------------|
| `/`                      | Dashboard             | Stats, platform analytics, pack performance, hardest questions |
| `/questions`             | QuestionList          | Question table with filters     |
| `/questions/new`         | QuestionForm          | Create question                 |
| `/questions/:id/edit`    | QuestionForm          | Edit question                   |
| `/import`                | BulkImport            | Excel bulk import               |
| `/packs`                 | PackList              | Pack table with filters         |
| `/packs/new`             | PackForm              | Create pack                     |
| `/packs/:id/edit`        | PackForm              | Edit pack (status, is_public, is_premium) |
| `/packs/:id/questions`   | PackQuestionsManager  | Add/remove/reorder questions    |

## Key Architecture

- **Auth**: AuthProvider wraps quiz-app; `useAuth()` hook for user/role/signOut
- **Roles**: DB-backed roles in `user_profiles.role`: `user`, `premium`, `editor`, `admin`, `superadmin`
- **Premium**: `useAuth().isPremium` — true for `premium`+ roles (DB-level, not app_metadata)
- **Admin access**: `useAuth().isAdmin` — true for `admin`/`superadmin`; `useAuth().isEditor` for `editor`+
- **Admin CMS access**: `editor` gets questions/packs; `admin`+ gets analytics, bulk import; `superadmin` gets user management
- **Dashboard layout**: Sidebar (260px) + content area, mobile hamburger at ≤768px
- **Auth routing**: AuthRedirect (landing or /dashboard), ProtectedRoute (guards all authenticated routes)
- **Quiz grid layout**: Flat CSS Grid card layout (`repeat(auto-fill, minmax(220px, 1fr))`) used by all quiz modes — each card shows category name + points in red. Shared `TopicGrid` component for Free Quiz and Pack Play; separate `HostTopicGrid` for Host Quiz (same visual design).
- **Free quiz**: Local useReducer state machine in FreeQuiz.jsx (loading/grid/question/answer/results/error)
- **Pack play formats**:
  - **Jeopardy** (PackPlayJeopardy): Groups questions by category into flat card grid, 10/20/30 pts
  - **Sequential** (PackPlaySequential): Questions one-by-one in sort_order, 10 pts each
- **Host quiz**: HostQuiz.jsx useReducer (packSelect/setup/grid/question/answer/results)
  - Pack selection from DB packs, 2-8 participants
  - Integrated scoreboard top bar: logo + self-contained timer + participant scores + END QUIZ button
  - Timer: Self-contained component with editable min/sec inputs, MM:SS display, play/pause/reset SVG buttons, Web Audio API beeps (3× 800Hz), color states (green running → yellow ≤30s → red ≤10s → red pulse expired)
  - Flat card grid for question selection (same visual style as pack play)
  - Answer view with participant point-awarding buttons
  - Session persistence in localStorage (24h expiry)
  - Full-screen overlay (`position: fixed; inset: 0; z-index: 200`)
- **Pack visibility**: Packs default to `is_public=false, status='draft'`. Must set `is_public=true` AND `status='active'` (via Admin CMS) for users to see them.
- **Session tracking**: createQuizSession → recordAttempt → completeQuizSession (non-blocking)
- **Session lifecycle**: in_progress → completed (on finish) or abandoned (on quit)
- **Resume**: Sessions store metadata (question_ids, format) in JSONB; ResumePlay restores state
- **Leaderboard**: Global (all_time/this_week/this_month) + per-pack top 10 via Postgres RPCs
- **User profiles**: user_profiles table with display_name, stats via get_user_stats RPC
- **Supabase**: Initialized conditionally in main.jsx — app works without credentials

## Database Tables

- `questions_master` — All quiz questions (question_text, answer_text, category, media_url, points, status, is_public)
- `quiz_packs` — Curated question sets (title, category, is_premium, is_public, status, question_count, play_count). Defaults: `is_public=false`, `status='draft'`
- `pack_questions` — Junction: pack_id ↔ question_id with sort_order
- `quiz_sessions` — Play sessions (user_id, is_free_quiz, quiz_pack_id, score, status, metadata JSONB)
- `question_attempts` — Per-question results (session_id, question_id, is_correct, time_spent_ms)
- `user_profiles` — User display names, avatars, and role (id FK → auth.users, role CHECK user/premium/editor/admin/superadmin)
- `feature_access` — Gate 1: which features (free_quiz, pack_browse, pack_premium, host_quiz, admin_cms) a user can access
- `content_permissions` — Gate 2: granular read/write/manage access to specific packs or categories

## RBAC — Two-Gate Security Model

- **Gate 1 (Feature Access):** `feature_access` table controls which features a user can enter. Admin/superadmin bypass.
- **Gate 2 (Content Permissions):** `content_permissions` table controls read/write/manage access to specific packs/categories.
- **Role precedence:** superadmin > admin > editor > premium > user. Admin+ bypasses both gates.
- **Helper functions:** `is_admin()`, `is_superadmin()`, `get_role()`, `has_feature_access(feature_key)`, `has_content_permission(type, id, level)`

## RLS Policies (Key)

- `quiz_packs`: Public+active readable by everyone. Admin has full CRUD. Editors can read/write granted packs.
- `pack_questions`: Readable if parent pack is public+active, or user is admin, or editor with grant.
- `questions_master`: Public+active readable by all. Admin has full CRUD. Editors can read/write granted categories.
- `user_profiles`: Users read own. Admins read all. Superadmin can update any (role assignment).
- `feature_access`: Admin can read. Superadmin can insert/delete. Users can read own grants.
- `content_permissions`: Admin can read. Superadmin can manage. Users can read own grants.

## Postgres RPC Functions

- `get_user_stats(target_user_id)` — Aggregated user quiz stats
- `get_global_leaderboard(time_filter, result_limit)` — Global leaderboard
- `get_pack_leaderboard(target_pack_id, result_limit)` — Per-pack top scores
- `get_admin_analytics()` — Platform-wide analytics (admin-only, uses `is_admin()`)
- `get_pack_performance()` — Pack play metrics (admin-only, uses `is_admin()`)
- `get_hardest_questions(result_limit)` — Lowest accuracy questions (admin-only, uses `is_admin()`)
- `increment_pack_play_count(pack_id)` — Increment play count (SECURITY DEFINER)
- `update_pack_question_count(target_pack_id)` — Sync question count on pack

## Commands

- `npm run dev` — Start all dev servers (quiz-app :5173, admin-cms :5174)
- `npm run build` — Build all packages
- `npm run lint` — Lint all packages
- `cd apps/quiz-app && npx vitest run` — Run tests (10 tests)

## Key Component Files

- `apps/quiz-app/src/components/TopicGrid.jsx` — Flat card grid for Free Quiz + Pack Play (shared)
- `apps/quiz-app/src/components/host/HostTopicGrid.jsx` — Flat card grid for Host Quiz
- `apps/quiz-app/src/components/host/HostQuiz.jsx` — Host quiz orchestrator (useReducer state machine)
- `apps/quiz-app/src/components/host/HostScoreboard.jsx` — Integrated top bar (logo + timer + scores + END QUIZ)
- `apps/quiz-app/src/components/host/TimerControl.jsx` — Self-contained countdown timer
- `apps/quiz-app/src/components/host/HostAnswerView.jsx` — Answer display + participant scoring
- `apps/quiz-app/src/components/host/HostResultsView.jsx` — Final results with medals
- `apps/quiz-app/src/components/host/HostPackSelect.jsx` — Browse & select packs from DB
- `apps/quiz-app/src/components/host/HostParticipantSetup.jsx` — Player names (2-8)
- `apps/quiz-app/src/components/ProtectedRoute.jsx` — Auth guard (Outlet pattern)
- `apps/quiz-app/src/components/AuthRedirect.jsx` — Landing or redirect to /dashboard
- `apps/quiz-app/src/layouts/DashboardLayout.jsx` — Sidebar + content layout
- `apps/quiz-app/src/pages/DashboardHome.jsx` — Welcome, quick actions, resumable sessions

## Completed Phases

- Phase 0: Foundation & Hardening
- Phase 1: Database + Auth + Free Quiz Flow
- Phase 2: Wire Auth UI + Remove Host Mode
- Phase 3: Admin CMS (questions, bulk import)
- Phase 4: Quiz Packs + Premium (pack CRUD, browse, detail, Jeopardy + Sequential play, premium gate)
- Phase 5: Retention + Competition + Admin Intelligence (profile, history, resume, leaderboards, admin analytics)
- Phase 6: Dashboard Layout + Host Quiz (sidebar layout, auth routing, host quiz with pack select, multiplayer, integrated scoreboard bar with self-contained timer, flat card grid layout for all quiz modes)
- Phase 7: RBAC (DB-backed roles in user_profiles, Two-Gate security: feature_access + content_permissions, updated RLS policies to use is_admin()/get_role(), editor CMS access, premium as DB role)
