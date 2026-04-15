import { useState, useEffect, useCallback } from 'react';
import { generateScoreCardImage } from '@/utils/scoreCardGenerator';
import { BADGES } from '@/utils/gamification';

const SHARE_URL = 'https://qwizzeria.com/play/free';

function buildShareText(score, maxScore) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return `I scored ${score}/${maxScore} (${pct}%) on Qwizzeria! Can you beat me?`;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}

export default function SharePanel({
  score, maxScore, correctCount, totalQuestions, bestStreak,
  gamification, onClose,
}) {
  const [imageData, setImageData] = useState(null);
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(score, maxScore);
  const generating = !imageData;

  useEffect(() => {
    let cancelled = false;
    const badgeKeys = (gamification?.newBadges || [])
      .filter((key) => BADGES.some((b) => b.key === key));
    generateScoreCardImage({
      score,
      maxScore,
      correctCount,
      totalQuestions,
      bestStreak,
      level: gamification?.level ?? null,
      levelTitle: gamification?.levelTitle ?? null,
      badges: badgeKeys,
      dailyStreakCount: gamification?.dailyStreak?.count ?? 0,
    }).then((result) => {
      if (!cancelled) setImageData(result);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [score, maxScore, correctCount, totalQuestions, bestStreak, gamification]);

  const handleShareX = useCallback(() => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [shareText]);

  const handleShareFacebook = useCallback(() => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [shareText]);

  const handleDownload = useCallback(() => {
    if (!imageData) return;
    const link = document.createElement('a');
    link.href = imageData.dataUrl;
    link.download = 'qwizzeria-score.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageData]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      if (imageData?.blob) {
        const file = new File([imageData.blob], 'qwizzeria-score.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ text: shareText, files: [file] });
          return;
        }
      }
      await navigator.share({ title: 'Qwizzeria Quiz Score', text: shareText, url: SHARE_URL });
    } catch {
      // User cancelled or share failed
    }
  }, [shareText, imageData]);

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="free-quiz__share-panel" role="region" aria-label="Share your score">
      <button
        className="free-quiz__share-panel-close"
        onClick={onClose}
        aria-label="Close share panel"
      >
        &times;
      </button>

      {generating ? (
        <div className="free-quiz__share-loading">Generating score card...</div>
      ) : imageData ? (
        <img
          src={imageData.dataUrl}
          alt={`Score card: ${score}/${maxScore} points`}
          className="free-quiz__share-preview"
        />
      ) : null}

      <div className="free-quiz__share-buttons">
        <button className="free-quiz__share-btn-item" onClick={handleShareX} aria-label="Share on X">
          <XIcon /> X
        </button>
        <button className="free-quiz__share-btn-item" onClick={handleShareFacebook} aria-label="Share on Facebook">
          <FacebookIcon /> Facebook
        </button>
        <button className="free-quiz__share-btn-item" onClick={handleDownload} disabled={!imageData} aria-label="Save score card image">
          <DownloadIcon /> Save Image
        </button>
        <button className="free-quiz__share-btn-item" onClick={handleCopy} aria-label="Copy score text">
          <CopyIcon /> {copied ? 'Copied!' : 'Copy Text'}
        </button>
        {supportsNativeShare && (
          <button className="free-quiz__share-btn-item" onClick={handleNativeShare} aria-label="Share via device">
            <ShareIcon /> Share
          </button>
        )}
      </div>
    </div>
  );
}
