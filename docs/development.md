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

### Coverage Goals
- Core state machines (`useReducer`).
- RBAC helper functions.
- Supabase utility wrappers.

---

## 🚀 Deployment

### Database Migrations
Migrations are stored in `packages/supabase-client/migrations`. 
**Note**: At this time, migrations must be run manually via the Supabase SQL Editor in the following order:
1. `001_initial_schema.sql`
2. `002_...`
...
6. `006_rbac.sql`

### CI/CD
The project is optimized for deployment on platforms like Vercel or Netlify via the Turborepo build pipeline.

---

© 2026 Qwizzeria DevOps Team.
