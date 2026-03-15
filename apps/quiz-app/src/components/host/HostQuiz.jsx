import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { clearHostSession, loadBuzzerState, clearBuzzerState } from '@/utils/hostSessionPersistence';
import {
  saveHostQuizSession,
  advanceMatchWinner as dbAdvanceMatchWinner,
  completeTournament as dbCompleteTournament,
} from '@qwizzeria/supabase-client';
import {
  advanceWinner,
  isTournamentComplete,
  getChampion,
  getRoundName,
} from '@/utils/tournamentBracket';
import { ACTIONS, initialState, reducer } from './hostQuizReducer';
import { useHostQuizPersistence } from '@/hooks/useHostQuizPersistence';
import { useTournamentSync } from '@/hooks/useTournamentSync';
import HostPackSelect from './HostPackSelect';
import HostParticipantSetup from './HostParticipantSetup';
import HostTopicGrid from './HostTopicGrid';
import HostScoreboard from './HostScoreboard';
import HostAnswerView from './HostAnswerView';
import HostResultsView from './HostResultsView';
import HostQuestionReview from './HostQuestionReview';
import BuzzerOverlay from './BuzzerOverlay';
import TournamentBracket from './TournamentBracket';
import TieBreakerModal from './TieBreakerModal';
import TournamentResultsView from './TournamentResultsView';
import QuestionView from '../QuestionView';
import useBuzzerHost from '@/hooks/useBuzzerHost';
import '@/styles/HostQuiz.css';
import '@/styles/MatchPackSelect.css';

