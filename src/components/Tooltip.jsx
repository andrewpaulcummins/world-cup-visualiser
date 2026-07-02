import { FLAGS, NAMES, flagUrl } from '../data/matchups';

function pos(x, y) {
  return {
    left: Math.min(x + 14, window.innerWidth - 240),
    top:  Math.min(y + 14, window.innerHeight - 160),
  };
}

function formatDateTime(utcDate) {
  if (!utcDate) return null;
  const d = new Date(utcDate);
  return d.toLocaleString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Inner-round tooltip (R16 / QF / SF) ───────────────────────────────────────
function RoundTooltip({ info, x, y }) {
  const { stage, homeCode, awayCode, homeLabel, awayLabel, utcDate, status, homeScore, awayScore, winner } = info;
  const stageLabel = stage === 'R16' ? 'Round of 16' : stage === 'QF' ? 'Quarter-final' : 'Semi-final';
  const hasScore   = status !== 'scheduled' && homeScore != null && awayScore != null;
  const flag1 = homeCode ? (flagUrl(homeCode) ? null : FLAGS[homeCode]) : null;
  const flag2 = awayCode ? (flagUrl(awayCode) ? null : FLAGS[awayCode]) : null;

  function TeamRow({ code, label, score, isWin }) {
    const url = code ? flagUrl(code) : null;
    return (
      <div className="t-team-row">
        <span className={`t-team-name${isWin ? ' t-winner' : ''}`}>
          {url ? <img src={url} alt={code} style={{ width: 16, height: 12, objectFit: 'cover', borderRadius: 2, marginRight: 5, verticalAlign: 'middle' }} /> : (FLAGS[code] || '')} {label}
        </span>
        {hasScore && <span className={`t-team-score${isWin ? ' t-winner' : ''}`}>{score}</span>}
      </div>
    );
  }

  return (
    <div className="tooltip" style={pos(x, y)}>
      <div className="t-meta" style={{ marginBottom: 6, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stageLabel}</div>
      <TeamRow code={homeCode} label={homeLabel} score={homeScore} isWin={winner === homeCode} />
      <TeamRow code={awayCode} label={awayLabel} score={awayScore} isWin={winner === awayCode} />
      {status === 'live'      && <div className="t-live">● LIVE</div>}
      {status === 'final'     && <div className="t-meta">Full Time</div>}
      {status === 'scheduled' && utcDate && (
        <div className="t-meta" style={{ marginTop: 6 }}>📅 {formatDateTime(utcDate)}</div>
      )}
      {status === 'scheduled' && !utcDate && <div className="t-meta">Date TBC</div>}
    </div>
  );
}

// ── R32 match tooltip (existing behaviour) ─────────────────────────────────────
function MatchTooltip({ match, data, x, y }) {
  const d    = data;
  const flag1 = FLAGS[match.home] || '';
  const flag2 = FLAGS[match.away] || '';
  const n1   = NAMES[match.home] || match.home;
  const n2   = NAMES[match.away] || match.away;

  const hs = d ? (d.home === match.home ? d.homeScore : d.awayScore) : null;
  const as = d ? (d.home === match.home ? d.awayScore : d.homeScore) : null;
  const status   = d ? d.status : 'scheduled';
  const hasScore = d && status !== 'scheduled' && hs != null && as != null;

  const ph = d?.penHome != null ? (d.home === match.home ? d.penHome : d.penAway) : null;
  const pa = d?.penHome != null ? (d.home === match.home ? d.penAway : d.penHome) : null;
  const isPen = d?.duration === 'PENALTY_SHOOTOUT' && ph != null;

  const hsLabel = isPen ? `${hs - ph}(${ph})` : hs;
  const asLabel = isPen ? `${as - pa}(${pa})` : as;

  const winner = d?.winner ?? (hasScore ? (hs > as ? match.home : as > hs ? match.away : null) : null);

  return (
    <div className="tooltip" style={pos(x, y)}>
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
        <div className="t-meta">
          {d?.duration === 'PENALTY_SHOOTOUT' ? 'After Penalties'
           : d?.duration === 'EXTRA_TIME'      ? 'After Extra Time'
           : 'Full Time'}
        </div>
      )}
      {status === 'scheduled' && <div className="t-meta">Upcoming</div>}
    </div>
  );
}

export default function Tooltip({ tooltip }) {
  if (!tooltip.visible) return null;

  if (tooltip.type === 'inner' && tooltip.info) {
    return <RoundTooltip info={tooltip.info} x={tooltip.x} y={tooltip.y} />;
  }

  if (!tooltip.match) return null;
  return <MatchTooltip match={tooltip.match} data={tooltip.data} x={tooltip.x} y={tooltip.y} />;
}
