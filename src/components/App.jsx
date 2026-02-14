import { useReducer, useEffect } from 'react';
import FileUpload from './FileUpload';
import ParticipantSetup from './ParticipantSetup';
import Scoreboard from './Scoreboard';
import TopicGrid from './TopicGrid';
import QuestionView from './QuestionView';
import AnswerView from './AnswerView';
import ResultsView from './ResultsView';
import LandingPage from './LandingPage';
import { saveSession, loadSession, clearSession } from '../utils/sessionPersistence';
import '../styles/Setup.css';

const initialState = {
  view: 'landing',
  topics: [],
  participants: [],
  selectedQuestion: null,
  completedQuestionIds: [],
  quizLoaded: false,
};

function quizReducer(state, action) {
  switch (action.type) {
    case 'LOAD_QUIZ':
      return { ...state, topics: action.payload.topics, quizLoaded: true };

    case 'START_QUIZ':
      return {
        ...state,
        view: 'grid',
        participants: action.payload.names.map((name, i) => ({
          id: i,
          name,
          score: 0,
        })),
      };

    case 'SELECT_QUESTION':
      return { ...state, view: 'question', selectedQuestion: action.payload.question };

    case 'REVEAL_ANSWER':
      return { ...state, view: 'answer' };

    case 'AWARD_POINTS': {
      const { participantId, points } = action.payload;
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === participantId ? { ...p, score: p.score + points } : p
        ),
      };
    }

    case 'MARK_COMPLETED':
      return {
        ...state,
        completedQuestionIds: [...state.completedQuestionIds, action.payload.questionId],
      };

    case 'RETURN_TO_GRID':
      return { ...state, view: 'grid', selectedQuestion: null };

    case 'END_QUIZ':
      return { ...state, view: 'results', selectedQuestion: null };

    case 'RESET_QUIZ':
      return { ...initialState };

    case 'PLAY_AGAIN':
      return {
        ...state,
        view: 'grid',
        selectedQuestion: null,
        completedQuestionIds: [],
        participants: state.participants.map(p => ({ ...p, score: 0 })),
      };

    case 'GOTO_QUIZ':
      return { ...state, view: 'setup' };

    case 'RESTORE_SESSION':
      return {
        ...state,
        view: action.payload.view,
        topics: action.payload.topics,
        participants: action.payload.participants,
        completedQuestionIds: action.payload.completedQuestionIds,
        selectedQuestion: action.payload.selectedQuestion,
        quizLoaded: action.payload.quizLoaded,
      };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Restore session on mount
  useEffect(() => {
    const savedSession = loadSession();
    if (savedSession && savedSession.topics?.length > 0) {
      dispatch({ type: 'RESTORE_SESSION', payload: savedSession });
    }
  }, []);

  // Save session whenever state changes (only during active quiz)
  useEffect(() => {
    if (state.quizLoaded && state.view !== 'setup') {
      saveSession(state);
    }
  }, [state]);

  function handleQuizLoaded(topics) {
    dispatch({ type: 'LOAD_QUIZ', payload: { topics } });
  }

  function handleGoToQuiz() {
    dispatch({ type: 'GOTO_QUIZ' });
  }

  function handleStart(names) {
    dispatch({ type: 'START_QUIZ', payload: { names } });
  }

  function handleSelectQuestion(question) {
    dispatch({ type: 'SELECT_QUESTION', payload: { question } });
  }

  function handleRevealAnswer() {
    dispatch({ type: 'REVEAL_ANSWER' });
  }

  function handleAwardPoints(participantId, points) {
    dispatch({ type: 'AWARD_POINTS', payload: { participantId, points } });
    dispatch({ type: 'MARK_COMPLETED', payload: { questionId: state.selectedQuestion.id } });
    dispatch({ type: 'RETURN_TO_GRID' });
  }

  function handleReturn() {
    dispatch({ type: 'MARK_COMPLETED', payload: { questionId: state.selectedQuestion.id } });
    dispatch({ type: 'RETURN_TO_GRID' });
  }

  function handleBackToGrid() {
    dispatch({ type: 'RETURN_TO_GRID' });
  }

  function handleEndQuiz() {
    dispatch({ type: 'END_QUIZ' });
  }

  function handleResetQuiz() {
    clearSession(); // Clear saved session when starting a new quiz
    dispatch({ type: 'RESET_QUIZ' });
  }

  function handlePlayAgain() {
    dispatch({ type: 'PLAY_AGAIN' });
  }

  // Landing page
  if (state.view === 'landing') {
    return <LandingPage onStartQuiz={handleGoToQuiz} />;
  }

  // Setup screen
  if (state.view === 'setup') {
    return (
      <div className="setup">
        <div className="setup__hero">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="setup__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
          <p className="setup__tagline">I learn, therefore I am</p>
        </div>

        <div className="setup__content">
          <div className="setup__panel-card">
            <FileUpload onQuizLoaded={handleQuizLoaded} />
          </div>
          <div className="setup__panel-card">
            <ParticipantSetup quizLoaded={state.quizLoaded} onStart={handleStart} />
          </div>
        </div>

        <div className="setup__qr-section">
          <div className="setup__qr-frame">
            <img
              src="/qr-code.png"
              alt="QR Code"
              className="setup__qr-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="setup__qr-placeholder" style={{ display: 'none' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="3" height="3" />
                <rect x="18" y="14" width="3" height="3" />
                <rect x="14" y="18" width="3" height="3" />
                <rect x="18" y="18" width="3" height="3" />
              </svg>
              <span>QR Code</span>
            </div>
          </div>
          <span className="setup__qr-label">Scan to follow</span>
        </div>

        <footer className="setup__footer">
          <div className="setup__footer-links">
            <a href="https://patreon.com/Qwizzeria" target="_blank" rel="noopener noreferrer">Patreon</a>
            <span className="setup__footer-sep">&middot;</span>
            <a href="https://instagram.com/qwizzeria" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span className="setup__footer-sep">&middot;</span>
            <a href="mailto:rajan@qwizzeria.com">rajan@qwizzeria.com</a>
          </div>
        </footer>
      </div>
    );
  }

  // Game screens (grid, question, answer) all show scoreboard
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Scoreboard participants={state.participants} onEndQuiz={handleEndQuiz} showEndQuiz={state.view === 'grid'} />

      {state.view === 'grid' && (
        <TopicGrid
          topics={state.topics}
          completedQuestionIds={state.completedQuestionIds}
          onSelectQuestion={handleSelectQuestion}
        />
      )}

      {state.view === 'question' && state.selectedQuestion && (
        <QuestionView
          question={state.selectedQuestion}
          onRevealAnswer={handleRevealAnswer}
          onBack={handleBackToGrid}
        />
      )}

      {state.view === 'answer' && state.selectedQuestion && (
        <AnswerView
          question={state.selectedQuestion}
          participants={state.participants}
          onAwardPoints={handleAwardPoints}
          onReturn={handleReturn}
        />
      )}

      {state.view === 'results' && (
        <ResultsView
          participants={state.participants}
          onNewQuiz={handleResetQuiz}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
