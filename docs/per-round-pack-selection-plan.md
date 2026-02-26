# Per-Match Pack Selection for Tournaments — Implementation Plan

## Overview

Currently, tournaments use a **single quiz pack** selected at the start. All questions are loaded, shuffled into one `question_pool`, and every match draws from that shared pool. This feature adds **per-match pack selection** — hosts pick a different pack before each match starts (e.g., Match 1 uses Epstein, Match 2 uses Raj Kapoor, Final uses a Mixed pack).

The design is fully backward-compatible with existing single-pack tournaments and respects all existing RLS policies.

---

## Architecture Decisions

### Per-Match Granularity
The host selects a pack **before each match**. This gives maximum flexibility — within the same round, Match 1 can quiz on Epstein while Match 2 quizzes on Raj Kapoor. Each match has its own pack and its own question pool.

### Lazy Selection
Pack selection happens **just before each match starts**, not upfront during setup. This lets the host decide dynamically based on who's playing and what topics haven't been covered yet.

### Storage: Existing `host_tournament_matches` Table
Rather than creating a new table, we add `pack_id` and `question_pool` columns directly to the existing `host_tournament_matches` table. Each match already has its own row — adding pack info there is the natural fit. This avoids extra joins and keeps the Realtime subscription path simple.

### DB as Source of Truth
Match-pack assignments are stored in `host_tournament_matches`. Client state is rebuilt from DB on page load, consistent with the existing tournament pattern.

---

## Phase 1: Database Schema + Data Layer

**Goal:** Add per-match pack storage to the existing matches table and update CRUD operations. No UI changes.

**Prerequisite:** None (standalone)

### 1A. New Migration: `016_match_pack_selection.sql`

**New file:** `packages/supabase-client/migrations/016_match_pack_selection.sql`

```sql
-- Add per-match pack selection columns to existing matches table
ALTER TABLE host_tournament_matches
  ADD COLUMN IF NOT EXISTS pack_id UUID REFERENCES quiz_packs(id),
  ADD COLUMN IF NOT EXISTS match_question_pool UUID[] DEFAULT '{}';

-- Make tournament-level pack_id nullable (per-match tournaments won't have one)
ALTER TABLE host_tournaments
  ALTER COLUMN pack_id DROP NOT NULL;

-- Add a flag to the bracket JSONB to indicate per-match mode
-- (No schema change needed — this lives in the bracket JSONB field)
```

**RLS note:** No new RLS policies needed. The `host_tournament_matches` table already has RLS based on parent tournament ownership. The new columns inherit those policies automatically. `quiz_packs` RLS already allows all active packs to be read by everyone.

### 1B. Update `packages/supabase-client/src/tournaments.js`

**Add 1 new function:**

```javascript
// Set the pack for a specific match (before it starts)
setMatchPack({ matchId, packId, questionPool })
  → update host_tournament_matches SET pack_id, match_question_pool
    WHERE id = matchId
  → returns updated row
```

**Modify existing functions:**

| Function | Change |
|----------|--------|
| `createTournament()` | Accept optional `perMatchPacks: true` flag; when set, insert with `pack_id: null`, `question_pool: []` |
| `fetchTournament()` | Match rows already fetched — no change needed (new columns come for free in `select('*')`) |
| `advanceMatchWinner()` | Accept optional `isPerMatch` flag; when true, skip updating `host_tournaments.question_pool` (each match manages its own pool) |

### 1C. Update `apps/quiz-app/src/utils/tournamentBracket.js`

**Modify `generateBracket(teamNames, questionsPerMatch, allQuestions = null)`:**
- Make `allQuestions` parameter optional (default `null`)
- When `null`: return bracket with `questionPool: []` and `perMatchPacks: true`
- When provided: existing behavior unchanged (shuffled pool, no `perMatchPacks` flag)

No changes to `allocateMatchQuestions()` — callers pass the match-specific pool.

### Backward Compatibility Matrix

