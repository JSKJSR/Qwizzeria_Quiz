# Development Workflow

This guide covers the standards and processes for contributing to the Qwizzeria WebApp.

---

## 🛠️ Local Setup

### Environment Variables
`apps/quiz-app` requires a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Stripe (Production — Vercel Environment Variables)
The following are set in the Vercel dashboard (never committed to the repo):

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLAYER_PRICE_ID=price_...
STRIPE_HOST_PRICE_ID=price_...
STRIPE_PASS_PRICE_ID=price_...
SUPABASE_SERVICE_ROLE_KEY=...
```

For local Stripe testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:5173/api/stripe/webhook
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
2. **Theming**: The app defaults to high-contrast Dark Mode (OLED black). The Host Dashboard features a toggleable Light Mode implemented via CSS variable overrides (`.host-light-theme` class).
3. **Animations**: Use subtle transitions (0.15s - 0.3s) for hover states and UI reveals (e.g. scoreboard drawer).

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

### Current Coverage (96 tests, 10 files)
- `mediaDetector.test.js` — Media URL detection (7 tests)
- `tournamentBracket.test.js` — Bracket generation, seeding, advancement (36 tests)
- `hostSessionPersistence.test.js` — localStorage save/load/clear (12 tests)
- `AuthContext.test.js` — Auth provider initialization (1 test)
- `supabaseClient.test.js` — Supabase client configuration (2 tests)
- `buzzerTimestamp.test.js` — Sub-millisecond buzzer resolution (13 tests)
- `aiGenerate.test.js` — AI Quiz generation and parsing (12 tests)
- `packManagement.test.js` — Admin pack CRUD (6 tests)
- `questionValidation.test.js` — Question schema checks (5 tests)
- `authHelpers.test.js` — Role and permission checks (2 tests)

### Coverage Goals
- Core state machines (`useReducer`).
- RBAC helper functions.
- Supabase utility wrappers.

---

## 🤖 AI-Driven Development Workflow

The project utilizes an AI-first development approach. Follow this workflow when using AI agents or contributors:

### 1. Planning & Context
- Provide the AI with the updated `CLAUDE.md` and the four documentation pillars in `docs/`.
- Ensure the AI understands the **Two-Gate Security Model** and **State Machine** architecture.

### 2. Implementation Standards
- **Vanilla CSS**: Avoid utility frameworks unless requested. Use design tokens.
- **Component Focused**: Keep components reusable and state-blind where possible.
- **Error Handling**: Every feature must include loading/error states with retry capability.

### 3. Pre-Completion Checklist (MANDATORY)
Before finalizing any feature or bugfix, the following must be verified:
- **Security**: Scan for hardcoded secrets, API keys, or passwords. Check for SQL/Shell injection.
- **Quality**: Run the full test suite (`npm run test`). Ensure no linting errors (`npm run lint`).
- **Performance**: Verify that new components don't cause unnecessary re-renders in the Topic Grid.
- **Documentation**: Update [Product Manual](./product-manual.md) and [Architecture Guide](./architecture.md) for any new features.

---

## 🚀 Deployment

### Database Migrations
Migrations are stored in `packages/supabase-client/migrations`.
**Note**: Migrations must be run manually via the Supabase SQL Editor in order:
1. `001_initial_schema.sql` through `020_buzzer_rooms.sql`

### CI/CD
The project includes a GitHub Actions pipeline (`.github/workflows/ci.yml`) that runs on every push/PR to `main`:
1. `npm ci` — Install dependencies
2. `npm run lint` — Lint all packages
3. `npm run build` — Build all packages
4. `npm run test` — Run test suite (96 tests)

Production deployment is configured for **Vercel** via `vercel.json` (output: `apps/quiz-app/dist`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel dashboard.

---

© 2026 Qwizzeria DevOps Team.
