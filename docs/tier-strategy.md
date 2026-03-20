# Qwizzeria Tier Strategy (Stripe-Only)

This document outlines the strategic implementation of the **Free → Gold → Platinum** membership model. We leverage a **Freemium** funnel where free usage builds habit before converting deeply engaged users via Stripe into core and power tiers.

---

## 🏗️ 1. Membership Tiers & Access

| Feature | **Free** (Discovery) | **Gold** (Core) | **Platinum** (Power) |
|---|---|---|---|
| **Purpose** | Habit/Acquisition | Engagement | Monetize / Competiton |
| **Quiz Sessions** | 3-5 per week | Unlimited | Unlimited |
| **Categories** | Selected (Starter) | Full Access | Full Access + Early Access |
| **Analytics** | Basic | Accuracy, Streaks | Deep (Category Heatmaps) |
| **Tournaments** | Spectate | Participate | Hosted / Private Rooms |
| **Pricing** | €0 | €5 - €8 / month | €10 - €15 / month |

---

## 🛡️ 2. Core Technical Architecture

### 2.1 Single Source of Truth: Stripe
- The **Stripe Dashboard** manages all billing lifecycles (Trial → Active → Past Due → Canceled).
- Existing `api/stripe/webhook.js` maps price IDs to the internal `gold` and `platinum` tags.
- The `subscriptions` table is the definitive source for paid eligibility.

### 2.2 Usage-Based Gating (Free Tier)
We transition from time-based trials to **usage-based gating**.
- **The RPC Logic**: `get_subscription_state` checks for recent `quiz_sessions` (past 7 days).
- **Session Threshold**: User can play up to 5 sessions per week.
- **The Nudge**: On the 5th session, the app triggers a "You've reached your free limit" modal with a "Compare Tiers & Upgrade" CTA to Stripe.

---

## 🎨 3. Behavioral Design & UX

### 3.1 "Play Instantly" UX
- **Landing Page**: The "Play" button takes users directly to a free jeopardy-style grid.
- **Delayed Login**: Prompt for account creation only after the first session to save results.
- **Highlights**: Explicitly highlight locked Gold/Platinum content in the UI to create natural desire (FOMO).

### 3.2 Conversion Journey
1.  **Session 1**: Pure fun, zero friction.
2.  **Session 3**: "Join the leaderboard to track your progress" (Profile CTA).
3.  **Session 5**: "Limit reached — Unlock unlimited play with Gold" (Pricing CTA).

---

## 📈 4. Growth & Analytics (GA4)

| Key Metric | Definition | Importance |
|---|---|---|
| **Habit Loop** | Users completing 3+ quizzes/week. | Indicator of high conversion potential. |
| **Limit Conversion** | % of users who click Stripe links after hitting a limit. | Core business KPI. |
| **Drop-off Point** | Where users drop out in a quiz session (Question #). | Identifies content fatigue. |
| **ARPU** | Average Revenue Per User. | Efficiency of the Gold/Platinum upsell. |

---

## 🚀 5. Implementation Roadmap

### Phase 1: Infrastructure
- [ ] Update `subscriptions` and `user_profiles` schema for Tier tags.
- [ ] Build the weekly session counting RPC logic.

### Phase 2: Stripe Integration
- [ ] Define Price IDs in Stripe Dashboard.
- [ ] Update webhook mapping for Gold/Platinum tiers.

### Phase 3: UI & Conversion
- [ ] Implement the "Usage Limit" nudge modals in `FreeQuiz.jsx`.
- [ ] Filter categories for the Free tier in the backend.

### Phase 4: Competitive Features
- [ ] Develop Advanced Analytics view (Category Accuracy).
- [ ] Implement Private Rooms/Regional Leaderboards.

---

> **Summary**: This lean architecture prioritizes **rapid habit-building** and uses Stripe's stability to manage all financial transactions, keeping the development focus on the quiz experience itself.