| Aspect | Legacy (single pack) | New (per-match) |
|--------|---------------------|-----------------|
| `host_tournaments.pack_id` | Pack UUID | `NULL` |
| `host_tournaments.question_pool` | Populated array | `[]` (empty) |
| `host_tournament_matches.pack_id` | `NULL` (unused) | Pack UUID per match |
| `host_tournament_matches.match_question_pool` | `[]` (unused) | Shuffled IDs per match |
| `bracket.perMatchPacks` | `false` / absent | `true` |

### Verification (Phase 1)
- Verify migration runs cleanly in Supabase SQL Editor
- Verify `setMatchPack()` updates match rows correctly
- Existing `fetchTournament()` returns new columns in match rows
- `generateBracket(names, qpm, null)` returns `perMatchPacks: true` with empty pool
- Existing tournament creation with `pack_id` still works

---

## Phase 2: UI — Setup Toggle + Match Pack Selection

**Goal:** Add the "different pack per match" toggle and the match pack selection phase to the HostQuiz state machine.

**Prerequisite:** Phase 1 (DB schema + data layer)

### 2A. Setup Toggle

**Modify:** `apps/quiz-app/src/components/host/HostParticipantSetup.jsx`

- Add checkbox visible only when `isTournament` is true: **"Different pack per match"**
- New state: `const [perMatchPacks, setPerMatchPacks] = useState(false)`
- Pass to `onStart()`: `onStart(trimmedNames, 'tournament', questionsPerMatch, perMatchPacks)`

### 2B. HostQuiz Reducer — New State, Phase, and Action

**Modify:** `apps/quiz-app/src/components/host/HostQuiz.jsx`

**New state fields in `initialState`:**
```javascript
matchPacks: {},          // { [matchKey]: { packId, packTitle, topics, questionPool } }
                         // matchKey format: "r{roundIndex}-m{matchIndex}"
pendingMatch: null,      // { roundIndex, matchIndex } — which match needs a pack
```

**New action:** `SELECT_MATCH_PACK`

**Modify `START_TOURNAMENT` reducer case:**
- Accept `perMatchPacks` from action payload
- When `perMatchPacks` is true: call `generateBracket(participants, questionsPerMatch, null)` (no questions)
- Bracket created with empty pool + `perMatchPacks: true`
- Phase transitions to `bracket` as before

**Modify `SELECT_MATCH` reducer case:**
```
Before allocating questions, check:
  tournament.perMatchPacks && !state.matchPacks[matchKey]

If no pack for this match yet:
  → return { phase: 'matchPackSelect', pendingMatch: { roundIndex, matchIndex } }

If pack already set (e.g., resuming a match):
  → allocate from matchPacks[matchKey].questionPool
  → rest of SELECT_MATCH logic unchanged
```

**New `SELECT_MATCH_PACK` reducer case:**
1. Receive `{ roundIndex, matchIndex, pack, questions }`
2. Build `matchKey = "r${roundIndex}-m${matchIndex}"`
3. `buildTopics(questions)` → topics
4. Shuffle question pool: `questions.map(q => q.id).sort(() => Math.random() - 0.5)`
5. Store in `matchPacks[matchKey]`: `{ packId, packTitle, topics, questionPool }`
6. Allocate `questionsPerMatch` from the pool
7. Build match topics, participants, mark match in_progress
8. Transition to `matchGrid`

**Modify `END_MATCH`:** When `perMatchPacks`, use `matchPacks[matchKey].questionPool` for pool updates.

### 2C. Render the `matchPackSelect` Phase

In HostQuiz render, add:

```jsx
if (phase === 'matchPackSelect') {
  const { roundIndex, matchIndex } = state.pendingMatch;
  const roundName = getRoundName(tournament.rounds.length, roundIndex);
  const match = tournament.rounds[roundIndex][matchIndex];
  const team1 = tournament.teams[match.team1Index].name;
  const team2 = tournament.teams[match.team2Index].name;

  return (
    <div className="host-quiz host-quiz--fullscreen">
      <div className="match-pack-select__header">
        <h2>Select Pack for Match</h2>
        <p className="match-pack-select__matchup">
          {team1} vs {team2} — {roundName}
        </p>
      </div>
      <HostPackSelect onSelectPack={(pack, questions) => {
        dispatch({
          type: ACTIONS.SELECT_MATCH_PACK,
          roundIndex, matchIndex, pack, questions,
        });
      }} />
    </div>
  );
}
```

