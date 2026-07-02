import { MATCHUPS, NAMES, FLAGS, flagUrl } from '../data/matchups';

function formatTime(utcDate) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
}

function isToday(utcDate) {
  if (!utcDate) return false;
  const d = new Date(utcDate);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function TeamFlag({ code }) {
  const url = flagUrl(code);
  return url
    ? <img src={url} alt={code} className="lmc-flag" />
    : <span className="lmc-flag-emoji">{FLAGS[code] || ''}</span>;
}

export default function LiveMatchCard({ liveData }) {
  // Derive live and today-scheduled matches from canonical MATCHUPS order (deduplication)
  const liveMatches = MATCHUPS
    .map(m => ({ m, d: liveData[`${m.home}-${m.away}`] }))
    .filter(({ d }) => d?.status === 'live');

  const todayScheduled = MATCHUPS
    .map(m => ({ m, d: liveData[`${m.home}-${m.away}`] }))
    .filter(({ d }) => d?.status === 'scheduled' && d?.utcDate && isToday(d.utcDate));

  if (liveMatches.length === 0 && todayScheduled.length === 0) return null;

  return (
    <div className="live-section">
      {liveMatches.map(({ m, d }) => (
        <div key={`${m.home}-${m.away}`} className="lmc">
          <div className="lmc-header">
            <span className="lmc-badge">● LIVE</span>
            <span className="lmc-round">Round of 32</span>
            {d.minuteStr && <span className="lmc-minute">{d.minuteStr}</span>}
          </div>
          <div className="lmc-body">
            <div className="lmc-team">
              <TeamFlag code={m.home} />
              <span className="lmc-name">{NAMES[m.home] || m.home}</span>
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
              <span className="lmc-name">{NAMES[m.away] || m.away}</span>
              <TeamFlag code={m.away} />
            </div>
          </div>
        </div>
      ))}

      {todayScheduled.length > 0 && (
        <div className="lmc-upcoming">
          <div className="lmc-upcoming-title">Today's Matches</div>
          {todayScheduled.map(({ m, d }) => (
            <div key={`${m.home}-${m.away}`} className="lmc-upcoming-row">
              <span>{FLAGS[m.home]} {NAMES[m.home] || m.home}</span>
              <span className="lmc-upcoming-time">{formatTime(d.utcDate)}</span>
              <span>{NAMES[m.away] || m.away} {FLAGS[m.away]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
