# Buzzer Feature — Bug Fixes

**Date:** 2026-03-11  
**Feature:** Real-time Buzzer (`/buzz/:roomCode`)  
**Affected Files:**
- `packages/supabase-client/migrations/021_buzzer_rls_fix.sql` *(new)*
- `packages/supabase-client/src/buzzer.js`
- `apps/quiz-app/src/pages/BuzzerPage.jsx`

---

## Background

After the buzzer was activated and reset by the host, some participants were
unable to buzz in on subsequent rounds. They saw the following error:

```
Room Not Found
Failed to join room: new row violates row-level security policy
(USING expression) for table "buzzer_participants"
```

A full lifecycle audit identified **6 bugs** spanning the database RLS policies,
the Supabase client library, and the React participant page.

---

## Bug 1 — Missing UPDATE RLS Policy on `buzzer_participants`

**Severity:** Critical  
**Layer:** Database  
**File:** `packages/supabase-client/migrations/020_buzzer_rooms.sql`  
**Fixed in:** `021_buzzer_rls_fix.sql`

### Root Cause

The original schema defined only `SELECT`, `INSERT`, and `DELETE` policies on
`buzzer_participants`. There was no `UPDATE` policy. Supabase's `.upsert()`
method internally executes both **INSERT** and **UPDATE** paths. On the UPDATE
path, Postgres found no matching `USING` expression and rejected the operation:

```
new row violates row-level security policy (USING expression)
for table "buzzer_participants"
```

This error only surfaced after a reset because new participants (first join)
only triggered INSERT. Returning participants triggered the UPDATE path.

### Fix

Added a missing `UPDATE` RLS policy allowing users to update their own row,
and tightened the `INSERT` policy to also validate that the room is `waiting`
or `active` (prevents joining closed rooms at the DB level):

```sql
-- New UPDATE policy
CREATE POLICY "buzzer_participants_update_own"
  ON buzzer_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM buzzer_rooms
      WHERE buzzer_rooms.id = buzzer_participants.room_id
        AND buzzer_rooms.status IN ('waiting', 'active')
    )
  );
```

> **Action required:** Run `021_buzzer_rls_fix.sql` in the Supabase SQL Editor.

---

## Bug 2 — `joinBuzzerRoom()` Used `upsert()`, Triggering the Broken UPDATE Path

**Severity:** Critical  
**Layer:** App → Database  
**File:** `packages/supabase-client/src/buzzer.js`

### Root Cause

`joinBuzzerRoom()` called Supabase's `.upsert()` unconditionally. For
participants rejoining after a reset, the row already existed → upsert
fired the UPDATE path → Bug 1 rejected it.

```js
// ❌ Before — upsert always triggers both INSERT and UPDATE internally
await supabase
  .from('buzzer_participants')
  .upsert(
    { room_id, user_id, display_name },
    { onConflict: 'room_id,user_id' }
  )
```

### Fix

Replaced with a two-step **insert-or-fetch** pattern that never triggers an
implicit UPDATE:

```js
// ✅ After — attempt INSERT; if duplicate key (23505), SELECT existing row
const { data: inserted, error } = await supabase
  .from('buzzer_participants')
  .insert({ room_id, user_id, display_name })
  .select().single();

if (error?.code === '23505') {
  // Row already exists — fetch and return it without any UPDATE
  return await supabase.from('buzzer_participants')
    .select().eq('room_id', room_id).eq('user_id', user_id).single();
}
```

Raw RLS/SQL error messages are also caught and translated to user-friendly text
before being surfaced to the participant UI.

---

## Bug 3 — `leaveBuzzerRoom()` Fired on Phase Change, Not Just Unmount

**Severity:** Critical  
**Layer:** React (`BuzzerPage.jsx`)

### Root Cause

The cleanup effect that deleted the participant's DB row had `[room, user]` as
its dependency array. React runs the cleanup of an effect whenever its dependencies
change. When `retryCount` incremented and `setRoom(roomData)` was called (even
with the same data), React created a new object reference for `room`, triggering
the cleanup — which **deleted the participant row from `buzzer_participants`
while they were still mid-session**.

```js
// ❌ Before — cleanup fires every time room or user reference changes
useEffect(() => {
  return () => {
    leaveBuzzerRoom(room.id, user.id); // silently removes user mid-session
  };
}, [room, user]); // ← room reference change triggers this on retry
```

### Fix

Moved cleanup to a dedicated effect with an empty dependency array `[]`,
which fires **only on true component unmount** (browser tab close / navigation).
Room data is stored in a `ref` instead of state so it never changes reference:

```js
// ✅ After — only runs on unmount, never on state changes
useEffect(() => {
  return () => {
    leaveBuzzerRoom(roomRef.current.id, user.id).catch(() => {});
  };
}, []); // empty deps = unmount only
```

---

## Bug 4 — Channel Subscription Torn Down and Rebuilt on Every Reset

**Severity:** High  
**Layer:** React (`BuzzerPage.jsx`)

### Root Cause