**Reuses `HostPackSelect` as-is** — no modifications needed.

### 2D. DB Persistence for Match Packs

Add `useEffect` in HostQuiz to persist match pack assignments:

```javascript
useEffect(() => {
  if (!state.tournamentId || !state.tournament?.perMatchPacks) return;
  for (const [matchKey, mp] of Object.entries(state.matchPacks)) {
    if (mp._persisted) continue;
    // Parse matchKey "r0-m1" → roundIndex=0, matchIndex=1
    const [ri, mi] = matchKey.replace('r','').split('-m').map(Number);
    const matchId = `${state.tournamentId}-m-${ri}-${mi}`;
    setMatchPack({
      matchId,
      packId: mp.packId,
      questionPool: mp.questionPool,
    }).catch(console.warn);
  }
}, [state.tournamentId, state.matchPacks]);
```

### 2E. TournamentMatchPage.jsx — Per-Match Question Loading

**Modify:** `apps/quiz-app/src/pages/TournamentMatchPage.jsx`

In `init()`, after fetching tournament and match row:

```
1. Check matchRow.pack_id (new column):
   - If set → fetchPackPlayQuestions(matchRow.pack_id)
              use matchRow.match_question_pool
   - Else if tournament.pack_id → legacy single-pack path (existing code)
   - Else → show error: "No pack has been selected for this match yet"
```

No extra fetch calls needed — the match row already includes the new columns.

### Verification (Phase 2)
- Create tournament with "Different pack per match" ON → bracket appears
- Click match → pack selection UI shows team names and round → select Epstein pack → match starts
- Complete match → click different match in SAME round → pack selection appears again (per-match, not per-round)
- Select Raj Kapoor pack → different questions appear
- Open match in new tab → correct pack's questions load
- Create tournament WITHOUT toggle → single-pack flow identical to before

---

## Phase 3: Visual Polish + Bracket Display

**Goal:** Show per-match pack info on the bracket and match pages. Handle edge cases.

**Prerequisite:** Phase 2 (functional per-match selection)

### 3A. Match Pack Labels on Bracket

**Modify:** `apps/quiz-app/src/components/host/TournamentBracket.jsx`

- Accept new optional prop: `matchPacks` — map of `{ [matchKey]: { packTitle } }`
- On each match card, show a small pack label:
  - If assigned: pack title (truncated, small text below scores)
  - If per-match mode + unassigned + match is playable: "Select pack to play"
  - If single-pack mode or bye/pending: nothing
  - ensure that brackets are big enough to show all match details and label


### 3B. Bracket Page Integration

**Modify:** `apps/quiz-app/src/pages/TournamentBracketPage.jsx`

In `loadTournament()`, build `matchPacksMap` from match rows:

```javascript
const matchPacksMap = {};
for (const m of matches) {
  if (m.pack_id) {
    const key = `r${m.round_index}-m${m.match_index}`;
    // pack title can be fetched via a join or a separate lookup
    matchPacksMap[key] = { packId: m.pack_id, packTitle: m.pack_title };
  }
}
```

Note: To get pack titles without extra queries, modify `fetchTournament()` match query to join pack metadata:
```javascript
.select('*, quiz_packs(id, title)')  // instead of select('*')
```

Pass `matchPacks={matchPacksMap}` to `<TournamentBracket>`.

### 3C. Match Page Pack Info

**Modify:** `apps/quiz-app/src/pages/TournamentMatchPage.jsx`

Show the pack name in the match header/scoreboard:
```
"Semi-final — Match 1 — Epstein Pack"
```

### 3D. CSS

**New file:** `apps/quiz-app/src/styles/MatchPackSelect.css`

Minimal styles: 
- `.match-pack-select__header` — centered header with match context
- `.match-pack-select__matchup` — team names + round name subtitle
- `.tournament-bracket__match-pack` — small label on bracket match cards

