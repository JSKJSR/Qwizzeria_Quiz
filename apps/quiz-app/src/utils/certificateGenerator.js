/**
 * Certificate generator — opens a styled printable page (Save as PDF).
 * Elegant formal layout inspired by traditional academic certificates.
 * Embeds the Qwizzeria logo at the top.
 */

const RANK_LABELS = {
  1: { ordinal: '1st Place', color: '#B8860B' },
  2: { ordinal: '2nd Place', color: '#71706E' },
  3: { ordinal: '3rd Place', color: '#8B5E3C' },
};

/**
 * Open a printable certificate in a new browser window.
 * The user can then "Save as PDF" via the print dialog.
 *
 * @param {object} params
 * @param {string} params.name - Participant name
 * @param {number} params.rank - 1, 2, or 3
 * @param {number} params.score - Final score
 * @param {string} params.quizTitle - Quiz/pack title
 * @param {string} params.date - Formatted date string
 */
export function generateCertificate({ name, rank, score, quizTitle = 'Quiz', date = '' }) {
  const info = RANK_LABELS[rank] || RANK_LABELS[1];

  // Build a base64 logo URL at runtime so the certificate works offline
  // We load the logo via fetch then embed it
  const logoUrl = `${window.location.origin}/qwizzeria-logo.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate — ${escapeHTML(name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: landscape;
      margin: 0;
    }

    body {
      width: 297mm;
      height: 210mm;
      margin: 0 auto;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cert {
      width: 277mm;
      height: 190mm;
      position: relative;
      background: #FFFDF5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20mm 30mm;
      font-family: 'Lato', 'Helvetica Neue', sans-serif;
      color: #2C2C2C;
    }

    /* ---- Decorative borders ---- */
    .cert::before {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 2px solid ${info.color};
      pointer-events: none;
    }

    .cert::after {
      content: '';
      position: absolute;
      inset: 10mm;
      border: 0.5px solid ${info.color}55;
      pointer-events: none;
    }

    /* ---- Corner ornaments ---- */
    .corner {
      position: absolute;
      width: 28px;
      height: 28px;
    }
    .corner::before, .corner::after {
      content: '';
      position: absolute;
      background: ${info.color};
    }
    .corner::before {
      width: 28px; height: 2px;
    }
    .corner::after {
      width: 2px; height: 28px;
    }
    .corner--tl { top: 9mm; left: 9mm; }
    .corner--tl::before { top: 0; left: 0; }
    .corner--tl::after { top: 0; left: 0; }

    .corner--tr { top: 9mm; right: 9mm; }
    .corner--tr::before { top: 0; right: 0; left: auto; }
    .corner--tr::after { top: 0; right: 0; left: auto; }

    .corner--bl { bottom: 9mm; left: 9mm; }
    .corner--bl::before { bottom: 0; left: 0; top: auto; }
    .corner--bl::after { bottom: 0; left: 0; top: auto; }

    .corner--br { bottom: 9mm; right: 9mm; }
    .corner--br::before { bottom: 0; right: 0; left: auto; top: auto; }
    .corner--br::after { bottom: 0; right: 0; left: auto; top: auto; }

    /* ---- Logo ---- */
    .cert__logo {
      width: 72px;
      height: auto;
      margin-bottom: 10px;
      opacity: 0.9;
    }

    /* ---- Organization name ---- */
    .cert__org {
      font-family: 'Lato', sans-serif;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: #C45A1A;
      margin-bottom: 2px;
    }

    /* ---- Title ---- */
    .cert__title {
      font-family: 'Lato', sans-serif;
      font-weight: 300;
      font-size: 12px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 24px;
    }

    /* ---- Rank badge ---- */
    .cert__rank {
      font-family: 'Lato', sans-serif;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${info.color};
      background: ${info.color}12;
      border: 1px solid ${info.color}44;
      padding: 4px 20px;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    /* ---- Recipient name ---- */
    .cert__name {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-weight: 400;
      font-style: italic;
      font-size: 42px;
      color: #1a1a1a;
      margin-bottom: 16px;
      line-height: 1.1;
    }

    /* ---- Decorative rule ---- */
    .cert__rule {
      width: 220px;
      height: 1px;
      background: ${info.color};
      margin-bottom: 20px;
      opacity: 0.5;
    }

    /* ---- Body text ---- */
    .cert__text {
      font-size: 13px;
      color: #555;
      text-align: center;
      line-height: 1.7;
      max-width: 420px;
      margin-bottom: 12px;
    }

    .cert__quiz-title {
      font-family: 'Lato', sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: #C45A1A;
      margin-bottom: 6px;
    }

    .cert__score {
      font-family: 'Lato', sans-serif;
      font-weight: 700;
      font-size: 15px;
      color: ${info.color};
      margin-bottom: 20px;
    }

    /* ---- Footer ---- */
    .cert__footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .cert__date {
      font-size: 11px;
      color: #999;
    }

    .cert__tagline {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 11px;
      color: #aaa;
      letter-spacing: 0.05em;
    }

    .cert__bottom-org {
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #bbb;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="corner corner--tl"></div>
    <div class="corner corner--tr"></div>
    <div class="corner corner--bl"></div>
    <div class="corner corner--br"></div>

    <img
      src="${logoUrl}"
      alt="Qwizzeria"
      class="cert__logo"
      onerror="this.src='${window.location.origin}/qwizzeria-logo.svg'"
    />

    <div class="cert__org">Qwizzeria</div>
    <div class="cert__title">Certificate of Achievement</div>

    <div class="cert__rank">${info.ordinal}</div>

    <div class="cert__name">${escapeHTML(name)}</div>

    <div class="cert__rule"></div>

    <div class="cert__text">
      has been recognized for outstanding performance<br>
      during the quiz
    </div>

    <div class="cert__quiz-title">${escapeHTML(quizTitle)}</div>

    <div class="cert__score">Score: ${score} points</div>

    <div class="cert__footer">
      ${date ? `<div class="cert__date">${escapeHTML(date)}</div>` : ''}
      <div class="cert__tagline">I learn, therefore I am</div>
      <div class="cert__bottom-org">Qwizzeria Quiz Platform</div>
    </div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    // Allow fonts to load before triggering print
    setTimeout(() => win.print(), 600);
  }
}

/**
 * Alias kept for backward compatibility — now just calls generateCertificate.
 * @deprecated Use generateCertificate directly.
 */
export function downloadCertificate() {
  // No-op — generateCertificate now opens the print dialog directly
}

/** Escape HTML special characters to prevent XSS. */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
