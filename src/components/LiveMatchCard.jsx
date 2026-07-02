import { MATCHUPS, NAMES, FLAGS, flagUrl } from '../data/matchups';

function formatDate(utcDate) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleDateString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
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
  return url
    ? <img src={url} alt={code} className="lmc-flag" />
    : <span className="lmc-flag-emoji">{FLAGS[code] || ''}</span>;
}

function teamName(code) {
  if (!code) return 'TBD';
  return NAMES[code] || code;
}

// ── Live match card ─────────────────────────────────────────────────────────
function LiveCard({ m, d }) {
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
          <span className="lmc-name">{teamName(m.home)}</span>
        </div>
        <div className="lmc-scorebox">
          <span className="lmc-score">{d.homeScore ?? '—'}</span>
          <span className="lmc-sep">–</span>
          <span className="lmc-score">{d.awayScore ?? '—'}</span>
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

// ── Next upcoming match (featured card) ─────────────────────────────────────
function NextUpCard({ match }) {
  const today = isToday(match.utcDate);
  const dateStr = today ? `Today · ${formatTime(match.utcDate)}` : `${formatDate(match.utcDate)} · ${formatTime(match.utcDate)}`;
  return (
    <div className="lmc lmc--next">
      <div className="lmc-header">
        <span className="lmc-badge lmc-badge--next">NEXT UP</span>
        <span className="lmc-round">{match.roundLabel}</span>
        <span className="lmc-minute" style={{ color: 'var(--gold)' }}>{dateStr}</span>
        <a href="https://www.rte.ie/player/" target="_blank" rel="noopener noreferrer" className="lmc-watch-btn lmc-watch-btn--dim">
          RTÉ ▶
        </a>
      </div>
      <div className="lmc-body">
        <div className="lmc-team">
          <TeamFlag code={match.home} />
          <span className="lmc-name">{teamName(match.home)}</span>
        </div>
        <div className="lmc-scorebox">
          <span className="lmc-vs">vs</span>
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
  if (!matches.length) return null;

  // Group by date
  const byDate = [];
  let currentDate = null;
  for (const m of matches) {
    const d = formatDate(m.utcDate) || 'Date TBC';
    if (d !== currentDate) {
      byDate.push({ date: d, items: [] });
      currentDate = d;
    }
    byDate[byDate.length - 1].items.push(m);
  }

  return (
    <div className="lmc-schedule">
      <div className="lmc-schedule-title">All Upcoming Matches</div>
      {byDate.map(group => (
        <div key={group.date} className="lmc-schedule-group">
          <div className="lmc-schedule-date">{group.date}</div>
          {group.items.map((m, idx) => (
            <div key={idx} className="lmc-schedule-row">
              <span className="lmc-schedule-time">{formatTime(m.utcDate) || '—'}</span>
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

  // Skip the match already shown as live in the schedule list
  const liveKeys = new Set(liveMatches.map(({ m }) => `${m.home}-${m.away}`));
  const upcoming = (schedule || []).filter(
    m => m.status !== 'live' && !liveKeys.has(`${m.home}-${m.away}`) && !liveKeys.has(`${m.away}-${m.home}`)
  );

  const nextUp      = upcoming[0] || null;
  const restUpcoming = upcoming.slice(1);

  if (!liveMatches.length && !nextUp && !restUpcoming.length) return null;

  return (
    <div className="live-section">
      {liveMatches.map(({ m, d }) => (
        <LiveCard key={`${m.home}-${m.away}`} m={m} d={d} />
      ))}

      {nextUp && <NextUpCard match={nextUp} />}

      <ScheduleList matches={restUpcoming} />
    </div>
  );
}
