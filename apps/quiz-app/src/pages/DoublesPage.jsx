import DoublesQuiz from '../components/doubles/DoublesQuiz';
import SEO from '../components/SEO';

export default function DoublesPage() {
  return (
    <>
      <SEO title="Qwizzeria Doubles" path="/doubles" noIndex />
      <DoublesQuiz />
    </>
  );
}
