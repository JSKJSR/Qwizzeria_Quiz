# Architecture Guide

The Qwizzeria WebApp is designed for performance, scalability, and security. It utilizes a monorepo structure to share code and types between the player-facing application and the administrative CMS.

---

## 🏗️ Monorepo Structure

Developed using **Turborepo** and npm workspaces, the codebase is split into independent apps and shared packages.

### `apps/`
- **`quiz-app/`**: The primary product. Built with Vite and React 19, it handles landing (with pack showcase carousel), browsing, playing quizzes (in various formats), and user profiles. All routes except `/play/free` require authentication and render with a sidebar layout.
- **`admin-cms/`**: The management layer. Built with Vite and React, it provides authorized editors and admins with tools to manage the question bank and quiz packs. Includes a **User Management** interface for superadmins.

### `packages/`
- **`supabase-client/`**: A centralized package wrapping the Supabase SDK. It manages:
  - Global authentication state.
  - CRUD operations for questions and packs.
  - Aggregated leaderboard and analytics queries via Postgres RPCs.
  - Database schema migrations (located in `packages/supabase-client/migrations`).
- **`shared-types/`**: Shared TypeScript interfaces to ensure type safety across the monorepo. (Work in progress/Partial).

---

## 🛡️ Security Model: Two-Gate RBAC

Qwizzeria implements a robust **Two-Gate security model** adapted from enterprise asset management patterns.

### Gate 1: Feature Access
Controls whether a user is allowed to enter a specific functional module. Examples include:
- `host_quiz`: Permission to start a live multiplayer session.
- `admin_cms`: Permission to access the administrative interface.
- `pack_premium`: Permission to browse and play premium content.

### Gate 2: Content Permissions
Controls granular access levels for specific resources (Quiz Packs or Categories). Levels include:
- `read`: Can view/play.
- `write`: Can edit content.
- `manage`: Can delete or grant permissions to others.

### Role Hierarchy
1. **`superadmin`**: Bypasses all gates, full system control, and **user role assignment via the User Management UI**.
2. **`admin`**: Bypasses Gate 1 and has platform-wide management permissions.
3. **`editor`**: Granted access to `admin_cms` and specific content folders/categories.
4. **`premium`**: Granted access to `pack_premium` features.
5. **`user`**: Base role with access to free quizzes and public packs.

---

## 🎮 Quiz Engine

Each quiz mode (Free Quiz, Pack Play, Host Quiz) is powered by a **state-machine-driven engine** implemented with React's `useReducer` and `useContext`.

### Key States
- **`loading`**: Fetching questions and initializing the session.
- **`grid`**: User selecting a topic/category (Jeopardy style).
- **`question`**: Active question being displayed.
- **`answer`**: Result reveal and point awarding.
- **`results`**: Final score tally and medals.

### Persistence
- **Client-Side**: `localStorage` is used for 24-hour host session recovery.
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
