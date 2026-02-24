import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { detectMediaType } from '../../utils/mediaDetector';
import { saveHostSession, loadHostSession, clearHostSession } from '../../utils/hostSessionPersistence';
import { saveHostQuizSession } from '@qwizzeria/supabase-client/src/questions.js';
import {
  createTournament as dbCreateTournament,
  advanceMatchWinner as dbAdvanceMatchWinner,
  completeTournament as dbCompleteTournament,
} from '@qwizzeria/supabase-client/src/tournaments.js';
import {
  generateBracket,
  advanceWinner,
  allocateMatchQuestions,
  isMatchPlayable,
  isTournamentComplete,
  getChampion,
  getRoundName,
} from '../../utils/tournamentBracket';
import HostPackSelect from './HostPackSelect';
import HostParticipantSetup from './HostParticipantSetup';
import HostTopicGrid from './HostTopicGrid';
import HostScoreboard from './HostScoreboard';
import HostAnswerView from './HostAnswerView';
import HostResultsView from './HostResultsView';
import HostQuestionReview from './HostQuestionReview';
import TournamentBracket from './TournamentBracket';
import QuestionView from '../QuestionView';
import '../../styles/HostQuiz.css';

const ACTIONS = {
  SELECT_PACK: 'SELECT_PACK',
  START_QUIZ: 'START_QUIZ',
  SELECT_QUESTION: 'SELECT_QUESTION',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  AWARD_POINTS: 'AWARD_POINTS',
  NO_POINTS: 'NO_POINTS',
  SKIP_QUESTION: 'SKIP_QUESTION',
  ADJUST_SCORE: 'ADJUST_SCORE',
  END_QUIZ: 'END_QUIZ',
  CONFIRM_END_QUIZ: 'CONFIRM_END_QUIZ',
  PLAY_AGAIN: 'PLAY_AGAIN',
  RESET_QUIZ: 'RESET_QUIZ',
  RESTORE_SESSION: 'RESTORE_SESSION',
  // Tournament actions
  START_TOURNAMENT: 'START_TOURNAMENT',
  SELECT_MATCH: 'SELECT_MATCH',
  MATCH_SELECT_QUESTION: 'MATCH_SELECT_QUESTION',
  MATCH_REVEAL_ANSWER: 'MATCH_REVEAL_ANSWER',
  MATCH_AWARD_POINTS: 'MATCH_AWARD_POINTS',
  MATCH_NO_POINTS: 'MATCH_NO_POINTS',
  MATCH_SKIP_QUESTION: 'MATCH_SKIP_QUESTION',
  MATCH_ADJUST_SCORE: 'MATCH_ADJUST_SCORE',
  END_MATCH: 'END_MATCH',
  DECLARE_WINNER: 'DECLARE_WINNER',
  SET_TOURNAMENT_ID: 'SET_TOURNAMENT_ID',
  END_TOURNAMENT: 'END_TOURNAMENT',
};

const initialState = {
  phase: 'packSelect', // packSelect | setup | grid | question | answer | review | results | bracket | matchGrid | matchQuestion | matchAnswer | tournamentResults
  pack: null,
  topics: [],
  allQuestions: [],
  participants: [],
  selectedQuestion: null,
  completedQuestionIds: [],
  skippedQuestions: [],
  // Tournament state
  mode: 'standard',
  tournament: null,
  tournamentId: null, // DB ID for persistence
  currentMatch: null, // { roundIndex, matchIndex }
  matchTopics: [],
  matchParticipants: [],
  matchCompletedQuestionIds: [],
  matchSkippedQuestions: [],
};

/**
 * Build topics from flat question list. Groups by category
 * and assigns ascending point values per category.
 */
