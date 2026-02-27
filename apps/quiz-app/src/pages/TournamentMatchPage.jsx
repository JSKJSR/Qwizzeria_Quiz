import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { detectMediaType } from '../utils/mediaDetector';
import { getRoundName } from '../utils/tournamentBracket';
import {
  fetchTournament,
  claimTournamentMatch,
  advanceMatchWinner as dbAdvanceMatchWinner,
  completeTournament as dbCompleteTournament,
} from '@qwizzeria/supabase-client/src/tournaments.js';
import { fetchPackPlayQuestions } from '@qwizzeria/supabase-client/src/packs.js';
import HostScoreboard from '../components/host/HostScoreboard';
import HostTopicGrid from '../components/host/HostTopicGrid';
import HostAnswerView from '../components/host/HostAnswerView';
import QuestionView from '../components/QuestionView';
import SEO from '../components/SEO';
import '../styles/HostQuiz.css';

const ACTIONS = {
  INIT: 'INIT',
  SELECT_QUESTION: 'SELECT_QUESTION',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  AWARD_POINTS: 'AWARD_POINTS',
  NO_POINTS: 'NO_POINTS',
  SKIP_QUESTION: 'SKIP_QUESTION',
  ADJUST_SCORE: 'ADJUST_SCORE',
  END_MATCH: 'END_MATCH',
};

const initialState = {
  phase: 'loading', // loading | error | claimed | grid | question | answer | completed
  topics: [],
  participants: [],
  selectedQuestion: null,
  completedQuestionIds: [],
  skippedQuestions: [],
  errorMessage: null,
  matchData: null,
  tournamentData: null,
};

function buildTopicsFromQuestions(questions) {
  const grouped = {};
  const pointLevels = [10, 20, 30];
  for (const q of questions) {
    const cat = q.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(q);
  }
  return Object.entries(grouped).map(([categoryName, qs]) => ({
    name: categoryName,
    questions: qs.map((q, i) => {
      const media = q.media_url ? detectMediaType(q.media_url) : { type: 'none', embedUrl: null };
      return {
        id: q.id,
        topic: categoryName,
        points: q.points != null ? q.points : (pointLevels[i] || (i + 1) * 10),
        question: q.question_text,
        answer: q.answer_text,
        answerExplanation: q.answer_explanation,
        mediaUrl: q.media_url,
        mediaType: media.type,
        embedUrl: media.embedUrl,
      };
    }),
  }));
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT:
      return {
        ...state,
        phase: action.phase || 'grid',
        topics: action.topics,
        participants: action.participants,
        matchData: action.matchData,
        tournamentData: action.tournamentData,
        errorMessage: action.errorMessage || null,
      };

    case ACTIONS.SELECT_QUESTION:
      return { ...state, phase: 'question', selectedQuestion: action.question };

    case ACTIONS.REVEAL_ANSWER:
      return { ...state, phase: 'answer' };

    case ACTIONS.AWARD_POINTS: {
      const { participantIndex } = action;
      const q = state.selectedQuestion;
      const newParticipants = state.participants.map((p, i) =>
        i === participantIndex ? { ...p, score: p.score + q.points } : p
      );
      return {
        ...state,
        phase: 'grid',
        participants: newParticipants,
        completedQuestionIds: [...state.completedQuestionIds, q.id],
        selectedQuestion: null,
      };
    }

    case ACTIONS.NO_POINTS:
      return {
        ...state,
        phase: 'grid',
        completedQuestionIds: [...state.completedQuestionIds, state.selectedQuestion.id],
        selectedQuestion: null,
      };

    case ACTIONS.SKIP_QUESTION:
      return {
        ...state,
        phase: 'grid',
        completedQuestionIds: [...state.completedQuestionIds, state.selectedQuestion.id],
        skippedQuestions: [...state.skippedQuestions, state.selectedQuestion],
        selectedQuestion: null,
      };

    case ACTIONS.ADJUST_SCORE: {
      const { participantIndex: adjIdx, delta } = action;
      const adjParticipants = state.participants.map((p, i) =>
        i === adjIdx ? { ...p, score: p.score + delta } : p
      );
      return { ...state, participants: adjParticipants };
    }

    case ACTIONS.END_MATCH:
      return { ...state, phase: 'completed' };

    default:
      return state;
  }
}

