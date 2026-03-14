# Architecture Guide

The Qwizzeria WebApp is designed for performance, scalability, and security. It utilizes a monorepo structure to share code and types between the player-facing application and the administrative CMS.

---

## 🏗️ Monorepo Structure

Developed using **Turborepo** and npm workspaces, the codebase is split into independent apps and shared packages.

### `apps/`
- **`quiz-app/`**: The primary product (Vite + React 19). It handles:
  - **Player App**: Landing (with pack showcase carousel), browsing, playing quizzes in **Jeopardy (grid-based)** or **Sequential (linear)** formats, and user profiles.
  - **Host Mode**: Multiplayer sessions with integrated scoreboard, timer, and buzzer system.
  - **Admin CMS**: Integrated management layer accessible at `/admin`. Provides authorized editors and admins with tools to manage the question bank and quiz packs. Includes a **User Management** interface for superadmins.

### `packages/`
- **`supabase-client/`**: A centralized package wrapping the Supabase SDK. It manages:
  - Global authentication state.
  - CRUD operations for questions and packs.
  - Aggregated leaderboard and analytics queries via Postgres RPCs.
  - **Subscriptions**: Tracking trial status and Stripe integration state.
  - Database schema migrations (located in `packages/supabase-client/migrations`).
- **`shared-types/`**: Shared TypeScript interfaces to ensure type safety across the monorepo. (Work in progress).

---

## 🎮 Quiz Engine

Each quiz mode (Free Quiz, Pack Play, Host Quiz) is powered by a **state-machine-driven engine** implemented with React's `useReducer` and `useContext`.

### Key States
- **`loading`**: Fetching questions and initializing the session.
- **`grid`**: User selecting a topic/category (Jeopardy style).
- **`question`**: Active question being displayed.
- **`answer`**: Result reveal and point awarding.
- **`results`**: Final score tally and medals.

### Real-time Buzzer & Host UI
The Host Quiz features a redesigned **Host UI** with responsive layouts, collapsible scoreboards (Drawers), hero-sized Timer Controls, and a high-contrast Light/Dark mode toggle implementation.
Additionally, it supports a live **Buzzer Overlay** synchronized via Supabase Realtime using the `useBuzzerHost` hook. 
- **Precision Logging**: Utilizes sub-millisecond timestamps (`buzzerTimestamp.js`) to determine the exact order of player buzzes.
- **State Restoration**: The host's buzzer state is persisted in `localStorage`, enabling robust recovery from accidental tab closures.

### Tournament Mode
Host Quiz supports a **Tournament Mode** for single-elimination bracket competitions:
- **Bracket Generation**: Auto-generated single-elimination brackets for 2–16 teams.
- **Per-Match Pack Selection**: Hosts pick a different pack before each match starts, allowing for diverse topics throughout the tournament.
- **Realtime Sync**: Bracket pages update in realtime via Supabase Realtime subscriptions. Spectators see results appear instantly.

---

## 💳 Subscriptions & Gating

Qwizzeria uses a **Two-Gate Security Model** combined with a subscription system:

- **14-Day Free Trial**: Automatically starts upon user registration.
- **Stripe Integration**: Handles Basic ($3.99/mo) and Pro ($12.99/mo) plan subscriptions.
- **Feature Gating**: 
  - `free`: `/play/free` only.
  - `basic`: Unlocks all Packs and History.
  - `pro`: Unlocks Host Mode and Tournaments.
- **RBAC Bypass**: Editors and Admins bypass subscription checks for testing and management.

---

## 🚀 Performance Optimizations

- **Vite 6**: Rapid HMR and optimized production bundling.
- **Postgres RPCs**: Moving complex aggregation logic (leaderboards, analytics, user search) to the database layer.
- **Flat CSS Grid**: Highly performant layout rendering for large topic grids.
- **Skeleton Loading**: All pages use shimmer skeleton placeholders for improved perceived performance.

---

## 🧪 Quality & Accessibility

- **Test Coverage**: Comprehensive Vitest suite covering tournament logic, session persistence, and buzzer resolution.
- **Error Handling**: All data-fetching pages display error UI with retry buttons.
- **WCAG Compliance**: focus-visible states, WCAG-AA contrast ratios, 44px minimum touch targets, and semantic ARIA labels.

---

© 2026 Qwizzeria Architecture Team.
