# 14-Day Free Trial + Stripe Billing & Subscription System

> **Implementation Plan** — Qwizzeria WebApp
> **Status:** Planned
> **Priority:** High
> **Estimated Phases:** 5

---

## Context

All Qwizzeria users currently access features based on a DB-backed role (`user_profiles.role`). There is no trial period, no payment integration, and no self-service subscription management. The goal is to:

1. Give every new user a **14-day free trial** of all features
2. After trial expires, require a paid subscription for premium features
3. **Free Quiz** (`/play/free`) remains free forever
4. Integrate **Stripe** for payment processing
5. Offer **two subscription tiers** (Basic + Pro)

The sidebar footer should display a **trial widget** with a circular progress ring showing days remaining, an UPGRADE button, and the user's name with a "Free Trial" label.

## Tier Definitions

| Feature | Free (post-trial) | Basic (~$5/mo) | Pro (~$10/mo) |
|---------|-------------------|----------------|---------------|
| Free Quiz | Yes | Yes | Yes |
| Dashboard | Yes | Yes | Yes |
| Profile / Guide | Yes | Yes | Yes |
| Quiz Packs (browse + play) | No | Yes | Yes |
| Quiz History | No | Yes | Yes |
| Global Leaderboard | No | Yes | Yes |
| Host Quiz (multiplayer) | No | No | Yes |
| Tournaments | No | No | Yes |

---

## Phase 1: Database + Subscription State

