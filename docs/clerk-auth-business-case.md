# Business Case: Clerk for Auth & Subscription

## Context

Qwizzeria currently uses **Supabase Auth** for authentication (email/password + Google OAuth) and a **manual DB-backed role system** (`user_profiles.role`) for authorization. There is **no payment integration** — premium roles are assigned manually by a superadmin, and the only payment path is an external Patreon link. This document evaluates whether adopting Clerk is the right move.

---

## Current State

| Capability | Status |
|------------|--------|
| Email/password sign-up/sign-in | Supabase Auth |
| Google OAuth | Supabase Auth |
| Session management | localStorage + auto-refresh tokens |
| Role system | DB column `user_profiles.role` (user/premium/editor/admin/superadmin) |
| Premium gating | App-layer checks (`isPremium` from DB role) |
| Payment/subscription | None — manual Patreon link, superadmin assigns premium role |
| Two-factor auth | Not available |
| User management UI | Custom-built admin pages |
| RLS security | `auth.uid()` + Postgres helper functions (`is_admin()`, `get_role()`) |

---

## Case FOR Adopting Clerk

### 1. Subscription & Payment Readiness

Clerk integrates natively with **Stripe** and **Paddle**. This solves the biggest gap in the current system:

- **Automated premium provisioning** — User pays → Stripe webhook → Clerk metadata updated → role synced to DB → premium access unlocked. No manual superadmin intervention.
- **Self-service billing portal** — Users manage their own subscription (upgrade, downgrade, cancel, update payment method).
- **Revenue tracking** — Stripe dashboard provides MRR, churn, payment analytics out of the box.

**Impact:** Eliminates the current manual workflow where a superadmin has to verify Patreon patronage and manually update `user_profiles.role`.

### 2. Auth UX Improvements

| Feature | Current (Supabase) | With Clerk |
|---------|-------------------|------------|
| OAuth providers | Google only | Google, GitHub, Apple, Discord, Microsoft, LinkedIn, Twitter, and more |
| Pre-built UI components | None (custom forms) | `<SignIn>`, `<SignUp>`, `<UserProfile>` drop-in components |
| Social account linking | Not supported | Built-in — users can link multiple OAuth accounts |
| Two-factor auth (2FA) | Not available | Built-in TOTP + SMS |
| Session security | JWT in localStorage (XSS-vulnerable) | HTTP-only secure cookies |
| Magic links | Not implemented | Built-in |
| Passkeys/WebAuthn | Not available | Built-in |

**Impact:** Better sign-up conversion (more OAuth options, magic links), stronger security (HTTP-only cookies, 2FA), less custom code to maintain.

### 3. User Management Dashboard

Clerk provides an admin dashboard for:
- Viewing/searching all users
- Assigning roles and metadata
- Banning/suspending users
- Viewing session activity
- Impersonating users for debugging

**Impact:** Reduces the need for custom admin UI for user management. The existing superadmin user management page could be simplified or removed.

### 4. Developer Experience

- **Maintained auth infrastructure** — Security patches, OAuth provider changes, and compliance updates handled by Clerk's team.
- **React hooks** — `useUser()`, `useAuth()`, `useOrganization()` replace custom AuthProvider logic.
- **Webhook-driven architecture** — Clean integration pattern for syncing user data to Supabase.

---

## Case AGAINST Adopting Clerk

### 1. Cost

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0/month | Up to 10,000 MAU |
| Pro | $25/month + $0.02/MAU beyond 10K | All features, custom domains |
| Enterprise | Custom | SLA, dedicated support |

**Current Supabase Auth cost:** $0 (included in Supabase free/pro tier).

**Risk:** For a quiz app that may have seasonal spikes (quiz events, tournaments), per-MAU pricing could become unpredictable. At 50K MAU, Clerk Pro costs ~$825/month just for auth.

### 2. Significant Migration Effort

The current system has deep Supabase Auth integration:

- **RLS policies** — 15+ policies use `auth.uid()` via Supabase's built-in JWT parsing. With Clerk, Supabase needs a custom JWT template from Clerk. This requires:
  - Configuring Clerk to issue Supabase-compatible JWTs
  - Updating Supabase client to pass Clerk's session token
  - Verifying all RLS policies still resolve `auth.uid()` correctly

- **Helper functions** — `get_role()`, `is_admin()`, `has_feature_access()`, `has_content_permission()` all query `user_profiles` keyed by `auth.uid()`. These need the Clerk user ID to match Supabase's `auth.uid()`.

- **Session recovery** — AuthProvider's `onAuthStateChange()` listener, OAuth hash redirect handling, and 3-second timeout fallback would all need rewriting.

