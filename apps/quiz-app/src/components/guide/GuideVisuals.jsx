// --- SVG Visuals ---

export function TierCardsVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="5" y="20" width="55" height="80" rx="6" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="32" y="42" textAnchor="middle" fill="#b0a0a5" fontSize="9" fontWeight="bold">Free</text>
      <text x="32" y="58" textAnchor="middle" fill="#b0a0a5" fontSize="7">$0</text>
      <text x="32" y="80" textAnchor="middle" fill="#b0a0a5" fontSize="6">Free Quiz</text>
      <rect x="72" y="15" width="55" height="90" rx="6" fill="#1a1015" stroke="#3498db" strokeWidth="2" />
      <text x="99" y="37" textAnchor="middle" fill="#3498db" fontSize="9" fontWeight="bold">Basic</text>
      <text x="99" y="53" textAnchor="middle" fill="#3498db" fontSize="7">$4.99/mo</text>
      <text x="99" y="72" textAnchor="middle" fill="#b0a0a5" fontSize="6">Packs</text>
      <text x="99" y="84" textAnchor="middle" fill="#b0a0a5" fontSize="6">Leaderboard</text>
      <rect x="139" y="15" width="55" height="90" rx="6" fill="#1a1015" stroke="#e85c1a" strokeWidth="2.5" />
      <text x="166" y="37" textAnchor="middle" fill="#e85c1a" fontSize="9" fontWeight="bold">Pro</text>
      <text x="166" y="53" textAnchor="middle" fill="#e85c1a" fontSize="7">$9.99/mo</text>
      <text x="166" y="72" textAnchor="middle" fill="#b0a0a5" fontSize="6">Host Quiz</text>
      <text x="166" y="84" textAnchor="middle" fill="#b0a0a5" fontSize="6">AI Generate</text>
    </svg>
  );
}

export function TrialVisual() {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * 0.3;
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <circle cx="100" cy="55" r={radius + 4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="100" cy="55" r={radius + 4}
        fill="none" stroke="#e85c1a" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 100 55)"
      />
      <text x="100" y="52" textAnchor="middle" fill="#f0f0f0" fontSize="16" fontWeight="bold">14</text>
      <text x="100" y="66" textAnchor="middle" fill="#b0a0a5" fontSize="7">days free</text>
      <text x="100" y="105" textAnchor="middle" fill="#b0a0a5" fontSize="8">Full Pro access — no card required</text>
    </svg>
  );
}

export function DashboardVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Sidebar */}
      <rect x="5" y="10" width="45" height="100" rx="4" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="27" y="28" textAnchor="middle" fill="#e85c1a" fontSize="6" fontWeight="bold">Q</text>
      <rect x="10" y="38" width="35" height="6" rx="2" fill="#2a1520" />
      <rect x="10" y="50" width="35" height="6" rx="2" fill="#e85c1a" />
      <rect x="10" y="62" width="35" height="6" rx="2" fill="#2a1520" />
      <rect x="10" y="74" width="35" height="6" rx="2" fill="#2a1520" />
      {/* Content */}
      <rect x="55" y="10" width="140" height="100" rx="4" fill="#1a1015" stroke="#2a1520" strokeWidth="1" />
      <text x="125" y="30" textAnchor="middle" fill="#f0f0f0" fontSize="8" fontWeight="bold">Welcome back!</text>
      <rect x="65" y="40" width="55" height="30" rx="4" fill="#2a1520" />
      <text x="92" y="59" textAnchor="middle" fill="#e85c1a" fontSize="7">Free Quiz</text>
      <rect x="128" y="40" width="55" height="30" rx="4" fill="#2a1520" />
      <text x="155" y="59" textAnchor="middle" fill="#3498db" fontSize="7">Packs</text>
      <rect x="65" y="78" width="55" height="26" rx="4" fill="#2a1520" />
      <text x="92" y="94" textAnchor="middle" fill="#b0a0a5" fontSize="7">Host</text>
      <rect x="128" y="78" width="55" height="26" rx="4" fill="#2a1520" />
      <text x="155" y="94" textAnchor="middle" fill="#b0a0a5" fontSize="7">Guide</text>
    </svg>
  );
}