The channel subscription effect included `[room, user, displayName]` as
dependencies and returned a cleanup that called `unsubscribeBuzzer()`. Any time
`room` changed reference (on retry), the channel was destroyed and rebuilt.
During the teardown window the participant missed broadcast events, and
the host's participant list showed spurious leave/rejoin flickers.

```js
// ❌ Before — channel destroyed and rebuilt whenever room changes
useEffect(() => {
  const channel = subscribeBuzzerChannel(room.room_code, handlers);
  return () => unsubscribeBuzzer(channel); // fires on retry/reset!
}, [room, user, displayName]);
```

### Fix

The channel is now created in a dedicated effect gated on a one-way `joined`
boolean state flag. Once `joined` is `true`, the effect runs exactly once and
**never returns a cleanup**, so the channel persists through all phase changes
(reset, result, waiting) until the component unmounts:

```js
// ✅ After — channel created once, lives for the full session
useEffect(() => {
  if (!joined || channelRef.current) return; // only runs once
  channelRef.current = subscribeBuzzerChannel(room.room_code, handlers);
  // No return/cleanup — channel stays alive until unmount effect cleans it up
}, [joined, user, displayName]);
```

---

## Bug 5 — Invalid React Dependency Array (Boolean Expression)

**Severity:** Medium  
**Layer:** React (`BuzzerPage.jsx`, intermediate fix)

### Root Cause

During an intermediate rewrite attempt, the channel effect used a boolean
expression as a dependency — invalid React:

```js
// ❌ Invalid — dependency array contains an expression, not a value
useEffect(() => { ... }, [phase === 'waiting' && !channelRef.current]);
```

React evaluates this as `[false]` or `[true]`, producing unpredictable
re-run behaviour and a React linting error.

### Fix

Replaced with a proper `joined: boolean` state value that transitions
`false → true` exactly once and never resets — a clear, valid, one-way trigger
for the channel subscription effect.

---

## Bug 6 — `isAllowed` Stale Closure in `handleBuzz`

**Severity:** Low  
**Layer:** React (`BuzzerPage.jsx`)

### Root Cause

`handleBuzz` read `isAllowed` from React state, captured at `useCallback`
creation time. In a rapid tap + reset race condition, `isAllowed` could be
stale (`true`) even after the host had already reset the buzzer.

```js
// ❌ Before — stale closure risk under rapid state changes
const handleBuzz = useCallback(() => {
  if (!isAllowed) return; // may be stale
}, [isAllowed]);
```

### Fix

`isAllowed` is now stored in `isAllowedRef` (a mutable ref). Refs are read
synchronously at call-time with no closure staleness:

```js
// ✅ After — ref always reflects current allowed state
const handleBuzz = useCallback(() => {
  if (!isAllowedRef.current) return; // always current
  if (hasBuzzedRef.current) return;
  if (!channelRef.current) return;
  // ... send buzz
}, [user, displayName]);
```

---

## Final Lifecycle Contract

After all fixes, the participant lifecycle works as follows:

```
① JOIN (once on mount, retry only if failed)
   getBuzzerRoom() → joinBuzzerRoom() → joined=true, phase='waiting'

② CHANNEL (created once when joined=true, never rebuilt)
   subscribeBuzzerChannel() stored in channelRef

③ HOST EVENTS — pure in-memory, no DB round-trips
   question_open  → phase='ready',    isAllowedRef=true,  hasBuzzedRef=false
   buzz (tap)     → phase='buzzed',   hasBuzzedRef=true
   buzz_result    → phase='result',   show winner
   buzz_reset     → phase='waiting',  isAllowedRef=false, hasBuzzedRef=false
   ↑ cycles here for every round until room is closed ↑

④ UNMOUNT (browser close / navigate away — NOT on reset)
   participant_left broadcast → unsubscribeBuzzer() → leaveBuzzerRoom()
```

---

## State vs. Ref Architecture

| Value | Storage | Reason |
|---|---|---|
| `phase` | `useState` | Drives UI rendering |
| `buzzResult` | `useState` | Drives UI rendering |
| `joined` | `useState` | One-way trigger for channel effect |
| `errorInfo` | `useState` | Drives error UI |
| `retryCount` | `useState` | Triggers join on manual retry |
| `roomRef` | `useRef` | Stable — must not cause re-renders |
| `channelRef` | `useRef` | Supabase channel handle |
| `hasBuzzedRef` | `useRef` | Per-round guard — read synchronously |
| `isAllowedRef` | `useRef` | Per-round eligibility — read synchronously |
| `questionOpenedAtRef` | `useRef` | Timestamp for buzz-offset calculation |

---

## Files Changed Summary

| File | Type | Change |
|---|---|---|
| `migrations/021_buzzer_rls_fix.sql` | New migration | Adds UPDATE policy; tightens INSERT policy |
| `packages/supabase-client/src/buzzer.js` | Modified | `joinBuzzerRoom`: upsert → insert-or-fetch; friendly error messages |
| `apps/quiz-app/src/pages/BuzzerPage.jsx` | Rewritten | 3 cleanly separated effects; refs for all guards; correct deps |

> **Remember:** `021_buzzer_rls_fix.sql` must be run manually in the
> **Supabase SQL Editor** — it cannot be applied from the app code alone.