export default function HostQuiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showTieBreaker, setShowTieBreaker] = useState(false);
  const [buzzerEnabled, setBuzzerEnabled] = useState(() => {
    const saved = loadBuzzerState();
    return !!(saved?.buzzerEnabled && saved.roomCode && saved.roomId);
  });
  const timerRef = useRef(null);
  const [autoShowResponses, setAutoShowResponses] = useState(false);
  const [buzzerCopied, setBuzzerCopied] = useState(false);
  const [buzzerRestore] = useState(() => {
    const saved = loadBuzzerState();
    if (saved?.buzzerEnabled && saved.roomCode && saved.roomId) {
      return { roomCode: saved.roomCode, roomId: saved.roomId };
    }
    return { roomCode: null, roomId: null };
  });

  // Buzzer hook (only active when buzzerEnabled)
  const buzzer = useBuzzerHost({
    hostUserId: user?.id,
    sessionType: state.mode === 'tournament' ? 'tournament_match' : 'host_quiz',
    sessionRef: state.tournamentId || null,
    enabled: buzzerEnabled,
    restoreRoomCode: buzzerRestore.roomCode,
    restoreRoomId: buzzerRestore.roomId,
  });

  // Session persistence (restore on mount + debounced save)
  useHostQuizPersistence({ state, dispatch, navigate, buzzerEnabled, buzzer, setBuzzerEnabled });

  // Tournament DB sync (create tournament + persist match packs)
  useTournamentSync({ state, dispatch, userId: user?.id });

  const handleCopyBuzzerLink = useCallback(() => {
    if (!buzzer.roomCode) return;
    const url = `${window.location.origin}/buzz/${buzzer.roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setBuzzerCopied(true);
      setTimeout(() => setBuzzerCopied(false), 2000);
    }).catch(() => {});
  }, [buzzer.roomCode]);

  // Auto-lock input + show responses when timer expires
  const handleTimerExpire = useCallback(() => {
    if (buzzer.interactionMode === 'input' && buzzer.isOpen) {
      buzzer.lockInput();
      setAutoShowResponses(true);
    }
  }, [buzzer]);

  // --- Standard mode handlers ---
  const handleSelectPack = useCallback((pack, questions) => {
    dispatch({ type: ACTIONS.SELECT_PACK, pack, questions });
  }, []);

  const handleStartQuiz = useCallback((participants, mode, questionsPerMatch, perMatchPacks, enableBuzzer) => {
    setBuzzerEnabled(!!enableBuzzer);
    if (mode === 'tournament') {
      dispatch({ type: ACTIONS.START_TOURNAMENT, participants, questionsPerMatch, perMatchPacks: !!perMatchPacks });
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
    clearBuzzerState();
    if (buzzerEnabled) buzzer.closeRoom();
  }, [user, state.pack, state.participants, state.completedQuestionIds, buzzerEnabled, buzzer]);

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: ACTIONS.PLAY_AGAIN });
  }, []);

  const handleNewQuiz = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_QUIZ });
    clearHostSession();
    clearBuzzerState();
    if (buzzerEnabled) buzzer.closeRoom();
    setBuzzerEnabled(false);
  }, [buzzerEnabled, buzzer]);

  // --- Tournament mode handlers ---
  const handleSelectMatch = useCallback((roundIndex, matchIndex) => {
    dispatch({ type: ACTIONS.SELECT_MATCH, roundIndex, matchIndex });
  }, []);

  const handleSelectMatchPack = useCallback((pack, questions, roundIndex, matchIndex) => {
    dispatch({ type: ACTIONS.SELECT_MATCH_PACK, roundIndex, matchIndex, pack, questions });
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
      const isPerMatch = !!state.tournament?.perMatchPacks;

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
        isPerMatch,
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
          quizTitle={state.pack?.title}
        />
      </div>
    );
  }

  // --- Per-match Pack Selection ---
  if (phase === 'matchPackSelect') {
    const { roundIndex, matchIndex } = state.pendingMatch || {};
    const tournament = state.tournament;
    const roundName = tournament ? getRoundName(tournament.rounds.length, roundIndex) : '';
    const match = tournament?.rounds[roundIndex]?.[matchIndex];
    const team1 = match?.team1Index != null ? tournament.teams[match.team1Index]?.name : '';
    const team2 = match?.team2Index != null ? tournament.teams[match.team2Index]?.name : '';

    return (
      <div className="host-quiz host-quiz--fullscreen">
        <div className="match-pack-select__header">
          <h2 className="match-pack-select__title">Select Pack for Match</h2>
          <p className="match-pack-select__matchup">
            {team1} vs {team2} &mdash; {roundName}
          </p>
        </div>
        <HostPackSelect
          onSelectPack={(pack, questions) => handleSelectMatchPack(pack, questions, roundIndex, matchIndex)}
        />
      </div>
    );
  }

  // --- Tournament Bracket ---
  if (phase === 'bracket') {
    // Build matchPacks map for bracket display { matchKey → { packTitle } }
    const bracketMatchPacks = Object.fromEntries(
      Object.entries(state.matchPacks).map(([key, mp]) => [key, { packTitle: mp.packTitle }])
    );

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
          matchPacks={state.tournament?.perMatchPacks ? bracketMatchPacks : undefined}
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
    const matchKey = currentMatch ? `r${currentMatch.roundIndex}-m${currentMatch.matchIndex}` : null;
    const matchPackTitle = matchKey && state.matchPacks[matchKey]?.packTitle;
    const matchLabel = `${roundName} — Match ${(currentMatch?.matchIndex || 0) + 1}${matchPackTitle ? ` — ${matchPackTitle}` : ''}`;

    return (
      <div className="host-quiz host-quiz--fullscreen">
        <HostScoreboard
          participants={matchParticipants}
          onEndQuiz={handleEndMatch}
          onAdjustScore={handleMatchAdjustScore}
          showEndQuiz={phase === 'matchGrid'}
          endButtonLabel="END MATCH"
          matchLabel={matchLabel}
          buzzerRoomCode={buzzerEnabled ? buzzer.roomCode : null}
          buzzerPlayerCount={buzzer.participants.length}
          onCopyBuzzerLink={buzzerEnabled ? handleCopyBuzzerLink : null}
          buzzerCopied={buzzerCopied}
          timerRef={timerRef}
          onTimerExpire={handleTimerExpire}
          onTimerTick={buzzerEnabled ? buzzer.broadcastTimerSync : undefined}
          onPublishScores={buzzerEnabled ? () => {
            const sorted = [...matchParticipants].sort((a, b) => b.score - a.score);
            const rankings = sorted.map((p, i) => ({ name: p.name, score: p.score, rank: i + 1 }));
            buzzer.publishScores(rankings);
          } : undefined}
        />

        {buzzerEnabled && buzzer.roomCode && (
          <BuzzerOverlay
            roomCode={buzzer.roomCode}
            participants={buzzer.participants}
            buzzes={buzzer.buzzes}
            buzzResult={buzzer.buzzResult}
            isOpen={buzzer.isOpen}
            isCreating={buzzer.isCreating}
            hasSelectedQuestion={!!state.selectedQuestion}
            onOpenBuzzer={buzzer.openBuzzer}
            onLockBuzzer={buzzer.lockBuzzer}
            onAnnounceBuzzResult={buzzer.announceBuzzResult}
            onResetBuzzer={buzzer.resetBuzzer}
            interactionMode={buzzer.interactionMode}
            allResponses={buzzer.allResponses}
            currentInputQuestionId={buzzer.currentInputQuestionId}
            inputRevealed={buzzer.inputRevealed}
            questionLabels={buzzer.questionLabels}
            inputQuestionOrder={buzzer.inputQuestionOrder}
            onOpenInput={(allowedUserIds) => {
              if (!state.selectedQuestion) return;
              buzzer.openInput(
                state.selectedQuestion.id,
                state.selectedQuestion.question || state.selectedQuestion.question_text,
                allowedUserIds
              );
              timerRef.current?.reset();
              timerRef.current?.start();
            }}
            onLockInput={buzzer.lockInput}
            onRevealResponses={buzzer.revealResponses}
            onResetInput={buzzer.resetInput}
            autoShowResponses={autoShowResponses}
            onAutoShowResponsesHandled={() => setAutoShowResponses(false)}
            onGoToGrid={handleMatchBackToGrid}
          />
        )}

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
        buzzerRoomCode={buzzerEnabled ? buzzer.roomCode : null}
        buzzerPlayerCount={buzzer.participants.length}
        onCopyBuzzerLink={buzzerEnabled ? handleCopyBuzzerLink : null}
        buzzerCopied={buzzerCopied}
        timerRef={timerRef}
        onTimerExpire={handleTimerExpire}
        onTimerTick={buzzerEnabled ? buzzer.broadcastTimerSync : undefined}
        onPublishScores={buzzerEnabled ? () => {
          const sorted = [...participants].sort((a, b) => b.score - a.score);
          const rankings = sorted.map((p, i) => ({ name: p.name, score: p.score, rank: i + 1 }));
          buzzer.publishScores(rankings);
        } : undefined}
      />

      {buzzerEnabled && buzzer.roomCode && (
        <BuzzerOverlay
          roomCode={buzzer.roomCode}
          participants={buzzer.participants}
          buzzes={buzzer.buzzes}
          buzzResult={buzzer.buzzResult}
          isOpen={buzzer.isOpen}
          isCreating={buzzer.isCreating}
          hasSelectedQuestion={!!state.selectedQuestion}
          onOpenBuzzer={buzzer.openBuzzer}
          onLockBuzzer={buzzer.lockBuzzer}
          onAnnounceBuzzResult={buzzer.announceBuzzResult}
          onResetBuzzer={buzzer.resetBuzzer}
          interactionMode={buzzer.interactionMode}
          allResponses={buzzer.allResponses}
          currentInputQuestionId={buzzer.currentInputQuestionId}
          inputRevealed={buzzer.inputRevealed}
          questionLabels={buzzer.questionLabels}
          inputQuestionOrder={buzzer.inputQuestionOrder}
          onOpenInput={(allowedUserIds) => {
            if (!state.selectedQuestion) return;
            buzzer.openInput(
              state.selectedQuestion.id,
              state.selectedQuestion.question || state.selectedQuestion.question_text,
              allowedUserIds
            );
            timerRef.current?.reset();
            timerRef.current?.start();
          }}
          onLockInput={buzzer.lockInput}
          onRevealResponses={buzzer.revealResponses}
          onResetInput={buzzer.resetInput}
          autoShowResponses={autoShowResponses}
          onAutoShowResponsesHandled={() => setAutoShowResponses(false)}
          onGoToGrid={handleBackToGrid}
        />
      )}

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
