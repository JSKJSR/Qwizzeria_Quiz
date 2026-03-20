import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { useBuzzerParticipant } from '../components/buzzer/useBuzzerParticipant';
import {
  BuzzerHeader,
  BuzzerLoading,
  BuzzerError,
  BuzzerClosed,
  BuzzerWaiting,
  BuzzerReady,
  BuzzerBuzzed,
  BuzzerSpectating,
  BuzzerResult,
  BuzzerScoreOverlay,
  BuzzerInputArea,
} from '../components/buzzer/BuzzerUI';
import '../styles/Buzzer.css';

/**
 * Participant buzzer page.
 * Logic extracted to useBuzzerParticipant hook.
 * UI decomposed into BuzzerUI components.
 */
export default function BuzzerPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    phase,
    errorInfo,
    buzzResult,
    connectionStatus,
    displayName,
    myResponses,
    currentQuestionId,
    currentQuestionText,
    inputText,
    inputLocked,
    viewingQuestionId,
    questionHistory,
    savedFlash,
    timerLeft,
    scoreOverlay,
    handleBuzz,
    handleSubmitResponse,
    handleViewQuestion,
    handleRetry,
    dismissScoreOverlay,
    setInputText,
  } = useBuzzerParticipant(user, roomCode);

  if (phase === 'loading') {
    return <BuzzerLoading roomCode={roomCode} />;
  }

  if (phase === 'error') {
    return (
      <BuzzerError
        roomCode={roomCode}
        errorInfo={errorInfo}
        onRetry={handleRetry}
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  if (phase === 'closed') {
    return <BuzzerClosed roomCode={roomCode} onBack={() => navigate('/dashboard')} />;
  }

  return (
    <div className="buzzer-page">
      <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />

      <BuzzerHeader
        roomCode={roomCode}
        displayName={displayName}
        connectionStatus={connectionStatus}
      />

      <div className="buzzer-page__body">
        {phase === 'waiting' && <BuzzerWaiting />}
        {phase === 'ready' && <BuzzerReady onBuzz={handleBuzz} />}
        {phase === 'buzzed' && <BuzzerBuzzed />}
        {phase === 'spectating' && <BuzzerSpectating />}
        {phase === 'result' && <BuzzerResult buzzResult={buzzResult} userId={user?.id} />}
        {phase === 'input_ready' && (
          <BuzzerInputArea
            currentQuestionText={currentQuestionText}
            viewingQuestionId={viewingQuestionId}
            currentQuestionId={currentQuestionId}
            questionHistory={questionHistory}
            timerLeft={timerLeft}
            inputText={inputText}
            setInputText={setInputText}
            inputLocked={inputLocked}
            savedFlash={savedFlash}
            myResponses={myResponses}
            onViewQuestion={handleViewQuestion}
            onSubmit={handleSubmitResponse}
          />
        )}
      </div>

      {scoreOverlay && (
        <BuzzerScoreOverlay
          scoreOverlay={scoreOverlay}
          displayName={displayName}
          onDismiss={dismissScoreOverlay}
        />
      )}
    </div>
  );
}
