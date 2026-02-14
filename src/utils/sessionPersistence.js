const SESSION_KEY = 'qwizzeria_session';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Helper function to find a question by ID in topics array
 */
function findQuestionById(topics, questionId) {
  if (!topics || !questionId) return null;

  for (const topic of topics) {
    const question = topic.questions.find(q => q.id === questionId);
    if (question) return question;
  }
  return null;
}

/**
 * Save the current quiz session to localStorage
 */
export function saveSession(state) {
  try {
    const sessionData = {
      timestamp: Date.now(),
      view: state.view,
      topics: state.topics,
      participants: state.participants,
      completedQuestionIds: state.completedQuestionIds,
      selectedQuestionId: state.selectedQuestion?.id || null,
      quizLoaded: state.quizLoaded,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    // Handle quota exceeded or other localStorage errors
    console.warn('Failed to save session:', error);

    // Try to clear old session and retry once
    if (error.name === 'QuotaExceededError') {
      try {
        clearSession();
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      } catch (retryError) {
        console.error('Failed to save session after clearing:', retryError);
      }
    }
  }
}

/**
 * Load and validate a saved session from localStorage
 * Returns null if no valid session exists
 */
export function loadSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;

    const session = JSON.parse(data);

    // Validate session structure
    if (!session || typeof session !== 'object') {
      clearSession();
      return null;
    }

    // Check if session is too old
    const age = Date.now() - (session.timestamp || 0);
    if (age > SESSION_MAX_AGE) {
      clearSession();
      return null;
    }

    // Validate essential fields
    if (!session.topics || !Array.isArray(session.topics) || session.topics.length === 0) {
      clearSession();
      return null;
    }

    // Reconstruct selectedQuestion from ID if it exists
    if (session.selectedQuestionId) {
      session.selectedQuestion = findQuestionById(session.topics, session.selectedQuestionId);
    } else {
      session.selectedQuestion = null;
    }

    return session;
  } catch (error) {
    console.warn('Failed to load session:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear the saved session from localStorage
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear session:', error);
  }
}

/**
 * Check if a valid session exists without loading it
 */
export function hasSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return false;

    const session = JSON.parse(data);
    const age = Date.now() - (session.timestamp || 0);

    return age <= SESSION_MAX_AGE && session.topics?.length > 0;
  } catch (error) {
    return false;
  }
}