export function FreeQuizGridVisual() {
  const cats = ['Science', 'History', 'Music', 'Sports'];
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {cats.map((cat, i) => (
        <g key={cat}>
          <rect x={8 + i * 48} y="15" width="42" height="36" rx="5" fill="#1a1015" stroke={i === 1 ? '#e85c1a' : '#2a1520'} strokeWidth={i === 1 ? 2 : 1.5} />
          <text x={29 + i * 48} y="30" textAnchor="middle" fill="#f0f0f0" fontSize="6">{cat}</text>
          <text x={29 + i * 48} y="44" textAnchor="middle" fill="#e85c1a" fontSize="10" fontWeight="bold">10</text>
        </g>
      ))}
      {cats.map((cat, i) => (
        <g key={`r2-${cat}`}>
          <rect x={8 + i * 48} y="58" width="42" height="36" rx="5" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
          <text x={29 + i * 48} y="73" textAnchor="middle" fill="#f0f0f0" fontSize="6">{cat}</text>
          <text x={29 + i * 48} y="87" textAnchor="middle" fill="#e85c1a" fontSize="10" fontWeight="bold">20</text>
        </g>
      ))}
      <text x="100" y="110" textAnchor="middle" fill="#b0a0a5" fontSize="7">Tap any card to play</text>
    </svg>
  );
}

export function FreeQuizInputVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="20" y="15" width="160" height="25" rx="4" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="100" y="31" textAnchor="middle" fill="#b0a0a5" fontSize="8">Mount Everst|</text>
      <rect x="35" y="55" width="130" height="28" rx="6" fill="rgba(231, 76, 60, 0.15)" stroke="#e74c3c" strokeWidth="1.5" />
      <text x="100" y="73" textAnchor="middle" fill="#e74c3c" fontSize="8" fontWeight="bold">Incorrect (Mount Everest)</text>
      <rect x="65" y="90" width="70" height="20" rx="4" fill="#2a1520" />
      <text x="100" y="103" textAnchor="middle" fill="#f0f0f0" fontSize="7">I was close!</text>
    </svg>
  );
}

export function AIGenerateVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      {/* Input */}
      <rect x="15" y="15" width="170" height="30" rx="6" fill="#1a1015" stroke="#9b59b6" strokeWidth="1.5" />
      <text x="100" y="34" textAnchor="middle" fill="#b0a0a5" fontSize="8">Enter topic: &quot;Space Exploration&quot;</text>
      {/* Arrow */}
      <line x1="100" y1="50" x2="100" y2="62" stroke="#9b59b6" strokeWidth="1.5" markerEnd="url(#aiArrow)" />
      {/* Generated cards */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={15 + i * 45} y="68" width="38" height="36" rx="4" fill="#1a1015" stroke={i < 3 ? '#9b59b6' : '#2a1520'} strokeWidth={i < 3 ? 1.5 : 1} />
          <text x={34 + i * 45} y="82" textAnchor="middle" fill={i < 3 ? '#f0f0f0' : '#b0a0a5'} fontSize="6">Q{i + 1}</text>
          <text x={34 + i * 45} y="96" textAnchor="middle" fill={i < 3 ? '#9b59b6' : '#b0a0a5'} fontSize="5">{i < 3 ? 'ready' : '...'}</text>
        </g>
      ))}
      <defs>
        <marker id="aiArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#9b59b6" />
        </marker>
      </defs>
      <text x="100" y="115" textAnchor="middle" fill="#b0a0a5" fontSize="7">AI generates questions instantly</text>
    </svg>
  );
}

export function PackCardsVisual() {
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

export function ParticipantsVisual() {
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

export function ModeToggleVisual({ active = 'standard' }) {
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

export function QuizGridVisual() {
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

export function QuestionFlowVisual() {
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

export function ScorebarVisual() {
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

export function PodiumVisual() {
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

export function BracketVisual() {
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

export function MatchHighlightVisual() {
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

export function AdvanceVisual() {
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

export function NewTabVisual() {
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

export function LiveBadgeVisual() {
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

export function TrophyVisual() {
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

export function BuzzerButtonVisual() {
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

export function BuzzerRoomVisual() {
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

export function BuzzerRankVisual() {
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

export function BuzzerHostFlowVisual() {
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

export function BuzzerTournamentVisual() {
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

export function InputModeToggleVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="30" y="40" width="140" height="40" rx="8" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <rect x="100" y="42" width="68" height="36" rx="6" fill="#3498db" />
      <text x="65" y="65" textAnchor="middle" fill="#b0a0a5" fontSize="10" fontWeight="bold">Buzzer</text>
      <text x="134" y="65" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">Input</text>
    </svg>
  );
}

export function InputAnswerVisual() {
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

export function InputRevealVisual() {
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

export function FormatSelectVisual() {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className="guide__svg">
      <rect x="25" y="35" width="70" height="50" rx="6" fill="#1a1015" stroke="#e85c1a" strokeWidth="2" />
      <text x="60" y="55" textAnchor="middle" fill="#f0f0f0" fontSize="8" fontWeight="bold">Jeopardy</text>
      <rect x="105" y="35" width="70" height="50" rx="6" fill="#1a1015" stroke="#2a1520" strokeWidth="1.5" />
      <text x="140" y="55" textAnchor="middle" fill="#b0a0a5" fontSize="8">Sequential</text>
    </svg>
  );
}

export function SequentialFlowVisual() {
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
