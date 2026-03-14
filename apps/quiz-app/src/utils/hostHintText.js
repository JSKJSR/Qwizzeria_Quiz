/**
 * Returns a contextual hint string for the host based on current quiz state.
 */
export function getHostHint({ isOpen, isInputMode, hasBuzzes, totalResponseCount, hasSelectedQuestion, awarded }) {
  // Input mode active — collecting responses
  if (isOpen && isInputMode) {
    return 'Waiting for responses… Lock & View when ready';
  }

  // Buzzer open — waiting for buzzes
  if (isOpen && !isInputMode) {
    return 'Waiting for buzzes… Lock when ready';
  }

  // Buzzer locked with results, not yet awarded
  if (!isOpen && hasBuzzes && !awarded) {
    return 'Award the point, then pick the next question';
  }

  // Buzzer locked, already awarded
  if (!isOpen && hasBuzzes && awarded) {
    return 'Select next question from the grid';
  }

  // Not open, has responses to review
  if (!isOpen && totalResponseCount > 0) {
    return 'View Responses to reveal answers';
  }

  // Question selected, idle
  if (hasSelectedQuestion) {
    return 'Open Buzzer or Collect Answers';
  }

  // Default — no question selected
  return 'Select a question from the grid';
}
