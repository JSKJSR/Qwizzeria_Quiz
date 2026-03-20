import { GuideSection, GuideStep, GuideTip } from '../GuideBase';
import { DashboardVisual, TierCardsVisual, TrialVisual } from '../GuideVisuals';

export default function GettingStartedSection() {
  return (
    <GuideSection title="Getting Started" icon={'🚀'} defaultOpen>
      <GuideStep
        number={1}
        title="Sign Up & Get 14 Days Free"
        description="Create an account to unlock a 14-day free trial with full Pro access. No credit card required — just sign up and start playing."
        visual={<TrialVisual />}
      />
      <GuideStep
        number={2}
        title="Your Dashboard"
        description="After signing in you land on the dashboard. From here you can start a free quiz, browse packs, host a multiplayer game, or pick up where you left off."
        visual={<DashboardVisual />}
      />
      <GuideStep
        number={3}
        title="Membership Tiers"
        description="Free gives you the open quiz. Basic unlocks quiz packs, leaderboard, and history. Pro adds hosting, AI generation, buzzer rooms, tournaments, and exports."
        visual={<TierCardsVisual />}
      />
      <GuideTip>
        Your trial countdown is always visible in the sidebar. When it expires you keep Free tier access and can upgrade any time from the Pricing page.
      </GuideTip>
    </GuideSection>
  );
}
