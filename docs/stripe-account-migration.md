# Stripe Account Migration Guide

How to switch the Qwizzeria app from one Stripe account to another.

---

## Overview

The app uses Stripe for subscription billing (Basic + Pro tiers). Switching accounts requires updating:

1. Stripe Dashboard setup (new account)
2. Environment variables (Vercel + local)
3. Webhook endpoint
4. Database cleanup (existing subscriptions)

---

## Step 1: Set Up the New Stripe Account

### 1a. Create Products & Prices

In the **new** Stripe Dashboard (https://dashboard.stripe.com):

1. Go to **Product catalog** > **Add product**
2. Create **Basic** product:
   - Name: `Qwizzeria Basic`
   - Price: `$9.99/month` (recurring)
   - Copy the **Price ID** (starts with `price_...`)
3. Create **Pro** product:
   - Name: `Qwizzeria Pro`
   - Price: `$19.99/month` (recurring)
   - Copy the **Price ID** (starts with `price_...`)

### 1b. Get API Keys

Go to **Developers** > **API keys**:

- Copy the **Secret key** (`sk_live_...` or `sk_test_...`)
- Copy the **Publishable key** (`pk_live_...` or `pk_test_...`) — not currently used server-side, but good to note

### 1c. Set Up Webhook Endpoint

Go to **Developers** > **Webhooks** > **Add endpoint**:

- **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
- **Events to listen to** (select these):
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.paid`
  - `charge.refunded`
  - `charge.dispute.created`
- After creating, copy the **Signing secret** (`whsec_...`)

### 1d. Set Up Customer Portal

Go to **Settings** > **Billing** > **Customer portal**:

- Enable the portal
- Configure allowed actions (cancel, change plan, update payment method)
- Save

---

## Step 2: Update Environment Variables

### 2a. Vercel Dashboard

Go to your Vercel project > **Settings** > **Environment Variables**.

Update these server-side variables:

| Variable | Old Value | New Value |
|----------|-----------|-----------|
| `STRIPE_SECRET_KEY` | `sk_...` (old) | `sk_...` (new account) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (old) | `whsec_...` (new endpoint) |
| `STRIPE_BASIC_PRICE_ID` | `price_...` (old) | `price_...` (new Basic price) |
| `STRIPE_PRO_PRICE_ID` | `price_...` (old) | `price_...` (new Pro price) |

Update these client-side variables (used in `tiers.js`):

| Variable | New Value |
|----------|-----------|
| `VITE_STRIPE_BASIC_PRICE_ID` | Same as `STRIPE_BASIC_PRICE_ID` above |
| `VITE_STRIPE_PRO_PRICE_ID` | Same as `STRIPE_PRO_PRICE_ID` above |

### 2b. Local Development (.env.local)

If testing locally, update `apps/quiz-app/.env.local`:

```env
# Stripe (new account — use test mode keys for dev)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
VITE_STRIPE_BASIC_PRICE_ID=price_...
VITE_STRIPE_PRO_PRICE_ID=price_...
```

### 2c. Redeploy

After updating env vars in Vercel:

```bash
# Trigger a redeployment to pick up new env vars
vercel --prod
# Or push a commit — Vercel auto-deploys
```

---

## Step 3: Database Cleanup

Existing subscription rows reference old Stripe customer/subscription IDs that don't exist in the new account. You have two options:

### Option A: Clean Slate (Recommended for fresh start)

Run in **Supabase SQL Editor**:

```sql
-- Remove all Stripe-linked subscriptions (users revert to free/trial)
DELETE FROM subscriptions;

-- Clear webhook log (old account events)
DELETE FROM stripe_webhook_log;
```

All users will revert to free tier (or trial if within 14 days of signup). Admin-granted subscriptions will also be removed — re-grant them via the admin panel after cleanup.

### Option B: Preserve Admin Grants Only

```sql
-- Remove only Stripe-linked subscriptions (keep admin grants)
DELETE FROM subscriptions
WHERE stripe_customer_id IS NOT NULL
   OR stripe_subscription_id IS NOT NULL;

-- Clear webhook log
DELETE FROM stripe_webhook_log;
```

Admin-granted subscriptions (those with `NULL` Stripe IDs) will be preserved.

---

## Step 4: Deactivate Old Account

In the **old** Stripe Dashboard:

1. Go to **Developers** > **Webhooks** > delete the old endpoint (prevents stale webhook calls)
2. Cancel any active subscriptions if needed (or let them expire)
3. Optionally, restrict the old API key: **Developers** > **API keys** > **Roll key** or delete

---

## Step 5: Verify

### Checklist

- [ ] New Stripe products & prices created
- [ ] Vercel env vars updated and redeployed
- [ ] Webhook endpoint active and receiving events
- [ ] Database cleaned (old Stripe IDs removed)
- [ ] Old webhook endpoint deleted

### Test the Flow

1. **Checkout**: Go to Pricing page > click Subscribe on Basic or Pro > verify Stripe Checkout opens with new account branding
2. **Webhook**: After successful payment, check Supabase `subscriptions` table for the new row with new `stripe_customer_id`
3. **Portal**: Go to Profile > Manage Subscription > verify Stripe Customer Portal opens
4. **Webhook log**: Check `stripe_webhook_log` table for `processed` events
5. **Admin panel**: Verify Users page shows correct subscription badges

### Test Webhook Locally (Optional)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to new Stripe account
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:5173/api/stripe/webhook

# Copy the webhook signing secret from the CLI output
# and use it as STRIPE_WEBHOOK_SECRET in .env.local
```

---

## Files That Reference Stripe

| File | What It Uses |
|------|-------------|
| `apps/quiz-app/api/stripe/create-checkout.js` | `STRIPE_SECRET_KEY`, `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID` |
| `apps/quiz-app/api/stripe/webhook.js` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID` |
| `apps/quiz-app/api/stripe/create-portal.js` | `STRIPE_SECRET_KEY` |
| `apps/quiz-app/src/config/tiers.js` | `VITE_STRIPE_BASIC_PRICE_ID`, `VITE_STRIPE_PRO_PRICE_ID` |

No code changes are needed — only environment variables and Stripe Dashboard configuration.

---

## Quick Reference: All Env Vars

```
STRIPE_SECRET_KEY=sk_live_...          # Server-side API key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret
STRIPE_BASIC_PRICE_ID=price_...        # Basic tier price ID
STRIPE_PRO_PRICE_ID=price_...          # Pro tier price ID
VITE_STRIPE_BASIC_PRICE_ID=price_...   # Client-side Basic price ID
VITE_STRIPE_PRO_PRICE_ID=price_...     # Client-side Pro price ID
```
