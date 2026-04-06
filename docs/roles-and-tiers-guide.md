# Qwizzeria Roles & Pricing Tiers — Sales & Marketing Guide

This document explains how user roles and subscription tiers work in Qwizzeria. It is written for non-technical team members who need to understand what each customer can access, how to talk about plans, and how internal staff access works.

---

## Part 1: Subscription Tiers (What Customers See)

Every user in Qwizzeria belongs to one of three pricing tiers. The tier determines which features they can use.

### The Three Tiers

| | **Free** | **Basic** | **Pro** |
|---|---|---|---|
| **Price** | $0 | $9.99/month | $19.99/month |
| **How to get it** | Default after trial expires | Subscribe via Pricing page | Subscribe via Pricing page |

### What Each Tier Includes

| Feature | Free | Basic | Pro |
|---|:---:|:---:|:---:|
| Free Quiz (public, no login needed) | Yes | Yes | Yes |
| Dashboard | Yes | Yes | Yes |
| Profile & How to Play Guide | Yes | Yes | Yes |
| Pricing Page | Yes | Yes | Yes |
| Daily Missions & XP Progression | Yes | Yes | Yes |
| Leagues (weekly XP competition) | Yes | Yes | Yes |
| Browse & Play Quiz Packs | - | Yes | Yes |
| Quiz History | - | Yes | Yes |
| Global Leaderboard | - | Yes | Yes |
| Resume Saved Sessions | - | Yes | Yes |
| Streak Freezes | - | 3/month | Unlimited |
| Doubles | - | - | Yes |
| Host Quiz (multiplayer, 2-8 players) | - | - | Yes |
| Tournaments (elimination brackets) | - | - | Yes |
| AI Quiz Generation (any topic) | - | - | Yes |
| Buzzer Rooms (real-time) | - | - | Yes |
| Export Results (CSV & PDF) | - | - | Yes |
| Certificates (top 3 finishers) | - | - | Yes |

### Key Talking Points

- **Free tier** is not empty — the Free Quiz is a fully functional, unlimited quiz experience with random questions across all categories. It includes a full Gamification engine (XP, Levels, Badges, Daily Streaks, Daily Missions, and Leagues) to encourage daily engagement and account creation. It is the hook that gets people through the door.
- **Basic tier** is for individual players who want a structured experience — curated packs, leaderboard competition, the ability to track progress over time, and 3 Streak Freezes per month to protect their daily streak.
- **Pro tier** is for quiz hosts, educators, and event organizers who need multiplayer, AI generation, buzzer rooms, export capabilities, and unlimited Streak Freezes.

---

## Part 2: The 14-Day Free Trial

Every new user automatically gets **14 days of full Pro access** the moment they sign up.

### How It Works

1. User creates an account (email or Google sign-in).
2. They immediately have access to every feature — hosting, AI generation, buzzer, tournaments, everything.
3. A countdown appears in the sidebar showing days remaining.
4. No credit card is required. There is no commitment.
5. After 14 days, they drop to the Free tier unless they subscribe.

### What Happens When the Trial Ends

- Features above their tier are locked with an upgrade prompt.
- They keep full access to the Free Quiz and dashboard.
- Any quiz sessions they started can no longer be resumed (Resume is a Basic feature).
- They can subscribe at any time from the Pricing page to restore access instantly.

### Sales Tips

- "Try everything free for 14 days" is the primary call to action.
- Users who host quizzes during the trial are the strongest conversion candidates — follow up on Day 10-12.
- The sidebar countdown creates natural urgency without feeling aggressive.

---

## Part 3: Subscription Lifecycle

### How Someone Subscribes

1. User visits the Pricing page (accessible from the sidebar or upgrade prompts).
2. They click "Subscribe" on the Basic or Pro card.
3. They are redirected to a Stripe checkout page to enter payment details.
4. After payment, they are returned to the dashboard with a confirmation banner.
5. Their new tier is active immediately.

### Managing a Subscription

- Users manage their subscription from the Profile page ("Manage Subscription" button).
- This opens the Stripe billing portal where they can:
  - Switch between Basic and Pro
  - Update payment method
  - Cancel their subscription
- Cancellation takes effect at the end of the billing period — they keep access until then.

### Subscription Statuses You May See

| Status | What It Means | What the User Sees |
|---|---|---|
| **Trialing** | Within the 14-day free trial | Full Pro access, countdown in sidebar |
| **Active** | Paying subscriber | Full access to their tier's features |
| **Past Due** | Payment failed | Warning in sidebar, prompted to update payment |
| **Canceled** | Canceled but period not over | Access continues until period end, then drops to Free |
| **Expired** | Trial ended, no subscription | Free tier only, upgrade prompts on locked features |

