import { useState, useEffect } from 'react';
import { MATCHUPS, NAMES, FLAGS, flagUrl } from '../data/matchups';
import { useCountdown } from '../hooks/useCountdown';

const WORKER = 'https://wc-scores.andrewpaulcummins.workers.dev';

function formatDate(utcDate) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(utcDate) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
}

function isToday(utcDate) {
  if (!utcDate) return false;
  return new Date(utcDate).toDateString() === new Date().toDateString();
}

function TeamFlag({ code }) {
  if (!code) return <span className="lmc-flag-emoji">🏳️</span>;
  const url = flagUrl(code);
  return url ? <img src={url} alt={code} className="lmc-flag" /> : <span className="lmc-flag-emoji">{FLAGS[code] || ''}</span>;
}

function teamName(code) {
  if (!code) return 'TBD';
  return NAMES[code] || code;
}

// ── Match stats (goal scorers) via Worker proxy ──────────────────────────────
function useMatchStats(matchId, isLive) {
  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!matchId || !isLive) return;
    let cancelled = false;
    fetch(`${WORKER}/match/${matchId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (Array.isArray(data.goals)) { setGoals(data.goals); setLoaded(true); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [matchId, isLive]);

  return { goals, loaded };
}

// ── Live match card ──────────────────────────────────────────────────────────
function LiveCard({ m, d }) {
  const { goals, loaded } = useMatchStats(d.matchId, true);

  const homeGoals = goals.filter(g => g.team?.tla === m.home || g.team?.tla === d.home);
  const awayGoals = goals.filter(g => g.team?.tla === m.away || g.team?.tla === d.away);

  // Free-tier API doesn't give live running scores; derive from goal events
  const scoreH = d.homeScore != null ? d.homeScore : (loaded ? homeGoals.length : null);
  const scoreA = d.awayScore != null ? d.awayScore : (loaded ? awayGoals.length : null);

  return (
    <div className="lmc">
      <div className="lmc-header">
        <span className="lmc-badge">● LIVE</span>
        <span className="lmc-round">Round of 32</span>
        {d.minuteStr && <span className="lmc-minute">{d.minuteStr}</span>}
        <a href="https://www.rte.ie/player/" target="_blank" rel="noopener noreferrer" className="lmc-watch-btn">
          Watch on RTÉ ▶
        </a>
      </div>
      <div className="lmc-body">
        <div className="lmc-team">
          <TeamFlag code={m.home} />
          <div className="lmc-team-info">
            <span className="lmc-name">{teamName(m.home)}</span>
            {homeGoals.length > 0 && (
              <div className="lmc-scorers">
                {homeGoals.map((g, i) => (
                  <span key={i} className="lmc-scorer">⚽ {g.scorer?.name?.split(' ').pop()} {g.minute}'</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="lmc-scorebox">
          <span className="lmc-score">{scoreH ?? '-'}</span>
          <span className="lmc-sep">-</span>
          <span className="lmc-score">{scoreA ?? '-'}</span>
          {d.duration === 'PENALTY_SHOOTOUT' && d.penHome != null && (
            <span className="lmc-pens">({d.penHome}–{d.penAway} pens)</span>
          )}
        </div>
        <div className="lmc-team lmc-team--right">
          <div className="lmc-team-info lmc-team-info--right">
            <span className="lmc-name">{teamName(m.away)}</span>
            {awayGoals.length > 0 && (
              <div className="lmc-scorers lmc-scorers--right">
                {awayGoals.map((g, i) => (
                  <span key={i} className="lmc-scorer">{g.minute}' {g.scorer?.name?.split(' ').pop()} ⚽</span>
                ))}
              </div>
            )}
          </div>
          <TeamFlag code={m.away} />
        </div>
      </div>
    </div>
  );
}

// ── Next upcoming match (with countdown) ────────────────────────────────────
function NextUpCard({ match }) {
  const countdown = useCountdown(match.utcDate);
  const today = isToday(match.utcDate);
  const dateStr = today ? `Today · ${formatTime(match.utcDate)}` : `${formatDate(match.utcDate)} · ${formatTime(match.utcDate)}`;

  return (
    <div className="lmc lmc--next">
      <div className="lmc-header">
        <span className="lmc-badge lmc-badge--next">NEXT UP</span>
        <span className="lmc-round">{match.roundLabel}</span>
        <span className="lmc-minute" style={{ color: 'var(--gold)' }}>{dateStr}</span>
        <a href="https://www.rte.ie/player/" target="_blank" rel="noopener noreferrer" className="lmc-watch-btn lmc-watch-btn--dim">RTÉ ▶</a>
      </div>
      <div className="lmc-body">
        <div className="lmc-team">
          <TeamFlag code={match.home} />
          <span className="lmc-name">{teamName(match.home)}</span>
        </div>
        <div className="lmc-scorebox" style={{ flexDirection: 'column', gap: 2 }}>
          <span className="lmc-vs">vs</span>
          {countdown && <span className="lmc-countdown">{countdown}</span>}
        </div>
        <div className="lmc-team lmc-team--right">
          <span className="lmc-name">{teamName(match.away)}</span>
          <TeamFlag code={match.away} />
        </div>
      </div>
    </div>
  );
}

// ── Full upcoming list ───────────────────────────────────────────────────────
function ScheduleList({ matches }) {
  const [open, setOpen] = useState(false);
  if (!matches.length) return null;

  const byDate = [];
  let currentDate = null;
  for (const m of matches) {
    const d = formatDate(m.utcDate) || 'Date TBC';
    if (d !== currentDate) { byDate.push({ date: d, items: [] }); currentDate = d; }
    byDate[byDate.length - 1].items.push(m);
  }

  return (
    <div className="lmc-schedule">
      <button className="lmc-schedule-title lmc-schedule-toggle" onClick={() => setOpen(o => !o)}>
        All Upcoming Matches ({matches.length})
        <span className="lmc-schedule-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && byDate.map(group => (
        <div key={group.date} className="lmc-schedule-group">
          <div className="lmc-schedule-date">{group.date}</div>
          {group.items.map((m, idx) => (
            <div key={idx} className="lmc-schedule-row">
              <span className="lmc-schedule-time">{formatTime(m.utcDate) || '-'}</span>
              <span className="lmc-schedule-round">{m.roundLabel}</span>
              <span className="lmc-schedule-teams">
                {teamName(m.home)} <span className="lmc-schedule-vs">vs</span> {teamName(m.away)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function LiveMatchCard({ liveData, schedule }) {
  const liveMatches = MATCHUPS
    .map(m => ({ m, d: liveData[`${m.home}-${m.away}`] }))
    .filter(({ d }) => d?.status === 'live');

  const liveKeys = new Set(liveMatches.map(({ m }) => `${m.home}-${m.away}`));
  const upcoming = (schedule || []).filter(
    m => m.status !== 'live' && !liveKeys.has(`${m.home}-${m.away}`) && !liveKeys.has(`${m.away}-${m.home}`)
  );

  const nextUp       = upcoming[0] || null;
  const restUpcoming = upcoming.slice(1);

  if (!liveMatches.length && !nextUp && !restUpcoming.length) return null;

  return (
    <div className="live-section">
      {liveMatches.map(({ m, d }) => <LiveCard key={`${m.home}-${m.away}`} m={m} d={d} />)}
      {nextUp && <NextUpCard match={nextUp} />}
      <ScheduleList matches={restUpcoming} />
    </div>
  );
}
