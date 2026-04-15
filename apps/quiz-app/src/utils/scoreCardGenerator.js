import { BADGES } from './gamification';

const WIDTH = 1200;
const HEIGHT = 630;
const BG_COLOR = '#0a0a0a';
const ACCENT = '#e85c1a';
const TEXT_PRIMARY = '#f0f0f0';
const TEXT_SECONDARY = '#b0a0a5';
const TEXT_MUTED = '#776a6a';
const BOX_FILL = 'rgba(255, 255, 255, 0.06)';
const FONT_FAMILY = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawCenteredText(ctx, text, y) {
  ctx.fillText(text, WIDTH / 2, y);
}

function drawStatBox(ctx, x, y, w, h, value, label) {
  ctx.fillStyle = BOX_FILL;
  drawRoundRect(ctx, x, y, w, h, 10);

  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(value, x + w / 2, y + 35);

  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = `14px ${FONT_FAMILY}`;
  ctx.fillText(label, x + w / 2, y + 58);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Generate a branded score card PNG using Canvas API.
 * Returns { blob: Blob, dataUrl: string }.
 */
export async function generateScoreCardImage({
  score, maxScore, correctCount, totalQuestions, bestStreak,
  level, levelTitle, badges, dailyStreakCount,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const hasGamification = level != null;
  const badgeDefs = (badges || [])
    .map((key) => BADGES.find((b) => b.key === key))
    .filter(Boolean);

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle accent border
  ctx.strokeStyle = 'rgba(232, 92, 26, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(16, 16, WIDTH - 32, HEIGHT - 32, 12);
  ctx.stroke();

  // Logo
  let logoY = 50;
  const logo = await loadImage('/qwizzeria-logo.png');
  if (logo) {
    const logoW = 180;
    const logoH = (logo.height / logo.width) * logoW;
    ctx.drawImage(logo, (WIDTH - logoW) / 2, logoY, logoW, logoH);
    logoY += logoH + 12;
  } else {
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 32px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    drawCenteredText(ctx, 'QWIZZERIA', logoY + 30);
    logoY += 50;
  }

  // Accent line
  const lineY = logoY + 8;
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 100, lineY);
  ctx.lineTo(WIDTH / 2 + 100, lineY);
  ctx.stroke();

  // Dynamic vertical layout
  let cursorY = lineY + 40;

  // Hero percentage
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = `bold 96px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  drawCenteredText(ctx, `${pct}%`, cursorY + 70);
  cursorY += 90;

  // Score text
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = `24px ${FONT_FAMILY}`;
  drawCenteredText(ctx, `${score} / ${maxScore} points`, cursorY + 10);
  cursorY += 40;

  // Stat boxes
  const boxW = 170;
  const boxH = 70;
  const boxGap = 30;
  const totalBoxW = boxW * 3 + boxGap * 2;
  const boxStartX = (WIDTH - totalBoxW) / 2;
  const boxY = cursorY + 10;

  drawStatBox(ctx, boxStartX, boxY, boxW, boxH, `${correctCount}/${totalQuestions}`, 'Correct');
  drawStatBox(ctx, boxStartX + boxW + boxGap, boxY, boxW, boxH, String(bestStreak), 'Best Streak');
  drawStatBox(ctx, boxStartX + (boxW + boxGap) * 2, boxY, boxW, boxH, `${dailyStreakCount || 0}`, 'Day Streak');
  cursorY = boxY + boxH + 20;

  // Level row
  if (hasGamification) {
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 22px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    drawCenteredText(ctx, `Lv. ${level}  ${levelTitle}`, cursorY + 20);
    cursorY += 36;
  }

  // Badge row
  if (badgeDefs.length > 0) {
    ctx.font = `28px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    const badgeText = badgeDefs.map((b) => `${b.icon} ${b.label}`).join('   ');
    ctx.fillStyle = TEXT_PRIMARY;
    drawCenteredText(ctx, badgeText, cursorY + 20);
    cursorY += 36;
  }

  // Footer
  const footerY = HEIGHT - 40;

  // Footer line
  ctx.strokeStyle = TEXT_MUTED;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, footerY - 20);
  ctx.lineTo(WIDTH - 60, footerY - 20);
  ctx.stroke();

  ctx.font = `16px ${FONT_FAMILY}`;
  ctx.fillStyle = TEXT_MUTED;
  ctx.textAlign = 'left';
  ctx.fillText('qwizzeria.com', 60, footerY);
  ctx.textAlign = 'right';
  ctx.fillText('Can you beat me?', WIDTH - 60, footerY);

  // Generate output
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await canvasToBlob(canvas);

  return { blob, dataUrl };
}
