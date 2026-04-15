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
  };
  return <span className={`rtg-status-badge rtg-status-badge--${colors[status] || 'muted'}`}>{status}</span>;
}

function FAQItem({ question, children }) {
  return (
    <div className="rtg-faq">
      <h4 className="rtg-faq__question">{question}</h4>
      <div className="rtg-faq__answer">{children}</div>
    </div>
  );
}

export default function RolesAndTiersGuide() {
  return (
    <div className="rtg">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1>Roles & Pricing Tiers</h1>
          <span className="page-header__subtitle">
            How user roles and subscription tiers work in Qwizzeria
          </span>
        </div>
      </div>

      {/* Part 1 — Subscription Tiers */}
      <SectionCard number={1} title="Subscription Tiers">
        <p className="rtg-intro">
          Every user belongs to one of three pricing tiers. The tier determines which features they can use.
        </p>

        <div className="rtg-tier-cards">
          {['free', 'basic', 'pro'].map((key) => {
            const t = TIERS[key];
            return (
              <div key={key} className={`rtg-tier-card${key === 'pro' ? ' rtg-tier-card--highlight' : ''}`}>
                <div className={`rtg-tier-card__header rtg-tier-card__header--${key}`}>
                  <span className="rtg-tier-card__name">{t.name}</span>
                  <span className="rtg-tier-card__price">
                    {t.price}
                    {t.period && <span className="rtg-tier-card__period">{t.period}</span>}
                  </span>
                </div>
                <p className="rtg-tier-card__desc">
                  {key === 'free' ? 'Default after trial expires' : 'Subscribe via Pricing page'}
                </p>
              </div>
            );
          })}
        </div>

        <h3 className="rtg-h3">Feature Comparison</h3>
        <table className="rtg-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th><TierBadge tier="free" /></th>
              <th><TierBadge tier="basic" /></th>
              <th><TierBadge tier="pro" /></th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Free Quiz (public, no login)', true, true, true],
              ['Dashboard', true, true, true],
              ['Profile & Guide', true, true, true],
              ['Browse & Play Quiz Packs', false, true, true],
              ['Quiz History', false, true, true],
              ['Global Leaderboard', false, true, true],
              ['Resume Saved Sessions', false, true, true],
              ['Daily Missions & Leagues', true, true, true],
              ['Streak Freezes', false, '3/mo', '30/mo'],
              ['Host Quiz (multiplayer)', false, false, true],
              ['Tournaments (brackets)', false, false, true],
              ['AI Quiz Generation', false, false, true],
              ['Buzzer Rooms (real-time)', false, false, true],
              ['Export Results (CSV & PDF)', false, false, true],
              ['Certificates (top 3)', false, false, true],
            ].map(([feature, free, basic, pro]) => (
              <tr key={feature}>
                <td>{feature}</td>
                <td className={free === true ? 'rtg-check' : (free === false ? 'rtg-cross' : '')}>{free === true ? CHECK : (free === false ? CROSS : free)}</td>
                <td className={basic === true ? 'rtg-check' : (basic === false ? 'rtg-cross' : '')}>{basic === true ? CHECK : (basic === false ? CROSS : basic)}</td>
                <td className={pro === true ? 'rtg-check' : (pro === false ? 'rtg-cross' : '')}>{pro === true ? CHECK : (pro === false ? CROSS : pro)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rtg-callout">
          <strong>Key Talking Points</strong>
          <ul>
            <li><strong>Free</strong> is not empty &mdash; the Free Quiz is unlimited with random questions. It is the hook that gets people through the door.</li>
            <li><strong>Basic</strong> is for individual players who want curated packs, leaderboard competition, progress tracking, and 3 streak freezes/month.</li>
            <li><strong>Pro</strong> is for quiz hosts, educators, and event organizers who need multiplayer, AI generation, buzzer rooms, exports, and 30 streak freezes/month.</li>
          </ul>
        </div>
      </SectionCard>

      {/* Part 2 — Free Trial */}
      <SectionCard number={2} title="The 14-Day Free Trial">
        <p className="rtg-intro">
          Every new user automatically gets <strong>14 days of full Pro access</strong> the moment they sign up.
        </p>

        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span>User creates an account (email or Google sign-in)</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span>Immediate access to every feature &mdash; hosting, AI, buzzer, tournaments</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span>A countdown appears in the sidebar showing days remaining</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span>No credit card required. No commitment.</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">5</span>
            <span>After 14 days, they drop to Free tier unless they subscribe</span>
          </div>
        </div>

        <h3 className="rtg-h3">When the Trial Ends</h3>
        <ul className="rtg-list">
          <li>Features above their tier are locked with an upgrade prompt</li>
          <li>They keep full access to the Free Quiz and dashboard</li>
          <li>Saved sessions can no longer be resumed (Resume is a Basic feature)</li>
          <li>They can subscribe any time to restore access instantly</li>
        </ul>

        <div className="rtg-callout rtg-callout--tip">
          <strong>Sales Tips</strong>
          <ul>
            <li>&ldquo;Try everything free for 14 days&rdquo; is the primary call to action</li>
            <li>Users who host quizzes during trial are the strongest conversion candidates &mdash; follow up on Day 10-12</li>
            <li>The sidebar countdown creates natural urgency without feeling aggressive</li>
          </ul>
        </div>
      </SectionCard>

      {/* Part 3 — Subscription Lifecycle */}
      <SectionCard number={3} title="Subscription Lifecycle">
        <h3 className="rtg-h3">How Someone Subscribes</h3>
        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span>User visits the Pricing page (sidebar or upgrade prompts)</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span>Clicks &ldquo;Subscribe&rdquo; on the Basic or Pro card</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span>Redirected to Stripe checkout for payment</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span>Returned to dashboard with confirmation &mdash; tier is active immediately</span>
          </div>
        </div>

        <h3 className="rtg-h3">Managing a Subscription</h3>
        <ul className="rtg-list">
          <li>Users manage from the Profile page (&ldquo;Manage Subscription&rdquo; button)</li>
          <li>Opens Stripe billing portal: switch tiers, update payment, or cancel</li>
          <li>Cancellation takes effect at period end &mdash; access continues until then</li>
        </ul>

        <h3 className="rtg-h3">Subscription Statuses</h3>
        <table className="rtg-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>What It Means</th>
              <th>What the User Sees</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><StatusBadge status="trialing" /></td>
              <td>Within the 14-day free trial</td>
              <td>Full Pro access, countdown in sidebar</td>
            </tr>
            <tr>
              <td><StatusBadge status="active" /></td>
              <td>Paying subscriber</td>
              <td>Full access to their tier&apos;s features</td>
            </tr>
            <tr>
              <td><StatusBadge status="past_due" /></td>
              <td>Payment failed</td>
              <td>Warning in sidebar, prompted to update payment</td>
            </tr>
            <tr>
              <td><StatusBadge status="canceled" /></td>
              <td>Canceled but period not over</td>
              <td>Access continues until period end, then Free</td>
            </tr>
            <tr>
              <td><StatusBadge status="expired" /></td>
              <td>Trial ended, no subscription</td>
              <td>Free tier only, upgrade prompts on locked features</td>
            </tr>
          </tbody>
        </table>
      </SectionCard>

      {/* Part 4 — Staff Roles */}
      <SectionCard number={4} title="Staff Roles (Internal Access)">
        <p className="rtg-intro">
          Separate from pricing tiers, Qwizzeria has an internal role system for team members.
          Roles control access to the admin panel and content management &mdash; they are not visible to regular customers.
        </p>

        <table className="rtg-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Who Gets It</th>
              <th>What They Can Do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>User</strong></td>
              <td>Every customer</td>
              <td>Play quizzes, browse packs, use features within their tier</td>
            </tr>
            <tr>
              <td><strong>Editor</strong></td>
              <td>Content creators</td>
              <td>User features + Admin CMS access (create/edit questions and packs)</td>
            </tr>
            <tr>
              <td><strong>Admin</strong></td>
              <td>Team leads</td>
              <td>Editor features + all content, analytics, bulk import, subscription data</td>
            </tr>
            <tr>
              <td><strong>Superadmin</strong></td>
              <td>Platform owner(s)</td>
              <td>Admin features + assign roles, manage access grants</td>
            </tr>
          </tbody>
        </table>

        <div className="rtg-callout rtg-callout--important">
          <strong>Staff roles bypass all subscription tiers.</strong> If someone has Editor, Admin, or Superadmin,
          they automatically get full Pro access at no charge. No trial banners, no upgrade prompts.
        </div>

        <h3 className="rtg-h3">How to Assign a Role</h3>
        <div className="rtg-steps">
          <div className="rtg-step">
            <span className="rtg-step__num">1</span>
            <span>A Superadmin goes to <strong>Admin &gt; Users</strong></span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">2</span>
            <span>Find the person by name or email</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">3</span>
            <span>Click the actions menu (&bull;&bull;&bull;) &gt; &ldquo;Change Role&rdquo;</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">4</span>
            <span>Select the new role and click Save</span>
          </div>
          <div className="rtg-step">
            <span className="rtg-step__num">5</span>
            <span>A confirmation dialog shows the change before it takes effect</span>
          </div>
        </div>

        <h3 className="rtg-h3">When to Use Each Role</h3>
        <table className="rtg-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Recommended Role</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Content writer who creates quiz questions</td><td><strong>Editor</strong></td></tr>
            <tr><td>Team member who needs analytics and full content access</td><td><strong>Admin</strong></td></tr>
            <tr><td>Person who manages the platform and assigns roles</td><td><strong>Superadmin</strong></td></tr>
            <tr><td>A paying customer</td><td><strong>User</strong> (subscription handles access)</td></tr>
            <tr><td>A reviewer or beta tester</td><td><strong>Editor</strong> (full access, no subscription)</td></tr>
          </tbody>
        </table>
      </SectionCard>

      {/* Part 5 — Common Questions */}
      <SectionCard number={5} title="Common Sales Scenarios">
        <FAQItem question={'"Can they try before they buy?"'}>
          <p>Yes. Every new account gets 14 days of full Pro access. No credit card. No setup. Just sign up and go.</p>
        </FAQItem>
        <FAQItem question={'"What happens if they cancel?"'}>
          <p>They keep access until the end of their billing period. After that, they drop to Free tier. Their data (quiz history, profile) is preserved &mdash; they just cannot access tier-locked features.</p>
        </FAQItem>
        <FAQItem question={'"Can we give someone free Pro access?"'}>
          <p>Yes, two ways:</p>
          <ol>
            <li><strong>Staff role</strong> &mdash; change their role to Editor or above in Admin &gt; Users. Gives unlimited Pro access.</li>
            <li><strong>Stripe coupon</strong> &mdash; create a 100% discount coupon in the Stripe Dashboard and share the checkout link (future feature).</li>
          </ol>
        </FAQItem>
        <FAQItem question={'"What\'s the difference between Basic and Pro?"'}>
          <p>Basic is for <strong>playing</strong> &mdash; browse packs, compete on leaderboards, track history. Pro is for <strong>hosting</strong> &mdash; run live multiplayer quizzes, generate AI packs, use buzzer rooms, run tournaments, export results.</p>
        </FAQItem>
        <FAQItem question={'"Can a Free user do anything useful?"'}>
          <p>Absolutely. The Free Quiz is unlimited, pulls random questions from the full database, and works without even logging in. It is a complete product on its own.</p>
        </FAQItem>
        <FAQItem question={'"How many people can be on one subscription?"'}>
          <p>Each subscription is per-user. A Pro host can run quizzes with up to 8 participants &mdash; participants only need to be logged in, they do not need their own Pro subscription to join a hosted quiz or buzzer room.</p>
        </FAQItem>
      </SectionCard>

      {/* Part 6 — Quick Reference */}
      <SectionCard number={6} title="Quick Reference">
        <h3 className="rtg-h3">For Customers</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr>
              <th>I want to...</th>
              <th>I need...</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Try Qwizzeria</td><td>Just sign up (14 days free)</td></tr>
            <tr><td>Play a quick quiz</td><td>Nothing (Free Quiz is public)</td></tr>
            <tr><td>Play curated quiz packs</td><td><TierBadge tier="basic" /> {TIERS.basic.price}{TIERS.basic.period}</td></tr>
            <tr><td>Track my scores and compete</td><td><TierBadge tier="basic" /> {TIERS.basic.price}{TIERS.basic.period}</td></tr>
            <tr><td>Host a live quiz for my team</td><td><TierBadge tier="pro" /> {TIERS.pro.price}{TIERS.pro.period}</td></tr>
            <tr><td>Generate quizzes with AI</td><td><TierBadge tier="pro" /> {TIERS.pro.price}{TIERS.pro.period}</td></tr>
            <tr><td>Run a tournament bracket</td><td><TierBadge tier="pro" /> {TIERS.pro.price}{TIERS.pro.period}</td></tr>
            <tr><td>Use the real-time buzzer</td><td><TierBadge tier="pro" /> {TIERS.pro.price}{TIERS.pro.period}</td></tr>
          </tbody>
        </table>

        <h3 className="rtg-h3">For Internal Team</h3>
        <table className="rtg-table rtg-table--compact">
          <thead>
            <tr>
              <th>I want to...</th>
              <th>I need...</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Create quiz content</td><td>Editor role (ask a Superadmin)</td></tr>
            <tr><td>View analytics and manage content</td><td>Admin role</td></tr>
            <tr><td>Assign roles to team members</td><td>Superadmin role</td></tr>
            <tr><td>Give a customer free access</td><td>Set them to Editor role, or Stripe coupon</td></tr>
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
