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
      <text x="150" y="60" textAnchor="middle" fill="#f0f0f0" fontSize="8">Lily: 20</text>
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

function BuzzerButtonVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Big buzzer button */}
      <circle cx="100" cy="55" r="40" fill="#1a1015" stroke="#2ecc71" strokeWidth="3" />
      <circle cx="100" cy="55" r="32" fill="rgba(46, 204, 113, 0.15)" />
      <text x="100" y="60" textAnchor="middle" fill="#2ecc71" fontSize="14" fontWeight="bold">BUZZ!</text>
      {/* Pulse rings */}
      <circle cx="100" cy="55" r="45" fill="none" stroke="#2ecc71" strokeWidth="1" opacity="0.4">
        <animate attributeName="r" values="45;55" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <text x="100" y="108" textAnchor="middle" fill="#b0a0a5" fontSize="8">Tap to buzz in!</text>
    </svg>
  );
}

function BuzzerRoomVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Room code box */}
      <rect x="40" y="20" width="120" height="40" rx="8" fill="#1a1015" stroke="#e85c1a" strokeWidth="2" />
      <text x="100" y="35" textAnchor="middle" fill="#b0a0a5" fontSize="7">ROOM CODE</text>
      <text x="100" y="52" textAnchor="middle" fill="#e85c1a" fontSize="16" fontWeight="bold" fontFamily="monospace">A3KX7P</text>
      {/* Participants joining */}
      {[0, 1, 2].map(i => (
        <g key={i}>
          <circle cx={55 + i * 45} cy="85" r="12" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
          <text x={55 + i * 45} y="89" textAnchor="middle" fill="#f0f0f0" fontSize="8">{['P1', 'P2', 'P3'][i]}</text>
        </g>
      ))}
      <text x="100" y="112" textAnchor="middle" fill="#b0a0a5" fontSize="7">Players join with room code</text>
    </svg>
  );
}

function BuzzerRankVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Ranked results */}
      <rect x="25" y="15" width="150" height="28" rx="5" fill="rgba(241, 196, 15, 0.1)" stroke="rgba(241, 196, 15, 0.3)" strokeWidth="1" />
      <text x="42" y="33" textAnchor="middle" fill="#e85c1a" fontSize="10" fontWeight="bold">#1</text>
      <text x="85" y="33" textAnchor="middle" fill="#f0f0f0" fontSize="9">Alice</text>
      <text x="155" y="33" textAnchor="middle" fill="#b0a0a5" fontSize="8" fontFamily="monospace">320ms</text>
      <rect x="25" y="48" width="150" height="28" rx="5" fill="rgba(255,255,255,0.03)" />
      <text x="42" y="66" textAnchor="middle" fill="#e85c1a" fontSize="10" fontWeight="bold">#2</text>
      <text x="85" y="66" textAnchor="middle" fill="#f0f0f0" fontSize="9">Lily</text>
      <text x="155" y="66" textAnchor="middle" fill="#b0a0a5" fontSize="8" fontFamily="monospace">480ms</text>
      <rect x="25" y="81" width="150" height="28" rx="5" fill="rgba(255,255,255,0.03)" />
      <text x="42" y="99" textAnchor="middle" fill="#e85c1a" fontSize="10" fontWeight="bold">#3</text>
      <text x="85" y="99" textAnchor="middle" fill="#f0f0f0" fontSize="9">Arjun</text>
      <text x="155" y="99" textAnchor="middle" fill="#b0a0a5" fontSize="8" fontFamily="monospace">650ms</text>
    </svg>
  );
}

function BuzzerHostFlowVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Open button */}
      <rect x="10" y="45" width="50" height="30" rx="6" fill="rgba(46, 204, 113, 0.15)" stroke="#2ecc71" strokeWidth="1.5" />
      <text x="35" y="64" textAnchor="middle" fill="#2ecc71" fontSize="7" fontWeight="bold">OPEN</text>
      {/* Arrow */}
      <line x1="65" y1="60" x2="80" y2="60" stroke="#b0a0a5" strokeWidth="1.5" markerEnd="url(#buzzArrow)" />
      {/* Buzzes arrive */}
      <circle cx="105" cy="60" r="18" fill="#1a1015" stroke="#e85c1a" strokeWidth="2" />
      <text x="105" y="56" textAnchor="middle" fill="#e85c1a" fontSize="14">!</text>
      <text x="105" y="67" textAnchor="middle" fill="#b0a0a5" fontSize="5">buzzes</text>
      {/* Arrow */}
      <line x1="128" y1="60" x2="143" y2="60" stroke="#b0a0a5" strokeWidth="1.5" markerEnd="url(#buzzArrow)" />
      {/* Award */}
      <rect x="148" y="45" width="42" height="30" rx="6" fill="rgba(46, 204, 113, 0.15)" stroke="#2ecc71" strokeWidth="1.5" />
      <text x="169" y="64" textAnchor="middle" fill="#2ecc71" fontSize="7" fontWeight="bold">AWARD</text>
      <defs>
        <marker id="buzzArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#b0a0a5" />
        </marker>
      </defs>
      <text x="35" y="90" textAnchor="middle" fill="#b0a0a5" fontSize="6">Host opens</text>
      <text x="35" y="99" textAnchor="middle" fill="#b0a0a5" fontSize="6">buzzer</text>
      <text x="105" y="92" textAnchor="middle" fill="#b0a0a5" fontSize="6">Players</text>
      <text x="105" y="101" textAnchor="middle" fill="#b0a0a5" fontSize="6">buzz in</text>
      <text x="169" y="92" textAnchor="middle" fill="#b0a0a5" fontSize="6">Host awards</text>
      <text x="169" y="101" textAnchor="middle" fill="#b0a0a5" fontSize="6">points</text>
    </svg>
  );
}

function BuzzerTournamentVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Two active players */}
      <circle cx="55" cy="40" r="16" fill="#1a1015" stroke="#2ecc71" strokeWidth="2" />
      <text x="55" y="44" textAnchor="middle" fill="#2ecc71" fontSize="8" fontWeight="bold">A</text>
      <circle cx="145" cy="40" r="16" fill="#1a1015" stroke="#2ecc71" strokeWidth="2" />
      <text x="145" y="44" textAnchor="middle" fill="#2ecc71" fontSize="8" fontWeight="bold">B</text>
      <text x="100" y="44" textAnchor="middle" fill="#e85c1a" fontSize="10" fontWeight="bold">VS</text>
      {/* Spectators */}
      {[0, 1, 2].map(i => (
        <g key={i}>
          <circle cx={55 + i * 45} cy="90" r="10" fill="#1a1015" stroke="#2a1520" strokeWidth="1" strokeDasharray="3 2" />
          <text x={55 + i * 45} y="93" textAnchor="middle" fill="#b0a0a5" fontSize="7">{['C', 'D', 'E'][i]}</text>
        </g>
      ))}
      <text x="100" y="25" textAnchor="middle" fill="#f0f0f0" fontSize="8">Active match</text>
      <text x="100" y="112" textAnchor="middle" fill="#b0a0a5" fontSize="7">Others spectate</text>
    </svg>
  );
}

function InputModeToggleVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="30" y="40" width="140" height="40" rx="8" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <rect x="100" y="42" width="68" height="36" rx="6" fill="#3498db" />
      <text x="65" y="65" textAnchor="middle" fill="#b0a0a5" fontSize="10" fontWeight="bold">Buzzer</text>
      <text x="134" y="65" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">Input</text>
    </svg>
  );
}

function InputAnswerVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="20" y="10" width="160" height="35" rx="6" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="100" y="32" textAnchor="middle" fill="#f0f0f0" fontSize="8">Type your answer...</text>
      <rect x="20" y="55" width="70" height="26" rx="5" fill="#3498db" />
      <text x="55" y="72" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">SUBMIT</text>
      <rect x="100" y="55" width="80" height="26" rx="5" fill="rgba(255,255,255,0.06)" stroke="#2a1520" strokeWidth="1" />
      <text x="112" y="72" fill="#2ecc71" fontSize="8">Q1 &#x2713;</text>
      <text x="140" y="72" fill="#3498db" fontSize="8" fontWeight="bold">Q2</text>
      <text x="165" y="72" fill="#b0a0a5" fontSize="8">Q3</text>
      <text x="100" y="105" textAnchor="middle" fill="#b0a0a5" fontSize="7">Edit any previous answer</text>
    </svg>
  );
}

function InputRevealVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Hidden answers */}
      <rect x="15" y="10" width="170" height="24" rx="4" fill="rgba(255,255,255,0.03)" />
      <text x="30" y="26" fill="#b0a0a5" fontSize="7">Alice:</text>
      <rect x="60" y="18" width="80" height="8" rx="2" fill="#2a1520" />
      <rect x="15" y="38" width="170" height="24" rx="4" fill="rgba(255,255,255,0.03)" />
      <text x="30" y="54" fill="#b0a0a5" fontSize="7">Lily:</text>
      <rect x="60" y="46" width="65" height="8" rx="2" fill="#2a1520" />
      {/* Reveal button */}
      <rect x="60" y="72" width="80" height="26" rx="5" fill="#9b59b6" />
      <text x="100" y="89" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">Reveal All</text>
      <text x="100" y="112" textAnchor="middle" fill="#b0a0a5" fontSize="7">Answers hidden until reveal</text>
    </svg>
  );
}

function FormatSelectVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="25" y="35" width="70" height="50" rx="6" fill="#1a1015" stroke="#e85c1a" strokeWidth="2" />
      <text x="60" y="55" textAnchor="middle" fill="#f0f0f0" fontSize="8" fontWeight="bold">Jeopardy</text>
      <rect x="105" y="35" width="70" height="50" rx="6" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="140" y="55" textAnchor="middle" fill="#b0a0a5" fontSize="8">Sequential</text>
    </svg>
  );
}

function SequentialFlowVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="20" y="50" width="30" height="20" rx="3" fill="#2a1520" />
      <text x="35" y="63" textAnchor="middle" fill="#f0f0f0" fontSize="8">Q1</text>
      <line x1="55" y1="60" x2="75" y2="60" stroke="#e85c1a" strokeWidth="1.5" markerEnd="url(#seqArrow)" />
      <rect x="85" y="50" width="30" height="20" rx="3" fill="#e85c1a" />
      <text x="100" y="63" textAnchor="middle" fill="#f0f0f0" fontSize="8" fontWeight="bold">Q2</text>
      <line x1="120" y1="60" x2="140" y2="60" stroke="#b0a0a5" strokeWidth="1.5" markerEnd="url(#seqArrowGray)" />
      <rect x="150" y="50" width="30" height="20" rx="3" fill="#2a1520" />
      <text x="165" y="63" textAnchor="middle" fill="#f0f0f0" fontSize="8">Q3</text>
      <defs>
        <marker id="seqArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#e85c1a" />
        </marker>
        <marker id="seqArrowGray" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#b0a0a5" />
        </marker>
      </defs>
    </svg>
  );
}

// --- Main Guide Component ---

export default function Guide() {
  return (
    <div className="guide">
      <SEO title="How to Play | Qwizzeria" />
      <h1 className="guide__title">How to Play</h1>
      <p className="guide__subtitle">
        Learn how to host quizzes, use the buzzer, and run tournaments with Qwizzeria.
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
      </GuideSection>

      <GuideSection title="Buzzer Mode" icon={'🔔'}>
        <GuideStep
          number={1}
          title="Enable Buzzer (Host)"
          description="When setting up a Host Quiz or Tournament, check 'Enable Buzzer' before starting. A unique room code is generated automatically."
          visual={<BuzzerRoomVisual />}
        />
        <GuideStep
          number={2}
          title="Players Join"
          description="Share the room code or join link with participants. Players must be logged in — go to /buzz/ROOMCODE to join. A green dot next to the room code confirms the connection is live."
          visual={<ParticipantsVisual />}
        />
        <GuideStep
          number={3}
          title="Choose Buzzer or Collect Answers"
          description="Select a question from the grid, then choose your mode: 'Buzzer' for speed-based buzzing, or 'Collect Answers' for text input. The overlay shows how many participants are connected — if zero, you'll see a warning."
          visual={<BuzzerHostFlowVisual />}
        />
        <GuideStep
          number={4}
          title="Buzz In!"
          description="Tap the buzzer as fast as you can! Your phone vibrates on press. Buzzes under 100ms are rejected (no bots allowed). The system measures your reaction time precisely."
          visual={<BuzzerButtonVisual />}
        />
        <GuideStep
          number={5}
          title="Ranked Results & Award"
          description="The host sees all buzzes ranked by speed. If two players buzz within 50ms of each other, it's flagged as a tie and the host decides. Click 'Award' to give the point, then 'Next Round' to continue."
          visual={<BuzzerRankVisual />}
        />
        <GuideStep
          number={6}
          title="Tournament Buzzer"
          description="In tournament mode, only the two players in the current match can buzz. Everyone else watches as a spectator until their match comes up."
          visual={<BuzzerTournamentVisual />}
        />
        <GuideTip>
          The buzzer uses real-time broadcasting for near-instant response. Each player's buzz time is measured from when they received the question — no unfair advantage from network speed!
        </GuideTip>
        <GuideTip>
          Host flow per round: Open Buzzer &rarr; Lock &rarr; Award &rarr; Next Round. That's it — no manual reset needed between rounds!
        </GuideTip>
        <GuideTip>
          Players see a connection dot in the header: green = connected, amber = connecting, red = disconnected. If the room is closed, participants are notified automatically.
        </GuideTip>

        <div className="guide__subsection-divider" />
        <h3 className="guide__subsection-title">Input Mode</h3>
        <p className="guide__subsection-desc">
          Instead of buzzing in, participants can type and submit text answers. Great for open-ended questions!
        </p>

        <GuideStep
          number={1}
          title="Collect Answers"
          description="Select 'Collect Answers' from the mode selector. The timer auto-starts and participants see a text field with a live countdown on their device. Colors change from green to yellow to red as time runs out."
          visual={<InputAnswerVisual />}
        />
        <GuideStep
          number={2}
          title="Auto-Open Responses"
          description="When the timer expires, answers are automatically locked and the responses modal opens — no manual clicking needed. Answers are hidden by default — click 'Reveal All' to show them game-show style!"
          visual={<InputRevealVisual />}
        />
        <GuideTip>
          You can use buzzer and input on the same question — award a buzzer point, then click &ldquo;Collect Answers&rdquo; to gather written responses too.
        </GuideTip>
        <GuideTip>
          Participants can browse and edit answers to any previous question using the Q1, Q2, Q3 tabs. Editing is disabled only when you lock or end the quiz.
        </GuideTip>
        <GuideTip>
          Use &ldquo;Clear All&rdquo; in the buzzer overlay to reset all accumulated responses and start fresh.
        </GuideTip>
      </GuideSection>

      <GuideSection title="Play Quiz Packs" icon={'🔍'}>
        <GuideStep
          number={1}
          title="Browse & Choose"
          description="Find a pack you like from the dashboard or library. Click 'Play' to start your session."
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