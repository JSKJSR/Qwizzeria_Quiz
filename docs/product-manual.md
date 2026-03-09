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
    - **Host UI Controls**: Features a responsive, hero-sized timer with precise countdown controls.
    - **Scoreboard & Theme**: The host dashboard utilizes a collapsible Scoreboard drawer for better space management and includes a Light/Dark Mode toggle to accommodate different classroom/presentation environments.
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
   - **Bulk Import (`/admin/import`)**: High-speed Excel (.xlsx) ingestion with immediate Pack assignment capabilities.
3. **Pack Management (`/admin/packs`)**: Manage curated collections, adjust premium/public visibility, and reorder questions.
4. **User Management (`/admin/users`)**: Restricted to `superadmin`. Lists users and provides the ability to update roles (e.g., promote `user` to `premium` or `admin`).

---

## 💳 Billing & Subscriptions

Qwizzeria implements a hybrid SaaS and One-Time Purchase model powered by Stripe.

- **3-Day Free Trial**: Short trial with restricted Host mode limits (up to 3 connected players).
- **Free**: $0. Access to Daily Free Quiz and Profile/Dashboard.
- **Player Tier (formerly Basic)**: $3.99/mo. Unlocks the entire Quiz Pack library, History, and Global Leaderboards.
- **Host / Game Master Tier (formerly Pro)**: $12.99/mo. Unlocks local/party Game Hosting, Real-Time Buzzer, and Tournament brackets for up to 16 teams.
- **Game Night Pass**: A $4.99 one-time purchase granting 48-hour access to the Host Tier features, designed for impulse event buyers.
- **Premium Packs Upsell**: Individually branded quiz packs available for $2.99 a la carte.

*Grace Period*: 3-day access window for `past_due` subscriptions before full gating. Editors/Admins bypass these checks automatically.
