# Doubles Quiz: Participant History & Admin Management

## Context

Doubles sessions are stored in `quiz_sessions` with `metadata.format = 'doubles'`, but the History page can't distinguish them from regular pack sessions. There's also no admin view for reviewing/grading Doubles responses across users. This plan adds both capabilities.

## Key Findings

- Doubles creates **2 session rows** per quiz (Part 1 + Part 2), each with metadata: `{ format: 'doubles', part: 1|2, player_name, responses: {qId: text}, timer_started_at, timer_duration_seconds }`
- Score = answered count (not correctness) — responses are free-text, intended for manual review
- Doubles does **NOT** create `question_attempts` rows — all data is in metadata JSONB
- History type detection uses `is_free_quiz` + `metadata.is_host_quiz` — no `doubles` case exists
- No admin page exists for viewing individual quiz sessions of any type

---

## Part 1: Participant Doubles History

### 1A. Update `fetchUserHistory()` type filters
**File:** `packages/supabase-client/src/users.js`
- Add `doubles` type filter: `.eq('is_free_quiz', false).eq('metadata->>format', 'doubles')`
- Update `pack` filter to **exclude** doubles: add `.neq('metadata->>format', 'doubles')`

### 1B. Add "Doubles" filter option to History page
**File:** `apps/quiz-app/src/pages/History.jsx`
- Add `<option value="doubles">Doubles</option>` to the type filter dropdown

### 1C. Add DOUBLES badge + part number to History rows
**File:** `apps/quiz-app/src/pages/History.jsx`
- Detect: `const isDoubles = session.metadata?.format === 'doubles'`
- Render badge: `DOUBLES P1` / `DOUBLES P2` (similar to existing HOST badge)
- Show `metadata.player_name` as subtitle

### 1D. Render doubles-specific expanded detail
**File:** `apps/quiz-app/src/pages/History.jsx`
- Skip `fetchSessionDetail()` for doubles sessions (no question_attempts exist)
- Add a `DoublesHistoryDetail` branch in the expanded section

### 1E. Create DoublesHistoryDetail component
**New file:** `apps/quiz-app/src/components/DoublesHistoryDetail.jsx`
- On mount, fetch questions via `fetchQuestionsByIds(Object.keys(responses))`
- Render table: #, Question, Category, Correct Answer, Your Response
- Show player name, part number, timer duration as header info

### 1F. Create shared `fetchQuestionsByIds()` utility
**File:** `packages/supabase-client/src/questions.js`
- Query `questions_master` with `.in('id', ids)` for `id, question_text, answer_text, category`
- Re-export from barrel `packages/supabase-client/src/index.js`

### 1G. CSS for doubles badge
**File:** `apps/quiz-app/src/styles/History.css`
- `.history__type-badge--doubles` — blue color scheme to distinguish from HOST (purple)

---

## Part 2: Admin Doubles Management

### 2A. Create `fetchDoublesSessionsAdmin()`
**File:** `packages/supabase-client/src/users.js`
- Fetch all doubles sessions with joins: `quiz_packs(title)`, `user_profiles(display_name)`
- Filters: userId, packId, status, dateFrom, dateTo
- Pagination (20/page), ordered by `started_at DESC`

### 2B. Create `gradeDoublesResponse()`
**File:** `packages/supabase-client/src/questions.js`
- Read session metadata, update `metadata.grades[questionId] = true/false`
- Single-field update on `quiz_sessions` row
- Also add `gradeAllDoublesResponses(sessionId, grades)` for bulk grading

### 2C. RLS policy for admin session reads
**New file:** `packages/supabase-client/migrations/026_admin_read_sessions.sql`
- Add `CREATE POLICY "admin_read_all_sessions" ON quiz_sessions FOR SELECT USING (is_admin())`
- Also add UPDATE policy for grading: `CREATE POLICY "admin_update_sessions" ON quiz_sessions FOR UPDATE USING (is_admin())`
- Check if these already exist first — skip if admin bypass is already in place

### 2D. Create admin DoublesSessions page
**New file:** `apps/quiz-app/src/pages/admin/DoublesSessions.jsx`
- Follow UserList pattern (orchestrator with inline sub-components or decomposed)
- **Filters bar:** User search (debounced text), Pack dropdown, Status, Date range
- **Table:** User, Pack, Part, Player Name, Answered, Status, Date, Actions (Grade)
- **Pagination:** 20/page

### 2E. Create DoublesGradeModal component
**New file:** `apps/quiz-app/src/components/admin/doubles/DoublesGradeModal.jsx`
- Fetch questions via `fetchQuestionsByIds`
- Table: Question Text, Category, Correct Answer, Player Response, Grade toggle (✓/✗)
- Summary: X/Y graded, Z correct
- Calls `gradeDoublesResponse` per toggle or `gradeAllDoublesResponses` for bulk

### 2F. Add route + sidebar nav
**File:** `apps/quiz-app/src/components/App.jsx`
- Add `<Route path="doubles" element={<DoublesSessions />} />` under admin routes
**File:** `apps/quiz-app/src/layouts/AdminLayout.jsx`
- Add "Doubles Sessions" NavLink (admin+ only), after "Quiz Packs"

### 2G. CSS
**New file:** `apps/quiz-app/src/styles/DoublesSessions.css`
- Follow existing admin page patterns (table, filters, modal)

---

## Implementation Order

1. `fetchQuestionsByIds()` — shared dependency (questions.js + barrel export)
2. `fetchUserHistory()` updates — add doubles filter, exclude from pack
3. History.jsx — badge, filter, expanded detail branch
4. `DoublesHistoryDetail` component + CSS
5. RLS migration (if needed)
6. `fetchDoublesSessionsAdmin()` + `gradeDoublesResponse()`
7. Admin DoublesSessions page + DoublesGradeModal
8. Route + sidebar nav updates

## Files Modified (Existing)
- `packages/supabase-client/src/questions.js` — add `fetchQuestionsByIds`, `gradeDoublesResponse`
- `packages/supabase-client/src/users.js` — update `fetchUserHistory`, add `fetchDoublesSessionsAdmin`
- `packages/supabase-client/src/index.js` — re-export new functions
- `apps/quiz-app/src/pages/History.jsx` — doubles filter, badge, expanded detail
- `apps/quiz-app/src/components/App.jsx` — admin doubles route
- `apps/quiz-app/src/layouts/AdminLayout.jsx` — sidebar nav item
- `apps/quiz-app/src/styles/History.css` — doubles badge style

## Files Created (New)
- `apps/quiz-app/src/components/DoublesHistoryDetail.jsx`
- `apps/quiz-app/src/pages/admin/DoublesSessions.jsx`
- `apps/quiz-app/src/components/admin/doubles/DoublesGradeModal.jsx`
- `apps/quiz-app/src/styles/DoublesSessions.css`
- `packages/supabase-client/migrations/026_admin_read_sessions.sql` (if needed)

## Verification
- `npm run build` — no build errors
- `npm run lint` — no lint issues
- `cd apps/quiz-app && npx vitest run` — all tests pass
- Manual: play a doubles quiz → check History page shows DOUBLES badge + P1/P2
- Manual: filter History by "Doubles" → only doubles sessions shown
- Manual: expand doubles session → see responses table (not question_attempts)
- Manual: admin `/admin/doubles` → see all doubles sessions across users
- Manual: click Grade → modal shows responses with grading toggles
