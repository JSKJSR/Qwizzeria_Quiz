import SEO from '../components/SEO';
import HostQuizSection from '../components/guide/sections/HostQuizSection';
import BuzzerModeSection from '../components/guide/sections/BuzzerModeSection';
import PlayPacksSection from '../components/guide/sections/PlayPacksSection';
import TournamentModeSection from '../components/guide/sections/TournamentModeSection';
import '../styles/Guide.css';

export default function Guide() {
  return (
    <div className="guide">
      <SEO title="How to Play | Qwizzeria" />
      <h1 className="guide__title">How to Play</h1>
      <p className="guide__subtitle">
        Learn how to host quizzes, use the buzzer, and run tournaments with Qwizzeria.
      </p>

      <HostQuizSection />
      <BuzzerModeSection />
      <PlayPacksSection />
      <TournamentModeSection />
    </div>
  );
}