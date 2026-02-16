# Qwizzeria WebApp - Development Guidelines

## Pre-Completion Checklist

Before completing any task, run these checks:

- Scan for hardcoded secrets, API keys, passwords
- Check for SQL injection, shell injection, path traversal
- Verify all user inputs are validated
- Run the test suite
- Check for type errors

## Project Context

- This project is being built incrementally — each phase builds on the previous
- Do not break previously built core logic unless absolutely required
- Turborepo monorepo with npm workspaces
- `apps/quiz-app` — Main Vite + React 19 quiz app with React Router
- `apps/admin-cms` — Admin CMS (Phase 3, placeholder)
- `packages/shared-types` — Shared type definitions
- `packages/supabase-client` — Supabase SDK wrapper (Phase 1)
- Dev server auto-opens browser (`server.open: true` in vite.config.js)
- Quiz app uses React Router: `/` (landing), `/host` (setup), `/host/play` (game), `/host/results` (results)
- Quiz state managed via useReducer + Context (QuizContext)
- Session persistence debounced at 300ms
- Tests: `cd apps/quiz-app && npx vitest run`