---

## Part 4: Staff Roles (Internal Access)

Separate from pricing tiers, Qwizzeria has an internal role system for team members. Roles control access to the admin panel and content management — they are not visible to regular customers.

### The Four Roles

| Role | Who Gets It | What They Can Do |
|---|---|---|
| **User** | Every customer | Play quizzes, browse packs, use features within their tier |
| **Editor** | Content creators | Everything a User can do + access the Admin CMS to create and edit questions and packs they've been granted access to |
| **Admin** | Team leads | Everything an Editor can do + view all content (including drafts), analytics dashboard, bulk import, subscription analytics |
| **Superadmin** | Platform owner(s) | Everything an Admin can do + assign roles to other users, manage access grants |

### How Roles Relate to Tiers

**Staff roles bypass all subscription tiers.** If someone has the Editor, Admin, or Superadmin role, they automatically get full Pro access at no charge. They never see trial banners, upgrade prompts, or tier gates.

This means:
- You do not need to give staff members a paid subscription.
- Changing someone's role to Editor or above immediately unlocks everything.
- If you remove their staff role (set back to User), they fall back to whatever subscription they have (or Free if none).

### How to Assign a Role

1. A Superadmin logs in and goes to **Admin > Users**.
2. Find the person by name or email.
3. Click the actions menu (three dots) > "Change Role".
4. Select the new role from the dropdown and click Save.
5. A confirmation dialog shows the change before it takes effect.

### Role Assignment Guidelines

| Scenario | Recommended Role |
|---|---|
| Content writer who creates quiz questions | **Editor** |
| Team member who needs analytics and full content access | **Admin** |
| The person who manages the platform and assigns roles | **Superadmin** |
| A paying customer | **User** (their subscription handles access) |
| A reviewer or beta tester | **Editor** (gives full access without a subscription) |

---

## Part 5: Common Sales Scenarios

### "Can they try before they buy?"
Yes. Every new account gets 14 days of full Pro access. No credit card. No setup. Just sign up and go.

### "What happens if they cancel?"
They keep access until the end of their billing period. After that, they drop to Free tier. Their data (quiz history, profile) is preserved — they just cannot access tier-locked features.

### "Can we give someone free Pro access?"
Yes, two ways:
1. **Staff role** — change their role to Editor or above in Admin > Users. They get unlimited Pro access.
2. **Stripe coupon** — create a 100% discount coupon in the Stripe Dashboard and share the checkout link (future feature).

### "What's the difference between Basic and Pro?"
Basic is for **playing** — browse packs, compete on leaderboards, track history. Pro is for **hosting** — run live multiplayer quizzes, generate AI packs, use buzzer rooms, run tournaments, export results.

### "Can a Free user do anything useful?"
Absolutely. The Free Quiz is unlimited, pulls random questions from the full database, and works without even logging in. It is a complete product on its own — the paid tiers add structure, competition, and multiplayer.

### "How many people can be on one subscription?"
Each subscription is per-user. For team or classroom pricing, contact us for bulk plans (future feature). In the meantime, a Pro host can run quizzes with up to 8 participants — participants only need to be logged in, they do not need their own Pro subscription to join a hosted quiz or buzzer room.

---

## Part 6: Quick Reference Card

### For Customers
| I want to... | I need... |
|---|---|
| Try Qwizzeria | Just sign up (14 days free) |
| Play a quick quiz | Nothing (Free Quiz is public) |
| Earn XP and join leagues | Nothing (Free tier includes full gamification) |
| Play curated quiz packs | Basic ($9.99/mo) |
| Track my scores and compete | Basic ($9.99/mo) |
| Protect my streak if I miss a day | Basic ($9.99/mo) — 3 freezes/month |
| Play Doubles quiz | Pro ($19.99/mo) |
| Host a live quiz for my team | Pro ($19.99/mo) |
| Generate quizzes with AI | Pro ($19.99/mo) |
| Run a tournament bracket | Pro ($19.99/mo) |
| Use the real-time buzzer | Pro ($19.99/mo) |

### For Internal Team
| I want to... | I need... |
|---|---|
| Create quiz content | Editor role (ask a Superadmin) |
| View analytics and manage content | Admin role |
| Assign roles to team members | Superadmin role |
| Give a customer free access | Set them to Editor role, or share a Stripe coupon |
