# Full Codebase Improvement Audit

## 1. 🔴 Critical: Massive Gaps in Test Coverage
While Vitest reports high coverage percentages, it is only measuring the 16 files explicitly included in `.test.js` files. The reality is that out of ~21,000 lines of `js/jsx` code, only ~540 statements are verified by unit tests. 

* **Untested Core Logic:** `gamification.js` has 8 pure functions for calculating XP, streaks, and levels. These are trivial to test but currently have 0 unit tests.
* **Untested Core UI:** None of the major user flows (`FreeQuiz.jsx`, `DashboardHome.jsx`, `History.jsx`, `Profile.jsx`) have DOM or interaction tests via React Testing Library. 
* **Recommendation:** Create a `gamification.test.js` suite immediately (pure functions). For UI, introduce basic render & smoke tests for the main routes.

## 2. 🟡 Medium: Component Bloat & "God Files"
Several components have grown into "God Components" that handle layout, business logic, data fetching, and state management all in one file.

* `AdminOpsManual.jsx`: **832 lines** (Updated content, still monolithic)
* `HostQuiz.jsx`: **621 lines** (Logic extracted, UI decomposition complete)
* `GuideVisuals.jsx`: **574 lines**
* `TournamentMatchPage.jsx`: **516 lines**
* `Profile.jsx`: **491 lines**

* **Outcome:** `HostQuiz.jsx` now uses `hostQuizReducer.js` and lifecycle hooks. `UserList.jsx` has been split into `UserKpis`, `UserTable`, and `UserFilters`.

## 3. 🟡 Medium: Inline Styling (CSS Debt)
A sweep of the codebase reveals **over 146 instances** of hardcoded inline styling (`style={{ ... }}`). For example, heavy usage in `TournamentMatchPage.jsx`, `ResumePlay.jsx`, and `BulkImport.jsx`.
* **The Problem:** Inline styles bypass your global CSS token system, break Responsive Design paradigms, and make dark/light mode maintenance a nightmare.
* **Recommendation:** Sweep `TournamentMatchPage`, `ResumePlay`, and `BulkImport` and move hardcoded styles (like `style={{ color: '#e85c1a' }}`) to CSS definitions utilizing the existing `var(--accent-primary)`.

## 4. 🔵 Low/Medium: Missing React Error Boundaries
If a database sync fails in the middle of a `FreeQuiz` answer mapping, or an unexpected `null` value propagates down the `HostQuiz` component tree, the entire React app crashes (White Screen of Death).
* **Recommendation:** Implement a top-level `<ErrorBoundary>` component in `main.jsx` and individual Error Boundaries around major route views (like `<HostQuiz>`). Fallbacks should show a styled "Snap, something went wrong" UI with a "Return to Dashboard" button.

## 5. 🔵 Low: UX / Gamification Gaps outside FreeQuiz
Although gamification (XP, badges, streaks) is fully functional inside `FreeQuiz.jsx` and syncs down to the Database correctly, the rest of the application is blind to it.
* **Outcome:** Gamification (XP, levels, badges) is now surfaced on the User Dashboard and Profile pages.
