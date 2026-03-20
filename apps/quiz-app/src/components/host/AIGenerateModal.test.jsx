import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIGenerateModal from './AIGenerateModal';

// Mock useAuth
const mockAuth = { user: { id: 'user-1' }, hasTier: () => true, role: 'user' };
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

// Mock aiGenerate module
const mockGenerateQuiz = vi.fn();
const mockSaveGeneratedPack = vi.fn();
vi.mock('@qwizzeria/supabase-client/src/aiGenerate.js', () => ({
  generateQuiz: (...args) => mockGenerateQuiz(...args),
  saveGeneratedPack: (...args) => mockSaveGeneratedPack(...args),
}));

const sampleQuestions = [
  { question_text: 'What is Mars?', answer_text: 'A planet', answer_explanation: 'Fourth from sun', category: 'Planets', points: 10 },
  { question_text: 'Who was Galileo?', answer_text: 'An astronomer', answer_explanation: 'Italian scientist', category: 'History', points: 20 },
];

describe('AIGenerateModal', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.hasTier = () => true;
    mockAuth.user = { id: 'user-1' };
  });

  it('renders input form with topic, count slider, and difficulty', () => {
    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(screen.getByLabelText('Number of Questions')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Generate Quiz')).toBeInTheDocument();
  });

  it('disables generate button when topic is empty', () => {
    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);
    expect(screen.getByText('Generate Quiz')).toBeDisabled();
  });

  it('shows generating state with loading spinner', async () => {
    mockGenerateQuiz.mockReturnValue(new Promise(() => {})); // never resolves

    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Space' } });
    fireEvent.click(screen.getByText('Generate Quiz'));

    expect(screen.getByText(/Generating your quiz on/)).toBeInTheDocument();
    expect(screen.getByText('Space')).toBeInTheDocument();
  });

  it('shows preview with question table after generation', async () => {
    mockGenerateQuiz.mockResolvedValue(sampleQuestions);

    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Space' } });
    fireEvent.click(screen.getByText('Generate Quiz'));

    await waitFor(() => {
      expect(screen.getByText('What is Mars?')).toBeInTheDocument();
    });

    expect(screen.getByText('Who was Galileo?')).toBeInTheDocument();
    expect(screen.getByText('2 questions generated. Click any text to edit.')).toBeInTheDocument();
    expect(screen.getByText('Use Without Saving')).toBeInTheDocument();
    expect(screen.getByText('Save & Use')).toBeInTheDocument();
  });

  it('deletes a question from preview', async () => {
    mockGenerateQuiz.mockResolvedValue(sampleQuestions);

    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Space' } });
    fireEvent.click(screen.getByText('Generate Quiz'));

    await waitFor(() => {
      expect(screen.getByText('What is Mars?')).toBeInTheDocument();
    });

    // Delete first question
    const deleteButtons = screen.getAllByTitle('Remove question');
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByText('What is Mars?')).not.toBeInTheDocument();
    expect(screen.getByText('Who was Galileo?')).toBeInTheDocument();
    expect(screen.getByText('1 questions generated. Click any text to edit.')).toBeInTheDocument();
  });

  it('calls onConfirm with ephemeral data on "Use Without Saving"', async () => {
    mockGenerateQuiz.mockResolvedValue(sampleQuestions);

    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Space' } });
    fireEvent.click(screen.getByText('Generate Quiz'));

    await waitFor(() => {
      expect(screen.getByText('Use Without Saving')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Use Without Saving'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [pack, questions] = onConfirm.mock.calls[0];
    expect(pack.title).toBe('AI: Space');
    expect(questions).toHaveLength(2);
    expect(questions[0].question_text).toBe('What is Mars?');
    // No DB calls
    expect(mockSaveGeneratedPack).not.toHaveBeenCalled();
  });

  it('calls saveGeneratedPack and onConfirm on "Save & Use"', async () => {
    mockGenerateQuiz.mockResolvedValue(sampleQuestions);
    mockSaveGeneratedPack.mockResolvedValue({
      pack: { id: 'pack-1', title: 'AI: Space' },
      questions: sampleQuestions.map((q, i) => ({ ...q, id: `q-${i}`, sort_order: i + 1 })),
    });

    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Space' } });
    fireEvent.click(screen.getByText('Generate Quiz'));

    await waitFor(() => {
      expect(screen.getByText('Save & Use')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save & Use'));

    await waitFor(() => {
      expect(mockSaveGeneratedPack).toHaveBeenCalledWith({
        title: 'AI: Space',
        questions: sampleQuestions,
        userId: 'user-1',
      });
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows error state with retry button', async () => {
    mockGenerateQuiz.mockRejectedValue(new Error('Rate limit exceeded'));

    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Space' } });
    fireEvent.click(screen.getByText('Generate Quiz'));

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();

    // Retry returns to input
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
  });

  it('shows pro gate for non-premium users', () => {
    mockAuth.hasTier = () => false;

    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByText('Pro Feature')).toBeInTheDocument();
    expect(screen.getByText(/AI quiz generation is available for Pro subscribers/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Topic')).not.toBeInTheDocument();
  });

  it('closes when overlay is clicked', () => {
    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    // Click the overlay (first element with the class)
    fireEvent.click(document.querySelector('.ai-modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when X button is clicked', () => {
    render(<AIGenerateModal onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('\u00d7'));
    expect(onClose).toHaveBeenCalled();
  });
});
