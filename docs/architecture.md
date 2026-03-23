# Architecture Guide

The Qwizzeria WebApp is designed for performance, scalability, and security. It utilizes a monorepo structure to share code and types between the player-facing application and the administrative CMS.

---

## 🏗️ Monorepo Structure

Developed using **Turborepo** and npm workspaces, the codebase is split into independent apps and shared packages.

### `apps/`
- **`quiz-app/`**: The primary product (Vite + React 19). It handles:
  - **Player App**: Landing (with pack showcase carousel), browsing, playing quizzes in **Jeopardy (grid-based)** or **Sequential (linear)** formats, user profiles, and a comprehensive **How to Play Guide**.
  - **Admin CMS**: Integrated management layer accessible at `/admin`. Provides authorized editors and admins with tools to manage the question bank and quiz packs (including direct pack creation via Bulk Import). Includes a **User Management** interface (`admin/UserList.jsx`) for superadmins, which follows a modular design with sub-components for KPIs, Tables, and Role management.

### `packages/`
- **`supabase-client/`**: A centralized package wrapping the Supabase SDK. It manages:
  - Global authentication state.
  - CRUD operations for questions and packs.
  - AI quiz generation client (`aiGenerate.js`).
  - Aggregated leaderboard and analytics queries via Postgres RPCs.
  - Database schema migrations (located in `packages/supabase-client/migrations`).
  - **Barrel Exports**: All core logic is re-exported from `index.js` for clean imports.
- **`shared-types/`**: Shared TypeScript interfaces to ensure type safety across the monorepo. (Work in progress/Partial).

---

## 🎮 Quiz Engine

Each quiz mode (Free Quiz, Pack Play, Host Quiz) is powered by a **state-machine-driven engine** implemented with React's `useReducer` and `useContext`.

### AI Generation Engine
The Host Quiz integrates an AI generation flow powered by **Claude 3.5 Sonnet**:
- **Supabase Edge Functions**: Calls the Anthropic API securely with service-role bypass.
- **Client Implementation**: `supabase-client/src/aiGenerate.js` provides `generateQuiz` and `saveGeneratedPack`.
- **UI Interaction**: `AIGenerateModal.jsx` handles the complex prompt -> generation -> preview -> edit -> save/use flow.
- **Rate Limiting**: Enforced via `ai_generation_log` table tracking (5/hour, 20/day per user; admin bypass).

### Key States
- **`loading`**: Fetching questions and initializing the session.
- **`grid`**: User selecting a topic/category (Jeopardy style).
- **`question`**: Active question being displayed.
- **`answer`**: Result reveal and point awarding.
- **`results`**: Final score tally and medals.

### Real-time Buzzer & Host UI
The Host Quiz features a modular **Host UI** with responsive layouts, collapsible scoreboards (Drawers), hero-sized Timer Controls, and a high-contrast Light/Dark mode toggle implementation.
- **Decomposition**: The core `HostQuiz.jsx`, `Guide.jsx`, and `BuzzerPage.jsx` components have been decomposed to improve maintainability and performance:
  - **Host Mode**: Logic extracted to `hostQuizReducer.js` and lifecycle hooks.
  - **How to Play Guide**: Modularized into sub-sections under `src/components/guide/` with a shared `GuideBase` and SVG visual library.
  - **Participant Buzzer**: Logic encapsulated in the `useBuzzerParticipant` hook and `buzzerReducer` state machine, with presentational components in `BuzzerUI.jsx`.
- **User Management**: The Admin User List (`UserList.jsx`) is similarly decomposed into modular components (`UserKpis`, `UserTable`, `UserFilters`) to handle the complexity of identity management.
Additionally, it supports a live **Buzzer Overlay** synchronized via Supabase Realtime using the `useBuzzerHost` hook. Participants join a session via the `/buzzer` route using a host-generated room code.
- **Precision Logging**: Utilizes sub-millisecond timestamps (`buzzerTimestamp.js`) to determine the exact order of player buzzes.
- **Feedback**: Provides immediate auditory (`buzzerSound.js`) and visual cues on both the player device and host screen.
- **State Restoration**: The host's buzzer state (`qwizzeria_host_buzzer`) is persisted alongside the host quiz session in `localStorage`, enabling robust recovery from accidental tab closures without dropping connected players.

### Tournament Mode
Host Quiz supports a **Tournament Mode** for single-elimination bracket competitions:
- **Bracket Generation**: Auto-generated single-elimination brackets for 2–16 teams, randomized seeding.
- **Match Play**: Each match is a full quiz session between two teams. Matches can be opened in separate browser tabs for parallel play.
- **Realtime Sync**: Bracket pages update in realtime via Supabase Realtime subscriptions. Spectators see results appear instantly with green flash animations and notification sounds.
- **Shareable URLs**: `/host/tournament/:id` for the bracket view, `/host/tournament/:id/match/:matchId` for individual matches.
- **Stale Match Resume**: Matches idle for 5+ minutes are flagged with pulsing indicators.
- **DB Persistence**: `host_tournaments` and `host_tournament_matches` tables store bracket state (DB is source of truth for tournaments).

### Persistence
- **Client-Side**: `localStorage` is used for 24-hour host session recovery (standard mode). Tournament mode uses DB as source of truth with lightweight session caching.
- **Server-Side**: The `quiz_sessions` table tracks progress for resumable sessions across devices.

---

## 🚀 Performance Optimizations

- **Vite 6**: Rapid HMR and optimized production bundling.
- **Path Aliases**: Uses `@/` aliases (e.g., `@/hooks/useAuth`) for clean, relative-path-independent imports.
- **Supabase Real-time**: Enables high-speed synchronization for Host Mode without complex WebSocket boilerplate.
- **Postgres RPCs**: Moving complex aggregation logic (leaderboards, analytics, **user search**) to the database layer to minimize network payload.
- **Flat CSS Grid**: Highly performant layout rendering for large topic grids.
- **Skeleton Loading**: All pages use shimmer skeleton placeholders instead of spinners for perceived performance.

---

## 🧪 Quality & Accessibility

- **Test Coverage**: 244 tests across 19 files (Vitest + jsdom) — includes gamification progression, core state machines (reducers), AI generation logic, tournament brackets, session persistence, media detection, auth, sub-millisecond buzzer resolution, and pack expiration utilities.
- **Error Handling**: All data-fetching pages display error UI with retry buttons (no silent failures).
- **WCAG Compliance**: focus-visible states, WCAG-AA contrast ratios, 44px minimum touch targets, `prefers-reduced-motion` support, semantic ARIA labels on interactive elements.
- **CI/CD**: GitHub Actions pipeline (lint → build → test) on every push/PR; Vercel deployment config.

---

## 🎨 Landing Page

The landing page (`LandingPageB`) serves as the public-facing marketing page:
- **Hero section**: Headline, CTAs (Free Game Night + Unlock Packs), Qwizzeria logo preview card.
- **Pack Carousel**: Horizontal scrollable showcase of all active, non-expired quiz packs fetched via `fetchShowcasePacks()`. Displays cover images, titles, and category tags. Uses scroll-snap for smooth navigation with arrow buttons.
- **Footer**: Social links (Patreon, Instagram, email).

Pack metadata (title, image, category) is visible to anonymous users via RLS. Expired packs are automatically hidden at the database level. Playing is gated by app-layer role checks after login.

---

© 2026 Qwizzeria Architecture Team.
