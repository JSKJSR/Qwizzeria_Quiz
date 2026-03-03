# Qwizzeria Project Audit & Workflow

This document provides a comprehensive map of the user flow, data architecture, and file-level dependencies for the Qwizzeria WebApp.

---

## 🏗️ System Architecture

Qwizzeria is a React monorepo powered by **Turborepo**.

### 1. Applications (`apps/`)
- **`quiz-app`**: The player-facing platform. Handles:
    - Landing & Marketing (`LandingPageB.jsx`)
    - Authentication Flow (`AuthProvider.jsx`, `LoginModal.jsx`)
    - Quiz Experience (Free Play, Packs, Host Mode)
    - User Profiles & Subscriptions
- **`admin-cms`**: Administrative interface for managing content and users.

### 2. Shared Packages (`packages/`)
- **`supabase-client`**: Centralized data access layer.
    - Wraps `@supabase/supabase-js`.
    - Handles Auth, CRUD, Realtime, and Postgres RPC calls.
- **`shared-types`**: Shared TypeScript definitions (In Progress).

---

## 🔄 User Flow Mapping

### 1. Discovery & Entry
- **Anonymous**: Landing Page → Browse Public Packs (Metadata only).
- **Onboarding**: Login/Sign-up via Supabase Auth (Google/Email).
- **Post-Login**: `AuthRedirect` routes user to `/dashboard` or `/admin` based on role.

### 2. Player Journey
- **Dashboard**: High-level stats, quick-play actions, resumable sessions.
- **Browse Packs**: Filterable grid of curated content (Tier-gated).
- **Play Quiz**:
    - **Sequential**: Linear question-by-question flow.
    - **Jeopardy**: Grid-based topic selection with point values.
- **Results**: Score summary, accuracy percentage, and history persistence.

### 3. Host & Tournament Flow
- **Host Quiz**: Real-time multiplayer sessions.
- **Tournaments**:
    - Bracket generation for 2-16 teams.
    - Match play via `TournamentMatchPage`.
    - Real-time sync across devices using Supabase Realtime.

---

## 📊 Data Architecture & State

### 1. Global State (`AuthContext`)
- **User**: Current user metadata.
- **Role**: `user`, `premium`, `editor`, `admin`, `superadmin`.
- **Subscription**: Tier status (`free`, `basic`, `pro`) and trial state.
- **Gating**: Helpers like `hasTier()` and `isPremium` for route and feature protection.

### 2. Quiz Engine (State Machine)
Quizzes use a `useReducer`-based state machine with phases:
- `loading` → `grid`/`preview` → `question` → `answer` → `results`/`completed`.

### 3. Database Source of Truth
- **Auth**: `auth.users`
- **Content**: `questions_master`, `quiz_packs`
- **Activity**: `quiz_sessions`, `user_profiles`
- **Tournaments**: `host_tournaments`, `host_tournament_matches`
- **Billing**: `subscriptions` (Sync via Stripe webhooks)

---

## 📂 File Audit & Dependencies

| File Path | Primary Responsibility | Key Dependencies |
| :--- | :--- | :--- |
| `apps/quiz-app/src/main.jsx` | Entry point, Supabase init | `App.jsx`, `supabase-client` |
| `apps/quiz-app/src/components/App.jsx` | Routing & Tier Gating | `react-router-dom`, `AuthProvider.jsx` |
| `apps/quiz-app/src/components/AuthProvider.jsx` | Auth, Role, & Sub state | `supabase-client`, `AuthContext.js` |
| `apps/quiz-app/src/layouts/DashboardLayout.jsx` | Unified sidebar UI & Trial alerts | `useAuth`, `SidebarTrialWidget` |
| `apps/quiz-app/src/pages/DashboardHome.jsx` | User dashboard & Stats | `users.js`, `leaderboard.js` |
| `apps/quiz-app/src/pages/PackPlay.jsx` | Quiz entry & Format selector | `packs.js`, `PackPlayJeopardy` |
| `apps/quiz-app/src/pages/TournamentMatchPage.jsx` | Tournament match state machine | `tournaments.js`, `realtime.js` |
| `packages/supabase-client/src/index.js` | Central Supabase initialization | `@supabase/supabase-js` |
| `packages/supabase-client/src/auth.js` | Auth methods & state listeners | `index.js` |
| `packages/supabase-client/src/users.js` | Role & Subscription RPCs | `index.js` |
| `packages/supabase-client/src/packs.js` | Pack & Question CRUD | `index.js` |
| `packages/supabase-client/src/realtime.js` | Tournament realtime channels | `index.js` |

---

## 🛠️ Internal Workflow Docs

For specialized workflows, refer to:
- `docs/architecture.md`: Low-level design patterns.
- `docs/database.md`: Schema and security policies.
- `docs/development.md`: Setup and contribution guide.

© 2026 Qwizzeria Project Audit Team.
