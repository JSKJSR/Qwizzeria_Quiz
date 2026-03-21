import { GuideSection, GuideStep, GuideTip } from '../GuideBase';
import { FreeQuizGridVisual, FreeQuizInputVisual } from '../GuideVisuals';

export default function FreeQuizSection() {
  return (
    <GuideSection title="Free Quiz" icon={'🎲'}>
      <GuideStep
        number={1}
        title="Jump Straight In"
        description="The free quiz is open to everyone — no login required. Head to /play/free or tap 'Free Quiz' from the dashboard to start instantly."
        visual={<FreeQuizGridVisual />}
      />
      <GuideStep
        number={2}
        title="Pick a Card"
        description="Questions are arranged in a grid by category with point values. Tap any card to reveal its question. The grid updates as you answer."
        visual={<FreeQuizGridVisual />}
      />
      <GuideStep
        number={3}
        title="Answer & Progress"
        description="Type your answer. The quiz uses fuzzy matching — close answers count! If you're marked wrong but were close, tap 'I was close' to override."
        visual={<FreeQuizInputVisual />}
      />
      <GuideTip>
        The free quiz pulls random questions each time, so every session is different. Your score is tracked for the session — try to beat your personal best!
      </GuideTip>
    </GuideSection>
  );
}
