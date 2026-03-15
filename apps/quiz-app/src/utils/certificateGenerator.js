/**
 * Canvas-based certificate generator for quiz winners.
 * Pure Canvas API — no external dependencies.
 */

const MEDAL_COLORS = {
  1: { primary: '#FFD700', secondary: '#FFA500', label: '1st Place' },
  2: { primary: '#C0C0C0', secondary: '#A0A0A0', label: '2nd Place' },
  3: { primary: '#CD7F32', secondary: '#8B4513', label: '3rd Place' },
};

/**
 * Generate a certificate as a PNG data URL.
 * @param {object} params
 * @param {string} params.name - Participant name
 * @param {number} params.rank - 1, 2, or 3
 * @param {number} params.score - Final score
 * @param {string} params.quizTitle - Quiz/pack title
 * @param {string} params.date - Formatted date string
 * @returns {string} PNG data URL
 */
export function generateCertificate({ name, rank, score, quizTitle = 'Quiz', date = '' }) {
  const W = 1200;
  const H = 800;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const medal = MEDAL_COLORS[rank] || MEDAL_COLORS[1];

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  ctx.strokeStyle = medal.primary;
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // Inner border
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(45, 45, W - 90, H - 90);

  // Corner accents
  const cornerSize = 40;
  ctx.fillStyle = medal.primary;
  [[50, 50], [W - 50 - cornerSize, 50], [50, H - 50 - cornerSize], [W - 50 - cornerSize, H - 50 - cornerSize]].forEach(([x, y]) => {
    ctx.fillRect(x, y, cornerSize, 2);
    ctx.fillRect(x, y, 2, cornerSize);
  });

  // "Certificate of Achievement" header
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0.3em';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', W / 2, 120);

  // Qwizzeria branding
  ctx.fillStyle = '#e85c1a';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('QWIZZERIA', W / 2, 175);

  // Tagline
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = 'italic 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('I learn, therefore I am', W / 2, 200);

  // Medal circle
  const medalY = 290;
  const gradient = ctx.createRadialGradient(W / 2, medalY, 10, W / 2, medalY, 45);
  gradient.addColorStop(0, medal.primary);
  gradient.addColorStop(1, medal.secondary);
  ctx.beginPath();
  ctx.arc(W / 2, medalY, 45, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Rank number in medal
  ctx.fillStyle = '#000';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${rank}`, W / 2, 303);

  // Rank label
  ctx.fillStyle = medal.primary;
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(medal.label, W / 2, 370);

  // "Awarded to"
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Awarded to', W / 2, 430);

  // Participant name
  ctx.fillStyle = '#ffffff';
  // Scale font size for long names
  const nameSize = name.length > 20 ? 36 : name.length > 14 ? 44 : 52;
  ctx.font = `bold ${nameSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText(name, W / 2, 485);

  // Decorative line
  ctx.strokeStyle = medal.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 510);
  ctx.lineTo(W / 2 + 120, 510);
  ctx.stroke();

  // Quiz title
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`for outstanding performance in`, W / 2, 550);

  ctx.fillStyle = '#e85c1a';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  // Truncate long titles
  const displayTitle = quizTitle.length > 40 ? quizTitle.slice(0, 37) + '...' : quizTitle;
  ctx.fillText(displayTitle, W / 2, 585);

  // Score
  ctx.fillStyle = medal.primary;
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Score: ${score} pts`, W / 2, 640);

  // Date
  if (date) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(date, W / 2, 720);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Trigger a browser download of a data URL.
 * @param {string} dataUrl
 * @param {string} filename
 */
export function downloadCertificate(dataUrl, filename = 'certificate.png') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
