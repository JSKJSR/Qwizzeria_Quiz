import { GuideSection, GuideStep, GuideTip } from '../GuideBase';
import { AIGenerateVisual, PackCardsVisual } from '../GuideVisuals';

export default function AIGenerateSection() {
  return (
    <GuideSection title="AI Quiz Generation" icon={'🤖'}>
      <GuideStep
        number={1}
        title="Generate on Any Topic"
        description="From Host Quiz setup, tap 'Generate with AI'. Enter any topic and choose difficulty and question count. AI creates a full quiz pack in seconds."
        visual={<AIGenerateVisual />}
      />
      <GuideStep
        number={2}
        title="Preview & Edit"
        description="Review every generated question before playing. Edit text, delete bad questions, or regenerate individual ones. Nothing goes live until you approve it."
        visual={<PackCardsVisual />}
      />
      <GuideStep
        number={3}
        title="Use or Save"
        description="Choose 'Use Without Saving' for a one-time session, or 'Save &amp; Use' to keep the pack in your library for future games."
        visual={<PackCardsVisual />}
      />
      <GuideTip>
        AI generation is a Pro feature. Rate limits: 5 quizzes per hour, 20 per day. Staff accounts have unlimited generation.
      </GuideTip>
    </GuideSection>
  );
}