### 1A. New Migration: `016_subscriptions.sql`
**New file:** `packages/supabase-client/migrations/016_subscriptions.sql`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro')) DEFAULT 'basic',
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','canceled','expired')) DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);
```

RLS policies:
- **SELECT:** `auth.uid() = user_id` OR `is_admin()`
- **INSERT/UPDATE/DELETE:** Service role only (Stripe webhook writes)

### 1B. New RPC: `get_subscription_state(target_user_id UUID)`
**In same migration file.** Single source of truth — returns JSON:

```sql
CREATE OR REPLACE FUNCTION get_subscription_state(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  sub_row subscriptions%ROWTYPE;
  profile_row user_profiles%ROWTYPE;
  trial_end TIMESTAMPTZ;
  days_left INT;
BEGIN
  SELECT * INTO profile_row FROM user_profiles WHERE id = target_user_id;

  -- Staff roles bypass subscription entirely
  IF profile_row.role IN ('editor', 'admin', 'superadmin') THEN
    RETURN json_build_object('status', 'staff', 'tier', 'pro', 'gated', false);
  END IF;

  SELECT * INTO sub_row FROM subscriptions WHERE user_id = target_user_id;

  -- No subscription row → check trial
  IF sub_row IS NULL THEN
    trial_end := profile_row.created_at + INTERVAL '14 days';
    days_left := GREATEST(0, EXTRACT(DAY FROM trial_end - now())::INT);
    IF now() < trial_end THEN
      RETURN json_build_object(
        'status', 'trialing', 'tier', 'pro',
        'trialEnd', trial_end, 'trialDaysLeft', days_left, 'gated', false
      );
    ELSE
      RETURN json_build_object('status', 'expired', 'tier', 'free', 'gated', true);
    END IF;
  END IF;

  -- Has subscription row — check for past_due grace period (3 days)
  IF sub_row.status = 'past_due' THEN
    IF now() < sub_row.updated_at + INTERVAL '3 days' THEN
      RETURN json_build_object(
        'status', 'past_due', 'tier', sub_row.tier, 'gated', false,
        'currentPeriodEnd', sub_row.current_period_end,
        'cancelAtPeriodEnd', sub_row.cancel_at_period_end
      );
    ELSE
      RETURN json_build_object('status', 'past_due', 'tier', 'free', 'gated', true);
    END IF;
  END IF;

  -- Active or other statuses
  RETURN json_build_object(
    'status', sub_row.status,
    'tier', CASE WHEN sub_row.status IN ('active') THEN sub_row.tier ELSE 'free' END,
    'currentPeriodEnd', sub_row.current_period_end,
    'cancelAtPeriodEnd', sub_row.cancel_at_period_end,
    'gated', sub_row.status NOT IN ('active')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1C. Update Data Layer
**Modify:** `packages/supabase-client/src/users.js`

Add:
```js
export async function getSubscriptionState(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_subscription_state', { target_user_id: userId });
  if (error) throw error;
  return data;
}
```

### 1D. Update AuthProvider
**Modify:** `apps/quiz-app/src/components/AuthProvider.jsx`

After fetching role, also call `getSubscriptionState(user.id)`. Add to context:

```js
// New context values
subscription: { status, tier, trialEnd, trialDaysLeft, gated, cancelAtPeriodEnd, currentPeriodEnd }

// Computed helpers
isTrial        // subscription.status === 'trialing'
isGated        // subscription.gated === true
hasTier(tier)  // 'basic' satisfied by basic|pro; 'pro' requires pro
```

Keep existing `isPremium`/`isAdmin`/`isEditor` unchanged (staff access backward compatibility).

### Backward Compatibility

| Aspect | Before | After |
|--------|--------|-------|
| `user_profiles.role` | Drives access | Still drives staff roles (editor/admin/superadmin) |
| `isPremium` context | Based on role | Unchanged — still role-based for staff |
| New `subscription.*` | N/A | Added — drives trial/billing gating |
| `subscriptions` table | N/A | New — webhook-managed |

---

## Phase 2: Sidebar Trial Widget + Feature Gating UI

### 2A. Sidebar Trial Widget (matching design reference)
**Modify:** `apps/quiz-app/src/layouts/DashboardLayout.jsx`

Replace current `dashboard__sidebar-footer` content with a **trial/subscription widget card**:

```
┌─────────────────────────┐
│                          │
│     ╭──── 13 ────╮      │   ← SVG circular progress ring
│     │             │      │     (orange stroke, days number centered)
│     ╰─────────────╯      │
│                          │
│   days remaining in your │   ← Subtitle text
│       Free trial         │
│                          │
│    ⚡ UPGRADE             │   ← Orange accent button → /pricing
│                          │
│  👤 Rohat Kharvari       │   ← User display name (or email prefix)
│     Free Trial           │   ← Subscription status label
└─────────────────────────┘
```

**Component:** Extract to `apps/quiz-app/src/components/SidebarTrialWidget.jsx`

**Circular progress ring implementation:**
```jsx
// Pure SVG — <circle> with stroke-dasharray + stroke-dashoffset
const radius = 40;
const circumference = 2 * Math.PI * radius;
const progress = (daysLeft / 14) * circumference;
const offset = circumference - progress;

<svg width="100" height="100" viewBox="0 0 100 100">
  {/* Background circle */}
  <circle cx="50" cy="50" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="6" />
  {/* Progress circle */}
  <circle cx="50" cy="50" r={radius} fill="none" stroke="#e85c1a" strokeWidth="6"
    strokeDasharray={circumference} strokeDashoffset={offset}
    strokeLinecap="round" transform="rotate(-90 50 50)" />
  {/* Days number */}
  <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
    fill="#fff" fontSize="24" fontWeight="700">{daysLeft}</text>
</svg>
```

**Widget states:**

| Subscription Status | Widget Display |
|---------------------|----------------|
| `trialing` | Ring + days left + "UPGRADE" button + "Free Trial" label |
| `active` (basic) | No ring. "Basic Plan" label + "Upgrade to Pro" link |
| `active` (pro) | No ring. "Pro Plan" label. No upgrade button |
| `expired` / `canceled` | No ring. "Free Plan" label + "UPGRADE" button |
| `staff` | Role badge (editor/admin) as current design. No widget |
| `past_due` | Warning icon + "Update Payment" link |

**User info section** (below widget in all states):
- Display name (from `user_profiles.display_name`, fallback to email prefix)
- Subscription status label ("Free Trial", "Basic Plan", "Pro Plan", "Free Plan")
- Account + Sign Out links (existing)

### 2B. New Component: `SubscriptionGate.jsx`
**New file:** `apps/quiz-app/src/components/SubscriptionGate.jsx`

Wrapper that checks `hasTier(requiredTier)`:
```jsx
<SubscriptionGate requiredTier="basic" feature="Quiz Packs">
  {children}
</SubscriptionGate>
```

- If user has required tier (or staff) → render children
- If trialing → render children (trial grants `pro` access)
- If gated → render `<UpgradeWall />` instead

### 2C. New Component: `UpgradeWall.jsx`
**New file:** `apps/quiz-app/src/components/UpgradeWall.jsx`

Full-page wall shown when trial expired and no active subscription:
- Qwizzeria logo
- "Your free trial has ended"
- Feature comparison table (Free vs Basic vs Pro)
- "Upgrade Now" button → `/pricing`
- "Continue with Free Quiz" link → `/play/free`

### 2D. New Component: `TrialBanner.jsx`
**New file:** `apps/quiz-app/src/components/TrialBanner.jsx`

Slim top banner (inside `DashboardLayout` content area):
- "X days left in your free trial — Upgrade now"
- Only shows when `isTrial && trialDaysLeft <= 5` (final 5 days)
- Dismissible per session (sessionStorage)

### 2E. Apply Gating to Routes
**Modify:** `apps/quiz-app/src/components/App.jsx`

Create a `TierRoute` wrapper component (similar to existing `ProtectedRoute`):

```jsx
// TierRoute.jsx — checks subscription tier before rendering <Outlet />
function TierRoute({ requiredTier }) {
  const { subscription, isGated, hasTier } = useAuth();
  if (subscription.status === 'trialing' || hasTier(requiredTier)) return <Outlet />;
  return <UpgradeWall requiredTier={requiredTier} />;
}
```

Route gating:

| Routes | Required Tier |
|--------|--------------|
| `/play/free`, `/dashboard`, `/profile`, `/guide`, `/pricing` | None (always free) |
| `/packs`, `/packs/:id`, `/packs/:id/play` | `basic` |
| `/history` | `basic` |
| `/leaderboard` | `basic` |
| `/play/resume/:sessionId` | `basic` |
| `/host` | `pro` |
| `/host/tournament/*` | `pro` |

### 2F. Sidebar Nav Lock Icons
**Modify:** `apps/quiz-app/src/layouts/DashboardLayout.jsx`

Add tier metadata to `NAV_ITEMS`:
```js
{ to: '/packs', icon: NAV_ICONS.packs, label: 'Browse Packs', tier: 'basic' },
{ to: '/host', icon: NAV_ICONS.host, label: 'Host Quiz', tier: 'pro' },
```

When user doesn't have the required tier and isn't trialing, show a small lock SVG icon next to the nav label. Clicking still navigates (where `TierRoute` handles the wall).

### 2G. CSS
**New file:** `apps/quiz-app/src/styles/SubscriptionGate.css`

Styles for:
- Trial widget card (dark background, centered, border-top separator)
- Circular progress ring container
- UPGRADE button (orange accent, lightning bolt icon, rounded)
- User name + status label
- UpgradeWall full-page centered layout
- TrialBanner slim top bar
- Lock icon for sidebar nav items
- Responsive: widget stacks vertically on mobile sidebar

---

## Phase 3: Stripe Integration (Backend)

### 3A. Stripe Products Setup
Create in Stripe Dashboard:
- **Qwizzeria Basic** — recurring monthly price (~$5)
- **Qwizzeria Pro** — recurring monthly price (~$10)
- Store price IDs as environment variables

### 3B. Vercel Serverless API Routes
**New files in:** `apps/quiz-app/api/stripe/`

**`api/stripe/create-checkout.js`**
```js
// POST /api/stripe/create-checkout
// Body: { tier: 'basic' | 'pro' }
// Auth: Supabase JWT in Authorization header

// 1. Verify JWT → extract user_id + email
// 2. Map tier → Stripe price ID
// 3. Create Stripe Checkout Session:
//    - mode: 'subscription'
//    - customer_email
//    - metadata: { user_id, tier }
//    - success_url: /dashboard?subscription=success
//    - cancel_url: /pricing
// 4. Return { url: session.url }
```

**`api/stripe/create-portal.js`**
```js
// POST /api/stripe/create-portal
// Auth: Supabase JWT

// 1. Verify JWT → get user_id
// 2. Look up stripe_customer_id from subscriptions table (using service role)
// 3. Create Stripe Billing Portal session
// 4. Return { url: session.url }
```

**`api/stripe/webhook.js`**
```js
// POST /api/stripe/webhook
// Stripe webhook signature verification

// Handle events:
// - checkout.session.completed → upsert subscriptions row (status: active)
// - customer.subscription.updated → sync status, tier, period dates, cancel_at_period_end
// - customer.subscription.deleted → set status: canceled
// - invoice.payment_failed → set status: past_due
```

### 3C. Environment Variables
Set in Vercel project settings (NOT committed to repo):
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3D. Frontend API Helper
**New file:** `apps/quiz-app/src/utils/stripe.js`

```js
export async function createCheckoutSession(tier) {
  const res = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ tier }),
  });
  const { url } = await res.json();
  window.location.href = url;
}

export async function openBillingPortal() {
  const res = await fetch('/api/stripe/create-portal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const { url } = await res.json();
  window.location.href = url;
}
```

---

## Phase 4: Pricing Page + Billing UI

### 4A. New Page: `Pricing.jsx`
**New file:** `apps/quiz-app/src/pages/Pricing.jsx`
**Route:** `/pricing` (no tier gate — always accessible)

Layout:
- Page title: "Choose Your Plan"
- Trial context banner (if trialing): "X days left — subscribe now to keep access"
- Two pricing cards side by side:
  - **Basic** card: price, feature list, "Subscribe" button
  - **Pro** card: price, feature list, "Subscribe" button, "Most Popular" badge
- Current plan indicator (if already subscribed)
- "Manage Subscription" button → Stripe Portal (if active)
- Free tier comparison at bottom

### 4B. Profile Subscription Section
**Modify:** `apps/quiz-app/src/pages/Profile.jsx`

New section between Account and Stats:

```jsx
<section className="profile__section">
  <h2>Subscription</h2>
  {/* Displays: current plan, trial days left, next billing date, manage/upgrade buttons */}
</section>
```

States:
- **Trial:** "Free Trial — X days remaining" + "Upgrade" link
- **Active:** "Basic/Pro Plan" + next billing date + "Manage Subscription" (Stripe Portal)
- **Canceled:** "Access until [date]" + "Resubscribe" button
- **Expired:** "Free Plan" + "Upgrade" link

### 4C. Add Route + Sidebar Nav
**Modify:** `apps/quiz-app/src/components/App.jsx`
- Add `/pricing` route → `Pricing.jsx` inside `DashboardLayout`

**Modify:** `apps/quiz-app/src/layouts/DashboardLayout.jsx`
- Add "Pricing" nav item (visible when gated or trialing)
- Icon: pricing tag or diamond

### 4D. CSS
**New file:** `apps/quiz-app/src/styles/Pricing.css`
- Pricing card grid (2-column, responsive to single column on mobile)
- Card styling (dark background, accent border for recommended plan)
- Feature checklist with check/cross icons
- Current plan badge
- Responsive layout

---

## Phase 5: Admin Analytics + Edge Cases

### 5A. Admin Subscription Metrics
**New RPC:** `get_subscription_analytics()` (admin-only, uses `is_admin()`)

Returns:
- Total users by subscription status (trialing, active, canceled, expired)
- Active users by tier (basic vs pro)
- Trial conversion rate (trialing → active)
- Monthly subscription count trend

**Modify:** `apps/admin-cms/src/pages/Dashboard.jsx`
- Add "Subscriptions" metrics card with the above data

### 5B. Grace Period (past_due)
Handled in `get_subscription_state()` RPC:
- `past_due` within 3 days of `updated_at` → `gated: false` (grace)
- After 3 days → `gated: true`
- UI: warning banner "Payment failed — update your payment method" with link to Stripe Portal

### 5C. Downgrade Behavior
- **Pro → Basic:** Immediately lose Host Quiz + Tournaments access
- **Basic → Free (canceled):** Lose Packs/History/Leaderboard after `current_period_end`
- **Data preservation:** All quiz history, scores, profiles preserved. Gated features become accessible again on resubscription.

### 5D. Email Notifications (Future — not in initial build)
Can add later via Stripe's built-in email receipts or Supabase Edge Functions:
- Trial ending in 3 days
- Payment failed
- Subscription canceled confirmation

---

## Files Summary

| File | Phase | Action |
|------|-------|--------|
| `packages/supabase-client/migrations/016_subscriptions.sql` | 1 | **New** — subscriptions table + RPC |
| `packages/supabase-client/src/users.js` | 1 | **Modify** — add `getSubscriptionState()` |
| `apps/quiz-app/src/components/AuthProvider.jsx` | 1 | **Modify** — fetch + expose subscription state |
| `apps/quiz-app/src/components/SidebarTrialWidget.jsx` | 2 | **New** — circular ring + upgrade button |
| `apps/quiz-app/src/layouts/DashboardLayout.jsx` | 2 | **Modify** — integrate trial widget + nav lock icons |
| `apps/quiz-app/src/components/SubscriptionGate.jsx` | 2 | **New** — tier-checking wrapper |
| `apps/quiz-app/src/components/TierRoute.jsx` | 2 | **New** — route-level tier guard |
| `apps/quiz-app/src/components/UpgradeWall.jsx` | 2 | **New** — full-page upgrade prompt |
| `apps/quiz-app/src/components/TrialBanner.jsx` | 2 | **New** — slim countdown banner |
| `apps/quiz-app/src/components/App.jsx` | 2+4 | **Modify** — TierRoute wrapping + /pricing route |
| `apps/quiz-app/src/styles/SubscriptionGate.css` | 2 | **New** — all subscription UI styles |
| `apps/quiz-app/api/stripe/create-checkout.js` | 3 | **New** — Stripe Checkout session |
| `apps/quiz-app/api/stripe/create-portal.js` | 3 | **New** — Stripe Billing Portal |
| `apps/quiz-app/api/stripe/webhook.js` | 3 | **New** — Stripe event handler |
| `apps/quiz-app/src/utils/stripe.js` | 3 | **New** — frontend Stripe API helpers |
| `apps/quiz-app/src/pages/Pricing.jsx` | 4 | **New** — pricing page |
| `apps/quiz-app/src/styles/Pricing.css` | 4 | **New** — pricing page styles |
| `apps/quiz-app/src/pages/Profile.jsx` | 4 | **Modify** — subscription section |
| `apps/admin-cms/src/pages/Dashboard.jsx` | 5 | **Modify** — subscription analytics |

## Key Design Decisions

1. **Separate `subscriptions` table** — subscription lifecycle (trialing/active/canceled) is fundamentally different from staff roles (editor/admin/superadmin). Staff roles bypass subscription entirely via the `get_subscription_state()` RPC.

2. **Trial computed from `user_profiles.created_at + 14 days`** — no extra columns needed. Server-side computation in Postgres prevents client-side tampering.

3. **Vercel API routes for Stripe** — app already deploys on Vercel, keeps infrastructure simple, uses Node.js runtime for Stripe SDK. No need for Supabase Edge Functions.

4. **`get_subscription_state()` RPC as single source of truth** — one call returns everything the frontend needs. Staff bypass, trial check, grace period, subscription status — all computed server-side.

5. **SVG circular progress ring in sidebar** — pure CSS/SVG, no dependencies. Matches the provided design reference with days remaining centered, progress stroke, and UPGRADE button.

6. **Existing `isPremium`/`isAdmin`/`isEditor` unchanged** — fully backward compatible. New `subscription.*` context values are additive. Staff access unaffected.

7. **`TierRoute` pattern** — mirrors existing `ProtectedRoute` (auth guard) pattern. Clean separation: `ProtectedRoute` checks auth, `TierRoute` checks subscription tier.

## Verification Checklist

### Phase 1 Verification
- [ ] Migration runs without errors in Supabase SQL Editor
- [ ] `get_subscription_state()` returns correct JSON for: new user (trialing), expired trial, staff role
- [ ] AuthProvider exposes `subscription` in context
- [ ] `useAuth()` returns `isTrial`, `isGated`, `hasTier()`
- [ ] Existing tests pass: `cd apps/quiz-app && npx vitest run`

### Phase 2 Verification
- [ ] Sidebar shows circular ring with correct days count for trial users
- [ ] Ring progress decreases as days count down (test with different `created_at` values)
- [ ] UPGRADE button navigates to `/pricing`
- [ ] User name + "Free Trial" label displayed correctly
- [ ] Staff users see role badge (no widget)
- [ ] Expired trial: `/packs` shows UpgradeWall, `/play/free` still works
- [ ] Basic tier: packs work, `/host` shows UpgradeWall
- [ ] Pro tier: everything accessible
- [ ] Nav items show lock icons for gated features
- [ ] TrialBanner appears in last 5 days, dismissible

### Phase 3 Verification
- [ ] `POST /api/stripe/create-checkout` returns valid Stripe URL
- [ ] Stripe Checkout flow completes → webhook fires → `subscriptions` row created
- [ ] `POST /api/stripe/create-portal` opens Stripe Portal
- [ ] Webhook handles: subscription updated, deleted, payment failed
- [ ] Environment variables configured in Vercel (not in code)

### Phase 4 Verification
- [ ] `/pricing` page renders with two plan cards
- [ ] Subscribe buttons redirect to Stripe Checkout
- [ ] Current plan shown for subscribed users
- [ ] "Manage Subscription" opens Stripe Portal
- [ ] Profile shows subscription section with correct status
- [ ] Sidebar shows "Pricing" nav item for trial/gated users

### Phase 5 Verification
- [ ] Admin dashboard shows subscription metrics
- [ ] Past due grace period: 3-day access, then gated
- [ ] Downgrade: Pro→Basic loses host quiz immediately
- [ ] All 53+ tests still pass
