import { flagUrl, NAMES } from '../data/matchups';

const CX = 450, CY = 450;
const R_OUTER = 412;
const R_R32   = 350;
const R_R16   = 282;
const R_QF    = 214;
const R_SF    = 148;
const R_CTR   = 60;
const N = 16;

// +0.5 offset rotates the wheel half a slot so the two SF nodes land at
// exactly 3 o'clock and 9 o'clock — bracket halves sit on left/right semicircles
function fa(frac) {
  return ((frac + 0.5) / N) * 2 * Math.PI - Math.PI / 2;
}

function polar(r, angle) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

// Straight radial segment inward, then arc along the destination ring
function arcElbow(from, bendAngle, destR, to, sweep) {
  const bend = polar(destR, bendAngle);
  return `M ${from.x} ${from.y} L ${bend.x} ${bend.y} A ${destR} ${destR} 0 0 ${sweep} ${to.x} ${to.y}`;
}

const LIVE_GREEN = '#00E676';

function matchColor(status) {
  if (status === 'live')  return LIVE_GREEN;
  if (status === 'final') return '#4CAF50';
  return '#C9A84C';
}

function getWinner(d) {
  if (!d || d.status !== 'final') return null;
  // Score comparison first — fullTime already includes AET/pen goals so it's always reliable
  if (d.homeScore != null && d.awayScore != null) {
    if (d.homeScore > d.awayScore) return d.home;
    if (d.awayScore > d.homeScore) return d.away;
  }
  // Fallback to API-declared winner for edge cases (e.g. scores not yet populated)
  return d.winner || null;
}

function getMatchData(liveData, home, away) {
  return liveData[`${home}-${away}`] || liveData[`${away}-${home}`] || null;
}

// Unplayed inner ring paths — neutral grey (match not yet played)
const INNER_LINE = { stroke: '#707070', strokeWidth: '1.8', strokeOpacity: '0.85' };

// Each of the 32 teams occupies its own 11.25° slot around the outer ring.
// Home team = slot 2i, away team = slot 2i+1, giving exact 1-slot spacing.
function faTeam(slot) {
  return ((slot + 0.5) / (N * 2)) * 2 * Math.PI - Math.PI / 2;
}

// Build the R16 tooltip info for a given R16 slot (pairIdx = Math.floor(i/2))
function buildR16Info(pairIdx, matchupsArr, ld, innerRounds) {
  const m0 = matchupsArr[pairIdx * 2];
  const m1 = matchupsArr[pairIdx * 2 + 1];
  if (!m0 || !m1) return null;
  const d0 = getMatchData(ld, m0.home, m0.away);
  const d1 = getMatchData(ld, m1.home, m1.away);
  const w0 = getWinner(d0);
  const w1 = getWinner(d1);
  const r16 = innerRounds?.R16;
  let fix = null;
  if (w0 && w1 && r16) fix = r16[`${w0}-${w1}`] || r16[`${w1}-${w0}`];
  const homeLabel = w0 ? (NAMES[w0] || w0) : `W. ${m0.home}/${m0.away}`;
  const awayLabel = w1 ? (NAMES[w1] || w1) : `W. ${m1.home}/${m1.away}`;
  const hs = fix ? (fix.home === w0 ? fix.homeScore : fix.awayScore) : null;
  const as = fix ? (fix.home === w0 ? fix.awayScore : fix.homeScore) : null;
  return {
    stage: 'R16',
    homeCode: w0, awayCode: w1,
    homeLabel, awayLabel,
    utcDate: fix?.utcDate || null,
    status: fix?.status || 'scheduled',
    homeScore: hs, awayScore: as,
    winner: fix?.winner || null,
  };
}

