# Qwizzeria WebApp

![Qwizzeria Banner](https://img.shields.io/badge/Qwizzeria-Premium_Quiz_Platform-be1332?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)

Qwizzeria is a high-performance, premium quiz platform built with a modern tech stack. It features a robust Role-Based Access Control (RBAC) system, real-time multiplayer "Host Mode", and a comprehensive Admin CMS.

---

## 🚀 Key Features

### 🎮 Player Experience
- **Jeopardy & Sequential Formats**: Choose how you want to play curated quiz packs.
- **Multisided Multiplayer**: Host live quiz sessions with a dedicated teacher/host view and participant scoring.
- **Resume Anywhere**: In-progress sessions are synced, allowing users to pick up where they left off.
- **Leaderboards**: Compete globally or per-pack with real-time score tracking.
- **Premium Access**: Exclusive content gated by a sophisticated RBAC system.

### 🛡️ Security & Access Control
- **Two-Gate Security Model**:
  - **Gate 1 (Feature Access)**: Controls entry to platform modules (e.g., Host Quiz, Admin CMS).
  - **Gate 2 (Content Permissions)**: Granular permissions for specific categories or quiz packs.
- **DB-Backed Roles**: Secure role management (`user`, `premium`, `editor`, `admin`, `superadmin`) enforced at the database level via Postgres RLS.

### 🛠️ Admin CMS
- **Content Management**: Full CRUD for questions and quiz packs.
- **Bulk Operations**: High-speed Excel import for mass question ingestion.
- **Platform Analytics**: Advanced insights into pack performance, user engagement, and question difficulty.
- **User Management**: Superadmin interface for role assignment and platform oversight.

---

## 🏗️ Project Architecture

Qwizzeria is a **Turborepo monorepo** designed for scalability:

```text
apps/
  ├── quiz-app/          # Main user-facing application (Vite + React 19)
  └── admin-cms/         # Admin dashboard and content management
packages/
  ├── supabase-client/   # Shared SDK wrapper and DB migrations
  └── shared-types/      # Centralized TypeScript definitions
```

### Tech Stack
- **Frontend**: React 19, Vite, Vanilla CSS (Design-driven).
- **Backend**: Supabase (Auth, Postgres, Real-time).
- **Orchestration**: Turborepo, npm workspaces.
- **Testing**: Vitest for core logic verification.

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
# Copy .env.example to .env.local in apps/quiz-app and apps/admin-cms
```

### Commands
- `npm run dev`: Start all development servers.
- `npm run build`: Build all applications for production.
- `npm run lint`: Run linting across the monorepo.
- `npm run test`: Execute the test suite.

---

## 📖 Documentation

For more detailed information, please refer to the following guides:

- [**Architecture Guide**](docs/architecture.md) — Deep dive into the monorepo and security model.
- [**Database & Security**](docs/database.md) — Schema documentation and RLS policies.
- [**Development Workflow**](docs/development.md) — Guidelines for contributing and building new features.
- [**RBAC Reference**](RBAC-Reference.md) — The original design document for the security model.

---

## 🎨 Design Principles
Qwizzeria follows a **vibrant, dark-mode-first** aesthetic:
- **Typography**: Inter (Modern, highly readable).
- **Grid System**: Responsive "Topic Grid" cards using Flat CSS Grid.
- **Design System**: Atomic CSS variables for consistent spacing, colors, and shadows.

---

© 2026 Qwizzeria Team. Built with ❤️ and high-performance React.

What business decisions are hardest today because of data gaps?
Where does your data governance or KPI framework break down today?
What does success look like for this role in the first 6 months?
What blocks your analysts the most today — data quality, speed, or stakeholder alignment?

This role sits exactly where I deliver the most value: business strategy, analytics, and leadership. I bring structure to data and clarity to decision-making.

I’ve led governance initiatives where the main goal was making data trustworthy at scale — defining ownership, documentation, and standards so reporting wasn’t constantly questioned

At Pictet, I helped move data from being ‘project by project’ to a structured governance model leadership could trust. That changed how executives used reporting for risk and compliance decisions.

I brought structure to how data moved across platforms and vendors so leadership could trust event reporting, not firefight data issues during competitions.