function buildTopics(questions) {
  const grouped = {};
  for (const q of questions) {
    const cat = q.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(q);
  }

  const pointLevels = [10, 20, 30, 40, 50];

  return Object.entries(grouped).map(([categoryName, qs]) => ({
    name: categoryName,
    questions: qs.map((q, i) => {
      const media = q.mediaUrl ? detectMediaType(q.mediaUrl) : { type: 'none', embedUrl: null };
      return {
        id: q.id,
        topic: categoryName,
        points: q.points != null ? q.points : (pointLevels[i] || (i + 1) * 10),
        question: q.question_text,
        answer: q.answer_text,
        answerExplanation: q.answer_explanation,
        mediaUrl: q.mediaUrl || q.media_url,
        mediaType: media.type,
        embedUrl: media.embedUrl,
      };
    }),
  }));
}

/**
 * Build match-scoped topics from a subset of questions.
 */
function buildMatchTopics(allocatedQuestions) {
  const grouped = {};
  const pointLevels = [10, 20, 30];
  for (const q of allocatedQuestions) {
    const cat = q.topic || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(q);
  }
  return Object.entries(grouped).map(([categoryName, qs]) => ({
    name: categoryName,
    questions: qs.map((q, i) => ({
      ...q,
      points: q.points != null ? q.points : (pointLevels[i] || (i + 1) * 10),
    })),
  }));
}

