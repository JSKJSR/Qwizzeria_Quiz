import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../styles/MiniQuizHook.css';

const CURATED_QUESTIONS = [
  {
    category: 'Science',
    question: 'What is the only planet that rotates on its side?',
    options: ['Mars', 'Uranus', 'Venus', 'Saturn'],
    correct: 1,
  },
  {
    category: 'Science',
    question: 'What gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'],
    correct: 2,
  },
  {
    category: 'History',
    question: 'In which year did the Berlin Wall fall?',
    options: ['1987', '1989', '1991', '1985'],
    correct: 1,
  },
  {
    category: 'History',
    question: 'Which ancient wonder was located in Alexandria?',
    options: ['Colossus', 'Lighthouse', 'Hanging Gardens', 'Great Pyramid'],
    correct: 1,
  },
  {
    category: 'Sports',
    question: 'Which country has won the most FIFA World Cups?',
    options: ['Germany', 'Argentina', 'Italy', 'Brazil'],
    correct: 3,
  },
  {
    category: 'Sports',
    question: 'In which sport is a "birdie" one under par?',
    options: ['Tennis', 'Badminton', 'Golf', 'Cricket'],
    correct: 2,
  },
  {
    category: 'Music',
    question: 'Which band released the album "Abbey Road"?',
    options: ['The Rolling Stones', 'The Beatles', 'Led Zeppelin', 'Pink Floyd'],
    correct: 1,
  },
  {
    category: 'Music',
    question: 'What instrument has 88 keys?',
    options: ['Guitar', 'Accordion', 'Piano', 'Organ'],
    correct: 2,
  },
  {
    category: 'Geography',
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correct: 1,
  },
  {
    category: 'Geography',
    question: 'Through how many countries does the equator pass?',
    options: ['9', '11', '13', '15'],
    correct: 2,
  },
  {
    category: 'Movies',
    question: 'Who directed "Inception"?',
    options: ['David Fincher', 'Christopher Nolan', 'Denis Villeneuve', 'Ridley Scott'],
    correct: 1,
  },
  {
    category: 'Movies',
    question: 'Which film won the first Best Picture Oscar?',
    options: ['Sunrise', 'Wings', 'The Jazz Singer', 'Metropolis'],
    correct: 1,
  },
];

const CATEGORIES = ['Science', 'History', 'Sports', 'Music', 'Geography', 'Movies'];

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MiniQuizHook() {
  // 'ask' | 'result' | 'conversion'
  const [phase, setPhase] = useState('ask');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionSeed, setQuestionSeed] = useState(0);

  const currentQuestion = useMemo(() => {
    const pool = activeCategory
      ? CURATED_QUESTIONS.filter((q) => q.category === activeCategory)
      : CURATED_QUESTIONS;
    return pool[Math.floor(Math.random() * pool.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, questionSeed]);

  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat);
    setQuestionSeed((s) => s + 1);
    setPhase('ask');
    setSelectedOption(null);
  }, []);

  const handleAnswer = useCallback((idx) => {
    if (phase !== 'ask') return;
    setSelectedOption(idx);
    setIsCorrect(idx === currentQuestion.correct);
    setPhase('result');
    setTimeout(() => setPhase('conversion'), 1800);
  }, [phase, currentQuestion]);

  const handleTryAnother = useCallback(() => {
    const cats = shuffleArray(CATEGORIES);
    const next = cats.find((c) => c !== activeCategory) || cats[0];
    setActiveCategory(next);
    setQuestionSeed((s) => s + 1);
    setPhase('ask');
    setSelectedOption(null);
  }, [activeCategory]);

  return (
    <div className="mini-quiz">
      {/* Category pills */}
      <div className="mini-quiz__cats">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`mini-quiz__cat${activeCategory === cat ? ' mini-quiz__cat--active' : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className={`mini-quiz__card${phase === 'result' ? (isCorrect ? ' mini-quiz__card--correct' : ' mini-quiz__card--wrong') : ''}`}>
        {/* Category badge */}
        <span className="mini-quiz__badge">{currentQuestion.category}</span>

        {phase === 'conversion' ? (
          <div className="mini-quiz__conversion">
            <p className="mini-quiz__conversion-msg">
              {isCorrect ? 'Nice one!' : 'Now you know!'}
            </p>
            <p className="mini-quiz__conversion-sub">
              Ready for more {currentQuestion.category} trivia?
            </p>
            <div className="mini-quiz__conversion-actions">
              <Link to="/play/free" className="mini-quiz__cta-play">
                Play Free Quiz
              </Link>
              <button className="mini-quiz__cta-another" onClick={handleTryAnother}>
                Try Another
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mini-quiz__question">{currentQuestion.question}</p>
            <div className="mini-quiz__options">
              {currentQuestion.options.map((opt, idx) => {
                let cls = 'mini-quiz__option';
                if (phase === 'result') {
                  if (idx === currentQuestion.correct) cls += ' mini-quiz__option--correct';
                  else if (idx === selectedOption) cls += ' mini-quiz__option--wrong';
                  else cls += ' mini-quiz__option--dimmed';
                }
                return (
                  <button
                    key={idx}
                    className={cls}
                    onClick={() => handleAnswer(idx)}
                    disabled={phase !== 'ask'}
                  >
                    <span className="mini-quiz__option-letter">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
