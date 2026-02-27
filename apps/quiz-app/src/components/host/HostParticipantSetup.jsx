import { useState, useCallback } from 'react';

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 16;
const MIN_TOURNAMENT_PLAYERS = 2;
const DEFAULT_QUESTIONS_PER_MATCH = 6;

export default function HostParticipantSetup({ pack, questionCount, onStart, onChangePack }) {
  const [names, setNames] = useState(['']);
  const [mode, setMode] = useState('standard');
  const [questionsPerMatch, setQuestionsPerMatch] = useState(DEFAULT_QUESTIONS_PER_MATCH);
  const [perMatchPacks, setPerMatchPacks] = useState(false);

  const isTournament = mode === 'tournament';
  const effectiveMax = MAX_PLAYERS;
  const effectiveMin = isTournament ? MIN_TOURNAMENT_PLAYERS : MIN_PLAYERS;

  const handleNameChange = useCallback((index, value) => {
    setNames(prev => prev.map((n, i) => i === index ? value : n));
  }, []);

  const handleAddPlayer = useCallback(() => {
    if (names.length < effectiveMax) {
      setNames(prev => [...prev, '']);
    }
  }, [names.length, effectiveMax]);

  const handleRemovePlayer = useCallback((index) => {
    if (names.length > effectiveMin) {
      setNames(prev => prev.filter((_, i) => i !== index));
    }
  }, [names.length, effectiveMin]);

  const allNamesFilled = names.every(n => n.trim().length > 0);
  const hasEnoughPlayers = names.length >= effectiveMin;

  // Tournament info
  const totalMatches = isTournament && names.length >= 2 ? names.length - 1 : 0;
  const totalQuestionsNeeded = totalMatches * questionsPerMatch;

  const handleStart = useCallback(() => {
    if (!allNamesFilled || !hasEnoughPlayers) return;
    const trimmedNames = names.map(n => n.trim());
    if (isTournament) {
      onStart(trimmedNames, 'tournament', questionsPerMatch, perMatchPacks);
    } else {
      onStart(trimmedNames);
    }
  }, [allNamesFilled, hasEnoughPlayers, names, onStart, isTournament, questionsPerMatch, perMatchPacks]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    // Ensure minimum players for tournament
    if (newMode === 'tournament' && names.length < MIN_TOURNAMENT_PLAYERS) {
      setNames(prev => [...prev, ...Array(MIN_TOURNAMENT_PLAYERS - prev.length).fill('')]);
    }
  }, [names.length]);

  return (
    <div className="host-setup">
      <div className="host-setup__pack-info">
        <h2 className="host-setup__pack-title">{pack?.title || 'Quiz Pack'}</h2>
        <p className="host-setup__pack-meta">
          {questionCount} questions
          {pack?.category && <> &middot; {pack.category}</>}
        </p>
        <button className="host-setup__change-btn" onClick={onChangePack}>
          Change Pack
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="host-setup__mode-toggle">
        <button
          className={`host-setup__mode-btn ${mode === 'standard' ? 'host-setup__mode-btn--active' : ''}`}
          onClick={() => handleModeChange('standard')}
        >
          Standard
        </button>
        <button
          className={`host-setup__mode-btn ${mode === 'tournament' ? 'host-setup__mode-btn--active' : ''}`}
          onClick={() => handleModeChange('tournament')}
        >
          Tournament
        </button>
      </div>

      {isTournament && (
        <p className="host-setup__mode-desc">
          Single-elimination bracket. Teams face off head-to-head — losers are eliminated until one champion remains.
        </p>
      )}

      <h1 className="host-setup__title">
        {isTournament ? 'Team Setup' : 'Player / Team Setup'}
      </h1>

      {/* Tournament settings */}
      {isTournament && (
        <div className="host-setup__tournament-settings">
          <div className="host-setup__setting-row">
            <label className="host-setup__setting-label" htmlFor="qpm">
              Questions per match
            </label>
            <input
              id="qpm"
              className="host-setup__setting-input"
              type="number"
              min={1}
              max={Math.max(1, questionCount)}
              value={questionsPerMatch}
              onChange={e => setQuestionsPerMatch(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="host-setup__setting-row">
            <label className="host-setup__setting-label" htmlFor="per-match-packs">
              Different pack per match
            </label>
            <input
              id="per-match-packs"
              className="host-setup__setting-checkbox"
              type="checkbox"
              checked={perMatchPacks}
              onChange={e => setPerMatchPacks(e.target.checked)}
            />
          </div>
          {perMatchPacks && (
            <p className="host-setup__tournament-info">
              You&apos;ll pick a quiz pack before each match starts.
            </p>
          )}
          {!perMatchPacks && names.length >= 2 && (
            <p className="host-setup__tournament-info">
              {names.length} teams = {totalMatches} matches &middot; {totalQuestionsNeeded} questions needed
              {totalQuestionsNeeded > questionCount && (
                <span className="host-setup__tournament-warning">
                  {' '}(pack has {questionCount} — questions will be reused)
                </span>
              )}
            </p>
          )}
        </div>
      )}

      <div className="host-setup__players">
        {names.map((name, i) => (
          <div key={i} className="host-setup__player-row">
            <span className="host-setup__player-label">
              {isTournament ? `Team ${i + 1}` : `Player / Team ${i + 1}`}
            </span>
            <input
              className="host-setup__player-input"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              placeholder={isTournament ? `Team ${i + 1} name` : `Player / Team ${i + 1} name`}
              maxLength={30}
            />
            {names.length > effectiveMin && (
              <button
                className="host-setup__remove-btn"
                onClick={() => handleRemovePlayer(i)}
                title="Remove"
              >
                &times;
              </button>
            )}
          </div>
        ))}

        {names.length < effectiveMax && (
          <button className="host-setup__add-btn" onClick={handleAddPlayer}>
            + Add more (up to {effectiveMax})
          </button>
        )}
      </div>

      <button
        className="host-setup__start-btn"
        onClick={handleStart}
        disabled={!allNamesFilled || !hasEnoughPlayers}
      >
        {isTournament ? 'Start Tournament' : 'Start Quiz'}
      </button>
    </div>
  );
}