### 3E. Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Pool exhaustion within match | Reshuffle from the same match's pack questions (existing refill logic, scoped to match pool) |
| Same pack selected for multiple matches | Each match gets its own independent shuffled pool from that pack — no shared state |
| Bye matches | No pack selection needed — auto-advanced, status remains `bye` |
| Match opened in new tab, no pack yet | Error: "No pack has been selected for this match yet" |
| Session persistence | DB is source of truth; match rows store `pack_id` + `match_question_pool`; client state rebuilt on load |
| Premium pack gating | `HostPackSelect` uses `browseHostPacks({ userRole })` — premium filtering unchanged |
| Realtime bracket sync | Match rows with pack_id update via existing Realtime — bracket page sees updated match data |
| Stale match resume | Recovery works — `pack_id` and `match_question_pool` are on the match row, available on reload |
| Host replays same matchup | If match is reset, `pack_id` can be re-selected (new pack or same pack) |

### Verification (Phase 3)
- Bracket shows pack name on completed/in-progress match cards
- Playable matches show "Select pack to play" hint
- Single-pack tournaments show no per-match pack labels
- Match page header shows pack name
- Run full test suite: `cd apps/quiz-app && npx vitest run`

---

## Files Summary

| File | Phase | Action |
|------|-------|--------|
| `packages/supabase-client/migrations/016_match_pack_selection.sql` | 1 | **New** |
| `packages/supabase-client/src/tournaments.js` | 1, 3 | Modify |
| `apps/quiz-app/src/utils/tournamentBracket.js` | 1 | Modify |
| `apps/quiz-app/src/components/host/HostParticipantSetup.jsx` | 2 | Modify |
| `apps/quiz-app/src/components/host/HostQuiz.jsx` | 2 | Modify |
| `apps/quiz-app/src/pages/TournamentMatchPage.jsx` | 2, 3 | Modify |
| `apps/quiz-app/src/components/host/TournamentBracket.jsx` | 3 | Modify |
| `apps/quiz-app/src/pages/TournamentBracketPage.jsx` | 3 | Modify |
| `apps/quiz-app/src/styles/MatchPackSelect.css` | 3 | **New** |

## Key Reused Components (No Changes Needed)

- `HostPackSelect.jsx` — Reused as-is for match pack selection (no modifications)
- `browseHostPacks()` in `packs.js` — Existing pack fetching with role-based filtering
- `fetchPackPlayQuestions()` in `packs.js` — Existing question loading per pack
- `buildTopics()` / `buildMatchTopics()` in `HostQuiz.jsx` — Existing topic building
- `allocateMatchQuestions()` in `tournamentBracket.js` — Existing pool allocation
- Realtime subscription in `realtime.js` — Works unchanged (match row updates carry pack info)

## Example Flow: Epstein vs Raj Kapoor Scenario

**8-team tournament, Quarter-finals (Round 1):**

| Match | Teams | Host Selects Pack | Questions From |
|-------|-------|-------------------|----------------|
| QF Match 1 | Team A vs Team B | Epstein | Epstein pack pool |
| QF Match 2 | Team C vs Team D | Raj Kapoor | Raj Kapoor pack pool |
| QF Match 3 | Team E vs Team F | Epstein | Epstein pack pool (independent shuffle) |
| QF Match 4 | Team G vs Team H | World Cup | World Cup pack pool |

**Semi-finals (Round 2):**

| Match | Teams | Host Selects Pack | Questions From |
|-------|-------|-------------------|----------------|
| SF Match 1 | Winner QF1 vs Winner QF2 | Science | Science pack pool |
| SF Match 2 | Winner QF3 vs Winner QF4 | Music | Music pack pool |

**Final:**

| Match | Teams | Host Selects Pack | Questions From |
|-------|-------|-------------------|----------------|
| Final | Winner SF1 vs Winner SF2 | Mixed Trivia | Mixed Trivia pack pool |

Each match is completely independent — the host picks any available pack right before the match begins.

