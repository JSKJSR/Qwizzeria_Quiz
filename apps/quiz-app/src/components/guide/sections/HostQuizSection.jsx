import { GuideSection, GuideStep, GuideTip } from '../GuideBase';
import {
  PackCardsVisual,
  ParticipantsVisual,
  ModeToggleVisual,
  QuizGridVisual,
  QuestionFlowVisual,
  ScorebarVisual,
  PodiumVisual
} from '../GuideVisuals';

export default function HostQuizSection() {
  return (
    <GuideSection title="Host a Quiz" icon={'\uD83C\uDFAE'}>
      <GuideStep
        number={1}
        title="Select a Quiz Pack"
        description="Browse available packs or generate one with AI. Each pack contains themed questions organized by category. Hosting requires a Pro subscription."
        visual={<PackCardsVisual />}
      />
      <GuideStep
        number={2}
        title="Add Participants"
        description="Enter 1 to 16 player or team names. You can add or remove players before starting."
        visual={<ParticipantsVisual />}
      />
      <GuideStep
        number={3}
        title="Choose Your Mode"
        description="Standard mode plays through all questions. Tournament mode creates a bracket for elimination rounds."
        visual={<ModeToggleVisual active="standard" />}
      />
      <GuideStep
        number={4}
        title="The Quiz Grid"
        description="Tap any card to reveal its question. Cards are organized by category with point values shown in red."
        visual={<QuizGridVisual />}
      />
      <GuideStep
        number={5}
        title="Question & Answer"
        description="Read the question aloud, reveal the answer, then award points to the players who got it right."
        visual={<QuestionFlowVisual />}
      />
      <GuideStep
        number={6}
        title="Scoreboard & Timer"
        description="The top bar tracks live scores for all players. Use the countdown timer with audio alerts to keep things moving. With buzzer enabled, participants see a live countdown on their devices too."
        visual={<ScorebarVisual />}
      />
      <GuideStep
        number={7}
        title="Publish Scores"
        description="Click 'Publish' in the scoreboard to broadcast the current standings to all connected participants. They'll see a leaderboard overlay on their devices for 5 seconds."
        visual={<ScorebarVisual />}
      />
      <GuideStep
        number={8}
        title="Results & Export"
        description="End the quiz to see final standings with medals. Export results as CSV or print as PDF. Download certificates for the top 3 players."
        visual={<PodiumVisual />}
      />
      <GuideTip>
        You can pause the timer at any time. The timer beeps 3 times when it expires!
      </GuideTip>
      <GuideTip>
        Your quiz session is saved automatically with 24-hour expiry. If the page refreshes, you can pick up right where you left off.
      </GuideTip>
    </GuideSection>
  );
}
