# Admin CMS Documentation

The Admin CMS is integrated into the `quiz-app` and is accessible to users with the `editor`, `admin`, or `superadmin` roles. It provides tools for content management, platform analytics, and user oversight.

## 🚀 Access & Security
- **Path**: `/admin` (and sub-routes)
- **Role Enforcement**: 
  - `editor`: Can manage specific questions and packs.
  - `admin`: Full content management and platform analytics.
  - `superadmin`: All permissions plus User Management (role assignment).
- **Security**: Gated by the `ProtectedRoute` and the Two-Gate RBAC model.

---

## 🛠️ Modules

### 1. Dashboard (`/admin`)
- **Purpose**: High-level platform overview.
- **Key Features**:
  - Subscription analytics (trial conversion, active subscribers).
  - Pack performance metrics.
  - Hardest questions identified by accuracy rates.
  - 7-day churn and user engagement stats.

### 2. Question Management (`/admin/questions`)
- **Question List**: Paginated table with filters for category, status, and search.
- **Question Form**: Full CRUD for individual questions, including media URL support and point values.
- **Bulk Import (`/admin/import`)**: High-speed Excel (.xlsx) ingestion for mass question creation.

### 3. Quiz Pack Management (`/admin/packs`)
- **Pack List**: Management of curated quiz collections.
- **Pack Form**: Edit pack metadata (title, category, visibility, premium status).
- **Question Manager**: Dedicated interface to add, remove, and reorder questions within a pack.

### 4. User Management (`/admin/users`)
- **Access**: Restricted to `superadmin`.
- **Purpose**: System-wide user oversight.
- **Features**:
  - List all users with emails and roles.
  - Update user roles (e.g., promote `user` to `premium` or `admin`).
  - Search and filter users by role.

---

## 📂 Component Map (src/pages/admin/)

| Component | Responsibility |
| :--- | :--- |
| `Dashboard.jsx` | Platform-wide analytics and charts. |
| `QuestionList.jsx` | Filterable question bank table. |
| `QuestionForm.jsx` | CRUD interface for a single question. |
| `BulkImport.jsx` | Excel file parsing and bulk DB insertion. |
| `PackList.jsx` | Table of available quiz packs. |
| `PackForm.jsx` | Metadata editor for quiz packs. |
| `PackQuestionsManager.jsx` | Drag-and-drop or checklist for pack contents. |
| `UserList.jsx` | Superadmin interface for role management. |

---

© 2026 Qwizzeria Admin Team.
