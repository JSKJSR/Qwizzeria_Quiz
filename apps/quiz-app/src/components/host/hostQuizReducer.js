import { detectMediaType } from '@/utils/mediaDetector';
import {
  generateBracket,
  advanceWinner,
  allocateMatchQuestions,
  isMatchPlayable,
  isTournamentComplete,
} from '@/utils/tournamentBracket';

export const ACTIONS = {
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
  SELECT_MATCH_PACK: 'SELECT_MATCH_PACK',
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

export const initialState = {
  phase: 'packSelect', // packSelect | setup | grid | question | answer | review | results | bracket | matchPackSelect | matchGrid | matchQuestion | matchAnswer | tournamentResults
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
  // Per-match pack state
  matchPacks: {}, // { [matchKey]: { packId, packTitle, topics, questionPool, _persisted } }
  pendingMatch: null, // { roundIndex, matchIndex } — awaiting pack selection
};

/**
 * Build topics from flat question list. Groups by category
 * and assigns ascending point values per category.
 */
export function buildTopics(questions) {
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
      const rawMediaUrl = q.media_url || q.mediaUrl;
      const media = rawMediaUrl ? detectMediaType(rawMediaUrl) : { type: 'none', embedUrl: null };
      return {
        id: q.id,
        topic: q.display_title || categoryName,
        points: q.points != null ? q.points : (pointLevels[i] || (i + 1) * 10),
        question: q.question_text,
        answer: q.answer_text,
        answerExplanation: q.answer_explanation,
        mediaUrl: rawMediaUrl,
        mediaType: media.type,
        embedUrl: media.embedUrl,
      };
    }),
  }));
}

/**
 * Build match-scoped topics from a subset of questions.
 */
export function buildMatchTopics(allocatedQuestions) {
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

export function reducer(state, action) {
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
      const { participants, questionsPerMatch, perMatchPacks } = action;
      // Per-match mode: pass null for questions so bracket gets empty pool
      const allTopicQuestions = perMatchPacks ? null : state.topics.flatMap(t => t.questions);
      const bracket = generateBracket(participants, questionsPerMatch, allTopicQuestions);
      return {
        ...state,
        phase: 'bracket',
        mode: 'tournament',
        tournament: bracket,
        participants: participants.map(name => ({ name, score: 0 })),
        matchPacks: {},
        pendingMatch: null,
      };
    }

    case ACTIONS.SELECT_MATCH: {
      const { roundIndex, matchIndex } = action;
      const tournament = state.tournament;
      const match = tournament.rounds[roundIndex][matchIndex];
      if (!isMatchPlayable(match)) return state;

      // Per-match pack mode: if no pack assigned yet, go to pack selection
      if (tournament.perMatchPacks) {
        const matchKey = `r${roundIndex}-m${matchIndex}`;
        if (!state.matchPacks[matchKey]) {
          return {
            ...state,
            phase: 'matchPackSelect',
            pendingMatch: { roundIndex, matchIndex },
          };
        }
        // Pack already chosen — allocate from match-specific pool
        const matchPackData = state.matchPacks[matchKey];
        const { allocatedQuestions, remainingPool } = allocateMatchQuestions(
          matchPackData.questionPool,
          tournament.questionsPerMatch,
          matchPackData.topics
        );
        const matchTopics = buildMatchTopics(allocatedQuestions);
        const updatedMatchPacks = {
          ...state.matchPacks,
          [matchKey]: { ...matchPackData, questionPool: remainingPool },
        };
        const newRounds = tournament.rounds.map((round, ri) =>
          round.map((m, mi) =>
            ri === roundIndex && mi === matchIndex ? { ...m, status: 'in_progress' } : m
          )
        );
        const matchParticipants = [
          { name: tournament.teams[match.team1Index].name, score: 0, teamIndex: match.team1Index },
          { name: tournament.teams[match.team2Index].name, score: 0, teamIndex: match.team2Index },
        ];
        return {
          ...state,
          phase: 'matchGrid',
          tournament: { ...tournament, rounds: newRounds },
          currentMatch: { roundIndex, matchIndex },
          matchTopics,
          matchParticipants,
          matchCompletedQuestionIds: [],
          matchSkippedQuestions: [],
          matchPacks: updatedMatchPacks,
          pendingMatch: null,
          selectedQuestion: null,
        };
      }

      // Standard single-pack mode: allocate questions from shared pool
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

    case ACTIONS.SELECT_MATCH_PACK: {
      const { roundIndex, matchIndex, pack, questions } = action;
      const matchKey = `r${roundIndex}-m${matchIndex}`;
      const tournament = state.tournament;
      const match = tournament.rounds[roundIndex][matchIndex];

      const topics = buildTopics(questions);
      const questionPool = [...questions.map(q => q.id || q.id)].sort(() => Math.random() - 0.5);

      // Allocate questions for this match
      const { allocatedQuestions, remainingPool } = allocateMatchQuestions(
        questionPool,
        tournament.questionsPerMatch,
        topics
      );

      const matchTopics = buildMatchTopics(allocatedQuestions);

      const updatedMatchPacks = {
        ...state.matchPacks,
        [matchKey]: {
          packId: pack.id,
          packTitle: pack.title,
          topics,
          questionPool: remainingPool,
          _persisted: false,
        },
      };

      // Mark match as in_progress in bracket
      const newRounds = tournament.rounds.map((round, ri) =>
        round.map((m, mi) =>
          ri === roundIndex && mi === matchIndex ? { ...m, status: 'in_progress' } : m
        )
      );

      const matchParticipants = [
        { name: tournament.teams[match.team1Index].name, score: 0, teamIndex: match.team1Index },
        { name: tournament.teams[match.team2Index].name, score: 0, teamIndex: match.team2Index },
      ];

      return {
        ...state,
        phase: 'matchGrid',
        tournament: { ...tournament, rounds: newRounds },
        currentMatch: { roundIndex, matchIndex },
        matchTopics,
        matchParticipants,
        matchCompletedQuestionIds: [],
        matchSkippedQuestions: [],
        matchPacks: updatedMatchPacks,
        pendingMatch: null,
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
