# Doubles Quiz: Participant History & Admin Management

## Context

Doubles sessions are stored in `quiz_sessions` with `metadata.format = 'doubles'`, but the History page can't distinguish them from regular pack sessions. There's also no admin view for reviewing/grading Doubles responses across users. This plan adds both capabilities.

## Key Findings

- Doubles creates **2 session rows** per quiz (Part 1 + Part 2), each with metadata: `{ format: 'doubles', part: 1|2, player_name, responses: {qId: text}, timer_started_at, timer_duration_seconds }`
- Score = answered count (not correctness) — responses are free-text, intended for manual review
- Doubles does **NOT** create `question_attempts` rows — all data is in metadata JSONB
- History type detection uses `is_free_quiz` + `metadata.is_host_quiz` — no `doubles` case existed
- No admin page existed for viewing individual quiz sessions of any type

---

## Part 1: Participant Doubles History

### 1A. `fetchQuestionsByIds()` shared utility
**File:** `packages/supabase-client/src/questions.js`
- Query `questions_master` with `.in('id', ids)` for `id, question_text, answer_text, category`
- Auto-exported via barrel `packages/supabase-client/src/index.js`

### 1B. Update `fetchUserHistory()` type filters
**File:** `packages/supabase-client/src/users.js`
- Added `doubles` type filter: `.eq('is_free_quiz', false).eq('metadata->>format', 'doubles')`
- Updated `pack` filter to **exclude** doubles: added `.neq('metadata->>format', 'doubles')`

### 1C. History page updates
**File:** `apps/quiz-app/src/pages/History.jsx`
- Added `<option value="doubles">Doubles</option>` to type filter dropdown
- Detect doubles: `const isDoubles = session.metadata?.format === 'doubles'`
- Render badge: `DOUBLES P1` / `DOUBLES P2` (blue, distinct from HOST purple)
- Show `metadata.player_name` in date line
- Skip `fetchSessionDetail()` for doubles sessions (no question_attempts exist)
- Added `DoublesHistoryDetail` branch in expanded section

### 1D. DoublesHistoryDetail component
**File:** `apps/quiz-app/src/components/DoublesHistoryDetail.jsx`
- On mount, fetches questions via `fetchQuestionsByIds(Object.keys(responses))`
- Renders table: #, Question, Category, Correct Answer, Your Response
- Shows grades column if responses have been graded
- Header info: player name, part number, timer duration

### 1E. CSS for doubles badge
**File:** `apps/quiz-app/src/styles/History.css`
- `.history__type-badge--doubles` — blue color scheme (`rgba(33, 150, 243, 0.2)` / `#64b5f6`)

---

## Part 2: Admin Doubles Management

### 2A. `fetchDoublesSessionsAdmin()` + `gradeAllDoublesResponses()`
**File:** `packages/supabase-client/src/users.js`
- `fetchDoublesSessionsAdmin()`: Fetches all doubles sessions with joins (`quiz_packs(title)`, `user_profiles(display_name)`), filters (userId, packId, status, dateFrom, dateTo), pagination (20/page), ordered by `started_at DESC`
- `gradeAllDoublesResponses(sessionId, grades)`: Reads session metadata, merges grades object, writes back. Logs admin action.

### 2B. RLS migration
**File:** `packages/supabase-client/migrations/027_admin_session_access.sql`
- `admin_read_all_sessions` — SELECT policy on quiz_sessions using `is_admin()`
- `admin_update_all_sessions` — UPDATE policy on quiz_sessions using `is_admin()`
- Both use `DO $$ ... IF NOT EXISTS` guard to skip if already present

### 2C. Admin DoublesSessions page
**File:** `apps/quiz-app/src/pages/admin/DoublesSessions.jsx`
- Follows UserList pattern (orchestrator)
- **Filters bar:** Debounced text search (user/player/pack name), status dropdown
- **Table:** User, Pack, Part, Player Name, Answered, Graded, Status, Date, Actions (Grade button)
- **Pagination:** 20/page
- Reuses existing AdminCms.css classes (no separate CSS file needed)

### 2D. DoublesGradeModal component
**File:** `apps/quiz-app/src/components/admin/doubles/DoublesGradeModal.jsx`
- Fetches questions via `fetchQuestionsByIds`
- Table: #, Question Text, Correct Answer, Player Response, Grade toggle button
- Three-state grade toggle: ungraded (—) → correct (✓) → wrong (✗) → ungraded
- Summary: X/Y graded, Z correct
- Calls `gradeAllDoublesResponses` on save
- Uses existing `confirm-overlay` / `confirm-dialog` / `data-table` CSS classes

### 2E. Route + sidebar nav
**File:** `apps/quiz-app/src/components/App.jsx`
- Added `<Route path="doubles" element={<DoublesSessions />} />` under admin routes
**File:** `apps/quiz-app/src/layouts/AdminLayout.jsx`
- Added "Doubles Sessions" NavLink (admin+ only), after "Bulk Import"

---

## Implementation Order

1. `fetchQuestionsByIds()` — shared dependency (questions.js, auto-exported via barrel)
2. `fetchUserHistory()` updates — add doubles filter, exclude from pack
3. `fetchDoublesSessionsAdmin()` + `gradeAllDoublesResponses()` — admin data layer
4. History.jsx — badge, filter, expanded detail branch
5. `DoublesHistoryDetail` component
6. Doubles badge CSS
7. Admin DoublesSessions page + DoublesGradeModal
8. Route + sidebar nav updates
9. RLS migration

## Files Modified (Existing)
- `packages/supabase-client/src/questions.js` — added `fetchQuestionsByIds`
- `packages/supabase-client/src/users.js` — updated `fetchUserHistory`, added `fetchDoublesSessionsAdmin`, `gradeAllDoublesResponses`
- `apps/quiz-app/src/pages/History.jsx` — doubles filter, badge, expanded detail
- `apps/quiz-app/src/components/App.jsx` — admin doubles route + import
- `apps/quiz-app/src/layouts/AdminLayout.jsx` — sidebar nav item
- `apps/quiz-app/src/styles/History.css` — doubles badge style

## Files Created (New)
- `apps/quiz-app/src/components/DoublesHistoryDetail.jsx`
- `apps/quiz-app/src/pages/admin/DoublesSessions.jsx`
- `apps/quiz-app/src/components/admin/doubles/DoublesGradeModal.jsx`
- `packages/supabase-client/migrations/027_admin_session_access.sql`

## Verification
- `npm run build` — no build errors
- `npm run lint` — no lint issues
- `cd apps/quiz-app && npx vitest run` — all tests pass
- Manual: play a doubles quiz → check History page shows DOUBLES badge + P1/P2
- Manual: filter History by "Doubles" → only doubles sessions shown
- Manual: expand doubles session → see responses table (not question_attempts)
- Manual: admin `/admin/doubles` → see all doubles sessions across users
- Manual: click Grade → modal shows responses with grading toggles
