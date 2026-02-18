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
| `/play/free`               | FreeQuizPage        | 3x3 Jeopardy grid, random questions    |
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
| `/packs/:id/edit`        | PackForm              | Edit pack                       |
| `/packs/:id/questions`   | PackQuestionsManager  | Add/remove/reorder questions    |

## Key Architecture

- **Auth**: AuthProvider wraps quiz-app; `useAuth()` hook for user/signOut
- **Premium**: `user.app_metadata.is_premium === true` (set in Supabase dashboard, no payment integration)
- **Admin access**: `user.app_metadata.role === 'admin'`
- **Dashboard layout**: Sidebar (260px) + content area, mobile hamburger at ≤768px
- **Auth routing**: AuthRedirect (landing or /dashboard), ProtectedRoute (guards all authenticated routes)
- **Free quiz**: Local useReducer state machine in FreeQuiz.jsx (loading/grid/question/answer/results/error)
- **Pack play formats**:
  - **Jeopardy** (PackPlayJeopardy): Groups questions by category into grid, 10/20/30 pts
  - **Sequential** (PackPlaySequential): Questions one-by-one in sort_order, 10 pts each
- **Host quiz**: HostQuiz.jsx useReducer (packSelect/setup/grid/question/answer/results)
  - Pack selection from DB packs, 2-8 participants, configurable timer
  - Grid + scoreboard + answer view with point awarding per participant
  - Timer: Web Audio API beeps, visual warning at 30s/10s
  - Session persistence in localStorage (24h expiry)
  - Full-screen overlay (`position: fixed; inset: 0; z-index: 200`)
- **Session tracking**: createQuizSession → recordAttempt → completeQuizSession (non-blocking)
- **Session lifecycle**: in_progress → completed (on finish) or abandoned (on quit)
- **Resume**: Sessions store metadata (question_ids, format) in JSONB; ResumePlay restores state
- **Leaderboard**: Global (all_time/this_week/this_month) + per-pack top 10 via Postgres RPCs
- **User profiles**: user_profiles table with display_name, stats via get_user_stats RPC
- **Supabase**: Initialized conditionally in main.jsx — app works without credentials

## Database Tables

- `questions_master` — All quiz questions (question_text, answer_text, category, media_url, status, is_public)
- `quiz_packs` — Curated question sets (title, category, is_premium, is_public, status, question_count, play_count)
- `pack_questions` — Junction: pack_id ↔ question_id with sort_order
- `quiz_sessions` — Play sessions (user_id, is_free_quiz, quiz_pack_id, score, status, metadata)
- `question_attempts` — Per-question results (session_id, question_id, is_correct, time_spent_ms)
- `user_profiles` — User display names and avatars (id FK → auth.users)

## Postgres RPC Functions

- `get_user_stats(target_user_id)` — Aggregated user quiz stats
- `get_global_leaderboard(time_filter, result_limit)` — Global leaderboard
- `get_pack_leaderboard(target_pack_id, result_limit)` — Per-pack top scores
- `get_admin_analytics()` — Platform-wide analytics (admin-only)
- `get_pack_performance()` — Pack play metrics (admin-only)
- `get_hardest_questions(result_limit)` — Lowest accuracy questions (admin-only)

## Commands

- `npm run dev` — Start all dev servers (quiz-app :5173, admin-cms :5174)
- `npm run build` — Build all packages
- `npm run lint` — Lint all packages
- `cd apps/quiz-app && npx vitest run` — Run tests (10 tests)

## Completed Phases

- Phase 0: Foundation & Hardening
- Phase 1: Database + Auth + Free Quiz Flow
- Phase 2: Wire Auth UI + Remove Host Mode
- Phase 3: Admin CMS (questions, bulk import)
- Phase 4: Quiz Packs + Premium (pack CRUD, browse, detail, Jeopardy + Sequential play, premium gate)
- Phase 5: Retention + Competition + Admin Intelligence (profile, history, resume, leaderboards, admin analytics)
- Phase 6: Dashboard Layout + Host Quiz (sidebar layout, auth routing, host quiz with pack select, multiplayer, timer, results)
