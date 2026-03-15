/**
 * Export quiz results as CSV or printable PDF.
 */

function escapeCSV(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate and download a CSV file with quiz results.
 * @param {Array<{name: string, score: number}>} participants
 * @param {string} quizTitle
 */
export function exportResultsCSV(participants, quizTitle = 'Quiz Results') {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  const rows = [['Rank', 'Name', 'Score'].map(escapeCSV).join(',')];

  let rank = 1;
  sorted.forEach((p, i) => {
    // Handle tied ranks
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      rank = i + 1;
    }
    rows.push([rank, p.name, p.score].map(escapeCSV).join(','));
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${quizTitle.replace(/[^a-zA-Z0-9 ]/g, '')}_results.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open a styled HTML page in a new window for printing/saving as PDF.
 * @param {Array<{name: string, score: number}>} participants
 * @param {string} quizTitle
 * @param {Array} skippedQuestions
 */
export function exportResultsPDF(participants, quizTitle = 'Quiz Results', skippedQuestions = []) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  const date = new Date().toLocaleDateString();

  let rank = 1;
  const resultsHTML = sorted.map((p, i) => {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      rank = i + 1;
    }
    const medal = i < 3 ? medals[i] : '';
    return `<tr>
      <td style="text-align:center;font-weight:700">${medal || '#' + rank}</td>
      <td>${p.name}</td>
      <td style="text-align:right;font-weight:700;color:#e85c1a">${p.score} pts</td>
    </tr>`;
  }).join('');

  const skippedHTML = skippedQuestions.length > 0 ? `
    <h3 style="margin-top:2rem">Skipped Questions</h3>
    ${skippedQuestions.map(q => `
      <div style="margin-bottom:0.75rem;padding:0.5rem;border:1px solid #ddd;border-radius:6px">
        <div style="font-size:0.8rem;color:#e85c1a;text-transform:uppercase">${q.topic || ''}</div>
        <div style="color:#666">${q.question || ''}</div>
        <div style="font-weight:600;color:#4caf50">${q.answer || ''}</div>
      </div>
    `).join('')}
  ` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${quizTitle} - Results</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 2rem auto; padding: 0 1rem; color: #333; }
    h1 { text-align: center; color: #e85c1a; }
    .meta { text-align: center; color: #888; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.6rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f8f8; font-size: 0.85rem; text-transform: uppercase; color: #888; }
    tr:first-child td { background: rgba(255,215,0,0.08); }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>${quizTitle}</h1>
  <div class="meta">${date}</div>
  <table>
    <thead><tr><th>Rank</th><th>Name</th><th style="text-align:right">Score</th></tr></thead>
    <tbody>${resultsHTML}</tbody>
  </table>
  ${skippedHTML}
  <div style="text-align:center;margin-top:2rem;color:#aaa;font-size:0.8rem">Qwizzeria — I learn, therefore I am</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }
}
