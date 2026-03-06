# Architecture Guide

The Qwizzeria WebApp is designed for performance, scalability, and security. It utilizes a monorepo structure to share code and types between the player-facing application and the administrative CMS.

---

## 🏗️ Monorepo Structure

Developed using **Turborepo** and npm workspaces, the codebase is split into independent apps and shared packages.

### `apps/`
- **`quiz-app/`**: The primary product (Vite + React 19). It handles:
  - **Player App**: Landing (with pack showcase carousel), browsing, playing quizzes in **Jeopardy (grid-based)** or **Sequential (linear)** formats, and user profiles.
  - **Admin CMS**: Integrated management layer accessible at `/admin`. Provides authorized editors and admins with tools to manage the question bank and quiz packs. Includes a **User Management** interface for superadmins.

### `packages/`
- **`supabase-client/`**: A centralized package wrapping the Supabase SDK. It manages:
  - Global authentication state.
  - CRUD operations for questions and packs.
  - Aggregated leaderboard and analytics queries via Postgres RPCs.
  - Database schema migrations (located in `packages/supabase-client/migrations`).
- **`shared-types/`**: Shared TypeScript interfaces to ensure type safety across the monorepo. (Work in progress/Partial).

---

## 🎮 Quiz Engine

Each quiz mode (Free Quiz, Pack Play, Host Quiz) is powered by a **state-machine-driven engine** implemented with React's `useReducer` and `useContext`.

### Key States
- **`loading`**: Fetching questions and initializing the session.
- **`grid`**: User selecting a topic/category (Jeopardy style).
- **`question`**: Active question being displayed.
- **`answer`**: Result reveal and point awarding.
- **`results`**: Final score tally and medals.

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
- **Supabase Real-time**: Enables high-speed synchronization for Host Mode without complex WebSocket boilerplate.
- **Postgres RPCs**: Moving complex aggregation logic (leaderboards, analytics, **user search**) to the database layer to minimize network payload.
- **Flat CSS Grid**: Highly performant layout rendering for large topic grids.
- **Skeleton Loading**: All pages use shimmer skeleton placeholders instead of spinners for perceived performance.

---

## 🧪 Quality & Accessibility

- **Test Coverage**: 53 tests across 5 files (Vitest + jsdom) — tournament bracket logic, session persistence, media detection, auth, supabase client.
- **Error Handling**: All data-fetching pages display error UI with retry buttons (no silent failures).
- **WCAG Compliance**: focus-visible states, WCAG-AA contrast ratios, 44px minimum touch targets, `prefers-reduced-motion` support, semantic ARIA labels on interactive elements.
- **CI/CD**: GitHub Actions pipeline (lint → build → test) on every push/PR; Vercel deployment config.

---

## 🎨 Landing Page

The landing page (`LandingPageB`) serves as the public-facing marketing page:
- **Hero section**: Headline, CTAs (Free Game Night + Unlock Packs), Qwizzeria logo preview card.
- **Pack Carousel**: Horizontal scrollable showcase of all active quiz packs fetched via `fetchShowcasePacks()`. Displays cover images, titles, and category tags. Uses scroll-snap for smooth navigation with arrow buttons.
- **Footer**: Social links (Patreon, Instagram, email).

Pack metadata (title, image, category) is visible to anonymous users via RLS. Playing is gated by app-layer role checks after login.

---

© 2026 Qwizzeria Architecture Team.
