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
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
SUPABASE_SERVICE_ROLE_KEY=...
```

For local Stripe testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:5173/api/stripe/webhook
```

### Running Locally
Use the root scripts to manage the monorepo:

```bash
# Start dev server
npm run dev

# Build for production
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

---

## 🧪 Testing

### Running Tests
We use **Vitest** for unit and integration testing.

```bash
# Run all tests
npm run test

# Run tests for a specific app
cd apps/quiz-app && npx vitest run
```

### Current Status (71 tests passed)
The codebase maintains robust coverage:
- `tournamentBracket.test.js` (36 tests)
- `buzzerTimestamp.test.js` (13 tests)
- `hostSessionPersistence.test.js` (12 tests)
- `mediaDetector.test.js` (7 tests)
- `supabaseClient.test.js` (2 tests)
- `AuthContext.test.js` (1 test)

---

## 🚀 Deployment

### Database Migrations
Migrations are stored in `packages/supabase-client/migrations`. Apply them via the Supabase SQL Editor in numerical order.

### CI/CD
The project includes a GitHub Actions pipeline (`.github/workflows/ci.yml`) that runs on every push to `main`:
1. `npm ci` — Install dependencies.
2. `npm run lint` — Verify code style.
3. `npm run build` — Validate build process.
4. `npm run test` — Ensure logic integrity (71 tests).

---

© 2026 Qwizzeria DevOps Team.
