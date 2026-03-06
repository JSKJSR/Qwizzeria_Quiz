# Qwizzeria Product Manual

This document provides a comprehensive map of the user flow, product features, and administrative tools for the Qwizzeria WebApp.

---

## 🔄 User Flow Mapping

### 1. Discovery & Entry
- **Anonymous**: Landing Page → Browse Public Packs (Metadata only).
- **Onboarding**: Login/Sign-up via Supabase Auth (Google/Email).
- **Post-Login**: Routes user to `/dashboard` or `/admin` based on role.

### 2. Player Journey
- **Dashboard**: High-level stats, quick-play actions, resumable sessions.
- **Browse Packs**: Filterable grid of curated content (Tier-gated).
- **Play Quiz**:
    - **Jeopardy Grid**: Non-linear topic selection with point values.
    - **Sequential**: Linear question-by-question flow.
- **Results**: Score summary, accuracy percentage, and history persistence.

### 3. Host & Tournament Flow
- **Host Quiz**: Real-time multiplayer sessions (2-8 players/teams) with a dedicated teacher/host view and participant scoring.
- **Real-Time Buzzer System**: Hosts can activate a live buzzer overlay. Participants join via the `/buzzer` route using a generated room code. The system features sub-millisecond precision, sound effects, and a dynamic host overlay to determine who buzzed first.
- **Tournaments**:
    - Auto-generated single-elimination brackets for 2-16 teams.
    - Match play via dedicated URLs.
    - Real-time sync across devices using Supabase Realtime (spectators see live updates).
    - Multi-tab parallel play for simultaneous matches.

---

## 🛠️ Admin CMS

The Admin CMS is integrated into the application and accessible at `/admin` for users with `editor`, `admin`, or `superadmin` roles. 

### Key Modules
1. **Dashboard (`/admin`)**: Subscription analytics (trial conversion, active subscribers), pack performance metrics, and hardest questions.
2. **Question Management (`/admin/questions`)**: 
   - Full CRUD for questions (media URLs, point values). 
   - **Bulk Import (`/admin/import`)**: High-speed Excel (.xlsx) ingestion.
3. **Pack Management (`/admin/packs`)**: Manage curated collections, adjust premium/public visibility, and reorder questions.
4. **User Management (`/admin/users`)**: Restricted to `superadmin`. Lists users and provides the ability to update roles (e.g., promote `user` to `premium` or `admin`).

---

## 💳 Billing & Subscriptions

Qwizzeria implements a 3-tier subscription model powered by Stripe.

- **14-Day Free Trial**: All new users get 14 days of full access.
- **Free**: $0. Access to Daily Free Quiz and Profile/Dashboard.
- **Basic**: ~$5/mo. Adds Pack Library, Play History, and Leaderboards.
- **Pro**: ~$10/mo. Adds Host Quiz (multiplayer) and Tournaments.

*Grace Period*: 3-day access window for `past_due` subscriptions before full gating. Editors/Admins bypass these checks automatically.
