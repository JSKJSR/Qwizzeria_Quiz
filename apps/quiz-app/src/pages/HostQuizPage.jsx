import HostQuiz from '../components/host/HostQuiz';
import SEO from '../components/SEO';

export default function HostQuizPage() {
  return (
    <>
      <SEO title="Host Quiz" path="/host" noIndex />
      <HostQuiz />
    </>
  );
}
