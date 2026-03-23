import { useState, useEffect } from 'react';
import { fetchDoublesPacks } from '@qwizzeria/supabase-client';

export default function DoublesEventSelect({ onSelect }) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoublesPacks()
      .then(setPacks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="doubles-select">
        <h2 className="doubles-select__title">Qwizzeria Doubles</h2>
        <p className="doubles-select__subtitle">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doubles-select">
        <h2 className="doubles-select__title">Qwizzeria Doubles</h2>
        <div className="doubles-error">{error}</div>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="doubles-select">
        <h2 className="doubles-select__title">Qwizzeria Doubles</h2>
        <p className="doubles-select__empty">No doubles events available right now. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="doubles-select">
      <h2 className="doubles-select__title">Qwizzeria Doubles</h2>
      <p className="doubles-select__subtitle">Select an event to begin</p>

      <div className="doubles-select__grid">
        {packs.map((pack) => (
          <button
            key={pack.id}
            className="doubles-select__card"
            onClick={() => onSelect(pack)}
          >
            {pack.cover_image_url && (
              <img
                src={pack.cover_image_url}
                alt=""
                className="doubles-select__card-image"
              />
            )}
            <div className="doubles-select__card-body">
              <h3 className="doubles-select__card-title">{pack.title}</h3>
              {pack.description && (
                <p className="doubles-select__card-desc">{pack.description}</p>
              )}
              <div className="doubles-select__card-meta">
                {pack.category && <span className="doubles-select__card-category">{pack.category}</span>}
                <span className="doubles-select__card-count">
                  {pack.config?.doubles_part1_questions != null
                    ? (pack.config.doubles_part2_questions > 0
                        ? `${pack.config.doubles_part1_questions} + ${pack.config.doubles_part2_questions} questions`
                        : `${pack.config.doubles_part1_questions} questions`)
                    : `${pack.question_count} questions`
                  }
                </span>
                <span className="doubles-select__card-timer">
                  {pack.config?.doubles_part1_timer_minutes != null
                    ? (pack.config.doubles_part2_questions > 0
                        ? `Part 1: ${pack.config.doubles_part1_timer_minutes}min / Part 2: ${pack.config.doubles_part2_timer_minutes}min`
                        : `${pack.config.doubles_part1_timer_minutes} min`)
                    : `${pack.config?.doubles_timer_minutes || 60} min per part`
                  }
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