export default function BracketSvg({ matchups, liveData, innerRounds, onMatchEnter, onMatchMove, onLeave, onRoundEnter }) {
  const lines = [];
  const nodes = [];

  matchups.forEach((match, i) => {
    const angle = fa(i);

    const posHome = polar(R_OUTER, faTeam(i * 2));
    const posAway = polar(R_OUTER, faTeam(i * 2 + 1));
    const posR32  = polar(R_R32, angle);

    // R16: pair (i, i+1) meets between their two angles
    const r16Frac = Math.floor(i / 2) * 2 + 0.5;
    const posR16  = polar(R_R16, fa(r16Frac));

    // QF: midpoint of the two R16 nodes in the group
    const qfFrac  = Math.floor(i / 4) * 4 + 1.5;
    const posQF   = polar(R_QF, fa(qfFrac));

    // SF: midpoint of the two QF nodes in the half
    // Half 0 (i=0..7)  → fa(3.5) = 3 o'clock
    // Half 1 (i=8..15) → fa(11.5) = 9 o'clock  (exactly opposite)
    const sfFrac  = Math.floor(i / 8) * 8 + 3.5;
    const posSF   = polar(R_SF, fa(sfFrac));

    const d      = getMatchData(liveData, match.home, match.away);
    const w      = getWinner(d);
    const status = d ? d.status : 'scheduled';
    const col    = matchColor(status);

    const homeScore = d ? (d.home === match.home ? d.homeScore : d.awayScore) : '-';
    const awayScore = d ? (d.home === match.home ? d.awayScore : d.homeScore) : '-';

    // Per-path colors:
    //   winner path  → blue       (match played, winner decided)
    //   loser path   → near-black (eliminated)
    //   live path    → green pulsing (only the two team → R32 paths)
    //   unplayed     → grey       (match not yet played)
    const GREY = '#707070';
    const homePathCol = status === 'live' ? LIVE_GREEN
                      : status === 'final' && w === match.home ? '#3A8FFF'
                      : status === 'final' && w !== match.home ? '#181822'
                      : GREY;
    const awayPathCol = status === 'live' ? LIVE_GREEN
                      : status === 'final' && w === match.away ? '#3A8FFF'
                      : status === 'final' && w !== match.away ? '#181822'
                      : GREY;
    // Advancing path (R32→R16): always grey — the R16 match hasn't been played
    // so this segment has no result to colour yet. Winner is shown at the R32 node.
    const advCol  = GREY;
    const liveClass = status === 'live' ? 'live-stroke' : '';

    // ── Teams → R32 ──────────────────────────────────────────────────────────
    lines.push(
      <path key={`hl-${i}`}
        className={liveClass}
        d={arcElbow(posHome, faTeam(i * 2), R_R32, posR32, 1)}
        fill="none" stroke={homePathCol} strokeWidth="1.8" strokeOpacity="0.85" strokeLinejoin="round" />,
      <path key={`al-${i}`}
        className={liveClass}
        d={arcElbow(posAway, faTeam(i * 2 + 1), R_R32, posR32, 0)}
        fill="none" stroke={awayPathCol} strokeWidth="1.8" strokeOpacity="0.85" strokeLinejoin="round" />,
    );

    // ── R32 → R16 ────────────────────────────────────────────────────────────
    lines.push(
      <path key={`r32r16-${i}`}
        d={arcElbow(posR32, angle, R_R16, posR16, i % 2 === 0 ? 1 : 0)}
        fill="none" stroke={advCol} strokeWidth="1.8" strokeOpacity="0.85" strokeLinejoin="round" />,
    );

    // ── R16 → QF (once per R16 pair) ─────────────────────────────────────────
    if (i % 2 === 0) {
      // First pair in the QF group arcs clockwise, second counterclockwise
      const sweep = Math.floor(i / 2) % 2 === 0 ? 1 : 0;
      lines.push(
        <path key={`r16qf-${i}`}
          d={arcElbow(posR16, fa(r16Frac), R_QF, posQF, sweep)}
          fill="none" {...INNER_LINE} strokeLinejoin="round" />,
      );
    }

    // ── QF → SF (once per QF group) ──────────────────────────────────────────
    if (i % 4 === 0) {
      // First QF in the SF half arcs clockwise, second counterclockwise
      const sweep = Math.floor(i / 4) % 2 === 0 ? 1 : 0;
      lines.push(
        <path key={`qfsf-${i}`}
          d={arcElbow(posQF, fa(qfFrac), R_SF, posSF, sweep)}
          fill="none" {...INNER_LINE} strokeLinejoin="round" />,
      );
    }

    // ── SF → Center (once per bracket half) ───────────────────────────────────
    if (i % 8 === 0) {
      const ctr = polar(R_CTR, fa(sfFrac));
      lines.push(
        <path key={`sfctr-${i}`}
          d={`M ${posSF.x} ${posSF.y} L ${ctr.x} ${ctr.y}`}
          fill="none" {...INNER_LINE} strokeLinejoin="round" />,
      );
    }

    // ── Team nodes ────────────────────────────────────────────────────────────
    function TeamNode({ pos, code, isWin, nodeKey }) {
      const isLose = status === 'final' && w !== null && w !== code;
      const lblAngle = Math.atan2(pos.y - CY, pos.x - CX);
      const lx = Math.cos(lblAngle) * 33;
      const ly = Math.sin(lblAngle) * 33;
      const border = isWin ? '#3A8FFF' : isLose ? '#252530' : (status === 'live' ? LIVE_GREEN : '#2A2A3A');
      return (
        <g key={nodeKey} transform={`translate(${pos.x},${pos.y})`} style={{ cursor: 'pointer' }}
          onMouseEnter={e => onMatchEnter(e, match, d)}
          onMouseMove={e => onMatchMove(e)}
          onMouseLeave={onLeave}
          onClick={e => { e.stopPropagation(); onMatchEnter(e, match, d); }}>
          <circle r="24" fill="#0F0F1A" stroke={border} strokeWidth={isWin ? '2.5' : '1.5'}
            className={status === 'live' ? 'live-stroke' : ''} />
          {flagUrl(code)
            ? <image href={flagUrl(code)} x="-22" y="-22" width="44" height="44"
                clipPath="url(#flagClip)" preserveAspectRatio="xMidYMid slice"
                style={isLose ? { filter: 'grayscale(100%) brightness(0.4)' } : {}} />
            : <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill={isLose ? '#444' : '#888070'}>{code}</text>
          }
          {isLose && <circle r="22" fill="rgba(0,0,0,0.35)" />}
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
            fontSize="8" fontFamily="Inter, sans-serif"
            fill={isWin ? '#3A8FFF' : isLose ? '#3A3A4A' : '#888070'} fontWeight={isWin ? '600' : '400'}>
            {code}
          </text>
        </g>
      );
    }

    nodes.push(
      <TeamNode key={`home-${i}`} pos={posHome} code={match.home} isWin={w === match.home} nodeKey={`home-${i}`} />,
      <TeamNode key={`away-${i}`} pos={posAway} code={match.away} isWin={w === match.away} nodeKey={`away-${i}`} />,
    );

    // ── Score label: floats radially outside the two team circles ────────────
    // Order by visual position so the upper team's score is always shown first.
    // For pens the API adds pen goals into fullTime, so subtract to get reg score:
    //   displayed as "1(3)–1(4)"  (reg(pens)–reg(pens))
    if (d && status !== 'scheduled' && homeScore !== null && awayScore !== null) {
      const sPos = polar(R_OUTER + 34, angle);
      const upperIsHome = posHome.y <= posAway.y;

      // Orient pen scores to home/away of this match
      const penH = d.penHome != null ? (d.home === match.home ? d.penHome : d.penAway) : null;
      const penA = d.penHome != null ? (d.home === match.home ? d.penAway : d.penHome) : null;

      const topRaw = upperIsHome ? homeScore : awayScore;
      const botRaw = upperIsHome ? awayScore : homeScore;
      const topPen = upperIsHome ? penH : penA;
      const botPen = upperIsHome ? penA : penH;

      const isPen = d.duration === 'PENALTY_SHOOTOUT' && topPen != null;
      const topLabel = isPen ? `${topRaw - topPen}(${topPen})` : topRaw;
      const botLabel = isPen ? `${botRaw - botPen}(${botPen})` : botRaw;

      nodes.push(
        <text key={`score-${i}`} x={sPos.x} y={sPos.y}
          textAnchor="middle" dominantBaseline="central"
          fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700" fill={col}
          pointerEvents="none">
          {topLabel}–{botLabel}
        </text>
      );
    }

    // ── R32 node: winner flag when decided, tiny dot otherwise ────────────────
    // Once the winner is known, hovering the R32 result node shows the R16 preview.
    const pairIdx = Math.floor(i / 2);
    const r16Info = w ? buildR16Info(pairIdx, matchups, liveData, innerRounds) : null;
    nodes.push(
      <g key={`r32-${i}`} transform={`translate(${posR32.x},${posR32.y})`} style={{ cursor: 'pointer' }}
        onMouseEnter={e => r16Info ? onRoundEnter(e, r16Info) : onMatchEnter(e, match, d)}
        onMouseMove={e => onMatchMove(e)}
        onMouseLeave={onLeave}
        onClick={e => { e.stopPropagation(); r16Info ? onRoundEnter(e, r16Info) : onMatchEnter(e, match, d); }}>
        {w ? (
          <>
            <circle r="18" fill="#0F0F1A" stroke="#C9A84C" strokeWidth="1.5" />
            {flagUrl(w)
              ? <image href={flagUrl(w)} x="-16" y="-16" width="32" height="32"
                  clipPath="url(#r32WinClip)" preserveAspectRatio="xMidYMid slice" />
              : <text textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#C9A84C">{w}</text>
            }
          </>
        ) : status === 'live' ? (
          <circle r="5" fill={LIVE_GREEN} opacity="0.8" className="live-stroke" />
        ) : (
          <circle r="8" fill="#0D0D1A" stroke="#707070" strokeWidth="1.5" />
        )}
      </g>,
    );

    // ── R16 dot (hover shows R16 matchup) ─────────────────────────────────────
    if (i % 2 === 0) {
      const r16NodeInfo = buildR16Info(pairIdx, matchups, liveData, innerRounds);
      nodes.push(
        <circle key={`r16-${i}`} cx={posR16.x} cy={posR16.y} r="11"
          fill="#0D0D1A" stroke="#707070" strokeWidth="1.5"
          style={{ cursor: 'pointer' }}
          onMouseEnter={e => r16NodeInfo && onRoundEnter(e, r16NodeInfo)}
          onMouseMove={e => onMatchMove(e)}
          onMouseLeave={onLeave}
          onClick={e => { e.stopPropagation(); r16NodeInfo && onRoundEnter(e, r16NodeInfo); }} />,
      );
    }

    // ── QF dot ────────────────────────────────────────────────────────────────
    if (i % 4 === 0) {
      nodes.push(
        <circle key={`qf-${i}`} cx={posQF.x} cy={posQF.y} r="11"
          fill="#0D0D1A" stroke="#707070" strokeWidth="1.5" />,
      );
    }

    // ── SF dot (at inner end of line, adjacent to trophy) ────────────────────
    if (i % 8 === 0) {
      const sfDot = polar(R_CTR, fa(sfFrac));
      nodes.push(
        <circle key={`sf-${i}`} cx={sfDot.x} cy={sfDot.y} r="12"
          fill="#0D0D1A" stroke="#5A5A7A" strokeWidth="1.8" />,
      );
    }
  });

  return (
    <div className="bracket-wrap">
      <svg viewBox="0 0 900 900" className="bracket-svg" onMouseLeave={onLeave} onClick={onLeave}>
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#C9A84C" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="trophyBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="25%" stopColor="#F0D060" />
            <stop offset="50%" stopColor="#FFF0A0" />
            <stop offset="75%" stopColor="#E8C040" />
            <stop offset="100%" stopColor="#7A5C10" />
          </linearGradient>
          <linearGradient id="trophyBase" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5A4010" />
            <stop offset="40%" stopColor="#C9A030" />
            <stop offset="60%" stopColor="#E8C840" />
            <stop offset="100%" stopColor="#5A4010" />
          </linearGradient>
          <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4B030" />
            <stop offset="50%" stopColor="#F8E878" />
            <stop offset="100%" stopColor="#B08820" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="trophyBlur" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
          <clipPath id="flagClip">
            <circle r="22" />
          </clipPath>
          <clipPath id="r32WinClip">
            <circle r="16" />
          </clipPath>
        </defs>

        <g>{lines}</g>
        <circle cx="450" cy="450" r="110" fill="#C9A84C" filter="url(#trophyBlur)" className="trophy-glow-circle" />
        <image href={`${import.meta.env.BASE_URL}trophy.webp`} x="320" y="288" width="261" height="324" />
        <g>{nodes}</g>
      </svg>
    </div>
  );
}
