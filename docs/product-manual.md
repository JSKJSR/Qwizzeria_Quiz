# Qwizzeria Product Manual

This document provides a comprehensive map of the user flow, product features, and administrative tools for the Qwizzeria WebApp.

---

## 🔄 User Flow Mapping

### 1. Discovery & Entry
- **Anonymous**: Landing Page → Browse Public Packs (Metadata only).
- **Onboarding**: Login/Sign-up via Supabase Auth. All new accounts start with a **14-day Free Trial**.
- **Post-Login**: Routes user to `/dashboard` or `/admin` based on role.

### 2. Player Journey
- **Dashboard**: High-level stats, quick-play actions, and **Trial Status Widget**.
- **Browse Packs**: Filterable grid of curated content (Requires Basic tier or Trial).
- **Play Quiz**:
    - **Jeopardy Grid**: Non-linear topic selection with point values.
    - **Sequential**: Linear question-by-question flow.
- **Results**: Score summary, accuracy percentage, and history persistence.

### 3. Host & Tournament Flow
- **Host Quiz**: Real-time multiplayer sessions (2-8 players/teams) with a dedicated host view.
- **Real-Time Buzzer**: Hosts can activate a live buzzer overlay. Participants join via `/buzz/:roomCode`. Sub-millisecond precision.
- **Tournaments**:
    - Auto-generated single-elimination brackets for 2-16 teams.
    - **Per-Match Pack Selection**: Host can select a different quiz pack for every match in the bracket.
    - Real-time sync across devices; spectators see live bracket updates.

---

## 🛠️ Admin CMS

Integrated into the application at `/admin` for users with `editor`, `admin`, or `superadmin` roles.

### Key Modules
1. **Dashboard (`/admin`)**: Subscription analytics (trial conversion, active subscribers), pack performance, and platform health.
2. **Content Management (`/admin/questions`, `/admin/packs`)**: 
   - Full CRUD for questions and quiz packs.
   - **Bulk Import**: Excel (.xlsx) ingestion for mass content updates.
3. **User Management (`/admin/users`)**: Restricted to `superadmin`. Lists users and provides role/tier management.

---

## 💳 Billing & Subscriptions

Qwizzeria offers a transparent subscription model powered by Stripe.

- **14-Day Free Trial**: All features unlocked (Pro tier access) for the first 14 days after registration.
- **Free**: $0. Access to Daily Free Quiz and Profile.
- **Basic**: $3.99/mo. Unlocks all Quiz Packs, Play History, and Global Leaderboards.
- **Pro**: $12.99/mo. Unlocks Host Mode, Real-Time Buzzer, and Tournament brackets.

*Note: Administrative roles (Editor+) bypass subscription checks automatically.*
