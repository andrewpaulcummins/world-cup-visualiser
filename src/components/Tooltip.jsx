import { FLAGS, NAMES } from '../data/matchups';

export default function Tooltip({ tooltip }) {
  if (!tooltip.visible) return null;
  const { match, data, x, y } = tooltip;
  if (!match) return null;

  const d = data;
  const flag1 = FLAGS[match.home] || '';
  const flag2 = FLAGS[match.away] || '';
  const n1 = NAMES[match.home] || match.home;
  const n2 = NAMES[match.away] || match.away;

  // Orient scores to match.home / match.away regardless of API home/away
  const hs = d ? (d.home === match.home ? d.homeScore : d.awayScore) : null;
  const as = d ? (d.home === match.home ? d.awayScore : d.homeScore) : null;
  const status = d ? d.status : 'scheduled';
  const hasScore = d && status !== 'scheduled' && hs != null && as != null;

  // Pen scores oriented to match.home / match.away
  const ph = d?.penHome != null ? (d.home === match.home ? d.penHome : d.penAway) : null;
  const pa = d?.penHome != null ? (d.home === match.home ? d.penAway : d.penHome) : null;
  const isPen = d?.duration === 'PENALTY_SHOOTOUT' && ph != null;

  // Score labels — for pens: "1(3)" style (API bundles pen goals into fullTime)
  const hsLabel = isPen ? `${hs - ph}(${ph})` : hs;
  const asLabel = isPen ? `${as - pa}(${pa})` : as;

  // Winner: use API-declared winner, fall back to score
  const winner = d?.winner ?? (hasScore ? (hs > as ? match.home : as > hs ? match.away : null) : null);

  return (
    <div
      className="tooltip"
      style={{
        left: Math.min(x + 14, window.innerWidth - 240),
        top: Math.min(y + 14, window.innerHeight - 120),
      }}
    >
      <div className="t-team-row">
        <span className={`t-team-name${winner === match.home ? ' t-winner' : ''}`}>{flag1} {n1}</span>
        {hasScore && <span className={`t-team-score${winner === match.home ? ' t-winner' : ''}`}>{hsLabel}</span>}
      </div>
      <div className="t-team-row">
        <span className={`t-team-name${winner === match.away ? ' t-winner' : ''}`}>{flag2} {n2}</span>
        {hasScore && <span className={`t-team-score${winner === match.away ? ' t-winner' : ''}`}>{asLabel}</span>}
      </div>
      {status === 'live' && (
        <div className="t-live">● LIVE{d?.minuteStr ? ` · ${d.minuteStr}` : ''}</div>
      )}
      {status === 'final' && (
        <>
          <div className="t-meta">
            {d?.duration === 'PENALTY_SHOOTOUT' ? 'After Penalties'
             : d?.duration === 'EXTRA_TIME'     ? 'After Extra Time'
             : 'Full Time'}
          </div>
        </>
      )}
      {status === 'scheduled' && <div className="t-meta">Upcoming</div>}
    </div>
  );
}
