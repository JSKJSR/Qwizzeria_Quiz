import { useAuth } from '../../hooks/useAuth';
import { TIERS } from '../../config/tiers';
import '../../styles/RolesAndTiersGuide.css';

const CHECK = '\u2713';
const CROSS = '\u2013';

function SectionCard({ number, title, children }) {
  return (
    <section className="rtg-section">
      <h2 className="rtg-section__title">
        <span className="rtg-section__number">{number}</span>
        {title}
      </h2>
      <div className="rtg-section__body">{children}</div>
    </section>
  );
}

function RoleBadge({ role }) {
  return <span className={`badge badge--${role}`}>{role}</span>;
}

function TierBadge({ tier }) {
  return <span className={`rtg-tier-badge rtg-tier-badge--${tier}`}>{tier}</span>;
}

function StatusBadge({ status }) {
  const colors = {
    trialing: 'orange',
    active: 'green',
    past_due: 'yellow',
    canceled: 'red',
    expired: 'muted',
    staff: 'green',
  };
  return <span className={`rtg-status-badge rtg-status-badge--${colors[status] || 'muted'}`}>{status}</span>;
}

export default function AdminOpsManual() {
  const { role } = useAuth();

  return (
    <div className="rtg">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1>Admin Operations Manual</h1>
          <span className="page-header__subtitle">
            Comprehensive guide for managing the Qwizzeria platform (your role: <RoleBadge role={role || 'user'} />)
          </span>
        </div>
      </div>

      {/* Section 1 — Access Matrix */}
      <SectionCard number={1} title="Role Access Matrix">
        <p className="rtg-intro">
          Four roles control who can do what. Staff roles (<strong>editor</strong>+) automatically bypass all subscription tier gates.
        </p>

        <table className="rtg-table">
          <thead>
            <tr>
              <th>Capability</th>
              <th>User</th>
              <th>Editor</th>
              <th>Admin</th>
              <th>Superadmin</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Access Admin Panel', false, true, true, true],
              ['Create / Edit Questions', false, 'granted', true, true],
              ['Delete Questions', false, false, true, true],
              ['Create / Edit Packs', false, 'granted', true, true],
              ['Delete Packs', false, false, true, true],
              ['Manage Pack Questions', false, 'granted', true, true],
              ['Bulk Import Questions', false, true, true, true],
              ['View Dashboard Analytics', false, false, true, true],
              ['View Subscription Analytics', false, false, true, true],
              ['View Pack Performance', false, false, true, true],
              ['View Hardest Questions', false, false, true, true],
              ['List All Users', false, false, true, true],
              ['Export Users CSV', false, false, true, true],
              ['Change User Roles', false, false, false, true],
              ['Bypass Subscription Tiers', false, true, true, true],
            ].map(([capability, user, editor, admin, superadmin]) => (
              <tr key={capability}>
                <td>{capability}</td>
                <td className={user ? 'rtg-check' : 'rtg-cross'}>{user ? CHECK : CROSS}</td>
                <td className={editor ? 'rtg-check' : 'rtg-cross'}>
                  {editor === 'granted' ? 'Granted*' : editor ? CHECK : CROSS}
                </td>
                <td className={admin ? 'rtg-check' : 'rtg-cross'}>{admin ? CHECK : CROSS}</td>
                <td className={superadmin ? 'rtg-check' : 'rtg-cross'}>{superadmin ? CHECK : CROSS}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rtg-callout">
          <strong>* Granted</strong> means editors require explicit <code>content_permissions</code> grants for specific packs or categories. Without a grant, editors cannot see or edit that content.
        </div>
      </SectionCard>

      {/* Section 2 — Admin Panel Navigation */}
      <SectionCard number={2} title="Admin Panel Navigation">
        <p className="rtg-intro">
          The Admin Panel is accessible from the quiz app sidebar (visible only to staff roles). Each page has its own role requirement.
        </p>

        <table className="rtg-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Route</th>
              <th>Required Role</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Dashboard</strong></td>
              <td><code>/admin</code></td>
              <td>admin+</td>
              <td>Platform analytics, question stats, pack performance</td>
            </tr>
            <tr>
              <td><strong>Questions</strong></td>
              <td><code>/admin/questions</code></td>
              <td>editor+</td>
              <td>Question list with filters, create/edit/delete</td>
            </tr>
            <tr>
              <td><strong>Bulk Import</strong></td>
              <td><code>/admin/import</code></td>
              <td>admin+</td>
              <td>Excel file upload for batch question creation</td>
            </tr>
            <tr>
              <td><strong>Quiz Packs</strong></td>
              <td><code>/admin/packs</code></td>
              <td>editor+</td>
              <td>Pack list, create/edit packs, manage questions</td>
            </tr>
            <tr>
              <td><strong>Users</strong></td>
              <td><code>/admin/users</code></td>
              <td>superadmin</td>
              <td>User list, KPIs, role assignment</td>
            </tr>
            <tr>
              <td><strong>Roles &amp; Tiers</strong></td>
              <td><code>/admin/guide</code></td>
              <td>editor+</td>
              <td>Sales/marketing reference for roles and pricing</td>
            </tr>
            <tr>
              <td><strong>Ops Manual</strong></td>
              <td><code>/admin/ops</code></td>
              <td>admin+</td>
              <td>This page &mdash; comprehensive admin operations guide</td>
            </tr>
            <tr>
              <td><strong>AI Generate</strong></td>
              <td><code>/host</code> (Host Mode)</td>
              <td>Pro / staff</td>
              <td>AI quiz pack generation (Claude 3.5 Sonnet)</td>
            </tr>
          </tbody>
        </table>
      </SectionCard>

      {/* Section 3 — Dashboard & Analytics */}
      <SectionCard number={3} title="Dashboard & Analytics">
        <p className="rtg-intro">
          The Admin Dashboard (<code>/admin</code>) provides platform-wide metrics. Only accessible to <strong>admin</strong>+ roles.
        </p>

        <h3 className="rtg-h3">Question Stats</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Metric</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>Total Questions</td><td>Count of all questions in the database</td></tr>
            <tr><td>Active Questions</td><td>Questions with status &ldquo;active&rdquo;</td></tr>
            <tr><td>Draft Questions</td><td>Questions with status &ldquo;draft&rdquo;</td></tr>
            <tr><td>Categories</td><td>Distinct category count</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Platform Analytics</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Metric</th><th>Description</th><th>Source</th></tr>
          </thead>
          <tbody>
            <tr><td>Total Users</td><td>All registered users</td><td><code>get_admin_analytics()</code></td></tr>
            <tr><td>Total Sessions</td><td>Completed quiz sessions</td><td><code>get_admin_analytics()</code></td></tr>
            <tr><td>Avg Score</td><td>Average score across all completed sessions</td><td><code>get_admin_analytics()</code></td></tr>
            <tr><td>Active Users (7d)</td><td>Distinct users active in last 7 days</td><td><code>get_admin_analytics()</code></td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Subscription Analytics</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Metric</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>Trialing</td><td>Users currently in 14-day free trial</td></tr>
            <tr><td>Active (Basic)</td><td>Paying Basic subscribers</td></tr>
            <tr><td>Active (Pro)</td><td>Paying Pro subscribers</td></tr>
            <tr><td>Conversion Rate</td><td>Trial-to-paid conversion percentage</td></tr>
            <tr><td>Canceled</td><td>Canceled subscriptions</td></tr>
            <tr><td>Expired Trials</td><td>Trials that ended without conversion</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Pack Performance &amp; Hardest Questions</h3>
        <ul className="rtg-list">
          <li><strong>Pack Performance</strong> &mdash; table of all packs ranked by play count, showing avg score and completion rate</li>
          <li><strong>Hardest Questions</strong> &mdash; top 10 lowest-accuracy questions (minimum 3 attempts to qualify)</li>
        </ul>
      </SectionCard>

      {/* Section 4 — Question Management */}
      <SectionCard number={4} title="Question Management">
        <p className="rtg-intro">
          Create, edit, delete, and export questions. Editors can manage questions in categories they have been granted access to. Admins have full access.
        </p>

        <h3 className="rtg-h3">Creating a Question</h3>
        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span>Navigate to <strong>Questions &gt; New Question</strong></span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span>Fill in required fields: <strong>Question Text</strong> and <strong>Answer Text</strong></span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span>Set optional fields: category, sub-category, display title, points, media URL, tags, explanation</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span>Set status to <strong>draft</strong> for review, or <strong>active</strong> to publish immediately</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">5</span>
            <span>Click <strong>Save</strong> &mdash; redirects to question list with success banner</span>
          </div>
        </div>

        <h3 className="rtg-h3">Question Fields</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Field</th><th>Required</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>question_text</td><td>Yes</td><td>The question displayed to players</td></tr>
            <tr><td>answer_text</td><td>Yes</td><td>The correct answer</td></tr>
            <tr><td>answer_explanation</td><td>No</td><td>Additional context shown after answering</td></tr>
            <tr><td>category</td><td>No</td><td>Category name (validated against standard list)</td></tr>
            <tr><td>sub_category</td><td>No</td><td>Sub-category (depends on category)</td></tr>
            <tr><td>display_title</td><td>No</td><td>Custom card label (overrides category on grid)</td></tr>
            <tr><td>points</td><td>No</td><td>Point value (auto-assigned if empty)</td></tr>
            <tr><td>media_url</td><td>No</td><td>Image or video URL</td></tr>
            <tr><td>tags</td><td>No</td><td>Comma-separated tags for filtering</td></tr>
            <tr><td>status</td><td>Yes</td><td>active / draft / archived</td></tr>
            <tr><td>is_public</td><td>Yes</td><td>Visible to non-admin users</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Filtering &amp; Export</h3>
        <ul className="rtg-list">
          <li>Filter by <strong>category</strong>, <strong>status</strong>, <strong>text search</strong>, or <strong>tag</strong></li>
          <li>Paginated at 20 per page</li>
          <li><strong>Export All</strong> &mdash; CSV of all questions matching current filters</li>
          <li><strong>Export Selected</strong> &mdash; CSV of checked rows only</li>
        </ul>

        <div className="rtg-callout rtg-callout--important">
          <strong>Deleting a question is permanent.</strong> Only admin+ can delete. Deletion also removes the question from any pack associations.
        </div>
      </SectionCard>

      {/* Section 5 — Pack Management */}
      <SectionCard number={5} title="Quiz Pack Management">
        <p className="rtg-intro">
          Packs are curated sets of questions. Create packs, assign questions, and publish them for players to discover.
        </p>

        <h3 className="rtg-h3">Pack Publication Lifecycle</h3>
        <p className="rtg-intro">
          Packs can be created manually via the CMS, uploaded via Bulk Import, or <strong>generated with AI</strong> (Pro feature).
        </p>

        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span><strong>Create</strong> a pack (defaults: <code>status=draft</code>, <code>is_public=false</code>)</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span><strong>Add questions</strong> via the Pack Questions Manager</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span><strong>Edit</strong> the pack: set <code>status=active</code> to publish</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span>Set <code>is_public=true</code> for it to appear in browse/carousel</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">5</span>
            <span><strong>Optionally</strong> set an <code>expires_at</code> date &mdash; pack auto-hides after this date</span>
          </div>
        </div>

        <div className="rtg-callout rtg-callout--important">
          <strong>Visibility rules:</strong> A pack must have <code>status=active</code> AND <code>is_public=true</code> AND not be expired to be visible to players. Missing any condition means the pack stays hidden. Expired packs show a red &ldquo;Expired&rdquo; badge in the admin pack list. To re-enable an expired pack, edit it and set a new future expiration date or clear the field entirely.
        </div>

        <h3 className="rtg-h3">Pack Fields</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Field</th><th>Required</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>title</td><td>Yes</td><td>Pack name</td></tr>
            <tr><td>description</td><td>No</td><td>Pack description</td></tr>
            <tr><td>cover_image_url</td><td>No</td><td>Cover image URL</td></tr>
            <tr><td>category</td><td>No</td><td>Category (autocomplete from existing)</td></tr>
            <tr><td>status</td><td>Yes</td><td>draft / active / archived</td></tr>
            <tr><td>expires_at</td><td>No</td><td>Expiration date/time (leave empty for no expiration). Pack auto-hides after this date.</td></tr>
            <tr><td>is_premium</td><td>No</td><td>Requires paid subscription to play</td></tr>
            <tr><td>is_public</td><td>No</td><td>Visible in browse/carousel</td></tr>
            <tr><td>is_host</td><td>No</td><td>Available only in Host Quiz mode</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Pack Questions Manager</h3>
        <ul className="rtg-list">
          <li><strong>Left panel:</strong> Current pack questions with sort order</li>
          <li><strong>Right panel:</strong> Browse all questions (searchable, filterable)</li>
          <li>Add single questions, bulk add, remove, or reorder</li>
          <li>Question count auto-syncs when you add/remove</li>
          <li><strong>Sort order matters:</strong> Sequential mode uses sort_order; Jeopardy groups by category</li>
        </ul>
      </SectionCard>

      {/* Section 6 — Bulk Import */}
      <SectionCard number={6} title="Bulk Import">
        <p className="rtg-intro">
          Import questions from an Excel file. Available to <strong>admin</strong>+ roles.
        </p>

        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span><strong>Download template</strong> &mdash; Excel file with headers and sample data</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span><strong>Fill in questions</strong> &mdash; one question per row (question + answer required)</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span><strong>Upload</strong> &mdash; drag-drop or file picker (<code>.xlsx</code> or <code>.xls</code>)</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span><strong>Validate</strong> &mdash; errors shown inline; non-standard categories flagged in orange</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">5</span>
            <span><strong>Import</strong> &mdash; batch insert all valid questions</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">6</span>
            <span><strong>Post-import</strong> &mdash; optionally create a new pack or add to an existing pack</span>
          </div>
        </div>
      </SectionCard>

      {/* Section 7 — User Management */}
      <SectionCard number={7} title="User Management">
        <p className="rtg-intro">
          View user data and manage roles. <strong>Admin</strong>+ can view users. Only <strong>superadmin</strong> can change roles.
        </p>

        <h3 className="rtg-h3">User KPIs</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Metric</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>Total Users</td><td>All registered accounts</td></tr>
            <tr><td>Active (24h)</td><td>Users with activity in last 24 hours</td></tr>
            <tr><td>Premium / Staff</td><td>Users with paid subscription or staff role</td></tr>
            <tr><td>Tournament %</td><td>Percentage who have participated in tournaments</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">User Table Columns</h3>
        <ul className="rtg-list">
          <li><strong>User</strong> &mdash; avatar + display name + email</li>
          <li><strong>Subscription</strong> &mdash; tier badge (free / basic / pro / staff)</li>
          <li><strong>Quizzes</strong> &mdash; completed quiz count</li>
          <li><strong>Tournaments</strong> &mdash; tournament creation count</li>
          <li><strong>Avg Score</strong> &mdash; average quiz score</li>
          <li><strong>Last Active</strong> &mdash; relative time (&ldquo;5h ago&rdquo;, &ldquo;2d ago&rdquo;)</li>
          <li><strong>Status</strong> &mdash; active (last 30d) or inactive badge</li>
          <li><strong>Actions</strong> &mdash; role dropdown (superadmin only)</li>
        </ul>

        <h3 className="rtg-h3">Filters &amp; Export</h3>
        <ul className="rtg-list">
          <li>Search by display name or email (debounced)</li>
          <li>Filter by role: all / user / editor / admin / superadmin</li>
          <li>Paginated at 20 per page</li>
          <li>CSV export: Name, Email, Role, Quizzes, Tournaments, Avg Score, Last Active, Joined</li>
        </ul>
      </SectionCard>

      {/* Section 8 — Role Assignment */}
      <SectionCard number={8} title="Role Assignment & Staff Access">
        <p className="rtg-intro">
          Only <strong>superadmin</strong> can change user roles. Changing a role takes effect on the user&apos;s next page load.
        </p>

        <h3 className="rtg-h3">How to Assign a Role</h3>
        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span>Go to <strong>Admin &gt; Users</strong> (<code>/admin/users</code>)</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span>Find the user by name or email</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span>Click the role dropdown in the Actions column</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span>Select the new role: <RoleBadge role="user" /> <RoleBadge role="editor" /> <RoleBadge role="admin" /> <RoleBadge role="superadmin" /></span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">5</span>
            <span>Confirm in the modal (shows current vs. new role, warns on superadmin promotion)</span>
          </div>
        </div>

        <h3 className="rtg-h3">What Happens When You Change a Role</h3>
        <table className="rtg-table">
          <thead>
            <tr><th>Change</th><th>Effect</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>user &rarr; editor</td>
              <td>Gains CMS access + all tier gates bypassed (full Pro access, no subscription needed)</td>
            </tr>
            <tr>
              <td>user &rarr; admin</td>
              <td>Same as editor + analytics dashboard + user list read access</td>
            </tr>
            <tr>
              <td>user &rarr; superadmin</td>
              <td>Full system access including role assignment for others</td>
            </tr>
            <tr>
              <td>editor &rarr; user</td>
              <td>Loses CMS access; falls back to subscription tier (or Free if none)</td>
            </tr>
          </tbody>
        </table>

        <div className="rtg-callout rtg-callout--important">
          <strong>Staff roles bypass all subscription tiers.</strong> You do not assign a tier to staff &mdash; the role IS the bypass. No Stripe subscription needed. Changing a role never modifies the user&apos;s Stripe subscription.
        </div>
      </SectionCard>

      {/* Section 9 — Subscription & Tier Management */}
      <SectionCard number={9} title="Subscription & Tier Management">
        <p className="rtg-intro">
          Subscription tiers are managed through Stripe. Admins cannot modify subscriptions directly from the Admin CMS.
        </p>

        <h3 className="rtg-h3">Tier Structure</h3>
        <table className="rtg-table">
          <thead>
            <tr><th>Tier</th><th>Price</th><th>Key Features</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><TierBadge tier="free" /></td>
              <td>{TIERS.free.price}</td>
              <td>Free Quiz (Gamified), Dashboard, Profile, Guide</td>
            </tr>
            <tr>
              <td><TierBadge tier="basic" /></td>
              <td>{TIERS.basic.price}{TIERS.basic.period}</td>
              <td>+ Packs, History, Leaderboard, Resume</td>
            </tr>
            <tr>
              <td><TierBadge tier="pro" /></td>
              <td>{TIERS.pro.price}{TIERS.pro.period}</td>
              <td>+ Doubles, Host Quiz, Tournaments, AI Generate, Buzzer, Export, Certificates</td>
            </tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Doubles Quiz (Pro)</h3>
        <ul className="rtg-list">
          <li><strong>Single-Part:</strong> If a quiz has only one part, the review phase is skipped and labels like &ldquo;Part 1&rdquo; are hidden for a cleaner UX.</li>
          <li><strong>Multi-Part:</strong> Standard two-part flow with review phase.</li>
        </ul>

        <h3 className="rtg-h3">Subscription Statuses</h3>
        <table className="rtg-table">
          <thead>
            <tr><th>Status</th><th>What It Means</th></tr>
          </thead>
          <tbody>
            <tr><td><StatusBadge status="trialing" /></td><td>Within the 14-day free trial (no Stripe, app-computed)</td></tr>
            <tr><td><StatusBadge status="active" /></td><td>Paying subscriber with active billing</td></tr>
            <tr><td><StatusBadge status="past_due" /></td><td>Payment failed, prompted to update</td></tr>
            <tr><td><StatusBadge status="canceled" /></td><td>Canceled but billing period not over, access continues</td></tr>
            <tr><td><StatusBadge status="expired" /></td><td>Trial ended or subscription lapsed, Free tier only</td></tr>
            <tr><td><StatusBadge status="staff" /></td><td>Staff role bypass (not a real subscription)</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">How to Manage Subscriptions</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Task</th><th>Where</th></tr>
          </thead>
          <tbody>
            <tr><td>Refund a payment</td><td>Stripe Dashboard &gt; Payments</td></tr>
            <tr><td>Cancel a subscription</td><td>Stripe Dashboard &gt; Subscriptions</td></tr>
            <tr><td>Apply a coupon / promo</td><td>Stripe Dashboard &gt; Coupons</td></tr>
            <tr><td>Give free Pro access</td><td>Promote to Editor+ role (no Stripe needed)</td></tr>
            <tr><td>View payment history</td><td>Stripe Dashboard &gt; Payments</td></tr>
            <tr><td>Update product pricing</td><td>Stripe Dashboard + update <code>config/tiers.js</code></td></tr>
          </tbody>
        </table>

        <div className="rtg-callout rtg-callout--tip">
          <strong>To change tier configuration</strong>, edit <code>apps/quiz-app/src/config/tiers.js</code> &mdash; the single source of truth. All UI (Pricing page, UpgradeWall, sidebar locks) auto-adapts. See <code>docs/reference/tier-strategy.md</code> for details.
        </div>
      </SectionCard>

      {/* Section 10 — Content Permissions */}
      <SectionCard number={10} title="Content Permissions (Editor Grants)">
        <p className="rtg-intro">
          Content permissions control which specific packs and categories an editor can access. <strong>Currently requires manual SQL</strong> (no admin UI yet).
        </p>

        <h3 className="rtg-h3">Access Level Hierarchy</h3>
        <ul className="rtg-list">
          <li><strong>read</strong> &mdash; can view the pack or questions in the category</li>
          <li><strong>write</strong> &mdash; can view + edit (includes read)</li>
          <li><strong>manage</strong> &mdash; full control (includes read + write)</li>
        </ul>

        <h3 className="rtg-h3">Granting Access (SQL)</h3>
        <div className="rtg-callout">
          <code style={{ display: 'block', whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: 1.6 }}>
{`-- Grant editor write access to a specific pack
INSERT INTO content_permissions
  (user_id, resource_type, resource_id, access_level)
VALUES
  ('editor-user-uuid', 'pack', 'pack-uuid', 'write');

-- Grant editor write access to a category
INSERT INTO content_permissions
  (user_id, resource_type, resource_id, access_level)
VALUES
  ('editor-user-uuid', 'category', 'Science', 'write');`}
          </code>
        </div>

        <h3 className="rtg-h3">Revoking Access (SQL)</h3>
        <div className="rtg-callout">
          <code style={{ display: 'block', whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: 1.6 }}>
{`DELETE FROM content_permissions
WHERE user_id = 'editor-user-uuid'
  AND resource_type = 'pack'
  AND resource_id = 'pack-uuid';`}
          </code>
        </div>

        <div className="rtg-callout rtg-callout--important">
          <strong>Enforced at database level.</strong> These permissions are checked by Row-Level Security (RLS) policies. Admins and superadmins bypass all content permission checks.
        </div>
      </SectionCard>

      {/* Section 11 — Audit Logging */}
      <SectionCard number={11} title="Audit Logging">
        <p className="rtg-intro">
          All admin CMS actions are logged to the <code>admin_audit_log</code> table. Logs are immutable &mdash; deleted content remains in the audit trail.
        </p>

        <table className="rtg-table">
          <thead>
            <tr><th>Action</th><th>Triggered By</th></tr>
          </thead>
          <tbody>
            {[
              ['create_question', 'Creating a new question'],
              ['update_question', 'Editing an existing question'],
              ['delete_question', 'Deleting a question'],
              ['bulk_create_questions', 'Bulk import from Excel'],
              ['create_pack', 'Creating a new pack'],
              ['update_pack', 'Editing pack metadata'],
              ['delete_pack', 'Deleting a pack'],
              ['add_question_to_pack', 'Adding a question to a pack'],
              ['bulk_add_questions_to_pack', 'Bulk adding questions to a pack'],
              ['remove_question_from_pack', 'Removing a question from a pack'],
              ['update_pack_question_order', 'Reordering questions in a pack'],
              ['update_user_role', 'Changing a user role (superadmin)'],
              ['ai_generate', 'AI quiz generation attempt'],
            ].map(([action, desc]) => (
              <tr key={action}>
                <td><code>{action}</code></td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="rtg-h3">Log Entry Fields</h3>
        <ul className="rtg-list">
          <li><strong>user_id</strong> &mdash; who performed the action</li>
          <li><strong>action</strong> &mdash; action type (see above)</li>
          <li><strong>table_name</strong> &mdash; affected table</li>
          <li><strong>record_id</strong> &mdash; primary key of affected record</li>
          <li><strong>payload</strong> &mdash; JSONB with mutation data</li>
          <li><strong>created_at</strong> &mdash; timestamp</li>
        </ul>
      </SectionCard>

      {/* Section 12 — Database & System Admin */}
      <SectionCard number={12} title="Database & System Administration">
        <p className="rtg-intro">
          Reference for system administrators who need to manage the database, run migrations, or configure Stripe.
        </p>

        <h3 className="rtg-h3">Key Database Tables</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Table</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td><code>questions_master</code></td><td>All quiz questions</td></tr>
            <tr><td><code>quiz_packs</code></td><td>Curated question sets</td></tr>
            <tr><td><code>pack_questions</code></td><td>Pack-question junction with sort_order</td></tr>
            <tr><td><code>quiz_sessions</code></td><td>Player quiz sessions</td></tr>
            <tr><td><code>question_attempts</code></td><td>Per-question results</td></tr>
            <tr><td><code>user_profiles</code></td><td>Display names, roles, avatars, XP/badges</td></tr>
            <tr><td><code>subscriptions</code></td><td>Stripe subscription state</td></tr>
            <tr><td><code>stripe_webhook_log</code></td><td>Webhook idempotency + audit</td></tr>
            <tr><td><code>content_permissions</code></td><td>Editor pack/category grants</td></tr>
            <tr><td><code>admin_audit_log</code></td><td>CMS action audit trail</td></tr>
            <tr><td><code>ai_generation_log</code></td><td>AI quiz generation audit</td></tr>
            <tr><td><code>buzzer_rooms</code></td><td>Buzzer room state</td></tr>
            <tr><td><code>host_tournaments</code></td><td>Tournament brackets</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">RLS Helper Functions</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Function</th><th>Returns</th><th>Used By</th></tr>
          </thead>
          <tbody>
            <tr><td><code>get_role()</code></td><td>Current user&apos;s role</td><td>RLS policies</td></tr>
            <tr><td><code>is_admin()</code></td><td>true if admin/superadmin</td><td>RLS policies, RPCs</td></tr>
            <tr><td><code>is_superadmin()</code></td><td>true if superadmin</td><td>RLS policies</td></tr>
            <tr><td><code>has_content_permission()</code></td><td>true if user has grant</td><td>RLS for editors</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Running Migrations</h3>
        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span>Open your Supabase project dashboard</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span>Go to <strong>SQL Editor</strong></span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span>Paste the migration SQL from <code>packages/supabase-client/migrations/</code></span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span>Click <strong>Run</strong></span>
          </div>
        </div>

        <h3 className="rtg-h3">Stripe Webhook Events</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Event</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr><td><code>checkout.session.completed</code></td><td>Create/update subscription row</td></tr>
            <tr><td><code>customer.subscription.updated</code></td><td>Update tier, status, period dates</td></tr>
            <tr><td><code>customer.subscription.deleted</code></td><td>Mark subscription expired</td></tr>
            <tr><td><code>invoice.paid</code></td><td>Confirm active status</td></tr>
            <tr><td><code>charge.refunded</code></td><td>Flag for manual review</td></tr>
            <tr><td><code>charge.dispute.created</code></td><td>Flag for manual review</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">Environment Variables (Stripe)</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr><th>Variable</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><code>VITE_STRIPE_BASIC_PRICE_ID</code></td><td>Stripe price ID for Basic tier</td></tr>
            <tr><td><code>VITE_STRIPE_PRO_PRICE_ID</code></td><td>Stripe price ID for Pro tier</td></tr>
            <tr><td><code>STRIPE_SECRET_KEY</code></td><td>Server-side Stripe API key</td></tr>
            <tr><td><code>STRIPE_WEBHOOK_SECRET</code></td><td>Webhook signing secret</td></tr>
          </tbody>
        </table>
      </SectionCard>

      {/* Section 13 — Row-Level Security */}
      <SectionCard number={13} title="Security & RLS Policies">
        <p className="rtg-intro">
          Row-Level Security (RLS) is enforced at the database level. This matrix shows who can access what.
        </p>

        <table className="rtg-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Public</th>
              <th>User</th>
              <th>Editor</th>
              <th>Admin+</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['questions_master', 'Read active+public', 'Read active+public', 'R/W granted categories', 'Full CRUD'],
              ['quiz_packs', 'Read active+public+non-expired', 'Read active+public+non-expired', 'R/W granted packs', 'Full CRUD (incl. drafts & expired)'],
              ['pack_questions', 'Read via active+non-expired pack', 'Read via active+non-expired pack', 'Manage granted packs', 'Full CRUD'],
              ['user_profiles', CROSS, 'Read own', 'Read own', 'Read all; superadmin update'],
              ['subscriptions', CROSS, 'Read own', 'Read own', 'Read all'],
              ['content_permissions', CROSS, 'Read own grants', 'Read own grants', 'Read all; superadmin manage'],
              ['admin_audit_log', CROSS, 'Insert own', 'Insert own', 'Read all'],
            ].map(([table, pub, user, editor, admin]) => (
              <tr key={table}>
                <td><code>{table}</code></td>
                <td>{pub}</td>
                <td>{user}</td>
                <td>{editor}</td>
                <td>{admin}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rtg-callout rtg-callout--important">
          <strong>Security checklist for admins:</strong>
          <ul>
            <li>Never share Stripe secret keys or webhook secrets</li>
            <li>Run migrations in Supabase SQL Editor before deploying code that depends on them</li>
            <li>Review audit logs periodically for unexpected role changes</li>
            <li>Keep superadmin count to a minimum (1-2 people)</li>
            <li>When demoting staff, verify their subscription state first</li>
          </ul>
        </div>
      </SectionCard>

      {/* Section 14 — Troubleshooting */}
      <SectionCard number={14} title="Troubleshooting">
        <table className="rtg-table">
          <thead>
            <tr><th>Issue</th><th>Cause</th><th>Solution</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Editor can&apos;t see a pack</td>
              <td>Missing content_permissions grant</td>
              <td>Add grant via SQL (see Section 10)</td>
            </tr>
            <tr>
              <td>Pack not visible to players</td>
              <td>status=draft, is_public=false, or expires_at in the past</td>
              <td>Edit pack: set status=active, is_public=true, and check expiration date (clear or set future date)</td>
            </tr>
            <tr>
              <td>Questions blank for non-admin</td>
              <td>Migration 019 not applied</td>
              <td>Run <code>019_questions_via_active_pack.sql</code></td>
            </tr>
            <tr>
              <td>User still has access after demotion</td>
              <td>Cached auth state</td>
              <td>User needs to refresh page or sign out/in</td>
            </tr>
            <tr>
              <td>Webhook not processing</td>
              <td>Signature mismatch or duplicate event</td>
              <td>Check <code>stripe_webhook_log</code>; verify STRIPE_WEBHOOK_SECRET</td>
            </tr>
            <tr>
              <td>Subscription not updating</td>
              <td>Webhook delay or failure</td>
              <td>Check Stripe Dashboard &gt; Webhooks for failed deliveries</td>
            </tr>
            <tr>
              <td>Trial banner for staff</td>
              <td>Role not synced</td>
              <td>Verify user_profiles.role is set correctly in DB</td>
            </tr>
            <tr>
              <td>Bulk import fails</td>
              <td>Invalid file or missing fields</td>
              <td>Use .xlsx format; ensure question + answer columns exist</td>
            </tr>
            <tr>
              <td>Pack question count wrong</td>
              <td>Out of sync after manual edit</td>
              <td>Run <code>update_pack_question_count(&apos;pack-uuid&apos;)</code></td>
            </tr>
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
