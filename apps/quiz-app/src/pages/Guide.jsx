import { useState } from 'react';
import SEO from '../components/SEO';
import '../styles/Guide.css';

function GuideSection({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`guide__section ${open ? 'guide__section--open' : ''}`}>
      <button className="guide__section-toggle" onClick={() => setOpen(o => !o)}>
        <span className="guide__section-chevron">{open ? '\u25BC' : '\u25B6'}</span>
        <span className="guide__section-icon">{icon}</span>
        <span className="guide__section-title">{title}</span>
      </button>
      {open && <div className="guide__section-content">{children}</div>}
    </div>
  );
}

function GuideStep({ number, title, description, visual }) {
  return (
    <div className="guide__step">
      <div className="guide__step-text">
        <div className="guide__step-header">
          <span className="guide__step-number">{number}</span>
          <span className="guide__step-title">{title}</span>
        </div>
        <p className="guide__step-desc">{description}</p>
      </div>
      <div className="guide__step-visual">{visual}</div>
    </div>
  );
}

function GuideTip({ children }) {
  return <div className="guide__tip">{children}</div>;
}

// --- SVG Visuals ---

function PackCardsVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="10" y="20" width="50" height="80" rx="6" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="35" y="55" textAnchor="middle" fill="#b0a0a5" fontSize="8">Science</text>
      <text x="35" y="75" textAnchor="middle" fill="#b0a0a5" fontSize="9">12 Qs</text>
      <rect x="75" y="15" width="50" height="90" rx="6" fill="#1a1015" stroke="#e85c1a" strokeWidth="2.5" />
      <text x="100" y="52" textAnchor="middle" fill="#f0f0f0" fontSize="8" fontWeight="bold">History</text>
      <text x="100" y="72" textAnchor="middle" fill="#e85c1a" fontSize="9" fontWeight="bold">20 Qs</text>
      <rect x="140" y="20" width="50" height="80" rx="6" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="165" y="55" textAnchor="middle" fill="#b0a0a5" fontSize="8">Sports</text>
      <text x="165" y="75" textAnchor="middle" fill="#b0a0a5" fontSize="9">15 Qs</text>
    </svg>
  );
}

function ParticipantsVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <circle cx={30 + i * 38} cy="50" r="18" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
          <text x={30 + i * 38} y="55" textAnchor="middle" fill="#f0f0f0" fontSize="12" fontWeight="bold">
            {['A', 'B', 'C', 'D'][i]}
          </text>
        </g>
      ))}
      <circle cx="182" cy="50" r="18" fill="#1a1015" stroke="#e85c1a" strokeWidth="2" strokeDasharray="4 2" />
      <text x="182" y="56" textAnchor="middle" fill="#e85c1a" fontSize="18">+</text>
      <text x="100" y="90" textAnchor="middle" fill="#b0a0a5" fontSize="9">2–16 players</text>
    </svg>
  );
}

function ModeToggleVisual({ active = 'standard' }) {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="20" y="40" width="160" height="40" rx="20" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <rect
        x={active === 'standard' ? '22' : '102'}
        y="42"
        width="78"
        height="36"
        rx="18"
        fill="#e85c1a"
      />
      <text x="60" y="65" textAnchor="middle" fill={active === 'standard' ? '#fff' : '#b0a0a5'} fontSize="10" fontWeight="bold">Standard</text>
      <text x="140" y="65" textAnchor="middle" fill={active === 'tournament' ? '#fff' : '#b0a0a5'} fontSize="10" fontWeight="bold">Tournament</text>
    </svg>
  );
}

function QuizGridVisual() {
  const cats = ['Science', 'History', 'Sports'];
  const pts = [10, 20];
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {cats.map((cat, col) => pts.map((pt, row) => (
        <g key={`${col}-${row}`}>
          <rect x={10 + col * 64} y={10 + row * 52} width="58" height="46" rx="5" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
          <text x={39 + col * 64} y={30 + row * 52} textAnchor="middle" fill="#f0f0f0" fontSize="7">{cat}</text>
          <text x={39 + col * 64} y={46 + row * 52} textAnchor="middle" fill="#e85c1a" fontSize="11" fontWeight="bold">{pt}</text>
        </g>
      )))}
    </svg>
  );
}

function QuestionFlowVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <circle cx="35" cy="60" r="22" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="35" y="67" textAnchor="middle" fill="#e85c1a" fontSize="22" fontWeight="bold">?</text>
      <line x1="60" y1="60" x2="72" y2="60" stroke="#b0a0a5" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <circle cx="100" cy="60" r="22" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <path d="M91 60 Q95 52 100 56 Q105 52 109 60 Q105 68 100 72 Q95 68 91 60Z" fill="none" stroke="#f0f0f0" strokeWidth="1.5" />
      <circle cx="100" cy="60" r="3" fill="#f0f0f0" />
      <line x1="125" y1="60" x2="137" y2="60" stroke="#b0a0a5" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <circle cx="165" cy="60" r="22" fill="#1a1015" stroke="#e85c1a" strokeWidth="2" />
      <path d="M155 60 L162 67 L177 52" fill="none" stroke="#e85c1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#b0a0a5" />
        </marker>
      </defs>
      <text x="35" y="96" textAnchor="middle" fill="#b0a0a5" fontSize="7">Question</text>
      <text x="100" y="96" textAnchor="middle" fill="#b0a0a5" fontSize="7">Reveal</text>
      <text x="165" y="96" textAnchor="middle" fill="#b0a0a5" fontSize="7">Award</text>
    </svg>
  );
}

function ScorebarVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="5" y="35" width="190" height="50" rx="8" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="25" y="57" fill="#b0a0a5" fontSize="14">&#9201;</text>
      <text x="42" y="57" fill="#f0f0f0" fontSize="11" fontWeight="bold">05:00</text>
      <rect x="85" y="45" width="40" height="22" rx="4" fill="#2a1520" />
      <text x="105" y="60" textAnchor="middle" fill="#f0f0f0" fontSize="8">Alice: 30</text>
      <rect x="130" y="45" width="40" height="22" rx="4" fill="#2a1520" />
      <text x="150" y="60" textAnchor="middle" fill="#f0f0f0" fontSize="8">Bob: 20</text>
      <text x="100" y="100" textAnchor="middle" fill="#b0a0a5" fontSize="8">Live scores + countdown timer</text>
    </svg>
  );
}

function PodiumVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="30" y="55" width="40" height="50" rx="3" fill="#2a1520" />
      <rect x="80" y="35" width="40" height="70" rx="3" fill="#2a1520" />
      <rect x="130" y="65" width="40" height="40" rx="3" fill="#2a1520" />
      <circle cx="100" cy="20" r="12" fill="#FFD700" />
      <text x="100" y="24" textAnchor="middle" fill="#1a1015" fontSize="10" fontWeight="bold">1</text>
      <circle cx="50" cy="42" r="10" fill="#C0C0C0" />
      <text x="50" y="46" textAnchor="middle" fill="#1a1015" fontSize="9" fontWeight="bold">2</text>
      <circle cx="150" cy="52" r="10" fill="#CD7F32" />
      <text x="150" y="56" textAnchor="middle" fill="#1a1015" fontSize="9" fontWeight="bold">3</text>
    </svg>
  );
}

function BracketVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Round 1 */}
      <rect x="5" y="10" width="50" height="18" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="30" y="23" textAnchor="middle" fill="#f0f0f0" fontSize="7">Team A</text>
      <rect x="5" y="32" width="50" height="18" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="30" y="45" textAnchor="middle" fill="#f0f0f0" fontSize="7">Team B</text>
      <rect x="5" y="70" width="50" height="18" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="30" y="83" textAnchor="middle" fill="#f0f0f0" fontSize="7">Team C</text>
      <rect x="5" y="92" width="50" height="18" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="30" y="105" textAnchor="middle" fill="#f0f0f0" fontSize="7">Team D</text>
      {/* Connectors */}
      <line x1="55" y1="19" x2="70" y2="19" stroke="#2a1520" strokeWidth="1" />
      <line x1="55" y1="41" x2="70" y2="41" stroke="#2a1520" strokeWidth="1" />
      <line x1="70" y1="19" x2="70" y2="41" stroke="#2a1520" strokeWidth="1" />
      <line x1="70" y1="30" x2="85" y2="30" stroke="#2a1520" strokeWidth="1" />
      <line x1="55" y1="79" x2="70" y2="79" stroke="#2a1520" strokeWidth="1" />
      <line x1="55" y1="101" x2="70" y2="101" stroke="#2a1520" strokeWidth="1" />
      <line x1="70" y1="79" x2="70" y2="101" stroke="#2a1520" strokeWidth="1" />
      <line x1="70" y1="90" x2="85" y2="90" stroke="#2a1520" strokeWidth="1" />
      {/* Round 2 */}
      <rect x="85" y="21" width="50" height="18" rx="3" fill="#1a1015" stroke="#e85c1a" strokeWidth="1.5" />
      <text x="110" y="34" textAnchor="middle" fill="#e85c1a" fontSize="7">Winner</text>
      <rect x="85" y="81" width="50" height="18" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="110" y="94" textAnchor="middle" fill="#b0a0a5" fontSize="7">Winner</text>
      {/* Final */}
      <line x1="135" y1="30" x2="150" y2="30" stroke="#2a1520" strokeWidth="1" />
      <line x1="135" y1="90" x2="150" y2="90" stroke="#2a1520" strokeWidth="1" />
      <line x1="150" y1="30" x2="150" y2="90" stroke="#2a1520" strokeWidth="1" />
      <line x1="150" y1="60" x2="165" y2="60" stroke="#2a1520" strokeWidth="1" />
      <rect x="165" y="51" width="30" height="18" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="180" y="64" textAnchor="middle" fill="#b0a0a5" fontSize="7">Final</text>
    </svg>
  );
}

function MatchHighlightVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="20" y="15" width="60" height="22" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="50" y="30" textAnchor="middle" fill="#b0a0a5" fontSize="7">Match 1</text>
      <rect x="20" y="50" width="60" height="22" rx="3" fill="#1a1015" stroke="#e85c1a" strokeWidth="2.5" />
      <text x="50" y="65" textAnchor="middle" fill="#e85c1a" fontSize="7" fontWeight="bold">Match 2</text>
      <rect x="20" y="85" width="60" height="22" rx="3" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="50" y="100" textAnchor="middle" fill="#b0a0a5" fontSize="7">Match 3</text>
      {/* Cursor / tap indicator */}
      <circle cx="95" cy="61" r="8" fill="none" stroke="#e85c1a" strokeWidth="1.5" opacity="0.6" />
      <circle cx="95" cy="61" r="3" fill="#e85c1a" />
      <text x="150" y="63" textAnchor="middle" fill="#b0a0a5" fontSize="8">Tap to play</text>
    </svg>
  );
}

function AdvanceVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="15" y="40" width="65" height="40" rx="5" fill="#1a1015" stroke="#e85c1a" strokeWidth="2" />
      <text x="47" y="57" textAnchor="middle" fill="#f0f0f0" fontSize="8">Match</text>
      <text x="47" y="70" textAnchor="middle" fill="#e85c1a" fontSize="7">Winner: A</text>
      <line x1="80" y1="60" x2="115" y2="60" stroke="#e85c1a" strokeWidth="2" markerEnd="url(#advArrow)" />
      <rect x="120" y="40" width="65" height="40" rx="5" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="152" y="57" textAnchor="middle" fill="#f0f0f0" fontSize="8">Next Round</text>
      <text x="152" y="70" textAnchor="middle" fill="#b0a0a5" fontSize="7">Team A</text>
      <defs>
        <marker id="advArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#e85c1a" />
        </marker>
      </defs>
    </svg>
  );
}

function NewTabVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="20" y="20" width="100" height="80" rx="6" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <rect x="20" y="20" width="100" height="18" rx="6" fill="#2a1520" />
      <rect x="20" y="32" width="100" height="6" rx="0" fill="#2a1520" />
      <circle cx="30" cy="29" r="3" fill="#e85c1a" />
      <circle cx="40" cy="29" r="3" fill="#b0a0a5" />
      <rect x="55" y="25" width="55" height="9" rx="3" fill="#1a1015" />
      <text x="82" y="32" textAnchor="middle" fill="#b0a0a5" fontSize="5">/tournament/123</text>
      <text x="70" y="70" textAnchor="middle" fill="#b0a0a5" fontSize="8">Match page</text>
      {/* Open arrow */}
      <line x1="130" y1="55" x2="155" y2="35" stroke="#e85c1a" strokeWidth="1.5" />
      <polygon points="150,30 160,33 153,40" fill="#e85c1a" />
      <text x="165" y="60" textAnchor="middle" fill="#b0a0a5" fontSize="7">Open in</text>
      <text x="165" y="72" textAnchor="middle" fill="#b0a0a5" fontSize="7">new tab</text>
    </svg>
  );
}

function LiveBadgeVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="50" y="35" width="100" height="50" rx="8" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <circle cx="75" cy="55" r="5" fill="#e85c1a">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <text x="88" y="53" fill="#e85c1a" fontSize="10" fontWeight="bold">LIVE</text>
      {/* Sync arrows */}
      <path d="M120 50 L132 50 L128 46" fill="none" stroke="#b0a0a5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M132 60 L120 60 L124 64" fill="none" stroke="#b0a0a5" strokeWidth="1.5" strokeLinecap="round" />
      <text x="100" y="75" textAnchor="middle" fill="#b0a0a5" fontSize="7">Realtime updates</text>
    </svg>
  );
}

function TrophyVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Trophy */}
      <path d="M75 25 H125 L118 65 H82 Z" fill="#FFD700" />
      <rect x="90" y="65" width="20" height="15" rx="2" fill="#CD7F32" />
      <rect x="80" y="80" width="40" height="8" rx="3" fill="#CD7F32" />
      {/* Handles */}
      <path d="M75 30 Q55 30 55 50 Q55 60 72 60" fill="none" stroke="#FFD700" strokeWidth="3" />
      <path d="M125 30 Q145 30 145 50 Q145 60 128 60" fill="none" stroke="#FFD700" strokeWidth="3" />
      {/* Confetti dots */}
      <circle cx="40" cy="25" r="3" fill="#e85c1a" />
      <circle cx="160" cy="30" r="2.5" fill="#e85c1a" />
      <circle cx="55" cy="95" r="2" fill="#FFD700" />
      <circle cx="150" cy="90" r="3" fill="#FFD700" />
      <circle cx="35" cy="60" r="2" fill="#f0f0f0" />
      <circle cx="170" cy="65" r="2.5" fill="#f0f0f0" />
      <circle cx="100" cy="10" r="2" fill="#e85c1a" />
      <circle cx="60" cy="15" r="1.5" fill="#C0C0C0" />
      <circle cx="145" cy="15" r="1.5" fill="#C0C0C0" />
    </svg>
  );
}

// --- Main Guide Component ---

export default function Guide() {
  return (
    <div className="guide">
      <SEO
        title="How to Play | Qwizzeria"
        description="Learn how to host quizzes and run tournaments with Qwizzeria. Step-by-step guide for Standard and Tournament modes."
        path="/guide"
        keywords="how to play quiz, host quiz guide, tournament mode, multiplayer quiz tutorial"
      />
      <h1 className="guide__title">How to Play</h1>
      <p className="guide__subtitle">
        Learn how to host quizzes and run tournaments with Qwizzeria.
      </p>

      <GuideSection title="Host a Quiz" icon={'\uD83C\uDFAE'} defaultOpen>
        <GuideStep
          number={1}
          title="Select a Quiz Pack"
          description="Browse available packs and pick one for your quiz. Each pack contains themed questions organized by category."
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
          description="The top bar tracks live scores for all players. Use the countdown timer with audio alerts to keep things moving."
          visual={<ScorebarVisual />}
        />
        <GuideStep
          number={7}
          title="Results"
          description="End the quiz to see final standings. Gold, silver, and bronze medals are awarded to the top three."
          visual={<PodiumVisual />}
        />
        <GuideTip>
          You can pause the timer at any time. The timer beeps 3 times when it expires!
        </GuideTip>
      </GuideSection>

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
    </div>
  );
}