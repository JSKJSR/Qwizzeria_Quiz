import FreeQuiz from '../components/FreeQuiz';
import SEO from '../components/SEO';

export default function FreeQuizPage() {
  return (
    <>
      <SEO
        title="Surprise Me!"
        description="Play a free Jeopardy-style quiz with random questions. Test your knowledge across multiple categories."
        path="/play/free"
        keywords="free quiz, jeopardy quiz, random trivia, play quiz online, free trivia game"
      />
      <FreeQuiz />
    </>
  );
}
