import { useState } from 'react';
import { MATCHUPS, NAMES, FLAGS, flagUrl } from '../data/matchups';
import { useCountdown } from '../hooks/useCountdown';

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

// ── Live match card ──────────────────────────────────────────────────────────
function LiveCard({ m, d }) {
  return (
    <div className="lmc">
      <div className="lmc-header">
        <span className="lmc-badge">● LIVE</span>
        <span className="lmc-round">Round of 32</span>
        {d.minuteStr && <span className="lmc-minute">{d.minuteStr}</span>}
        <a href="https://www.rte.ie/player/onnow" target="_blank" rel="noopener noreferrer" className="lmc-watch-btn">
          Watch on RTÉ ▶
        </a>
      </div>
      <div className="lmc-body">
        <div className="lmc-team">
          <TeamFlag code={m.home} />
          <span className="lmc-name">{teamName(m.home)}</span>
        </div>
        <div className="lmc-scorebox">
          <span className="lmc-score">{d.homeScore ?? '-'}</span>
          <span className="lmc-sep">-</span>
          <span className="lmc-score">{d.awayScore ?? '-'}</span>
          {d.duration === 'PENALTY_SHOOTOUT' && d.penHome != null && (
            <span className="lmc-pens">({d.penHome}–{d.penAway} pens)</span>
          )}
        </div>
        <div className="lmc-team lmc-team--right">
          <span className="lmc-name">{teamName(m.away)}</span>
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
        <a href="https://www.rte.ie/player/onnow" target="_blank" rel="noopener noreferrer" className="lmc-watch-btn lmc-watch-btn--dim">RTÉ ▶</a>
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

// ── Recent results ──────────────────────────────────────────────────────────
function RecentResultsList({ results }) {
  if (!results?.length) return null;
  return (
    <div className="lmc-results">
      <div className="lmc-results-title">Recent Results</div>
      {results.map((m, idx) => {
        const isPen = m.duration === 'PENALTY_SHOOTOUT' && m.penHome != null;
        return (
          <div key={idx} className="lmc-result-row">
            <span className="lmc-result-round">{m.roundLabel}</span>
            <div className="lmc-result-match">
              <div className={`lmc-result-team${m.winner === m.home ? ' lmc-result-team--win' : ''}`}>
                <TeamFlag code={m.home} />
                <span className="lmc-result-name">{teamName(m.home)}</span>
              </div>
              <div className="lmc-result-score">
                <div className="lmc-result-score-main">
                  <span className={m.winner === m.home ? 'lmc-result-score--win' : 'lmc-result-score--lose'}>{m.homeScore}</span>
                  <span className="lmc-sep">–</span>
                  <span className={m.winner === m.away ? 'lmc-result-score--win' : 'lmc-result-score--lose'}>{m.awayScore}</span>
                </div>
                {isPen && <div className="lmc-result-pens">(pens. {m.penHome} – {m.penAway})</div>}
              </div>
              <div className={`lmc-result-team lmc-result-team--right${m.winner === m.away ? ' lmc-result-team--win' : ''}`}>
                <span className="lmc-result-name">{teamName(m.away)}</span>
                <TeamFlag code={m.away} />
              </div>
            </div>
          </div>
        );
      })}
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

// ── The Final card ───────────────────────────────────────────────────────────
function FinalCard({ match }) {
  const isLive = match.status === 'live';
  const isFinal = match.status === 'final';
  const countdown = useCountdown(match.utcDate);
  const dateStr = match.utcDate ? `${formatDate(match.utcDate)} · ${formatTime(match.utcDate)}` : '';

  return (
    <div className={`lmc lmc--final${isLive ? ' lmc--live-final' : ''}`}>
      <div className="lmc-header">
        {isLive  && <span className="lmc-badge">● LIVE</span>}
        {isFinal && <span className="lmc-badge lmc-badge--done">FT</span>}
        {!isLive && !isFinal && <span className="lmc-badge lmc-badge--next">THE FINAL</span>}
        <span className="lmc-round lmc-round--final">World Cup Final</span>
        {isLive && match.minuteStr && <span className="lmc-minute">{match.minuteStr}</span>}
        {!isLive && !isFinal && dateStr && <span className="lmc-minute" style={{ color: 'var(--gold)' }}>{dateStr}</span>}
      </div>
      <div className="lmc-body">
        <div className="lmc-team">
          <TeamFlag code={match.home} />
          <span className="lmc-name lmc-name--final">{teamName(match.home)}</span>
        </div>
        <div className="lmc-scorebox" style={{ flexDirection: 'column', gap: 4 }}>
          {(isLive || isFinal) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="lmc-score lmc-score--final">{match.homeScore ?? '-'}</span>
              <span className="lmc-sep">-</span>
              <span className="lmc-score lmc-score--final">{match.awayScore ?? '-'}</span>
            </div>
          ) : (
            <>
              <span className="lmc-vs">vs</span>
              {countdown && <span className="lmc-countdown">{countdown}</span>}
            </>
          )}
          {isFinal && match.winner && (
            <span className="lmc-winner-label">World Champion</span>
          )}
          {match.penHome != null && (
            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>({match.penHome}–{match.penAway} pens)</span>
          )}
        </div>
        <div className="lmc-team lmc-team--right">
          <span className="lmc-name lmc-name--final">{teamName(match.away)}</span>
          <TeamFlag code={match.away} />
        </div>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function LiveMatchCard({ liveData, schedule, recentResults, finalMatch }) {
  const liveMatches = MATCHUPS
    .map(m => ({ m, d: liveData[`${m.home}-${m.away}`] }))
    .filter(({ d }) => d?.status === 'live');

  const liveKeys = new Set(liveMatches.map(({ m }) => `${m.home}-${m.away}`));
  const upcoming = (schedule || []).filter(
    m => m.status !== 'live' && !liveKeys.has(`${m.home}-${m.away}`) && !liveKeys.has(`${m.away}-${m.home}`)
  );

  const nextUp       = upcoming[0] || null;
  const restUpcoming = upcoming.slice(1);

  const hasFinal = finalMatch && (finalMatch.home || finalMatch.away);
  if (!liveMatches.length && !nextUp && !restUpcoming.length && !hasFinal && !recentResults?.length) return null;

  return (
    <div className="live-section">
      {hasFinal && <FinalCard match={finalMatch} />}
      {liveMatches.map(({ m, d }) => <LiveCard key={`${m.home}-${m.away}`} m={m} d={d} />)}
      {nextUp && <NextUpCard match={nextUp} />}
      <RecentResultsList results={recentResults} />
      <ScheduleList matches={restUpcoming} />
    </div>
  );
}
