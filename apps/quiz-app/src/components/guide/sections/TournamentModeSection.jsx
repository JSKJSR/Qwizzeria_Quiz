import { GuideSection, GuideStep, GuideTip } from '../GuideBase';
import {
  ModeToggleVisual,
  BracketVisual,
  MatchHighlightVisual,
  AdvanceVisual,
  NewTabVisual,
  LiveBadgeVisual,
  TrophyVisual
} from '../GuideVisuals';

export default function TournamentModeSection() {
  return (
    <GuideSection title="Tournament Mode" icon={'\uD83C\uDFC6'}>
      <GuideStep
        number={1}
        title="Setup"
        description="Set up like a regular Host Quiz, but select &quot;Tournament&quot; mode and add 2 to 16 players."
        visual={<ModeToggleVisual active="tournament" />}
      />
      <GuideStep
        number={2}
        title="Auto-Generated Bracket"
        description="A single-elimination bracket is created automatically from your player names. Seeding is randomized."
        visual={<BracketVisual />}
      />
      <GuideStep
        number={3}
        title="Play Matches"
        description="Select any available match from the bracket to start playing. Completed matches are greyed out."
        visual={<MatchHighlightVisual />}
      />
      <GuideStep
        number={4}
        title="Declare a Winner"
        description="After all questions in a match, choose the winner. They automatically advance to the next round."
        visual={<AdvanceVisual />}
      />
      <GuideStep
        number={5}
        title="Open in New Tabs"
        description="Each match can be opened in a separate browser tab, perfect for running multiple matches simultaneously."
        visual={<NewTabVisual />}
      />
      <GuideStep
        number={6}
        title="Live Bracket Updates"
        description="The bracket page updates in realtime as matches complete. No need to refresh — results appear instantly."
        visual={<LiveBadgeVisual />}
      />
      <GuideStep
        number={7}
        title="Crown the Champion"
        description="The tournament ends when the final match winner is declared. A full bracket recap shows every result."
        visual={<TrophyVisual />}
      />
      <GuideTip>
        Share the bracket URL with spectators — they'll see results update live!
      </GuideTip>
    </GuideSection>
  );
}
