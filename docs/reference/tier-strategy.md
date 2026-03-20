# Qwizzeria Tier Strategy

This document defines the **Free → Basic → Pro** subscription model. All tier logic is centralized in `apps/quiz-app/src/config/tiers.js` — see that file as the authoritative reference.

---

## 1. Membership Tiers & Access

| Feature | **Free** ($0) | **Basic** ($4.99/mo) | **Pro** ($9.99/mo) | **Staff** (bypass) |
|---|:---:|:---:|:---:|:---:|
| Free Quiz (`/play/free`) | Yes | Yes | Yes | Yes |
| Dashboard | Yes | Yes | Yes | Yes |
| Profile / Guide | Yes | Yes | Yes | Yes |
| Pricing Page | Yes | Yes | Yes | Yes |
| Quiz Packs (browse + play) | - | Yes | Yes | Yes |
| Quiz History | - | Yes | Yes | Yes |
| Global Leaderboard | - | Yes | Yes | Yes |
| Resume Sessions | - | Yes | Yes | Yes |
| Doubles | - | - | Yes | Yes |
| Host Quiz (multiplayer) | - | - | Yes | Yes |
| Tournaments | - | - | Yes | Yes |
| AI Quiz Generation | - | - | Yes (5/hr, 20/day) | Yes (unlimited) |
| Buzzer Rooms | - | - | Yes | Yes |
| Export Results (CSV/PDF) | - | - | Yes | Yes |
| Certificates (PNG) | - | - | Yes | Yes |

---

## 2. Trial & Conversion

### 14-Day Free Trial
- All new users get **14 days of full Pro access** (computed from `user_profiles.created_at`).
- No credit card required. No Stripe trial — app-computed via `get_subscription_state` RPC.
- After trial: Free tier (only free quiz + dashboard + profile) unless subscribed.

### Conversion Flow
1. User signs up → immediate Pro access for 14 days
2. Trial banner shows throughout (softer tone days 6-14, urgent ≤5 days)
3. Sidebar trial widget shows countdown ring
4. After trial expires → UpgradeWall blocks gated features with contextual messaging
5. Pricing page accessible at all times

---

## 3. Technical Architecture

### Single Source of Truth: `config/tiers.js`
- `TIER_HIERARCHY`: ordered list of tier keys
- `TIERS`: tier metadata (name, price, Stripe price ID)
- `FEATURE_TIERS`: maps each feature to its minimum required tier
- `tierSatisfies()`: checks if a tier meets a requirement
- `getTierList()`: generates Pricing page data from config
- `mapPriceToTier()`: maps Stripe price ID to tier key (returns null for unknowns)

### Subscription State: `get_subscription_state` RPC
1. Staff roles (editor/admin/superadmin) bypass all gating
2. If subscription row exists → return status/tier from DB
3. If no subscription → compute trial from `user_profiles.created_at`
4. Returns: `{ status, tier, gated, trialEnd?, trialDaysLeft?, cancelAtPeriodEnd?, currentPeriodEnd? }`

### Gating Components
- `useEntitlement(feature)` — hook returning `{ allowed, requiredTier, currentTier, reason }`
- `TierRoute` — layout route that blocks with UpgradeWall
- `SubscriptionGate` — wrapper component for inline gating
- `UpgradeWall` — contextual upgrade prompt (trial_expired / canceled / tier_insufficient)

### Stripe Integration
- **Checkout**: `api/stripe/create-checkout.js` creates Stripe checkout sessions
- **Webhook**: `api/stripe/webhook.js` handles subscription lifecycle events
- **Portal**: `api/stripe/create-portal.js` opens Stripe billing portal
- **Idempotency**: `stripe_webhook_log` table prevents duplicate event processing

---

## 4. Roles vs. Tiers (Admin Guide)

Two independent systems control access — they do not overlap:

| Concept | Source of Truth | Controls | Managed By |
|---|---|---|---|
| **Role** (`user_profiles.role`) | `user`, `editor`, `admin`, `superadmin` | Staff/CMS access, DB-level RLS security | Superadmin via Admin → Users |
| **Tier** (`subscriptions.tier`) | `free`, `basic`, `pro` | Player feature access (packs, host, buzzer, etc.) | Stripe (automated via webhooks) |

**Key rules:**
- Roles are for **operational/staff access**. Tiers are for **customer features**.
- Staff roles (editor+) bypass all tier gating automatically (`status='staff'`).
- Stripe subscribers have `role='user'` + a `subscriptions` row — the webhook never touches `user_profiles.role`.
- To give someone CMS access: change their role to `editor`/`admin`/`superadmin` in Admin → Users.
- To give someone paid features: they subscribe via Pricing page, or promote them to a staff role.
- The `feature_access` table exists but is unused (legacy from Phase 7). `content_permissions` is active for editor grants but requires manual SQL.

---

## 5. Dropped Proposals (from original strategy)

| Proposal | Decision | Reason |
|---|---|---|
| Gold / Platinum naming | **Dropped** | Code uses Basic / Pro; simpler and clearer |
| Usage-based free (5 sessions/week) | **Dropped** | Time-based 14-day trial is simpler, proven |
| Delayed login (anonymous → nudge) | **Dropped** | Major architectural change, marginal ROI |
| Category filtering for free tier | **Dropped** | Reduces value of the only free feature |
| `premium` DB role for paid users | **Removed** | Replaced by `subscriptions` table; role was vestigial and caused bugs |
| `feature_access` table (Gate 1) | **Deprecated** | Superseded by `useEntitlement` + `config/tiers.js` |

---

## 6. Deferred (Future Phases)

| Feature | Phase | Description |
|---|---|---|
| Session nudge sequence | G/H | Config-driven nudge system (session 1/3/5 prompts) |
| GA4 analytics | Future | Track conversion funnel, drop-off points, ARPU |
| Usage metering | G | `get_usage_count` RPC + `useUsageMeter` hook |
| Coupon/promo codes | Future | Stripe coupon support in checkout |
| Stripe-managed trials | Future | Move trial from app-computed to Stripe subscription trials |
| Admin UI for content_permissions | Future | UI for managing editor pack/category grants (currently requires SQL) |

---

## 7. How to Change Tiers

See `apps/quiz-app/src/config/tiers.js` — all changes are centralized there.

- **Change pricing/names**: Edit `TIERS` object, update Stripe Dashboard + env vars
- **Move feature between tiers**: Edit `FEATURE_TIERS` — all UI auto-adapts
- **Add new tier**: Add to `TIER_HIERARCHY` + `TIERS`, Stripe product, DB migration for CHECK constraint
- **Add gated feature**: Add line to `FEATURE_TIERS`, wrap with `SubscriptionGate` or `TierRoute`
