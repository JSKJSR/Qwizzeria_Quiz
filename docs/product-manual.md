# Qwizzeria Product Manual

This document provides a comprehensive map of the user flow, product features, and administrative tools for the Qwizzeria WebApp.

---

## 🔄 User Flow Mapping

### 1. Discovery & Entry
- **Anonymous**: Landing Page → Browse Public Packs (Metadata only).
- **Onboarding**: Login/Sign-up via Supabase Auth (Google/Email).
- **Post-Login**: Routes user to `/dashboard` or `/admin` based on role.

### 2. Player Journey
- **Dashboard**: High-level stats, quick-play actions, resumable sessions, league badge and weekly XP, and daily mission progress.
  - **Gamification Summary**: Displays current XP level, title, progress bar, daily streak count, and streak freeze credits.
  - **Daily Missions**: A set of daily objectives (e.g., play 3 quizzes, earn 50 XP, answer 10 correctly) with progress bars. Completing all missions earns a bonus XP reward.
  - **League Badge**: Shows the user's current league (e.g., Bronze, Silver, Gold) and weekly XP earned within that league.
- **Browse Packs**: Filterable grid of curated content (Tier-gated).
- **Play Quiz**:
    - **Free Quiz**: Free-to-play random questions featuring Duolingo-style text input with fuzzy matching. Includes a full progression system (XP, Levels, Badges, Daily Streaks) that syncs to user profiles.
    - **Jeopardy Grid**: Non-linear topic selection with point values.
    - **Sequential**: Linear question-by-question flow with a countdown ring timer per question.
- **Results**: Score summary, accuracy percentage, and history persistence.

### 3. Host & Tournament Flow
- **Host Quiz**: Real-time multiplayer sessions (2-8 players/teams) with a dedicated teacher/host view and participant scoring.
    - **Host UI Controls**: Features a responsive, hero-sized timer with precise countdown controls.
    - **Scoreboard & Theme**: The host dashboard utilizes a collapsible Scoreboard drawer for better space management and includes a Light/Dark Mode toggle to accommodate different classroom/presentation environments.
    - **Mid-Quiz Score Publishing**: The host can click "Publish" in the scoreboard to broadcast current standings to all connected participant devices. Participants see a ranked leaderboard overlay that auto-dismisses after 5 seconds (or tap to close).
    - **Export Results**: At the end of a quiz, hosts can export results as CSV or print as PDF. Download certificates (PNG) for the top 3 finishers with Qwizzeria branding, participant name, rank, score, and quiz title.
- **Real-Time Buzzer System**: Hosts can activate a live buzzer overlay. Participants join via the `/buzzer` route using a generated room code. The system features sub-millisecond precision, sound effects, and a dynamic host overlay to determine who buzzed first.
    - **Mode Selector**: When a question is selected, the host sees two distinct mode cards — "Buzzer" (speed-based) and "Collect Answers" (text input) — replacing the old side-by-side buttons. A participant readiness badge shows the number of connected participants with a yellow warning when zero are connected.
    - **Auto-Open Answer Summary**: When the timer expires during input collection, answers are automatically locked and the responses modal opens — no manual click required.
    - **Participant Timer Sync**: During input collection, participants see a live MM:SS countdown on their device that matches the host timer, with color states (green > 30s, yellow ≤ 30s, red ≤ 10s).
    - **Session Persistence**: Buzzer room state (room code and ID) is persisted locally. If a host accidentally refreshes or navigates away during an active buzzer session, they are prompted to restore it upon returning, automatically reconnecting players seamlessly.
- **AI Quiz Generation**: Professional hosts can generate custom quiz packs on any topic instantly.
    - **Workflow**: Enter a topic/prompt -> Preview generated questions -> Edit or delete individual questions -> "Use Without Saving" for one-off events or "Save & Use" to persist the pack to the database.
    - **Customization**: Supports question count and difficulty levels (accessible to Admins).
- **Tournaments**:
- **Auto-generated single-elimination brackets for 2-16 teams.**
- **Match play via dedicated URLs.**
- **Real-time sync across devices using Supabase Realtime (spectators see live updates).**
- **Multi-tab parallel play for simultaneous matches.**

### 4. Help & Guidance
- **How to Play Guide (`/guide`)**: Interactive, visual step-by-step guide for hosting, buzzer mode, and tournaments. Features live-animated SVG visuals to demonstrate complex flows like reaction-time buzzing and bracket advancement.

---

## 🛠️ Admin CMS

The Admin CMS is integrated into the application and accessible at `/admin` for users with `editor`, `admin`, or `superadmin` roles. 

### Key Modules
1. **Dashboard (`/admin`)**: Subscription analytics (trial conversion, active subscribers), pack performance metrics, and hardest questions.
2. **Question Management (`/admin/questions`)**: 
   - Full CRUD for questions (media URLs, point values). 
   - **Bulk Import (`/admin/import`)**: High-speed Excel (.xlsx) ingestion with immediate Pack assignment capabilities.
3. **Pack Management (`/admin/packs`)**: Manage curated collections, adjust premium/public visibility, set optional expiration dates, and reorder questions. Expired packs are automatically hidden from players but remain visible to admins.
4. **Doubles Sessions (`/admin/doubles`)**: Browse all Doubles quiz sessions with status filters and pagination. Admins can open the **grading modal** to manually mark each player answer as correct or incorrect, with grades persisted to `metadata.grades`.
5. **User Management (`/admin/users`)**: Restricted to `superadmin`. Lists users and provides the ability to update roles (e.g., promote `user` to `admin`) and directly change a user's subscription tier (Free/Basic/Pro) via the tier badge modal.

---

## 💳 Billing & Subscriptions

Qwizzeria implements a hybrid SaaS and One-Time Purchase model powered by Stripe.

- **14-Day Free Trial**: Full access to all features (including AI generation) for 14 days upon sign up.
- **Free**: $0. Access to Free Quiz (with XP/Level/Badge/Streak progression + Daily Missions + Leagues), Dashboard, Profile, and Guide.
- **Basic Tier**: $9.99/mo. Unlocks the entire Quiz Pack library, History, Global Leaderboards, Resume Sessions, and 3 Streak Freezes per month.
- **Pro Tier**: $19.99/mo. Unlocks local/party Game Hosting, Doubles Quiz, AI Quiz Generation (Claude 3.5), Real-Time Buzzer, Tournament brackets, Export Results, Certificates, and unlimited Streak Freezes.

*Grace Period*: Access window for `past_due` subscriptions before full gating. Editors/Admins bypass these checks automatically.
