import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchTournament,
  reclaimStaleMatch,
} from '@qwizzeria/supabase-client/src/tournaments.js';
import {
  subscribeTournamentMatches,
  unsubscribeTournament,
} from '@qwizzeria/supabase-client/src/realtime.js';
import { useAuth } from '../hooks/useAuth';
import { isTournamentComplete, getChampion } from '../utils/tournamentBracket';
import TournamentBracket from '../components/host/TournamentBracket';
import SEO from '../components/SEO';
import '../styles/TournamentBracketPage.css';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Reconstruct bracket state from DB tournament + matches.
 */
function reconstructBracket(tournament, matches) {
  const bracket = JSON.parse(JSON.stringify(tournament.bracket));

  for (const m of matches) {
    const round = bracket.rounds[m.round_index];
    if (!round) continue;
    const match = round[m.match_index];
    if (!match) continue;

    match.team1Index = m.team1_index;
    match.team2Index = m.team2_index;
    match.team1Score = m.team1_score;
    match.team2Score = m.team2_score;
    match.winnerIndex = m.winner_index;
    match.status = m.status;
    match.playedBy = m.played_by;
    match.updatedAt = m.updated_at;
    match.dbMatchId = m.id;
  }

  return bracket;
}

/**
 * Apply a single match update to an existing bracket (optimistic update).
 */
function applyMatchUpdate(bracket, matchRow) {
  const newBracket = JSON.parse(JSON.stringify(bracket));
  const round = newBracket.rounds[matchRow.round_index];
  if (!round) return newBracket;
  const match = round[matchRow.match_index];
  if (!match) return newBracket;

  match.team1Index = matchRow.team1_index;
  match.team2Index = matchRow.team2_index;
  match.team1Score = matchRow.team1_score;
  match.team2Score = matchRow.team2_score;
  match.winnerIndex = matchRow.winner_index;
  match.status = matchRow.status;
  match.playedBy = matchRow.played_by;
  match.updatedAt = matchRow.updated_at;
  match.dbMatchId = matchRow.id;

  if (matchRow.status === 'completed' && matchRow.winner_index !== null) {
    const nextRoundIndex = matchRow.round_index + 1;
    if (nextRoundIndex < newBracket.rounds.length) {
      const nextMatchIndex = Math.floor(matchRow.match_index / 2);
      const slot = matchRow.match_index % 2 === 0 ? 'team1Index' : 'team2Index';
      const nextMatch = newBracket.rounds[nextRoundIndex][nextMatchIndex];
      if (nextMatch) {
        nextMatch[slot] = matchRow.winner_index;
      }
    }

    const loserIndex = match.team1Index === matchRow.winner_index
      ? match.team2Index
      : match.team1Index;
    if (loserIndex !== null && newBracket.teams[loserIndex]) {
      newBracket.teams[loserIndex] = { ...newBracket.teams[loserIndex], eliminated: true };
    }

    newBracket.completedMatches = (newBracket.completedMatches || 0) + 1;
  }

  return newBracket;
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio not available
  }
}

export default function TournamentBracketPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const channelRef = useRef(null);

  const loadTournament = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { tournament: t, matches } = await fetchTournament(tournamentId);
      setBracket(reconstructBracket(t, matches));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  // Realtime subscription
  useEffect(() => {
    if (!tournamentId) return;

    const channel = subscribeTournamentMatches(tournamentId, (matchRow) => {
      setBracket(prev => {
        if (!prev) return prev;
        return applyMatchUpdate(prev, matchRow);
      });

      if (matchRow.status === 'completed') {
        const matchKey = `${matchRow.round_index}-${matchRow.match_index}`;
        setRecentlyCompleted(prev => new Set(prev).add(matchKey));
        playNotificationSound();

        setTimeout(() => {
          setRecentlyCompleted(prev => {
            const next = new Set(prev);
            next.delete(matchKey);
            return next;
          });
        }, 2000);
      }
    });

    channelRef.current = channel;

    return () => {
      unsubscribeTournament(channel);
      channelRef.current = null;
    };
  }, [tournamentId]);

  const handleSelectMatch = useCallback((roundIndex, matchIndex) => {
    navigate(`/host/tournament/${tournamentId}/match/${tournamentId}-m-${roundIndex}-${matchIndex}`);
  }, [navigate, tournamentId]);

  const handleOpenInNewTab = useCallback((roundIndex, matchIndex) => {
    const matchId = `${tournamentId}-m-${roundIndex}-${matchIndex}`;
    window.open(`/host/tournament/${tournamentId}/match/${matchId}`, '_blank');
  }, [tournamentId]);

  const handleResumeMatch = useCallback(async (roundIndex, matchIndex) => {
    const matchId = `${tournamentId}-m-${roundIndex}-${matchIndex}`;
    try {
      await reclaimStaleMatch(matchId, user?.id);
      navigate(`/host/tournament/${tournamentId}/match/${matchId}`);
    } catch (err) {
      console.warn('Failed to reclaim match:', err);
      // Fall through — navigate anyway, the match page will handle the error
      navigate(`/host/tournament/${tournamentId}/match/${matchId}`);
    }
  }, [tournamentId, user, navigate]);

  const handleCopyUrl = useCallback(() => {
    const url = `${window.location.origin}/host/tournament/${tournamentId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="tournament-page">
        <div className="tournament-page__loading">
          <div className="tournament-page__spinner" />
          <p>Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-page">
        <div className="tournament-page__error">
          <p>Failed to load tournament: {error}</p>
          <button className="tournament-page__btn" onClick={loadTournament}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!bracket) return null;

  const isComplete = isTournamentComplete(bracket);
  const champion = isComplete ? getChampion(bracket) : null;

  return (
    <div className="tournament-page">
      <SEO title="Tournament Bracket" path={`/host/tournament/${tournamentId}`} noIndex />

      <div className="tournament-page__toolbar">
        <button className="tournament-page__back-btn" onClick={() => navigate('/host')}>
          &larr; Back to Host
        </button>
        <div className="tournament-page__toolbar-right">
          <button className="tournament-page__btn tournament-page__btn--copy" onClick={handleCopyUrl}>
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          {!isComplete && <span className="tournament-page__live-badge">LIVE</span>}
          <button className="tournament-page__btn" onClick={loadTournament}>
            Refresh
          </button>
        </div>
      </div>

      {isComplete && champion !== null && (
        <div className="tournament-page__champion-banner">
          <span className="tournament-page__champion-trophy">&#127942;</span>
          <span className="tournament-page__champion-text">
            Champion: <strong>{bracket.teams[champion].name}</strong>
          </span>
        </div>
      )}

      <TournamentBracket
        bracket={bracket}
        onSelectMatch={handleSelectMatch}
        onOpenInNewTab={handleOpenInNewTab}
        onResumeMatch={handleResumeMatch}
        recentlyCompleted={recentlyCompleted}
        staleThresholdMs={STALE_THRESHOLD_MS}
      />
    </div>
  );
}
