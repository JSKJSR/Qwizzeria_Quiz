import { GuideSection, GuideStep, GuideTip } from '../GuideBase';
import {
  PackCardsVisual,
  FormatSelectVisual,
  QuizGridVisual,
  SequentialFlowVisual
} from '../GuideVisuals';

export default function PlayPacksSection() {
  return (
    <GuideSection title="Play Quiz Packs" icon={'🔍'}>
      <GuideStep
        number={1}
        title="Browse & Choose"
        description="Browse the pack library by category. Basic tier and above can play all public packs. Premium packs are available to paying subscribers."
        visual={<PackCardsVisual />}
      />
      <GuideStep
        number={2}
        title="Select Your Format"
        description="Choose 'Jeopardy Grid' for a non-linear points-based game, or 'Sequential' to answer in order."
        visual={<FormatSelectVisual />}
      />
      <GuideStep
        number={3}
        title="Jeopardy Grid"
        description="The classic Qwizzeria experience. Tap cards to reveal questions and earn points based on difficulty."
        visual={<QuizGridVisual />}
      />
      <GuideStep
        number={4}
        title="Sequential Mode"
        description="Perfect for rapid-fire rounds. Answer questions one-by-one until you reach the end."
        visual={<SequentialFlowVisual />}
      />
      <GuideTip>
        Your progress is saved automatically. You can resume any pack session later from the dashboard!
      </GuideTip>
    </GuideSection>
  );
}