- **Two apps** — Both `quiz-app` and `admin-cms` use the same AuthProvider pattern. Both need migration.

**Estimated effort:** 2-3 weeks for a clean migration with thorough testing of all RLS paths.

### 3. Vendor Lock-in

- Supabase Auth is open-source (GoTrue). Self-hostable if needed.
- Clerk is proprietary SaaS. If Clerk changes pricing, deprecates features, or shuts down, migration is forced.
- Auth is a foundational dependency — switching later is expensive.

### 4. Added Complexity

- **Two auth systems to coordinate** — Clerk handles authentication, but Supabase still needs to authorize DB access. This means syncing Clerk users to Supabase via webhooks and configuring Clerk as a custom JWT issuer for Supabase.
- **Webhook reliability** — If the Clerk→Supabase user sync webhook fails, a user could authenticate but have no `user_profiles` row, breaking role checks and RLS.
- **Debugging** — Auth issues now span two systems instead of one. "Why can't this user access premium packs?" could be a Clerk JWT issue, a webhook sync issue, or a Supabase RLS issue.

### 5. Supabase Auth Is Already Sufficient

The current auth system works. The actual gaps are:

| Gap | Clerk solves it? | Simpler alternative |
|-----|-----------------|---------------------|
| No payment integration | Indirectly (pairs with Stripe) | Add Stripe directly to Supabase (webhook → `user_profiles.role` update) |
| Only Google OAuth | Yes (10+ providers) | Add more providers in Supabase Auth dashboard (supports GitHub, Apple, Discord, etc.) |
| No 2FA | Yes | Supabase Auth supports TOTP 2FA (needs enabling) |
| Manual premium assignment | Indirectly | Stripe webhook → update `user_profiles.role` directly |
| localStorage tokens | Yes (HTTP-only cookies) | Configure Supabase Auth for PKCE flow with server-side token handling |

**Key insight:** The actual business need is **payment integration**, not auth replacement. Stripe can be added to the existing Supabase stack without Clerk.

---

## Recommendation

### For a Quiz App at Current Scale: Stay with Supabase Auth + Add Stripe Directly

**Rationale:**
1. The auth system works and is tightly integrated with RLS. Migration effort is high for marginal auth improvements.
2. The real gap is **payment automation**, which Stripe solves directly — no Clerk needed.
3. Zero additional monthly cost for auth (Supabase Auth is included).
4. Adding more OAuth providers (GitHub, Discord, Apple) is a config change in Supabase dashboard, not a code change.

**Recommended path:**
1. Add Stripe Checkout + Customer Portal
2. Create a Stripe webhook endpoint that updates `user_profiles.role` to `premium` on successful subscription
3. Downgrade role on subscription cancellation/failure
4. Keep Supabase Auth for everything else

### When Clerk Becomes Worth It

Consider Clerk if:
- **User base exceeds 10K MAU** and you need enterprise auth features (SSO, organizations, advanced session management)
- **Multi-tenant/organization features** are needed (e.g., school districts running their own quiz instances)
- **You're rebuilding the app** from scratch and want to reduce custom auth code from day one
- **Compliance requirements** (SOC 2, GDPR DPA) make a managed auth provider preferable

---

## Cost Comparison (12-Month Projection)

| Scenario | Supabase Auth + Stripe | Clerk Pro + Stripe |
|----------|----------------------|-------------------|
| 1K MAU | $0 auth + $0 Stripe (until revenue) | $25/mo auth = **$300/yr** |
| 10K MAU | $0 auth | $25/mo = **$300/yr** |
| 25K MAU | $0 auth | $25 + (15K × $0.02) = **$325/mo = $3,900/yr** |
| 50K MAU | $0 auth | $25 + (40K × $0.02) = **$825/mo = $9,900/yr** |

Stripe fees (2.9% + 30¢ per transaction) apply equally in both scenarios.

---

## Summary

| Factor | Supabase Auth (Keep) | Clerk (Switch) |
|--------|---------------------|----------------|
| Migration effort | None | 2-3 weeks |
| Monthly cost | $0 | $25-$825+/mo |
| Payment integration | Add Stripe directly | Add Stripe via Clerk |
| RLS compatibility | Native | Requires JWT template config |
| OAuth providers | Add via dashboard | Built-in (10+) |
| 2FA | Enable in Supabase | Built-in |
| Vendor lock-in | Open-source (GoTrue) | Proprietary SaaS |
| Pre-built UI | None (custom) | Drop-in components |
| User management | Custom admin pages | Clerk dashboard |
| Best for | Current scale, cost-sensitive | Enterprise, multi-tenant, rapid prototyping |
