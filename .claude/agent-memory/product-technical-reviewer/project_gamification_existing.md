---
name: Existing Gamification System
description: Current state of gamification — what exists, what's DB-backed, what's localStorage-only
type: project
---

Gamification exists in two layers as of Phase 11/12:

**DB-backed (migration 026_gamification.sql):** `user_profiles` has columns: `xp_total`, `daily_streak_count`, `daily_streak_last_play`, `badges TEXT[]`, `total_correct`. Synced at session end via `saveGamificationStats()`. Read on quiz load via `fetchGamificationStats()` with a merge strategy (take higher value).

**localStorage-primary:** `freeQuizStorage.js` is the write-first layer. XP, streak, badges, best score, play count, total_correct all live in localStorage keys. DB sync is fire-and-forget at results phase only.

**Logic:** `gamification.js` has pure functions: `calculateXP`, `getLevel`, `getLevelTitle`, `getLevelProgress`, `checkNewBadges`, `updateStreak`. LEVELS array (10 levels), BADGES array (6 badges). XP: correct answer = points + speed bonus + streak multiplier.

**Scope:** Currently only wired into FreeQuiz. Pack Play and Host Quiz do NOT use the gamification system at all.

**Key gap:** No coins, no energy, no virtual economy. Streak is date-based (one check per day), not time-based regen. No ELO/skill rating. No reward engine.

**Why this matters:** Any new gamification proposal builds on this foundation — avoid duplicating what already exists. The DB columns are in place; the localStorage-DB sync pattern is established.
