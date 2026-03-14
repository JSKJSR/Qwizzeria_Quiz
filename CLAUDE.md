# Qwizzeria WebApp - Development Guidelines

## Project Structure

Turborepo monorepo with npm workspaces:

```
apps/
  quiz-app/          — Main Vite + React 19 application (Player App + Admin CMS + Host Mode)
packages/
  shared-types/      — Shared type definitions (In Progress)
  supabase-client/   — Supabase SDK wrapper (auth, questions, packs, users, leaderboard, subscriptions)
    migrations/      — SQL migrations
```

## Quiz App Routes (apps/quiz-app)

Authenticated routes use `ProtectedRoute` + `DashboardLayout` (sidebar). Unauthenticated users see the Landing page.

| Route                      | Page/Component      | Description                            |
|----------------------------|---------------------|----------------------------------------|
| `/`                        | AuthRedirect        | Landing or redirect to /dashboard      |
| `/play/free`               | FreeQuizPage        | Public quiz (no login required)        |
| `/dashboard`               | DashboardHome       | Core dashboard, trial status           |
| `/play/resume/:sessionId`  | ResumePlay          | Resume in-progress session             |
| `/packs`                   | PackBrowse          | Tier-gated quiz pack library           |
| `/packs/:id`               | PackDetail          | Pack info, leaderboard, start quiz     |
| `/packs/:id/play`          | PackPlay            | Format selection → Jeopardy/Sequential |
| `/profile`                 | Profile             | Stats, billing management              |
| `/history`                 | History             | Quiz session history                   |
| `/leaderboard`             | Leaderboard         | Global leaderboard                     |
| `/host`                    | HostQuizPage        | Host multiplayer quiz/tournament       |
| `/host/tournament/:id`     | TournamentBracket   | Bracket view for tournaments           |
| `/host/tournament/:id/match/:matchId` | TournamentMatch | Active match for tournament |
| `/guide`                   | Guide               | How to Play guide                      |
| `/buzz/:roomCode`          | BuzzerPage          | Participant buzzer page                |
| `/pricing`                 | PricingPage         | Subscription tier selection            |

## Admin CMS Routes (integrated in quiz-app)

Access restricted to `editor`, `admin`, `superadmin`.

| Route                      | Page                  | Description                     |
|----------------------------|-----------------------|---------------------------------|
| `/admin`                   | Dashboard             | Platform analytics              |
| `/admin/questions`         | QuestionList          | Question management             |
| `/admin/import`            | BulkImport            | Excel bulk import               |
| `/admin/packs`             | PackList              | Pack management                 |
| `/admin/users`             | UserList              | User roles (superadmin only)    |

## Commands

- `npm run dev` — Start dev server (Port 5173)
- `npm run build` — Build monorepo
- `npm run lint` — Lint all packages
- `npm run test` — Run all Vitest tests

## Completed Phases

- Phase 0-6: Foundation, Auth, Free Quiz, Admin CMS, Packs, Host Mode, Dashboard.
- Phase 7: RBAC (Two-Gate security model).
- Phase 8: Polish & Quality (CI/CD, 50+ tests, Accessibility).
- Phase 9: Trials & Billing (14-day trial, Stripe integration, Tier-gating).
- Phase 10: Tournament Enhancements (Per-match pack selection, realtime sync).

## Full Documentation

See the `docs/` directory for detailed pillars:
- [Product Manual](docs/product-manual.md)
- [Architecture Guide](docs/architecture.md)
- [Backend & Security](docs/backend-and-security.md)
- [Development Workflow](docs/development.md)
