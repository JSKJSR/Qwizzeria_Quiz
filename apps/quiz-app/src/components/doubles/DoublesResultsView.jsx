import { exportDoublesCSV } from '@/utils/exportDoubles';

export default function DoublesResultsView({ pack, playerName, passiveParticipant, part1Questions, part2Questions, responses, onReset }) {
  const totalQuestions = part1Questions.length + part2Questions.length;
  const answeredCount = [...part1Questions, ...part2Questions].filter(q => responses[q.id]?.trim()).length;

  const handleExport = () => {
    exportDoublesCSV({
      playerName,
      partnerName: passiveParticipant?.displayName || null,
      packTitle: pack.title,
      part1Questions,
      part2Questions,
      responses,
    });
  };

  return (
    <div className="doubles-results">
      <h2 className="doubles-results__title">Quiz Complete!</h2>
      <p className="doubles-results__subtitle">{pack.title}</p>

      <div className="doubles-results__summary">
        <div className="doubles-results__stat">
          <span className="doubles-results__stat-label">Player</span>
          <span className="doubles-results__stat-value">{playerName}</span>
        </div>
        {passiveParticipant && (
          <div className="doubles-results__stat">
            <span className="doubles-results__stat-label">Partner</span>
            <span className="doubles-results__stat-value">{passiveParticipant.displayName || 'Partner'}</span>
          </div>
        )}
        <div className="doubles-results__stat">
          <span className="doubles-results__stat-label">Questions Answered</span>
          <span className="doubles-results__stat-value">{answeredCount} / {totalQuestions}</span>
        </div>
        <div className="doubles-results__stat">
          <span className="doubles-results__stat-label">Part 1</span>
          <span className="doubles-results__stat-value">
            {part1Questions.filter(q => responses[q.id]?.trim()).length} / {part1Questions.length}
          </span>
        </div>
        <div className="doubles-results__stat">
          <span className="doubles-results__stat-label">Part 2</span>
          <span className="doubles-results__stat-value">
            {part2Questions.filter(q => responses[q.id]?.trim()).length} / {part2Questions.length}
          </span>
        </div>
      </div>

      <div className="doubles-results__actions">
        <button
          type="button"
          className="doubles-btn doubles-btn--primary"
          onClick={handleExport}
        >
          Download CSV
        </button>
        <button
          type="button"
          className="doubles-btn doubles-btn--secondary"
          onClick={onReset}
        >
          Back to Events
        </button>
      </div>
    </div>
  );
}
