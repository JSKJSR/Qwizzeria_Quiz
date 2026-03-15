# Qwizzeria WebApp

![Qwizzeria Banner](https://img.shields.io/badge/Qwizzeria-Premium_Quiz_Platform-be1332?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)

Qwizzeria is a high-performance, premium quiz platform built with a modern tech stack. It features a robust Role-Based Access Control (RBAC) system, real-time multiplayer "Host Mode" with AI generation, and an integrated Admin CMS.

---

## 🚀 Key Features

### 🎮 Player Experience
- **Landing Page Showcase**: Browse all available quiz packs with cover images in a scrollable carousel — no login required.
- **3-Day Free Trial**: All new users get full access to every feature for 3 days.
- **Jeopardy & Sequential Formats**: Choose how you want to play curated quiz packs — either a points-based topic grid or a linear question flow.
- **Multisided Multiplayer**: Host live quiz sessions with a dedicated teacher/host view and participant scoring.
- **AI Quiz Generation**: Generate high-quality quiz packs on any topic instantly using the Claude 3.5 Sonnet API.
- **Tournament Mode**: Single-elimination bracket competitions for 2–16 teams with realtime bracket updates, shareable match URLs, and multi-tab parallel play.
- **Resume Anywhere**: In-progress sessions are synced, allowing users to pick up where they left off.
- **Leaderboards**: Compete globally or per-pack with real-time score tracking.
- **Subscription Tiers**: Free, Player ($3.99/mo), and Host ($12.99/mo) plans powered by Stripe.

### 🛡️ Security & Access Control
- **Two-Gate Security Model**:
  - **Gate 1 (Feature Access)**: Controls entry to platform modules (e.g., Host Quiz, AI Generation, Admin CMS).
  - **Gate 2 (Content Permissions)**: Granular permissions for specific categories or quiz packs.
- **DB-Backed Roles**: Secure role management (`user`, `premium`, `editor`, `admin`, `superadmin`) enforced at the database level via Postgres RLS.

### 🛠️ Admin CMS
- **Content Management**: Full CRUD for questions and quiz packs.
- **Bulk Operations**: High-speed Excel import for mass question ingestion.
- **Platform Analytics**: Advanced insights into pack performance, user engagement, question difficulty, and subscription metrics (trial conversion, active subscribers by tier).
- **User Management**: Superadmin interface for role assignment and platform oversight.

---

## 🏗️ Project Architecture

Qwizzeria is a **Turborepo monorepo** designed for scalability:

```text
apps/
  ├── quiz-app/          # Main application (Player App + Integrated Admin CMS)
packages/
  ├── supabase-client/   # Shared SDK wrapper, AI client, and DB migrations
  └── shared-types/      # Centralized TypeScript definitions
```

### Tech Stack
- **Frontend**: React 19, Vite, Vanilla CSS.
- **Backend**: Supabase (Auth, Postgres, Realtime, Edge Functions).
- **AI**: Claude 3.5 Sonnet (via Anthropic API).
- **Payments**: Stripe (subscriptions, billing portal).
- **Orchestration**: Turborepo, npm workspaces.
- **Testing**: Vitest (149 tests across 14 files).
- **CI/CD**: GitHub Actions (lint → build → test) + Vercel deployment.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (URL and Anon/Service-Role keys)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/qwizzeria-webapp.git

# Install dependencies
npm install

# Setup environment variables
# Copy .env.example to .env.local in apps/quiz-app
```

### Commands
- `npm run dev`: Start all development servers.
- `npm run build`: Build for production.
- `npm run lint`: Run linting across the monorepo.
- `npm run test`: Execute the test suite (149 tests).

---

## 📖 Documentation

For more detailed information, please refer to the following guides:

- [**Product Manual**](docs/product-manual.md) — How the product works, user flows, AI generation, and Admin operations.
- [**Architecture Guide**](docs/architecture.md) — Technical overview of the frontend, state machines, and AI integration.
- [**Backend & Security**](docs/backend-and-security.md) — Database schema, the Two-Gate RBAC model, and RPC APIs.
- [**Development Workflow**](docs/development.md) — Guidelines for local setup, testing, and AI-assisted dev workflow.

---

## 🎨 Design Principles
Qwizzeria follows a **vibrant, dark-mode-first** aesthetic:
- **Typography**: Inter (Modern, highly readable).
- **Grid System**: Responsive "Topic Grid" cards using Flat CSS Grid.
- **Design System**: Atomic CSS variables for consistent spacing, colors, and shadows.

---

© 2026 Qwizzeria Team. Built with ❤️ and high-performance React.