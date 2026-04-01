---
name: Gamification Full System Review (2026-03-31)
description: Review outcome for the proposed Duolingo-inspired gamification overhaul — energy, coins, ELO, loot boxes
type: project
---

**Decision: PROCEED WITH CHANGES (phased)**

The full proposal was evaluated on 2026-03-31. Key findings:

**What to accept:** DB-backed XP/streak/levels/badges (already partially built), daily reward calendar, streak milestones. These are high-value, low-risk, and directly buildable on migration 026.

**What to reject outright:** Energy system — wrong product type (knowledge quiz, not idle game), creates friction that contradicts the platform's positioning, high implementation cost, and drives negative monetization perception. ELO skill rating — no adaptive question difficulty in the content model to act on it; orphaned metric. Ad-based energy refill — legal/UX liability.

**What to defer:** Full virtual coin economy, loot/chest mechanics, probability-based reward engine. These are scope-expanding, legally ambiguous (loot box regulations in EU/some US states), and distract from core subscription monetization.

**Recommended MVP:** Phase A = extend DB gamification to all quiz modes + streak milestone rewards. Phase B = coin-lite (earn only, simple spend paths). Phase C = premium tier bonuses (2x XP, bonus coins for Pro subscribers).

**Why it matters:** Existing subscription model (Basic $9.99 / Pro $19.99) is the revenue engine. Gamification should funnel users toward subscriptions, not create a parallel virtual economy that competes with it.
