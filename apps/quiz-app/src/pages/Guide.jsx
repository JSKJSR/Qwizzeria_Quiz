import SEO from '../components/SEO';
import GettingStartedSection from '../components/guide/sections/GettingStartedSection';
import FreeQuizSection from '../components/guide/sections/FreeQuizSection';
import PlayPacksSection from '../components/guide/sections/PlayPacksSection';
import HostQuizSection from '../components/guide/sections/HostQuizSection';
import AIGenerateSection from '../components/guide/sections/AIGenerateSection';
import BuzzerModeSection from '../components/guide/sections/BuzzerModeSection';
import TournamentModeSection from '../components/guide/sections/TournamentModeSection';
import '../styles/Guide.css';

export default function Guide() {
  return (
    <div className="guide">
      <SEO
        title="How to Play | Qwizzeria"
        description="Learn how to play Qwizzeria — free quizzes, quiz packs, hosting multiplayer games, AI generation, buzzer mode, and tournaments."
        path="/guide"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How do I play a free quiz on Qwizzeria?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Visit the Free Quiz page — no login required. Pick categories from the grid and answer questions at your own pace.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do I host a multiplayer quiz?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Go to Host Quiz, select a pack or generate one with AI, add 2-8 participants, and use the interactive grid to run your game night.',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the buzzer mode?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Buzzer mode lets participants join a live room on their devices and buzz in to answer. The host controls rounds and sees who buzzed first.',
              },
            },
          ],
        }}
      />
      <h1 className="guide__title">How to Play</h1>
      <p className="guide__subtitle">
        Everything you need to know about Qwizzeria — from your first free quiz to hosting multiplayer tournaments.
      </p>

      <GettingStartedSection />
      <FreeQuizSection />
      <PlayPacksSection />
      <HostQuizSection />
      <AIGenerateSection />
      <BuzzerModeSection />
      <TournamentModeSection />
    </div>
  );
}