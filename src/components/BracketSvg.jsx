import { flagUrl, NAMES, TEAM_COLORS } from '../data/matchups';
import { usePinchZoom } from '../hooks/usePinchZoom';

function teamCol(code) { return TEAM_COLORS[code] || '#3A8FFF'; }

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

function getMatchKey(info) {
  return info?.homeCode && info?.awayCode ? `${info.homeCode}-${info.awayCode}` : null;
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

// QF: two R16 winners feed into one QF slot (i%4===0)
function buildQFInfo(i, matchupsArr, ld, innerRounds) {
  const r0 = buildR16Info(Math.floor(i / 2),     matchupsArr, ld, innerRounds);
  const r1 = buildR16Info(Math.floor(i / 2) + 1, matchupsArr, ld, innerRounds);
  const w0 = r0?.winner || null;
  const w1 = r1?.winner || null;
  const qfMap = innerRounds?.QF;
  let fix = null;
  if (w0 && w1 && qfMap) fix = qfMap[`${w0}-${w1}`] || qfMap[`${w1}-${w0}`];
  const homeLabel = w0 ? (NAMES[w0] || w0) : 'TBD';
  const awayLabel = w1 ? (NAMES[w1] || w1) : 'TBD';
  const hs = fix ? (fix.home === w0 ? fix.homeScore : fix.awayScore) : null;
  const as = fix ? (fix.home === w0 ? fix.awayScore : fix.homeScore) : null;
  return { stage: 'QF', homeCode: w0, awayCode: w1, homeLabel, awayLabel,
           utcDate: fix?.utcDate || null, status: fix?.status || 'scheduled',
           homeScore: hs, awayScore: as, winner: fix?.winner || null };
}

// SF: two QF winners feed into one SF slot (i%8===0)
function buildSFInfo(i, matchupsArr, ld, innerRounds) {
  const q0 = buildQFInfo(i,     matchupsArr, ld, innerRounds);
  const q1 = buildQFInfo(i + 4, matchupsArr, ld, innerRounds);
  const w0 = q0?.winner || null;
  const w1 = q1?.winner || null;
  const sfMap = innerRounds?.SF;
  let fix = null;
  if (w0 && w1 && sfMap) fix = sfMap[`${w0}-${w1}`] || sfMap[`${w1}-${w0}`];
  const homeLabel = w0 ? (NAMES[w0] || w0) : 'TBD';
  const awayLabel = w1 ? (NAMES[w1] || w1) : 'TBD';
  const hs = fix ? (fix.home === w0 ? fix.homeScore : fix.awayScore) : null;
  const as = fix ? (fix.home === w0 ? fix.awayScore : fix.homeScore) : null;
  return { stage: 'SF', homeCode: w0, awayCode: w1, homeLabel, awayLabel,
           utcDate: fix?.utcDate || null, status: fix?.status || 'scheduled',
           homeScore: hs, awayScore: as, winner: fix?.winner || null };
}

function getTeamIdx(matchups, code) {
  return matchups.findIndex(m => m.home === code || m.away === code);
}

// Search a round map for any entry that includes the given team code.
// Returns the first matching entry, or null.
function findTeamInMap(map, code) {
  if (!map || !code) return null;
  for (const entry of Object.values(map)) {
    if (entry.home === code || entry.away === code) return entry;
  }
  return null;
}

function makeInnerInfo(stage, entry) {
  return {
    stage,
    homeCode:  entry.home, awayCode:  entry.away,
    homeLabel: NAMES[entry.home] || entry.home,
    awayLabel: NAMES[entry.away] || entry.away,
    utcDate:   entry.utcDate,
    status:    entry.status,
    homeScore: entry.homeScore, awayScore: entry.awayScore,
    winner:    entry.winner,
  };
}

// Returns how far a team has advanced: 0=lost/unknown R32, 1=reached R16, 2=reached QF, 3=reached SF, 4=in Final
// Searches inner-round maps directly so it works even when R32 liveData is incomplete.
function getTeamAdvancement(code, matchupsArr, ld, ir) {
  if (!code) return -1;
  const idx = matchupsArr.findIndex(m => m.home === code || m.away === code);
  if (idx < 0) return -1;

  const sfEntry = findTeamInMap(ir?.SF, code);
  if (sfEntry) return sfEntry.winner === code ? 4 : 3;

  const qfEntry = findTeamInMap(ir?.QF, code);
  if (qfEntry) return qfEntry.winner === code ? 3 : 2;

  const r16Entry = findTeamInMap(ir?.R16, code);
  if (r16Entry) return r16Entry.winner === code ? 2 : 1;

  // Fall back to R32 liveData check
  const d = getMatchData(ld, matchupsArr[idx].home, matchupsArr[idx].away);
  return getWinner(d) === code ? 1 : 0;
}

// Returns the team's next/current match so the click modal shows the right game.
// Prioritises inner-round maps over R32 liveData so it works even when R32 data is incomplete.
function findNextMatchInfo(code, matchupsArr, ld, ir) {
  const idx = matchupsArr.findIndex(m => m.home === code || m.away === code);
  if (idx < 0) return null;

  // SF
  const sfEntry = findTeamInMap(ir?.SF, code);
  if (sfEntry) {
    if (sfEntry.winner && sfEntry.winner !== code) return null; // eliminated
    if (!sfEntry.winner) return { type: 'inner', info: makeInnerInfo('SF', sfEntry) };
    return null; // won SF → in Final
  }

  // QF
  const qfEntry = findTeamInMap(ir?.QF, code);
  if (qfEntry) {
    if (qfEntry.winner && qfEntry.winner !== code) return null;
    if (!qfEntry.winner) return { type: 'inner', info: makeInnerInfo('QF', qfEntry) };
    return null; // won QF, SF not yet in map
  }

  // R16
  const r16Entry = findTeamInMap(ir?.R16, code);
  if (r16Entry) {
    if (r16Entry.winner && r16Entry.winner !== code) return null;
    if (!r16Entry.winner) return { type: 'inner', info: makeInnerInfo('R16', r16Entry) };
    return null; // won R16, QF not yet in map
  }

  // R32 fallback
  const match = matchupsArr[idx];
  const d = getMatchData(ld, match.home, match.away);
  const gsWinner = getWinner(d);
  if (gsWinner !== code) return { type: 'match', match, data: d };
  return null; // won R32 but R16 not yet scheduled
}

// Deterministic particle ring around trophy
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  x: CX + Math.cos((i / 22) * Math.PI * 2) * (62 + (i % 5) * 14),
  y: CY + Math.sin((i / 22) * Math.PI * 2) * (58 + (i % 4) * 13),
  r: 1.1 + (i % 3) * 0.85,
  dur: `${2.1 + (i % 5) * 0.55}s`,
  delay: `${(i % 7) * 0.38}s`,
  rise: 48 + (i % 4) * 22,
}));

