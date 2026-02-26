# Development Workflow

This guide covers the standards and processes for contributing to the Qwizzeria WebApp.

---

## 🛠️ Local Setup

### Environment Variables
Both `apps/quiz-app` and `apps/admin-cms` require a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally
Use the root scripts to manage the monorepo:

```bash
# Start all apps in dev mode
npm run dev

# Build all apps
npm run build

# Lint the entire codebase
npm run lint
```

---

## 🎨 Styling & Design System

Qwizzeria uses **Vanilla CSS** with a design-token-driven approach. 

### Key Design Tokens (global.css)
- **Colors**:
  - `--bg-primary`: #000000 (OLED Black)
  - `--accent-primary`: #be1332 (Vibrant Red)
  - `--text-secondary`: #b0a0a5 (Muted Rose)
- **Typography**: `Inter`, `Segoe UI`, sans-serif.
- **Grids**: Responsive card grids using `repeat(auto-fill, minmax(220px, 1fr))`.

### Guidelines
1. **No Ad-hoc Utilities**: Use variables from `global.css`.
2. **Dark Mode First**: Ensure contrast is high; use OLED black for backgrounds.
3. **Animations**: Use subtle transitions (0.15s - 0.3s) for hover states.

---

## 🧪 Testing

### Running Tests
We use **Vitest** for unit and integration testing.

```bash
# Run all tests from the root
npm run test

# Run tests for a specific app
cd apps/quiz-app && npx vitest run
```

### Current Coverage (53 tests, 5 files)
- `mediaDetector.test.js` — Media URL detection (7 tests)
- `tournamentBracket.test.js` — Bracket generation, seeding, advancement (36 tests)
- `hostSessionPersistence.test.js` — localStorage save/load/clear (7 tests)
- `AuthContext.test.js` — Auth provider initialization (1 test)
- `supabaseClient.test.js` — Supabase client configuration (2 tests)

### Coverage Goals
- Core state machines (`useReducer`).
- RBAC helper functions.
- Supabase utility wrappers.

---

## 🚀 Deployment

### Database Migrations
Migrations are stored in `packages/supabase-client/migrations`. 
**Note**: Migrations must be run manually via the Supabase SQL Editor in order:
1. `001_initial_schema.sql` through `015_showcase_packs_policy.sql`

### CI/CD
The project includes a GitHub Actions pipeline (`.github/workflows/ci.yml`) that runs on every push/PR to `main`:
1. `npm ci` — Install dependencies
2. `npm run lint` — Lint all packages
3. `npm run build` — Build all packages
4. `npm run test` — Run test suite (53 tests)

Production deployment is configured for **Vercel** via `vercel.json` (output: `apps/quiz-app/dist`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel dashboard.

---

© 2026 Qwizzeria DevOps Team.
