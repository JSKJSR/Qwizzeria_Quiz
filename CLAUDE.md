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
  quiz-app/          — Main Vite + React 19 application (Player App + Admin CMS)
packages/
  shared-types/      — Shared type definitions (In Progress)
  supabase-client/   — Supabase SDK wrapper (auth, questions, packs, users, leaderboard)
    migrations/      — SQL migrations (run manually in Supabase SQL Editor)
```

## Quiz App Routes (apps/quiz-app)

Authenticated routes use `ProtectedRoute` + `DashboardLayout` (sidebar). Unauthenticated users see the Landing page. Only `/play/free` is publicly accessible without login.

| Route                      | Page/Component      | Description                            |
|----------------------------|---------------------|----------------------------------------|
| `/`                        | AuthRedirect        | Landing (unauthenticated) or redirect to /dashboard (authenticated) |
| `/play/free`               | FreeQuizPage        | Flat card grid, random questions (public, no login required) |
| `/dashboard`               | DashboardHome       | Welcome, quick actions, resumable sessions |
| `/play/resume/:sessionId`  | ResumePlay          | Resume an in-progress quiz session     |
| `/packs`                   | PackBrowse          | Grid of packs with category filter (requires login, sidebar) |
| `/packs/:id`               | PackDetail          | Pack info, premium gate, pack leaderboard, "Start Quiz" |
| `/packs/:id/play`          | PackPlay            | Format selection → Jeopardy or Sequential |
| `/profile`                 | Profile             | User stats, display name, resumable sessions |
| `/history`                 | History             | Paginated session history with expandable details |
| `/leaderboard`             | Leaderboard         | Global leaderboard with time filters (requires login, sidebar) |
| `/host`                    | HostQuizPage        | Host multiplayer quiz: pack select → setup → grid → score → results |
| `/guide`                   | Guide               | How to Play guide |
| `/buzz/:roomCode`          | BuzzerPage          | Real-time buzzer for participants (auth required, full-screen) |

## Admin CMS Routes (apps/quiz-app/src/pages/admin)

Access restricted via role checks (editor, admin, superadmin).

| Route                      | Page                  | Description                     |
|----------------------------|-----------------------|---------------------------------|
| `/admin`                   | Dashboard             | Stats, platform analytics, pack performance, hardest questions |
| `/admin/questions`         | QuestionList          | Question table with filters     |
| `/admin/questions/new`     | QuestionForm          | Create question                 |
| `/admin/questions/:id/edit`| QuestionForm          | Edit question                   |
| `/admin/import`            | BulkImport            | Excel bulk import               |
| `/admin/packs`             | PackList              | Pack table with filters         |
| `/admin/packs/new`         | PackForm              | Create pack                     |
| `/admin/packs/:id/edit`    | PackForm              | Edit pack (status, is_public, is_premium) |
| `/admin/packs/:id/questions`| PackQuestionsManager | Add/remove/reorder questions    |
| `/admin/users`             | UserList              | User management (superadmin only) |
| `/admin/doubles`           | DoublesSessions       | Doubles session browse & grading (admin+) |
| `/admin/guide`             | RolesAndTiersGuide    | Roles & tiers reference (editor+) |
| `/admin/ops`               | AdminOpsManual        | Admin operations manual (admin+)  |

## Key Architecture

- **Auth**: AuthProvider wraps quiz-app; `useAuth()` hook for user/role/signOut
- **Roles**: DB-backed roles in `user_profiles.role`: `user`, `editor`, `admin`, `superadmin` (operational/staff access only)
- **Subscription tiers**: `free`, `basic`, `pro` — controls player feature access via `subscriptions` table + `useEntitlement` hook
- **Admin access**: `useAuth().isAdmin` — true for `admin`/`superadmin`; `useAuth().isEditor` for `editor`+
- **Admin CMS access**: `editor` gets questions/packs; `admin`+ gets analytics, bulk import; `superadmin` gets user management
- **Dashboard layout**: Sidebar (260px) + content area, mobile hamburger at ≤768px
- **Auth routing**: AuthRedirect (landing or /dashboard), ProtectedRoute (guards all authenticated routes)
- **Quiz grid layout**: Flat CSS Grid card layout (`repeat(auto-fill, minmax(220px, 1fr))`) used by all quiz modes — each card shows category name + points in red. Shared `TopicGrid` component for Free Quiz and Pack Play; separate `HostTopicGrid` for Host Quiz (same visual design).
- **Free quiz**: Local useReducer state machine in FreeQuiz.jsx (loading/grid/question/feedback/results/error). Uses Duolingo-style answer input with fuzzy matching. Engagement features: lightweight gamification (XP, levels, daily streak, badges) synced to DB for logged-in users, score bounce animation, question count selector (9/18/27), personal best tracking (localStorage), share score button, context-aware signup nudge for anonymous users, and statistics/progression feedback on results.
- **Pack play formats**:
  - **Jeopardy** (PackPlayJeopardy): Groups questions by category into flat card grid, 10/20/30 pts
  - **Sequential** (PackPlaySequential): Questions one-by-one in sort_order, 10 pts each
- **AI quiz generation**: Pro users can generate quizzes on any topic via Claude API (Supabase Edge Function). AIGenerateModal in HostPackSelect: input → generating → preview (inline edit/delete) → "Use Without Saving" (ephemeral) or "Save & Use" (persists to DB). Rate limited: 5/hour, 20/day per user; admin bypass. Generated packs use same data shape as DB packs — zero reducer changes needed.
- **Host quiz**: HostQuiz.jsx useReducer (packSelect/setup/grid/question/answer/results)
  - Pack selection from DB packs + "Generate with AI" card, 2-8 participants
  - Integrated scoreboard top bar: logo + self-contained timer + participant scores + END QUIZ button
  - Timer: Self-contained component with editable min/sec inputs, MM:SS display, play/pause/reset SVG buttons, Web Audio API beeps (3× 800Hz), color states (green running → yellow ≤30s → red ≤10s → red pulse expired), `onTick` prop for broadcasting timer sync to participants
  - Flat card grid for question selection (same visual style as pack play)
  - Answer view with participant point-awarding buttons
  - Session persistence in localStorage (24h expiry) for quiz state and buzzer rooms
  - Full-screen overlay (`position: fixed; inset: 0; z-index: 200`)
  - **Mode selector**: BuzzerOverlay idle state shows two mode cards (Buzzer / Collect Answers) instead of side-by-side buttons, with participant readiness count and zero-participant warning
  - **Auto-open responses**: When timer expires during input collection, ResponsesModal auto-opens (no manual click)
  - **Timer sync**: Host broadcasts timer ticks via Supabase Broadcast; participants see live MM:SS countdown with color states
  - **Score publish**: "Publish" button in scoreboard broadcasts rankings to participant devices (5s auto-dismiss overlay)
  - **Export results**: CSV download + PDF print from HostResultsView
  - **Certificates**: Canvas-based PNG certificates for top 3 finishers (1200×800, Qwizzeria branding)
- **Landing page**: LandingPageB with hero section + pack carousel (fetches all active packs via `fetchShowcasePacks`)
- **Pack visibility**: Packs default to `is_public=false, status='draft', expires_at=NULL`. Must set `status='active'` (via Admin CMS) for packs to be visible. Optional `expires_at` timestamp hides packs after expiration. RLS allows all active non-expired packs to be read by everyone (including anonymous); app-layer role checks control who can actually play (premium/host gating).
- **Pack expiration**: Optional `expires_at TIMESTAMPTZ` on `quiz_packs`. Enforced at DB level via RLS (`expires_at IS NULL OR expires_at > now()`). Three policies updated: `packs_select_public`, `pack_questions_select_public`, `questions_select_via_active_pack`. Admin sees all packs including expired. Utility functions in `utils/packExpiration.js`, reusable `ExpirationBadge` component.
- **Session tracking**: createQuizSession → recordAttempt → completeQuizSession (non-blocking)
- **Session lifecycle**: in_progress → completed (on finish) or abandoned (on quit)
- **Resume**: Sessions store metadata (question_ids, format) in JSONB; ResumePlay restores state
- **Leaderboard**: Global (all_time/this_week/this_month) + per-pack top 10 via Postgres RPCs
- **User profiles**: user_profiles table with display_name, stats via get_user_stats RPC
- **Path aliases**: `@/` maps to `apps/quiz-app/src/` (configured in vite.config.js + jsconfig.json). Use `@/hooks/useAuth` instead of `../../hooks/useAuth`.
- **Barrel exports**: `import { fn } from '@qwizzeria/supabase-client'` — all modules re-exported from index.js. Deep paths (`/src/packs.js`) still work for backward compat.
- **Supabase**: Initialized conditionally in main.jsx — app works without credentials

## Subscription & Tier System

- **Tier config**: `apps/quiz-app/src/config/tiers.js` — single source of truth for tier hierarchy, pricing, feature-to-tier mapping
- **Tiers**: Free ($0) → Basic ($9.99/mo) → Pro ($19.99/mo). Staff roles bypass all gating.
- **Trial**: 14-day Pro trial computed from `user_profiles.created_at` (no Stripe trial)
- **Gating hook**: `useEntitlement(feature)` — returns `{ allowed, requiredTier, currentTier, reason }`
- **Gating components**: `TierRoute` (layout route), `SubscriptionGate` (wrapper), `UpgradeWall` (contextual messaging)
- **Stripe**: Checkout (create-checkout.js), Webhook (webhook.js with idempotency via `stripe_webhook_log`), Portal (create-portal.js)
- **Subscription state**: `get_subscription_state` RPC — staff bypass, subscription row check, trial computation
- **Post-payment**: `SubscriptionSuccessBanner` polls `refreshSubscription()` after checkout return; Profile refreshes on `visibilitychange`
- **TrialBanner**: Shows for all trial days (softer tone days 6-14, urgent ≤5 days)
- **Admin tier override**: Superadmins can change a user's tier directly in Admin → Users via `UserSubscriptionModal` (no Stripe involved; stored in `subscriptions` table)
- **Streak Freezes**: `streak_freeze_3` (Basic: 3/month) and `streak_freeze_unlimited` (Pro: 30/month) in `FEATURE_TIERS`
- **Adding/changing tiers**: Edit `config/tiers.js` → all UI auto-adapts. See `docs/tier-strategy.md` for details.

## Database Tables

- `questions_master` — All quiz questions (question_text, answer_text, category, media_url, points, status, is_public)
- `quiz_packs` — Curated question sets (title, category, is_premium, is_public, status, question_count, play_count, expires_at). Defaults: `is_public=false`, `status='draft'`, `expires_at=NULL` (no expiration)
- `pack_questions` — Junction: pack_id ↔ question_id with sort_order
- `quiz_sessions` — Play sessions (user_id, is_free_quiz, quiz_pack_id, score, status, metadata JSONB)
- `question_attempts` — Per-question results (session_id, question_id, is_correct, time_spent_ms)
- `ai_generation_log` — AI quiz generation audit log (user_id, topic, question_count, difficulty, created_at). Rate limiting via time-window queries.
- `user_profiles` — User display names, avatars, and role (id FK → auth.users, role CHECK user/editor/admin/superadmin)
- `subscriptions` — Stripe subscriptions (user_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_start/end, cancel_at_period_end, trial_start/end)
- `stripe_webhook_log` — Webhook idempotency + audit (event_id UNIQUE, event_type, status, error_message)
- `feature_access` — Legacy Gate 1 table (defined but unused — superseded by tier system)
- `content_permissions` — Gate 2: granular read/write/manage access to specific packs or categories (used in RLS for editor access)
- `daily_missions` — Per-user daily mission progress (user_id, mission_key, progress, target, xp_reward, completed_at, mission_date)
- `user_leagues` — Weekly league standings (user_id, league, weekly_xp, week_start)

## Authorization Model

Two independent systems control access:

- **Roles** (`user_profiles.role`): `user` < `editor` < `admin` < `superadmin`. Controls staff/CMS access and DB-level security (RLS). Staff roles (editor+) bypass all subscription gating.
- **Tiers** (`subscriptions.tier`): `free` < `basic` < `pro`. Controls player feature access. Managed by Stripe webhooks. `useEntitlement` hook + `config/tiers.js` is the single source of truth.
- **Content Permissions** (`content_permissions` table): Granular read/write/manage grants for editors on specific packs/categories. Used in RLS only; no admin UI (requires manual SQL).
- **Helper functions:** `is_admin()`, `is_superadmin()`, `get_role()`, `has_content_permission(type, id, level)`

## RLS Policies (Key)

- `quiz_packs`: All active non-expired packs readable by everyone (including anonymous). Expired packs (`expires_at` in the past) are hidden from non-admin users. Admin sees all packs (including drafts and expired). Admin has full CRUD. Editors can read/write granted packs.
- `pack_questions`: Readable if parent pack is public+active+non-expired, or user is admin, or editor with grant.
- `questions_master`: Public+active readable by all. Admin has full CRUD. Editors can read/write granted categories.
- `user_profiles`: Users read own. Admins read all. Superadmin can update any (role assignment).
- `feature_access`: Admin can read. Superadmin can insert/delete. Users can read own grants.
- `content_permissions`: Admin can read. Superadmin can manage. Users can read own grants.

## Postgres RPC Functions

- `get_subscription_state(target_user_id)` — Subscription/trial/gating state (staff bypass, subscription check, trial computation)
- `get_subscription_analytics()` — Subscription analytics (admin-only)
- `get_user_stats(target_user_id)` — Aggregated user quiz stats
- `get_global_leaderboard(time_filter, result_limit)` — Global leaderboard
- `get_pack_leaderboard(target_pack_id, result_limit)` — Per-pack top scores
- `get_admin_analytics()` — Platform-wide analytics (admin-only, uses `is_admin()`)
- `get_pack_performance()` — Pack play metrics (admin-only, uses `is_admin()`)
- `get_hardest_questions(result_limit)` — Lowest accuracy questions (admin-only, uses `is_admin()`)
- `increment_pack_play_count(pack_id)` — Increment play count (SECURITY DEFINER)
- `update_pack_question_count(target_pack_id)` — Sync question count on pack

## Commands

- `npm run dev` — Start the quiz-app dev server (Player + Admin CMS) at :5173
- `npm run build` — Build all packages
- `npm run lint` — Lint all packages
- `cd apps/quiz-app && npx vitest run` — Run tests (168 tests across 15 files)

## Key Component Files

- `apps/quiz-app/src/components/TopicGrid.jsx` — Flat card grid for Free Quiz + Pack Play (shared)
- `apps/quiz-app/src/components/host/HostTopicGrid.jsx` — Flat card grid for Host Quiz
- `apps/quiz-app/src/components/host/HostQuiz.jsx` — Host quiz orchestrator (handlers + render, ~615 lines)
- `apps/quiz-app/src/components/host/hostQuizReducer.js` — Extracted reducer, ACTIONS, buildTopics, initialState (~478 lines)
- `apps/quiz-app/src/hooks/useHostQuizPersistence.js` — Session restore on mount + debounced persistence
- `apps/quiz-app/src/hooks/useTournamentSync.js` — Tournament DB creation + match pack persistence
- `apps/quiz-app/src/components/host/TieBreakerModal.jsx` — Tie-breaker winner selection modal
- `apps/quiz-app/src/components/host/TournamentResultsView.jsx` — Tournament results with bracket recap
- `apps/quiz-app/src/components/host/HostScoreboard.jsx` — Integrated top bar (logo + timer + scores + END QUIZ)
- `apps/quiz-app/src/components/host/TimerControl.jsx` — Self-contained countdown timer
- `apps/quiz-app/src/components/host/HostAnswerView.jsx` — Answer display + participant scoring
- `apps/quiz-app/src/components/host/HostResultsView.jsx` — Final results with medals
- `apps/quiz-app/src/components/host/AIGenerateModal.jsx` — AI quiz generation modal (input/generating/preview/error states)
- `apps/quiz-app/src/components/host/HostPackSelect.jsx` — Browse & select packs from DB + "Generate with AI" card
- `apps/quiz-app/src/components/host/HostParticipantSetup.jsx` — Player names (2-8)
- `apps/quiz-app/src/utils/packExpiration.js` — Pack expiration utilities (isExpired, isExpiringSoon, getExpirationStatus, formatExpiration, toExpiresAtValue, toDatetimeLocalValue)
- `apps/quiz-app/src/components/ExpirationBadge.jsx` — Reusable expiration badge (Expired/Expiring soon)
- `apps/quiz-app/src/config/tiers.js` — Centralized tier config (TIERS, FEATURE_TIERS, tierSatisfies, getTierList)
- `apps/quiz-app/src/hooks/useEntitlement.js` — Feature entitlement hook (allowed, requiredTier, reason)
- `apps/quiz-app/src/components/SubscriptionGate.jsx` — TierRoute (layout) + SubscriptionGate (wrapper)
- `apps/quiz-app/src/components/UpgradeWall.jsx` — Contextual upgrade prompt (trial_expired/canceled/tier_insufficient)
- `apps/quiz-app/src/components/SubscriptionSuccessBanner.jsx` — Post-checkout success banner with polling
- `apps/quiz-app/src/components/TrialBanner.jsx` — Trial countdown banner (all days, urgent ≤5)
- `apps/quiz-app/src/components/ProtectedRoute.jsx` — Auth guard (Outlet pattern)
- `apps/quiz-app/src/components/AuthRedirect.jsx` — Landing or redirect to /dashboard
- `apps/quiz-app/src/layouts/DashboardLayout.jsx` — Sidebar + content layout
- `apps/quiz-app/src/pages/DashboardHome.jsx` — Welcome, quick actions, resumable sessions
- `apps/quiz-app/src/components/LandingPageB.jsx` — Landing page with hero + pack carousel
- `packages/supabase-client/src/packs.js` — Pack CRUD, browsing, play, showcase, admin analytics RPCs
- `packages/supabase-client/src/aiGenerate.js` — AI quiz generation client (generateQuiz + saveGeneratedPack)
- `packages/supabase-client/src/buzzer.js` — Buzzer room CRUD + Supabase Broadcast channel
- `apps/quiz-app/src/pages/BuzzerPage.jsx` — Decomposed participant buzzer page (orchestrator, 105 lines)
- `apps/quiz-app/src/components/buzzer/` — Buzzer participant sub-components (Reducer, Hook, UI)
- `apps/quiz-app/src/hooks/useBuzzerHost.js` — Host-side buzzer hook (room lifecycle, buzz ranking)
- `apps/quiz-app/src/components/host/BuzzerOverlay.jsx` — Host buzzer controls overlay
- `apps/quiz-app/src/utils/buzzerTimestamp.js` — Buzz ranking, tie detection, validation
- `apps/quiz-app/src/utils/buzzerSound.js` — Web Audio buzzer sound effects
- `apps/quiz-app/src/utils/exportResults.js` — CSV download + PDF print for quiz results
- `apps/quiz-app/src/utils/certificateGenerator.js` — Canvas-based PNG certificate generation for top 3
- `apps/quiz-app/src/pages/Guide.jsx` — Guide page orchestrator (7 sections)
- `apps/quiz-app/src/components/guide/` — Guide sub-components (Base, Visuals, Sections: GettingStarted, FreeQuiz, PlayPacks, HostQuiz, AIGenerate, BuzzerMode, Tournament)
- `apps/quiz-app/src/components/QuestionView.jsx` — Shared question display component with SVG countdown ring timer, media toggle, and optional answer text input (used in Sequential + Doubles play)
- `apps/quiz-app/src/components/DailyMissions.jsx` — Dashboard widget showing daily mission progress bars and XP rewards (fetches from `fetchDailyMissions` RPC)
- `apps/quiz-app/src/components/LeagueBadge.jsx` — Dashboard widget showing user's weekly league tier and XP earned (fetches from `fetchUserLeague`)
- `apps/quiz-app/src/pages/admin/UserList.jsx` — Decomposed admin user management (orchestrator, 184 lines)
- `apps/quiz-app/src/components/admin/users/` — User management sub-components (KPIs, Table, Filters, UserRoleConfirmModal, UserSubscriptionModal)
- `apps/quiz-app/src/pages/admin/DoublesSessions.jsx` — Admin page to browse and grade Doubles quiz sessions (admin+)
- `apps/quiz-app/src/components/admin/doubles/DoublesGradeModal.jsx` — Modal for grading individual Doubles session answers
- `apps/quiz-app/src/pages/admin/AdminOpsManual.jsx` — Admin operations manual page (18 sections)
- `apps/quiz-app/src/pages/admin/RolesAndTiersGuide.jsx` — Roles & tiers reference page

## Completed Phases

- Phase 0: Foundation & Hardening
- Phase 1: Database + Auth + Free Quiz Flow
- Phase 2: Wire Auth UI + Remove Host Mode
- Phase 3: Admin CMS (questions, bulk import)
- Phase 4: Quiz Packs + Premium (pack CRUD, browse, detail, Jeopardy + Sequential play, premium gate)
- Phase 5: Retention + Competition + Admin Intelligence (profile, history, resume, leaderboards, admin analytics)
- Phase 6: Dashboard Layout + Host Quiz (sidebar layout, auth routing, host quiz with pack select, multiplayer, integrated scoreboard bar with self-contained timer, flat card grid layout for all quiz modes)
- Phase 7: RBAC (DB-backed roles in user_profiles, content_permissions for editor grants, updated RLS policies to use is_admin()/get_role(), editor CMS access, User Management UI)
- Phase 8: Polish & Quality (test coverage 53 tests, error UI with retry on all pages, skeleton loading states, WCAG accessibility improvements, CI/CD pipeline, landing page pack carousel, host pack cover images, simplified RLS for active pack showcase)
- Phase 9: AI Quiz Generation (Supabase Edge Function + Claude API, AIGenerateModal with preview/edit, "Generate with AI" in HostPackSelect, rate limiting, Pro-gate)
- Phase 10: Codebase Improvements (HostQuiz.jsx decomposed from 1283→615 lines, Guide.jsx decomposed from 705→23 lines, BuzzerPage.jsx decomposed from 686→105 lines, UserList.jsx decomposed from 574→184 lines, reducer/hooks/components extracted, 168 tests across 15 files, `@/` path aliases, barrel exports for supabase-client)
- Phase 11: Tier Strategy Implementation (centralized tier config in `config/tiers.js`, `useEntitlement` hook, webhook security fixes — unknown price rejection/explicit status mapping/customer fallback/idempotency, post-payment UX — success banner with polling/visibilitychange refresh, contextual UpgradeWall messaging, TrialBanner for all trial days, downgrade warnings on Pricing page, `invoice.paid`/`charge.refunded`/`charge.dispute.created` webhook handlers, `stripe_webhook_log` table, WCAG focus-visible/aria-labels/sr-only text, DoublesRoute replaced with TierRoute, `tier-strategy.md` updated, removed vestigial `premium` DB role — pack visibility now uses subscription tier instead of role, `feature_access` table marked legacy)
- Phase 12: Engagement & Admin Improvements (Daily Missions system with progress tracking and XP rewards, Leagues system with weekly tier-based competition, Streak Freezes per tier, `QuestionView.jsx` shared component with countdown ring timer, Doubles Sessions admin page with answer grading modal, `UserSubscriptionModal` for direct admin tier overrides, `DailyMissions` + `LeagueBadge` dashboard widgets, 244 tests across 19 files)

## Full Documentation

For detailed guides, see the `docs/` directory:
- [Product Manual](docs/product-manual.md) (Features, flows, Admin CMS)
- [Architecture Guide](docs/architecture.md) (Frontend UI, React state)
- [Backend & Security](docs/backend-and-security.md) (Supabase, Roles, DB Schema)
- [Development Workflow](docs/development.md) (Tests, local setup, CI/CD)
- [Roles & Tiers Guide](docs/roles-and-tiers-guide.md) (Sales/marketing-friendly guide to roles and pricing)
- [Admin Operations Manual](docs/admin-operations-manual.md) (Comprehensive admin/superadmin operations guide)