function reducer(state, action) {
  switch (action.type) {
    // ===== Standard mode (unchanged) =====
    case ACTIONS.SELECT_PACK:
      return {
        ...state,
        phase: 'setup',
        pack: action.pack,
        topics: buildTopics(action.questions),
        allQuestions: action.questions,
      };

    case ACTIONS.START_QUIZ:
      return {
        ...state,
        phase: 'grid',
        participants: action.participants.map(name => ({ name, score: 0 })),
        completedQuestionIds: [],
        skippedQuestions: [],
        selectedQuestion: null,
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

    case ACTIONS.END_QUIZ:
      return { ...state, phase: 'review' };

    case ACTIONS.CONFIRM_END_QUIZ:
      return { ...state, phase: 'results' };

    case ACTIONS.PLAY_AGAIN:
      return {
        ...state,
        phase: 'grid',
        participants: state.participants.map(p => ({ ...p, score: 0 })),
        completedQuestionIds: [],
        skippedQuestions: [],
        selectedQuestion: null,
      };

    case ACTIONS.RESET_QUIZ:
      return { ...initialState };

    case ACTIONS.RESTORE_SESSION:
      return {
        ...action.savedState,
      };

    // ===== Tournament mode =====
    case ACTIONS.START_TOURNAMENT: {
      const { participants, questionsPerMatch } = action;
      const allTopicQuestions = state.topics.flatMap(t => t.questions);
      const bracket = generateBracket(participants, questionsPerMatch, allTopicQuestions);
      return {
        ...state,
        phase: 'bracket',
        mode: 'tournament',
        tournament: bracket,
        participants: participants.map(name => ({ name, score: 0 })),
      };
    }

    case ACTIONS.SELECT_MATCH: {
      const { roundIndex, matchIndex } = action;
      const tournament = state.tournament;
      const match = tournament.rounds[roundIndex][matchIndex];
      if (!isMatchPlayable(match)) return state;

      // Allocate questions from pool
      const { allocatedQuestions, remainingPool } = allocateMatchQuestions(
        tournament.questionPool,
        tournament.questionsPerMatch,
        state.topics
      );

      // If pool exhausted, refill from all questions (with shuffle)
      let pool = remainingPool;
      let questions = allocatedQuestions;
      if (questions.length < tournament.questionsPerMatch) {
        const allQIds = state.topics.flatMap(t => t.questions).map(q => q.id);
        const reshuffled = [...allQIds].sort(() => Math.random() - 0.5);
        const extra = allocateMatchQuestions(
          reshuffled,
          tournament.questionsPerMatch - questions.length,
          state.topics
        );
        questions = [...questions, ...extra.allocatedQuestions];
        pool = extra.remainingPool;
      }

      const matchTopics = buildMatchTopics(questions);

      // Mark match as in_progress in bracket
      const newRounds = tournament.rounds.map((round, ri) =>
        round.map((m, mi) =>
          ri === roundIndex && mi === matchIndex
            ? { ...m, status: 'in_progress' }
            : m
        )
      );

      const matchParticipants = [
        { name: tournament.teams[match.team1Index].name, score: 0, teamIndex: match.team1Index },
        { name: tournament.teams[match.team2Index].name, score: 0, teamIndex: match.team2Index },
      ];

      return {
        ...state,
        phase: 'matchGrid',
        tournament: { ...tournament, rounds: newRounds, questionPool: pool },
        currentMatch: { roundIndex, matchIndex },
        matchTopics,
        matchParticipants,
        matchCompletedQuestionIds: [],
        matchSkippedQuestions: [],
        selectedQuestion: null,
      };
    }

    case ACTIONS.MATCH_SELECT_QUESTION:
      return { ...state, phase: 'matchQuestion', selectedQuestion: action.question };

    case ACTIONS.MATCH_REVEAL_ANSWER:
      return { ...state, phase: 'matchAnswer' };

    case ACTIONS.MATCH_AWARD_POINTS: {
      const { participantIndex } = action;
      const q = state.selectedQuestion;
      const newMatchParticipants = state.matchParticipants.map((p, i) =>
        i === participantIndex ? { ...p, score: p.score + q.points } : p
      );
      return {
        ...state,
        phase: 'matchGrid',
        matchParticipants: newMatchParticipants,
        matchCompletedQuestionIds: [...state.matchCompletedQuestionIds, q.id],
        selectedQuestion: null,
      };
    }

    case ACTIONS.MATCH_NO_POINTS:
      return {
        ...state,
        phase: 'matchGrid',
        matchCompletedQuestionIds: [...state.matchCompletedQuestionIds, state.selectedQuestion.id],
        selectedQuestion: null,
      };

    case ACTIONS.MATCH_SKIP_QUESTION:
      return {
        ...state,
        phase: 'matchGrid',
        matchCompletedQuestionIds: [...state.matchCompletedQuestionIds, state.selectedQuestion.id],
        matchSkippedQuestions: [...state.matchSkippedQuestions, state.selectedQuestion],
        selectedQuestion: null,
      };

    case ACTIONS.MATCH_ADJUST_SCORE: {
      const { participantIndex: adjIdx, delta } = action;
      const adjMatchParticipants = state.matchParticipants.map((p, i) =>
        i === adjIdx ? { ...p, score: p.score + delta } : p
      );
      return { ...state, matchParticipants: adjMatchParticipants };
    }

    case ACTIONS.END_MATCH: {
      const { winnerTeamIndex } = action;
      const { roundIndex, matchIndex } = state.currentMatch;

      // Update match scores in bracket
      const updatedRounds = state.tournament.rounds.map((round, ri) =>
        round.map((m, mi) => {
          if (ri === roundIndex && mi === matchIndex) {
            return {
              ...m,
              team1Score: state.matchParticipants[0].score,
              team2Score: state.matchParticipants[1].score,
            };
          }
          return m;
        })
      );
      const updatedTournament = { ...state.tournament, rounds: updatedRounds };

      // Advance winner
      const newBracket = advanceWinner(updatedTournament, roundIndex, matchIndex, winnerTeamIndex);

      // Check if tournament is complete
      const complete = isTournamentComplete(newBracket);

      return {
        ...state,
        phase: complete ? 'tournamentResults' : 'bracket',
        tournament: newBracket,
        currentMatch: null,
        matchTopics: [],
        matchParticipants: [],
        matchCompletedQuestionIds: [],
        matchSkippedQuestions: [],
        selectedQuestion: null,
      };
    }

    case ACTIONS.END_TOURNAMENT:
      return { ...state, phase: 'tournamentResults' };

    case ACTIONS.SET_TOURNAMENT_ID:
      return { ...state, tournamentId: action.tournamentId };

    default:
      return state;
  }
}

// Tie-breaker modal component
function TieBreakerModal({ team1Name, team2Name, onSelectWinner }) {
  return (
    <div className="tiebreaker-overlay">
      <div className="tiebreaker-modal">
        <h2 className="tiebreaker-modal__title">Tie Breaker</h2>
        <p className="tiebreaker-modal__text">
          The match is tied! Choose the winner:
        </p>
        <div className="tiebreaker-modal__buttons">
          <button
            className="tiebreaker-modal__btn"
            onClick={() => onSelectWinner(0)}
          >
            {team1Name}
          </button>
          <button
            className="tiebreaker-modal__btn"
            onClick={() => onSelectWinner(1)}
          >
            {team2Name}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tournament results component
function TournamentResultsView({ tournament, onNewTournament, onNewQuiz }) {
  const champion = getChampion(tournament);
  const { teams, rounds } = tournament;

  // Build match results summary
  const matchResults = [];
  for (let ri = 0; ri < rounds.length; ri++) {
    for (let mi = 0; mi < rounds[ri].length; mi++) {
      const m = rounds[ri][mi];
      if (m.status === 'completed' && m.winnerIndex !== null) {
        matchResults.push({
          round: getRoundName(rounds.length, ri),
          team1: teams[m.team1Index]?.name || 'BYE',
          team2: teams[m.team2Index]?.name || 'BYE',
          team1Score: m.team1Score,
          team2Score: m.team2Score,
          winner: teams[m.winnerIndex].name,
        });
      }
    }
  }

  return (
    <div className="tournament-results">
      <div className="tournament-results__champion-section">
        <div className="tournament-results__trophy">&#127942;</div>
        <h1 className="tournament-results__title">Tournament Champion</h1>
        {champion !== null && (
          <div className="tournament-results__champion-name">
            {teams[champion].name}
          </div>
        )}
      </div>

      {/* Full bracket recap */}
      <TournamentBracket bracket={tournament} />

      <div className="tournament-results__matches">
        <h3 className="tournament-results__matches-title">Match Results</h3>
        {matchResults.map((m, i) => (
          <div key={i} className="tournament-results__match-row">
            <span className="tournament-results__match-round">{m.round}</span>
            <span className="tournament-results__match-teams">
              <span className={m.winner === m.team1 ? 'tournament-results__match-winner' : ''}>
                {m.team1}
              </span>
              {' '}{m.team1Score} - {m.team2Score}{' '}
              <span className={m.winner === m.team2 ? 'tournament-results__match-winner' : ''}>
                {m.team2}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="tournament-results__actions">
        <button className="host-results__btn host-results__btn--primary" onClick={onNewTournament}>
          New Tournament
        </button>
        <button className="host-results__btn host-results__btn--secondary" onClick={onNewQuiz}>
          New Quiz
        </button>
      </div>
    </div>
  );
}

export default function HostQuiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimerRef = useRef(null);
  const restoredRef = useRef(false);
  const [showTieBreaker, setShowTieBreaker] = useState(false);

  // Attempt session restore on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadHostSession();
    if (saved && saved.phase !== 'packSelect' && saved.phase !== 'review' && saved.phase !== 'results' && saved.phase !== 'tournamentResults') {
      // Tournament mode: redirect to bracket page (DB is source of truth)
      if (saved.mode === 'tournament' && saved.tournamentId) {
        const resume = window.confirm('You have an active tournament. Return to the bracket?');
        if (resume) {
          clearHostSession();
          navigate(`/host/tournament/${saved.tournamentId}`);
        } else {
          clearHostSession();
        }
        return;
      }
      const resume = window.confirm('You have an unfinished host quiz session. Resume where you left off?');
      if (resume) {
        dispatch({ type: ACTIONS.RESTORE_SESSION, savedState: saved });
      } else {
        clearHostSession();
      }
    }
  }, [navigate]);

  // Debounced session persistence
  useEffect(() => {
    if (state.phase === 'packSelect' || state.phase === 'review' || state.phase === 'results' || state.phase === 'tournamentResults') return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (state.mode === 'tournament' && state.tournamentId) {
        // Tournament mode: save only lightweight ref — DB is source of truth
        saveHostSession({
          mode: 'tournament',
          tournamentId: state.tournamentId,
          phase: state.phase,
          pack: state.pack,
        });
      } else {
        saveHostSession(state);
      }
    }, 300);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  // Persist new tournament to DB when bracket phase starts without a DB ID
  useEffect(() => {
    if (state.phase !== 'bracket' || !state.tournament || state.tournamentId) return;
    if (!user?.id || !state.pack?.id) return;

    dbCreateTournament({
      userId: user.id,
      packId: state.pack.id,
      teamNames: state.tournament.teams.map(t => t.name),
      questionsPerMatch: state.tournament.questionsPerMatch,
      bracket: state.tournament,
      questionPool: state.tournament.questionPool,
    })
      .then(tournament => {
        dispatch({ type: ACTIONS.SET_TOURNAMENT_ID, tournamentId: tournament.id });
      })
      .catch(err => console.warn('Failed to persist tournament to DB:', err));
  }, [state.phase, state.tournament, state.tournamentId, user, state.pack]);

  // --- Standard mode handlers (unchanged) ---
  const handleSelectPack = useCallback((pack, questions) => {
    dispatch({ type: ACTIONS.SELECT_PACK, pack, questions });
  }, []);

  const handleStartQuiz = useCallback((participants, mode, questionsPerMatch) => {
    if (mode === 'tournament') {
      dispatch({ type: ACTIONS.START_TOURNAMENT, participants, questionsPerMatch });
      // DB persistence happens after state update via effect
    } else {
      dispatch({ type: ACTIONS.START_QUIZ, participants });
    }
  }, []);

  const handleChangePack = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_QUIZ });
  }, []);

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

  const handleEndQuiz = useCallback(() => {
    dispatch({ type: ACTIONS.END_QUIZ });
  }, []);

  const handleConfirmEndQuiz = useCallback(() => {
    if (user?.id && state.pack?.id) {
      saveHostQuizSession({
        userId: user.id,
        packId: state.pack.id,
        participants: state.participants,
        completedQuestionIds: state.completedQuestionIds,
      }).catch(err => console.warn('Failed to save host quiz session:', err));
    }
    dispatch({ type: ACTIONS.CONFIRM_END_QUIZ });
    clearHostSession();
  }, [user, state.pack, state.participants, state.completedQuestionIds]);

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: ACTIONS.PLAY_AGAIN });
  }, []);

  const handleNewQuiz = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_QUIZ });
    clearHostSession();
  }, []);

  // --- Tournament mode handlers ---
  const handleSelectMatch = useCallback((roundIndex, matchIndex) => {
    dispatch({ type: ACTIONS.SELECT_MATCH, roundIndex, matchIndex });
  }, []);

  const handleMatchSelectQuestion = useCallback((question) => {
    dispatch({ type: ACTIONS.MATCH_SELECT_QUESTION, question });
  }, []);

  const handleMatchRevealAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.MATCH_REVEAL_ANSWER });
  }, []);

  const handleMatchBackToGrid = useCallback(() => {
    dispatch({ type: ACTIONS.MATCH_NO_POINTS });
  }, []);

  const handleMatchAwardPoints = useCallback((participantIndex) => {
    dispatch({ type: ACTIONS.MATCH_AWARD_POINTS, participantIndex });
  }, []);

  const handleMatchNoPoints = useCallback(() => {
    dispatch({ type: ACTIONS.MATCH_NO_POINTS });
  }, []);

  const handleMatchSkipAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.MATCH_SKIP_QUESTION });
  }, []);

  const handleMatchAdjustScore = useCallback((participantIndex, delta) => {
    dispatch({ type: ACTIONS.MATCH_ADJUST_SCORE, participantIndex, delta });
  }, []);

  const matchParticipantsRef = useRef(state.matchParticipants);
  useEffect(() => {
    matchParticipantsRef.current = state.matchParticipants;
  }, [state.matchParticipants]);

  // Persist match result to DB after dispatch
  const persistMatchResult = useCallback((winnerTeamIndex, mp) => {
    dispatch({ type: ACTIONS.END_MATCH, winnerTeamIndex });

    // Async DB persistence (non-blocking)
    if (state.tournamentId && state.currentMatch) {
      const { roundIndex, matchIndex } = state.currentMatch;
      const matchId = `${state.tournamentId}-m-${roundIndex}-${matchIndex}`;

      // We need the updated bracket — compute it here to persist
      const updatedRounds = state.tournament.rounds.map((round, ri) =>
        round.map((m, mi) => {
          if (ri === roundIndex && mi === matchIndex) {
            return { ...m, team1Score: mp[0].score, team2Score: mp[1].score };
          }
          return m;
        })
      );
      const tempBracket = { ...state.tournament, rounds: updatedRounds };
      const advancedBracket = advanceWinner(tempBracket, roundIndex, matchIndex, winnerTeamIndex);
      const isComplete = isTournamentComplete(advancedBracket);

      dbAdvanceMatchWinner({
        tournamentId: state.tournamentId,
        matchId,
        roundIndex,
        matchIndex,
        winnerIndex: winnerTeamIndex,
        team1Score: mp[0].score,
        team2Score: mp[1].score,
        completedQuestionIds: state.matchCompletedQuestionIds,
        skippedQuestions: state.matchSkippedQuestions,
        updatedBracket: advancedBracket,
        updatedQuestionPool: state.tournament.questionPool,
      })
        .then(() => {
          if (isComplete) {
            const champion = getChampion(advancedBracket);
            return dbCompleteTournament(state.tournamentId, champion);
          }
        })
        .catch(err => console.warn('Failed to persist match result:', err));
    }
  }, [state.tournamentId, state.currentMatch, state.tournament, state.matchCompletedQuestionIds, state.matchSkippedQuestions]);

  const handleEndMatch = useCallback(() => {
    const mp = matchParticipantsRef.current;
    if (mp.length !== 2) return;

    const score1 = mp[0].score;
    const score2 = mp[1].score;

    if (score1 === score2) {
      setShowTieBreaker(true);
    } else {
      const winnerIdx = score1 > score2 ? 0 : 1;
      persistMatchResult(mp[winnerIdx].teamIndex, mp);
    }
  }, [persistMatchResult]);

  const handleTieBreakerSelect = useCallback((participantIdx) => {
    setShowTieBreaker(false);
    const mp = matchParticipantsRef.current;
    persistMatchResult(mp[participantIdx].teamIndex, mp);
  }, [persistMatchResult]);

  const handleNewTournament = useCallback(() => {
    dispatch({ type: ACTIONS.RESTORE_SESSION, savedState: { ...initialState, phase: 'setup', pack: state.pack, topics: state.topics, allQuestions: state.allQuestions } });
    clearHostSession();
  }, [state.pack, state.topics, state.allQuestions]);

  const { phase, pack, topics, participants, selectedQuestion, completedQuestionIds, skippedQuestions } = state;

  // --- Pack Selection ---
  if (phase === 'packSelect') {
    return (
      <div className="host-quiz">
        <HostPackSelect onSelectPack={handleSelectPack} />
      </div>
    );
  }

  // --- Participant Setup ---
  if (phase === 'setup') {
    const totalQuestions = topics.flatMap(t => t.questions).length;
    return (
      <div className="host-quiz">
        <HostParticipantSetup
          pack={pack}
          questionCount={totalQuestions}
          onStart={handleStartQuiz}
          onChangePack={handleChangePack}
        />
      </div>
    );
  }

  // --- Question Review (before results) ---
  if (phase === 'review') {
    return (
      <div className="host-quiz host-quiz--fullscreen">
        <HostScoreboard
          participants={participants}
          onEndQuiz={handleEndQuiz}
          onAdjustScore={handleAdjustScore}
          showEndQuiz={false}
        />
        <HostQuestionReview
          topics={topics}
          completedQuestionIds={completedQuestionIds}
          skippedQuestions={skippedQuestions}
          onConfirmEnd={handleConfirmEndQuiz}
        />
      </div>
    );
  }

  // --- Standard Results ---
  if (phase === 'results') {
    return (
      <div className="host-quiz host-quiz--fullscreen">
        <HostResultsView
          participants={participants}
          skippedQuestions={skippedQuestions}
          onPlayAgain={handlePlayAgain}
          onNewQuiz={handleNewQuiz}
        />
      </div>
    );
  }

  // --- Tournament Bracket ---
  if (phase === 'bracket') {
    return (
      <div className="host-quiz host-quiz--fullscreen">
        {state.tournamentId && (
          <div className="tournament-toolbar">
            <button
              className="tournament-toolbar__btn"
              onClick={() => window.open(`/host/tournament/${state.tournamentId}`, '_blank')}
            >
              Open Bracket in New Tab
            </button>
            <button
              className="tournament-toolbar__btn tournament-toolbar__btn--secondary"
              onClick={handleNewQuiz}
            >
              Exit Tournament
            </button>
          </div>
        )}
        <TournamentBracket
          bracket={state.tournament}
          onSelectMatch={handleSelectMatch}
          onOpenInNewTab={state.tournamentId ? ((ri, mi) => {
            const matchId = `${state.tournamentId}-m-${ri}-${mi}`;
            window.open(`/host/tournament/${state.tournamentId}/match/${matchId}`, '_blank');
          }) : undefined}
        />
      </div>
    );
  }

  // --- Tournament Results ---
  if (phase === 'tournamentResults') {
    return (
      <div className="host-quiz host-quiz--fullscreen">
        <TournamentResultsView
          tournament={state.tournament}
          onNewTournament={handleNewTournament}
          onNewQuiz={handleNewQuiz}
        />
      </div>
    );
  }

  // --- Match screens (matchGrid, matchQuestion, matchAnswer) ---
  if (phase === 'matchGrid' || phase === 'matchQuestion' || phase === 'matchAnswer') {
    const { currentMatch, matchParticipants, matchTopics: mTopics, matchCompletedQuestionIds, matchSkippedQuestions: mSkipped } = state;
    const roundName = currentMatch
      ? getRoundName(state.tournament.rounds.length, currentMatch.roundIndex)
      : '';
    const matchLabel = `${roundName} — Match ${(currentMatch?.matchIndex || 0) + 1}`;

    return (
      <div className="host-quiz host-quiz--fullscreen">
        <HostScoreboard
          participants={matchParticipants}
          onEndQuiz={handleEndMatch}
          onAdjustScore={handleMatchAdjustScore}
          showEndQuiz={phase === 'matchGrid'}
          endButtonLabel="END MATCH"
          matchLabel={matchLabel}
        />

        {phase === 'matchGrid' && (
          <HostTopicGrid
            topics={mTopics}
            completedQuestionIds={matchCompletedQuestionIds}
            skippedQuestionIds={mSkipped.map(q => q.id)}
            onSelectQuestion={handleMatchSelectQuestion}
          />
        )}

        {phase === 'matchQuestion' && selectedQuestion && (
          <QuestionView
            question={selectedQuestion}
            onRevealAnswer={handleMatchRevealAnswer}
            onBack={handleMatchBackToGrid}
            onSkip={handleMatchSkipAnswer}
          />
        )}

        {phase === 'matchAnswer' && selectedQuestion && (
          <HostAnswerView
            question={selectedQuestion}
            participants={matchParticipants}
            onAwardPoints={handleMatchAwardPoints}
            onNoPoints={handleMatchNoPoints}
            onSkipAnswer={handleMatchSkipAnswer}
          />
        )}

        {showTieBreaker && matchParticipants.length === 2 && (
          <TieBreakerModal
            team1Name={matchParticipants[0].name}
            team2Name={matchParticipants[1].name}
            onSelectWinner={handleTieBreakerSelect}
          />
        )}
      </div>
    );
  }

  // --- Standard game screens: grid, question, answer ---
  return (
    <div className="host-quiz host-quiz--fullscreen">
      <HostScoreboard
        participants={participants}
        onEndQuiz={handleEndQuiz}
        onAdjustScore={handleAdjustScore}
        showEndQuiz={phase === 'grid'}
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
    </div>
  );
}
