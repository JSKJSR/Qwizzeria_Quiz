# Shared Supabase Client Documentation

The `@qwizzeria/supabase-client` package is a centralized data access layer shared across the Qwizzeria monorepo. It abstracts direct Supabase SDK calls and provides a consistent API for authentication, content management, and real-time multiplayer features.

## 📁 Key Modules

### 1. Core (`index.js`)
- Initializes the Supabase client.
- Handles public vs. private client configuration (anon key vs. service role).

### 2. Authentication (`auth.js`)
- **Key Functions**: `signInWithGoogle()`, `signInWithEmail()`, `signOut()`.
- **State Listeners**: `onAuthStateChange()` to handle session persistence.
- **Role Integration**: Fetches current user role and subscription state from `user_profiles`.

### 3. Quiz Content (`packs.js`, `questions.js`)
- **Packs**: CRUD for quiz packs, browsing public content, and fetching showcase packs.
- **Questions**: CRUD for individual questions and bulk operations.
- **Gating**: Implements feature and content gates for premium content.

### 4. Multiplayer & Tournaments (`tournaments.js`, `realtime.js`)
- **Tournaments**: Bracket generation, match results persistence, and champion declaration.
- **Realtime**: Manages Phoenix-style channels for instant bracket updates and match synchronization.
- **Optimistic Locking**: Claims matches to avoid dual-hosting in multi-tab scenarios.

### 5. Social & Competition (`leaderboard.js`, `users.js`)
- **Leaderboards**: Global and per-pack rankings via Postgres RPC calls.
- **User Profiles**: Management of display names, avatars, and admin role assignments.
- **Analytics**: Admin-only RPCs for platform performance and user engagement metrics.

---

## ⚡ Key Postgres RPC APIs

| RPC Name | Purpose |
| :--- | :--- |
| `get_user_stats` | User stats for profile display. |
| `get_global_leaderboard` | Top scoring players platform-wide. |
| `get_admin_analytics` | High-level metrics for the Admin Dashboard. |
| `get_subscription_state` | Single source of truth for gating. |

---

© 2026 Qwizzeria Backend Team.
