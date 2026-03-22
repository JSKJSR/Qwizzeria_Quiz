/**
 * Export doubles quiz responses as CSV.
 */

function escapeCSV(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate and download a CSV file with doubles quiz responses.
 * @param {object} params
 * @param {string} params.playerName
 * @param {string} params.packTitle
 * @param {Array} params.part1Questions - Array of { id, question_text, answer_text }
 * @param {Array} params.part2Questions - Array of { id, question_text, answer_text }
 * @param {object} params.responses - { [questionId]: string }
 */
export function exportDoublesCSV({ playerName, partnerName, packTitle, part1Questions, part2Questions, responses }) {
  const header = ['Part', 'Question #', 'Question Text', 'Correct Answer', 'Your Response'];
  if (partnerName) header.push('Partner');
  const rows = [header.map(escapeCSV).join(',')];

  // Add partner name to first data row only (for CSV context)
  const partnerCol = partnerName ? escapeCSV(partnerName) : null;

  part1Questions.forEach((q, i) => {
    const row = ['Part 1', i + 1, q.question_text, q.answer_text, responses[q.id] || ''].map(escapeCSV);
    if (partnerCol) row.push(i === 0 ? partnerCol : '');
    rows.push(row.join(','));
  });

  part2Questions.forEach((q, i) => {
    const row = ['Part 2', i + 1, q.question_text, q.answer_text, responses[q.id] || ''].map(escapeCSV);
    if (partnerCol) row.push('');
    rows.push(row.join(','));
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const safeName = (playerName || 'player').replace(/[^a-zA-Z0-9 ]/g, '');
  const safeTitle = (packTitle || 'doubles').replace(/[^a-zA-Z0-9 ]/g, '');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}_${safeName}_responses.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
