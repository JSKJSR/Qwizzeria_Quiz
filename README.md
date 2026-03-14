# Qwizzeria WebApp

![Qwizzeria Banner](https://img.shields.io/badge/Qwizzeria-Premium_Quiz_Platform-be1332?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)

Qwizzeria is a high-performance, premium quiz platform built with a modern tech stack. It features a robust Role-Based Access Control (RBAC) system, real-time multiplayer "Host Mode", a comprehensive Admin CMS, and a integrated subscription model.

---

## 🚀 Key Features

### 🎮 Player Experience
- **Landing Page Showcase**: Browse all available quiz packs with cover images in a scrollable carousel — no login required.
- **Trial & Subscriptions**: 14-day free trial on all accounts. Powered by Stripe for Basic and Pro tiers.
- **Jeopardy & Sequential Formats**: Choose how you want to play curated quiz packs — either a points-based topic grid or a linear question flow.
- **Host Mode**: Host live quiz sessions with a dedicated teacher/host view and participant scoring.
- **Real-time Buzzer System**: High-precision buzzer rooms for live play with sub-millisecond ranking.
- **Tournament Mode**: Single-elimination bracket competitions for 2–16 teams with realtime bracket updates and per-match pack selection.
- **Resume Anywhere**: In-progress sessions are synced, allowing users to pick up where they left off.
- **Leaderboards**: Global and per-pack leaderboards with real-time score tracking.

### 🛡️ Security & Access Control
- **Two-Gate Security Model**:
  - **Gate 1 (Feature Access)**: Controls entry to platform modules (e.g., Host Quiz, Admin CMS).
  - **Gate 2 (Content Permissions)**: Granular permissions for specific categories or quiz packs.
- **DB-Backed Roles**: Secure role management (`user`, `premium`, `editor`, `admin`, `superadmin`) enforced via Postgres RLS.

### 🛠️ Admin CMS
- **Integrated Dashboard**: Full CRUD for questions and quiz packs directly within the main app.
- **Bulk Operations**: High-speed Excel (.xlsx) import for mass question ingestion.
- **Platform Analytics**: Insights into pack performance, user engagement, question difficulty, and subscription conversion.
- **User Management**: Interface for role assignment and platform oversight.

---

## 🏗️ Project Architecture

Qwizzeria is a **Turborepo monorepo** designed for scalability:

```text
apps/
  └── quiz-app/          # Main application (Vite + React 19)
                         # Handles Player App + Admin CMS + Host Mode
packages/
  ├── supabase-client/   # Shared SDK wrapper and DB migrations
  └── shared-types/      # Centralized TypeScript definitions
```

### Tech Stack
- **Frontend**: React 19, Vite 6, Vanilla CSS.
- **Backend**: Supabase (Auth, Postgres, Realtime).
- **Payments**: Stripe (Subscriptions, Billing Portal).
- **Orchestration**: Turborepo, npm workspaces.
- **Testing**: Vitest (extensive coverage of core logic).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (URL and Anon/Service-Role keys)
- Stripe account (for payments)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/qwizzeria-webapp.git

# Install dependencies
npm install

# Setup environment variables
# Copy .env.example to .env.local in apps/quiz-app and packages/supabase-client
```

### Commands
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run linting across the monorepo.
- `npm run test`: Execute the test suite.

---

## 📖 Documentation

For more detailed information, please refer to the following pillars:

- [**Product Manual**](docs/product-manual.md) — How the product works, user flows, and Admin operations.
- [**Architecture Guide**](docs/architecture.md) — Technical overview of the frontend, state machines, and UI performance.
- [**Backend & Security**](docs/backend-and-security.md) — Database schema, the Two-Gate RBAC model, and RPC APIs.
- [**Development Workflow**](docs/development.md) — Guidelines for local setup, testing, and deployment.

Additional technical specifications and historical proposals can be found in [**Reference Docs**](docs/reference/).

---

## 🎨 Design Principles
Qwizzeria follows a **vibrant, dark-mode-first** aesthetic:
- **Typography**: Inter (Modern, highly readable).
- **Grid System**: Responsive "Topic Grid" cards using Flat CSS Grid.
- **Design System**: Atomic CSS variables for consistent spacing, colors, and shadows.

---

© 2026 Qwizzeria Team. Built with ❤️ and high-performance React.
ws.

---

© 2026 Qwizzeria Team. Built with ❤️ and high-performance React.