function TieBreakerModal({ team1Name, team2Name, onSelectWinner }) {
  return (
    <div className="tiebreaker-overlay">
      <div className="tiebreaker-modal">
        <h2 className="tiebreaker-modal__title">Tie Breaker</h2>
        <p className="tiebreaker-modal__text">
          The match is tied! Choose the winner:
        </p>
        <div className="tiebreaker-modal__buttons">
          <button className="tiebreaker-modal__btn" onClick={() => onSelectWinner(0)}>
            {team1Name}
          </button>
          <button className="tiebreaker-modal__btn" onClick={() => onSelectWinner(1)}>
            {team2Name}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TournamentMatchPage() {
  const { tournamentId, matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const initRef = useRef(false);
  const [showTieBreaker, setShowTieBreaker] = useState(false);

  // Initialize: fetch tournament, claim match, load questions
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        // 1. Fetch tournament
        const { tournament, matches } = await fetchTournament(tournamentId);
        const matchRow = matches.find(m => m.id === matchId);

        if (!matchRow) {
          dispatch({ type: ACTIONS.INIT, phase: 'error', topics: [], participants: [], matchData: null, tournamentData: null, errorMessage: 'Match not found.' });
          return;
        }

        // Check if match is already completed
        if (matchRow.status === 'completed') {
          dispatch({ type: ACTIONS.INIT, phase: 'completed', topics: [], participants: [], matchData: matchRow, tournamentData: tournament, errorMessage: null });
          return;
        }

        // Check if match is already being played by someone else
        if (matchRow.status === 'in_progress' && matchRow.played_by && matchRow.played_by !== user?.id) {
          dispatch({ type: ACTIONS.INIT, phase: 'error', topics: [], participants: [], matchData: matchRow, tournamentData: tournament, errorMessage: 'This match is being played in another tab.' });
          return;
        }

        // 2. Claim match if pending
        if (matchRow.status === 'pending') {
          const claimed = await claimTournamentMatch(matchId, user?.id);
          if (!claimed) {
            dispatch({ type: ACTIONS.INIT, phase: 'error', topics: [], participants: [], matchData: matchRow, tournamentData: tournament, errorMessage: 'This match is already in progress in another tab.' });
            return;
          }
        }

        // 3. Load pack questions
        const allQuestions = await fetchPackPlayQuestions(tournament.pack_id);

        // 4. Allocate questions for this match from the pool
        const pool = tournament.question_pool || [];
        const qpm = tournament.questions_per_match;
        let matchQuestionIds = matchRow.question_ids || [];

        // If no questions allocated yet, allocate from pool
        if (matchQuestionIds.length === 0) {
          matchQuestionIds = pool.slice(0, qpm);
          // If pool exhausted, pick random from all
          if (matchQuestionIds.length < qpm) {
            const allIds = allQuestions.map(q => q.id);
            const shuffled = [...allIds].sort(() => Math.random() - 0.5);
            matchQuestionIds = [...matchQuestionIds, ...shuffled.slice(0, qpm - matchQuestionIds.length)];
          }
        }

        // Filter to allocated questions
        const matchQuestions = matchQuestionIds
          .map(id => allQuestions.find(q => q.id === id))
          .filter(Boolean);

        const topics = buildTopicsFromQuestions(matchQuestions);

        // Build participants from match teams
        const teams = tournament.bracket?.teams || tournament.team_names.map((name, i) => ({ name, seed: i + 1 }));
        const participants = [
          { name: teams[matchRow.team1_index]?.name || `Team ${matchRow.team1_index + 1}`, score: matchRow.team1_score || 0, teamIndex: matchRow.team1_index },
          { name: teams[matchRow.team2_index]?.name || `Team ${matchRow.team2_index + 1}`, score: matchRow.team2_score || 0, teamIndex: matchRow.team2_index },
        ];

        dispatch({
          type: ACTIONS.INIT,
          phase: 'grid',
          topics,
          participants,
          matchData: matchRow,
          tournamentData: tournament,
        });
      } catch (err) {
        dispatch({ type: ACTIONS.INIT, phase: 'error', topics: [], participants: [], matchData: null, tournamentData: null, errorMessage: err.message });
      }
    }

    init();
  }, [tournamentId, matchId, user]);

  const handleSelectQuestion = useCallback((question) => {
    dispatch({ type: ACTIONS.SELECT_QUESTION, question });
  }, []);

  const handleRevealAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.REVEAL_ANSWER });
  }, []);

  const handleBackToGrid = useCallback(() => {
    dispatch({ type: ACTIONS.NO_POINTS });
  }, []);

  const handleAwardPoints = useCallback((participantIndex) => {
    dispatch({ type: ACTIONS.AWARD_POINTS, participantIndex });
  }, []);

  const handleNoPoints = useCallback(() => {
    dispatch({ type: ACTIONS.NO_POINTS });
  }, []);

  const handleSkipAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.SKIP_QUESTION });
  }, []);

  const handleAdjustScore = useCallback((participantIndex, delta) => {
    dispatch({ type: ACTIONS.ADJUST_SCORE, participantIndex, delta });
  }, []);

  // Persist and end match
  const persistAndEnd = useCallback(async (winnerTeamIndex) => {
    dispatch({ type: ACTIONS.END_MATCH });

    const { matchData, tournamentData, participants, completedQuestionIds, skippedQuestions } = state;
    if (!matchData || !tournamentData) return;

    try {
      // Reconstruct updated bracket
      const bracket = tournamentData.bracket;
      const { round_index: ri, match_index: mi } = matchData;

      // Update match in bracket
      const updatedBracket = { ...bracket };
      const newRounds = updatedBracket.rounds.map((round, rIdx) =>
        round.map((m, mIdx) => {
          if (rIdx === ri && mIdx === mi) {
            return {
              ...m,
              team1Score: participants[0].score,
              team2Score: participants[1].score,
              winnerIndex: winnerTeamIndex,
              status: 'completed',
            };
          }
          return m;
        })
      );
      updatedBracket.rounds = newRounds;
      updatedBracket.completedMatches = (updatedBracket.completedMatches || 0) + 1;

      // Advance winner to next round in bracket
      const nextRound = ri + 1;
      if (nextRound < updatedBracket.rounds.length) {
        const nextMatch = Math.floor(mi / 2);
        const slot = mi % 2 === 0 ? 'team1Index' : 'team2Index';
        updatedBracket.rounds[nextRound][nextMatch][slot] = winnerTeamIndex;
      }

      // Mark loser eliminated
      const match = bracket.rounds[ri][mi];
      const loserIdx = match.team1Index === winnerTeamIndex ? match.team2Index : match.team1Index;
      if (updatedBracket.teams[loserIdx]) {
        updatedBracket.teams = updatedBracket.teams.map((t, i) =>
          i === loserIdx ? { ...t, eliminated: true } : t
        );
      }

      // Remove used questions from pool
      const usedIds = new Set(completedQuestionIds);
      const updatedPool = (tournamentData.question_pool || []).filter(id => !usedIds.has(id));

      await dbAdvanceMatchWinner({
        tournamentId,
        matchId,
        roundIndex: ri,
        matchIndex: mi,
        winnerIndex: winnerTeamIndex,
        team1Score: participants[0].score,
        team2Score: participants[1].score,
        completedQuestionIds,
        skippedQuestions,
        updatedBracket,
        updatedQuestionPool: updatedPool,
      });

      // Check if tournament is complete (final match)
      const finalRound = updatedBracket.rounds[updatedBracket.rounds.length - 1];
      const isFinal = finalRound && finalRound.length === 1 && finalRound[0].winnerIndex !== null;
      if (isFinal) {
        await dbCompleteTournament(tournamentId, winnerTeamIndex);
      }
    } catch (err) {
      console.warn('Failed to persist match result:', err);
    }
  }, [state, tournamentId, matchId]);

  const participantsRef = useRef(state.participants);
  useEffect(() => {
    participantsRef.current = state.participants;
  }, [state.participants]);

  const handleEndMatch = useCallback(() => {
    const p = participantsRef.current;
    if (p.length !== 2) return;

    if (p[0].score === p[1].score) {
      setShowTieBreaker(true);
    } else {
      const winnerIdx = p[0].score > p[1].score ? 0 : 1;
      persistAndEnd(p[winnerIdx].teamIndex);
    }
  }, [persistAndEnd]);

  const handleTieBreakerSelect = useCallback((participantIdx) => {
    setShowTieBreaker(false);
    const p = participantsRef.current;
    persistAndEnd(p[participantIdx].teamIndex);
  }, [persistAndEnd]);

  const { phase, topics, participants, selectedQuestion, completedQuestionIds, skippedQuestions, errorMessage, matchData, tournamentData } = state;

  // Round/match label
  const roundName = matchData && tournamentData
    ? getRoundName(tournamentData.bracket?.rounds?.length || 1, matchData.round_index)
    : '';
  const matchLabel = matchData ? `${roundName} — Match ${matchData.match_index + 1}` : '';

  // --- Loading ---
  if (phase === 'loading') {
    return (
      <div className="host-quiz host-quiz--fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SEO title="Tournament Match" noIndex />
        <div style={{ textAlign: 'center', color: 'var(--text-secondary, #b0a0a5)' }}>
          <div className="host-pack-select__spinner" />
          <p>Loading match...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (phase === 'error') {
    return (
      <div className="host-quiz host-quiz--fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SEO title="Tournament Match" noIndex />
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{errorMessage}</p>
          <button
            className="host-results__btn host-results__btn--secondary"
            onClick={() => navigate(`/host/tournament/${tournamentId}`)}
          >
            Return to Bracket
          </button>
        </div>
      </div>
    );
  }

  // --- Completed ---
  if (phase === 'completed') {
    const winner = participants.length === 2
      ? (participants[0].score >= participants[1].score ? participants[0] : participants[1])
      : null;

    return (
      <div className="host-quiz host-quiz--fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SEO title="Match Complete" noIndex />
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Match Complete</h2>
          {matchLabel && <p style={{ color: 'var(--accent-primary, #e85c1a)', fontSize: '0.85rem', marginBottom: '1rem' }}>{matchLabel}</p>}
          {winner && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>&#127942;</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffd700' }}>{winner.name}</div>
              {participants.length === 2 && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {participants[0].name} {participants[0].score} - {participants[1].score} {participants[1].name}
                </p>
              )}
            </div>
          )}
          <button
            className="host-results__btn host-results__btn--primary"
            onClick={() => navigate(`/host/tournament/${tournamentId}`)}
          >
            Return to Bracket
          </button>
        </div>
      </div>
    );
  }

  // --- Match play: grid, question, answer ---
  return (
    <div className="host-quiz host-quiz--fullscreen">
      <SEO title={`Match: ${matchLabel}`} noIndex />
      <HostScoreboard
        participants={participants}
        onEndQuiz={handleEndMatch}
        onAdjustScore={handleAdjustScore}
        showEndQuiz={phase === 'grid'}
        endButtonLabel="END MATCH"
        matchLabel={matchLabel}
      />

      {phase === 'grid' && (
        <HostTopicGrid
          topics={topics}
          completedQuestionIds={completedQuestionIds}
          skippedQuestionIds={skippedQuestions.map(q => q.id)}
          onSelectQuestion={handleSelectQuestion}
        />
      )}

      {phase === 'question' && selectedQuestion && (
        <QuestionView
          question={selectedQuestion}
          onRevealAnswer={handleRevealAnswer}
          onBack={handleBackToGrid}
          onSkip={handleSkipAnswer}
        />
      )}

      {phase === 'answer' && selectedQuestion && (
        <HostAnswerView
          question={selectedQuestion}
          participants={participants}
          onAwardPoints={handleAwardPoints}
          onNoPoints={handleNoPoints}
          onSkipAnswer={handleSkipAnswer}
        />
      )}

      {showTieBreaker && participants.length === 2 && (
        <TieBreakerModal
          team1Name={participants[0].name}
          team2Name={participants[1].name}
          onSelectWinner={handleTieBreakerSelect}
        />
      )}
    </div>
  );
}