export default function BracketSvg({ matchups, liveData, innerRounds, onMatchEnter, onMatchMove, onLeave, onRoundEnter, onMatchClick, selectedTeam, onTeamSelect, onEliminatedClick, picks, glowColor = '#C9A84C' }) {
  const { scale, style: pinchStyle, reset: resetZoom, handlers: pinchHandlers } = usePinchZoom();
  const teamIdx = selectedTeam ? getTeamIdx(matchups, selectedTeam) : -1;
  const dimmed  = teamIdx >= 0;
  const adv     = dimmed ? getTeamAdvancement(selectedTeam, matchups, liveData, innerRounds) : -1;

  function onPath(i, level) {
    if (!dimmed) return true;
    if (level === 'match')  return i === teamIdx;
    if (level === 'r16')    return Math.floor(i / 2) === Math.floor(teamIdx / 2) && adv >= 1;
    if (level === 'qf')     return Math.floor(i / 4) === Math.floor(teamIdx / 4) && adv >= 2;
    if (level === 'sf')     return Math.floor(i / 8) === Math.floor(teamIdx / 8) && adv >= 3;
    if (level === 'center') return Math.floor(i / 8) === Math.floor(teamIdx / 8) && adv >= 4;
    return false;
  }
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

    // Compute inner-round info once per slot — used for both lines and nodes.
    const pairIdx  = Math.floor(i / 2);
    const r16Info  = buildR16Info(pairIdx, matchups, liveData, innerRounds);

    // Per-path colors:
    //   winner path  → team color  (match played, winner decided)
    //   loser path   → near-black  (eliminated)
    //   live path    → green pulsing
    //   unplayed     → grey
    const GREY = '#707070';
    const homePathCol = status === 'live' ? LIVE_GREEN
                      : status === 'final' && w === match.home ? teamCol(match.home)
                      : status === 'final' && w !== match.home ? '#181822'
                      : GREY;
    const awayPathCol = status === 'live' ? LIVE_GREEN
                      : status === 'final' && w === match.away ? teamCol(match.away)
                      : status === 'final' && w !== match.away ? '#181822'
                      : GREY;
    // Advancing path (R32→R16): winner's team color when decided, grey otherwise.
    const advCol  = w ? teamCol(w) : GREY;
    const liveClass = status === 'live' ? 'live-stroke' : '';

    // ── Teams → R32 ──────────────────────────────────────────────────────────
    const mOp  = onPath(i, 'match')  ? 1 : 0.06;
    const r16Op = onPath(i, 'r16')   ? 1 : 0.06;
    const qfOp  = onPath(i, 'qf')    ? 1 : 0.06;
    const sfOp  = onPath(i, 'sf')    ? 1 : 0.06;

    lines.push(
      <path key={`hl-${i}`} opacity={mOp}
        className={liveClass}
        d={arcElbow(posHome, faTeam(i * 2), R_R32, posR32, 1)}
        fill="none" stroke={homePathCol} strokeWidth="1.8" strokeOpacity="0.85" strokeLinejoin="round" />,
      <path key={`al-${i}`} opacity={mOp}
        className={liveClass}
        d={arcElbow(posAway, faTeam(i * 2 + 1), R_R32, posR32, 0)}
        fill="none" stroke={awayPathCol} strokeWidth="1.8" strokeOpacity="0.85" strokeLinejoin="round" />,
    );

    // ── R32 → R16 ────────────────────────────────────────────────────────────
    lines.push(
      <path key={`r32r16-${i}`} opacity={mOp}
        d={arcElbow(posR32, angle, R_R16, posR16, i % 2 === 0 ? 1 : 0)}
        fill="none" stroke={advCol} strokeWidth="1.8" strokeOpacity="0.85" strokeLinejoin="round" />,
    );

    // ── R16 → QF (once per R16 pair) ─────────────────────────────────────────
    if (i % 2 === 0) {
      const sweep = Math.floor(i / 2) % 2 === 0 ? 1 : 0;
      const r16LineCol = r16Info?.winner ? teamCol(r16Info.winner)
        : r16Info?.status === 'live' ? LIVE_GREEN : GREY;
      lines.push(
        <path key={`r16qf-${i}`} opacity={r16Op}
          d={arcElbow(posR16, fa(r16Frac), R_QF, posQF, sweep)}
          fill="none" stroke={r16LineCol} strokeWidth="1.8" strokeOpacity="0.85"
          className={r16Info?.status === 'live' ? 'live-stroke' : ''}
          strokeLinejoin="round" />,
      );
    }

    // ── QF → SF (once per QF group) ──────────────────────────────────────────
    if (i % 4 === 0) {
      const sweep = Math.floor(i / 4) % 2 === 0 ? 1 : 0;
      const qfInfoLine = buildQFInfo(i, matchups, liveData, innerRounds);
      const qfLineCol = qfInfoLine?.winner ? teamCol(qfInfoLine.winner)
        : qfInfoLine?.status === 'live' ? LIVE_GREEN : GREY;
      lines.push(
        <path key={`qfsf-${i}`} opacity={qfOp}
          d={arcElbow(posQF, fa(qfFrac), R_SF, posSF, sweep)}
          fill="none" stroke={qfLineCol} strokeWidth="1.8" strokeOpacity="0.85"
          className={qfInfoLine?.status === 'live' ? 'live-stroke' : ''}
          strokeLinejoin="round" />,
      );
    }

    // ── SF → Center (once per bracket half) ───────────────────────────────────
    if (i % 8 === 0) {
      const ctr = polar(R_CTR, fa(sfFrac));
      const sfInfoLine = buildSFInfo(i, matchups, liveData, innerRounds);
      const sfLineCol = sfInfoLine?.winner ? teamCol(sfInfoLine.winner)
        : sfInfoLine?.status === 'live' ? LIVE_GREEN : GREY;
      lines.push(
        <path key={`sfctr-${i}`} opacity={onPath(i, 'center') ? 1 : 0.06}
          d={`M ${posSF.x} ${posSF.y} L ${ctr.x} ${ctr.y}`}
          fill="none" stroke={sfLineCol} strokeWidth="1.8" strokeOpacity="0.85"
          className={sfInfoLine?.status === 'live' ? 'live-stroke' : ''}
          strokeLinejoin="round" />,
      );
    }

    // ── Team nodes ────────────────────────────────────────────────────────────
    function TeamNode({ pos, code, isWin, nodeKey }) {
      // Check if team was eliminated in any inner round (R16/QF/SF)
      const r16e = findTeamInMap(innerRounds?.R16, code);
      const qfe  = findTeamInMap(innerRounds?.QF,  code);
      const sfe  = findTeamInMap(innerRounds?.SF,  code);
      const lostInner =
        (r16e?.winner != null && r16e.winner !== code) ||
        (qfe?.winner  != null && qfe.winner  !== code) ||
        (sfe?.winner  != null && sfe.winner  !== code);
      const isLose = (status === 'final' && w !== null && w !== code) || lostInner;
      // Suppress R32-winner styling for teams that were later eliminated
      const win = isWin && !lostInner;
      const lblAngle = Math.atan2(pos.y - CY, pos.x - CX);
      const lx = Math.cos(lblAngle) * 33;
      const ly = Math.sin(lblAngle) * 33;
      const border = win ? teamCol(code) : isLose ? '#252530' : (status === 'live' ? LIVE_GREEN : '#2A2A3A');
      const isSelected = selectedTeam === code;
      const nodeOp = dimmed ? (isSelected ? 1 : onPath(i, 'match') ? 0.5 : 0.06) : 1;
      const matchKey = `${match.home}-${match.away}`;
      const pick = picks?.[matchKey] || picks?.[`${match.away}-${match.home}`];
      const isPick = pick === code;
      return (
        <g key={nodeKey} transform={`translate(${pos.x},${pos.y})`} style={{ cursor: 'pointer' }} opacity={nodeOp}
          onMouseEnter={e => onMatchEnter(e, match, d)}
          onMouseMove={e => onMatchMove(e)}
          onMouseLeave={onLeave}
          onClick={e => {
            e.stopPropagation();
            if (isLose) { onEliminatedClick?.(NAMES[code] || code); return; }
            onTeamSelect?.(isSelected ? null : code);
            const next = findNextMatchInfo(code, matchups, liveData, innerRounds);
            if (!next) return;
            if (next.type === 'match') {
              onMatchClick?.({
                matchKey: `${next.match.home}-${next.match.away}`,
                homeCode: next.match.home, awayCode: next.match.away,
                homeLabel: NAMES[next.match.home] || next.match.home,
                awayLabel: NAMES[next.match.away] || next.match.away,
                stage: 'R32', status: next.data?.status || 'scheduled',
              });
            } else {
              const info = next.info;
              onMatchClick?.({
                matchKey: info.homeCode && info.awayCode ? `${info.homeCode}-${info.awayCode}` : null,
                ...info,
              });
            }
          }}>
          <circle r="24" fill="#0F0F1A" stroke={border} strokeWidth={win ? '2.5' : '1.5'}
            className={status === 'live' ? 'live-stroke' : ''} />
          {flagUrl(code)
            ? <image href={flagUrl(code)} x="-22" y="-22" width="44" height="44"
                clipPath="url(#flagClip)" preserveAspectRatio="xMidYMid slice"
                style={isLose ? { filter: 'grayscale(100%) brightness(0.4)' } : {}} />
            : <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill={isLose ? '#444' : '#888070'}>{code}</text>
          }
          {isLose && <circle r="22" fill="rgba(0,0,0,0.35)" />}
          {isPick && <circle r="27" fill="none" stroke="#C9A84C" strokeWidth="2" strokeDasharray="4 3" opacity="0.9" />}
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
            fontSize="8" fontFamily="Inter, sans-serif"
            fill={win ? '#3A8FFF' : isLose ? '#3A3A4A' : '#888070'} fontWeight={win ? '600' : '400'}>
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
      const topLabel = isPen ? `${topRaw}(${topPen})` : topRaw;
      const botLabel = isPen ? `${botRaw}(${botPen})` : botRaw;

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
    nodes.push(
      <g key={`r32-${i}`} transform={`translate(${posR32.x},${posR32.y})`} style={{ cursor: 'pointer' }}
        onMouseEnter={e => r16Info ? onRoundEnter(e, r16Info) : onMatchEnter(e, match, d)}
        onMouseMove={e => onMatchMove(e)}
        onMouseLeave={onLeave}
        onClick={e => {
          e.stopPropagation();
          onMatchClick?.({
            matchKey: `${match.home}-${match.away}`,
            homeCode: match.home, awayCode: match.away,
            homeLabel: NAMES[match.home] || match.home,
            awayLabel: NAMES[match.away] || match.away,
            stage: 'R32', status,
          });
        }}>
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

    // ── R16 node (hover shows R16 matchup, winner flag when decided) ─────────
    if (i % 2 === 0) {
      nodes.push(
        <g key={`r16-${i}`} transform={`translate(${posR16.x},${posR16.y})`}
          opacity={onPath(i, 'r16') ? 1 : 0.06}
          style={{ cursor: 'pointer' }}
          onMouseEnter={e => r16Info && onRoundEnter(e, r16Info)}
          onMouseMove={e => onMatchMove(e)}
          onMouseLeave={onLeave}
          onClick={e => {
            e.stopPropagation();
            if (!r16Info) return;
            onMatchClick?.({
              matchKey: r16Info.homeCode && r16Info.awayCode
                ? `${r16Info.homeCode}-${r16Info.awayCode}` : null,
              ...r16Info,
            });
          }}>
          {r16Info?.winner ? (
            <>
              <circle r="14" fill="#0F0F1A" stroke={teamCol(r16Info.winner)} strokeWidth="1.8" />
              {flagUrl(r16Info.winner)
                ? <image href={flagUrl(r16Info.winner)} x="-12" y="-12" width="24" height="24"
                    clipPath="url(#r16WinClip)" preserveAspectRatio="xMidYMid slice" />
                : <text textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#C9A84C">{r16Info.winner}</text>
              }
            </>
          ) : r16Info?.status === 'live' ? (
            <circle r="6" fill={LIVE_GREEN} opacity="0.9" className="live-stroke" />
          ) : (
            <circle r="11" fill="#0D0D1A" stroke="#707070" strokeWidth="1.5" />
          )}
        </g>,
      );
    }

    // ── QF node (winner flag when decided) ────────────────────────────────────
    if (i % 4 === 0) {
      const qfInfo = buildQFInfo(i, matchups, liveData, innerRounds);
      nodes.push(
        <g key={`qf-${i}`} transform={`translate(${posQF.x},${posQF.y})`}
          style={{ cursor: 'pointer' }} opacity={onPath(i, 'qf') ? 1 : 0.06}
          onMouseEnter={e => qfInfo && onRoundEnter(e, qfInfo)}
          onMouseMove={e => onMatchMove(e)}
          onMouseLeave={onLeave}
          onClick={e => {
            e.stopPropagation();
            if (!qfInfo) return;
            onMatchClick?.({ matchKey: getMatchKey(qfInfo), ...qfInfo });
          }}>
          {qfInfo?.winner ? (
            <>
              <circle r="13" fill="#0F0F1A" stroke={teamCol(qfInfo.winner)} strokeWidth="1.8" />
              {flagUrl(qfInfo.winner)
                ? <image href={flagUrl(qfInfo.winner)} x="-11" y="-11" width="22" height="22"
                    clipPath="url(#qfWinClip)" preserveAspectRatio="xMidYMid slice" />
                : <text textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#C9A84C">{qfInfo.winner}</text>
              }
            </>
          ) : qfInfo?.status === 'live' ? (
            <circle r="6" fill={LIVE_GREEN} opacity="0.9" className="live-stroke" />
          ) : (
            <circle r="11" fill="#0D0D1A" stroke="#707070" strokeWidth="1.5" />
          )}
        </g>,
      );
    }

    // ── SF node (winner flag when decided, adjacent to trophy) ────────────────
    if (i % 8 === 0) {
      const sfDot = polar(R_CTR, fa(sfFrac));
      const sfInfo = buildSFInfo(i, matchups, liveData, innerRounds);
      nodes.push(
        <g key={`sf-${i}`} transform={`translate(${sfDot.x},${sfDot.y})`}
          style={{ cursor: 'pointer' }} opacity={onPath(i, 'sf') ? 1 : 0.06}
          onMouseEnter={e => sfInfo && onRoundEnter(e, sfInfo)}
          onMouseMove={e => onMatchMove(e)}
          onMouseLeave={onLeave}
          onClick={e => {
            e.stopPropagation();
            if (!sfInfo) return;
            onMatchClick?.({ matchKey: getMatchKey(sfInfo), ...sfInfo });
          }}>
          {sfInfo?.winner ? (
            <>
              <circle r="15" fill="#0F0F1A" stroke={teamCol(sfInfo.winner)} strokeWidth="2" />
              {flagUrl(sfInfo.winner)
                ? <image href={flagUrl(sfInfo.winner)} x="-13" y="-13" width="26" height="26"
                    clipPath="url(#sfWinClip)" preserveAspectRatio="xMidYMid slice" />
                : <text textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#C9A84C">{sfInfo.winner}</text>
              }
            </>
          ) : sfInfo?.status === 'live' ? (
            <circle r="7" fill={LIVE_GREEN} opacity="0.9" className="live-stroke" />
          ) : (
            <circle r="12" fill="#0D0D1A" stroke="#5A5A7A" strokeWidth="1.8" />
          )}
        </g>,
      );
    }
  });

  return (
    <div className="bracket-wrap" {...pinchHandlers}>
      {scale > 1 && (
        <button className="bracket-zoom-reset" onClick={resetZoom}>Reset zoom</button>
      )}
      <svg viewBox="0 0 900 900" className="bracket-svg" style={pinchStyle} onMouseLeave={onLeave}
        onClick={e => { onLeave(); onTeamSelect?.(null); }}>
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.5" />
            <stop offset="60%" stopColor={glowColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
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
          <clipPath id="r16WinClip"><circle r="12" /></clipPath>
          <clipPath id="qfWinClip"><circle r="11" /></clipPath>
          <clipPath id="sfWinClip"><circle r="13" /></clipPath>
        </defs>

        <g>{lines}</g>
        <circle cx="450" cy="450" r="120" fill={glowColor} filter="url(#trophyBlur)" className="trophy-glow-circle" />
        {PARTICLES.map((p, i) => (
          <circle key={`p${i}`} cx={p.x} cy={p.y} r={p.r} fill={glowColor}
            className="trophy-particle"
            style={{ '--pdur': p.dur, '--pdelay': p.delay, '--prise': `${p.rise}px` }}
          />
        ))}
        <image href={`${import.meta.env.BASE_URL}trophy.webp`} x="320" y="288" width="261" height="324" />
        <g>{nodes}</g>
      </svg>
    </div>
  );
}
