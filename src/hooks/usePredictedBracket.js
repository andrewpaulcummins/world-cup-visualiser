import { MATCHUPS } from '../data/matchups';

export function buildPredictedData(picks) {
  const r32Winners = MATCHUPS.map(m =>
    picks[`${m.home}-${m.away}`] || picks[`${m.away}-${m.home}`] || null
  );

  // Each pair's stored winner is validated against actual teams in that slot
  const r16Pairs = Array.from({ length: 8 }, (_, j) => {
    const home = r32Winners[j * 2] || null;
    const away = r32Winners[j * 2 + 1] || null;
    const stored = picks[`r16_${j}`] || null;
    const winner = (home && away && (stored === home || stored === away)) ? stored : null;
    return { home, away, winner, position: j };
  });

  const qfPairs = Array.from({ length: 4 }, (_, k) => {
    const home = r16Pairs[k * 2]?.winner || null;
    const away = r16Pairs[k * 2 + 1]?.winner || null;
    const stored = picks[`qf_${k}`] || null;
    const winner = (home && away && (stored === home || stored === away)) ? stored : null;
    return { home, away, winner, position: k };
  });

  const sfPairs = Array.from({ length: 2 }, (_, l) => {
    const home = qfPairs[l * 2]?.winner || null;
    const away = qfPairs[l * 2 + 1]?.winner || null;
    const stored = picks[`sf_${l}`] || null;
    const winner = (home && away && (stored === home || stored === away)) ? stored : null;
    return { home, away, winner, position: l };
  });

  const finalHome = sfPairs[0]?.winner || null;
  const finalAway = sfPairs[1]?.winner || null;
  const stored = picks['pred_final'] || null;
  const finalWinner = (finalHome && finalAway && (stored === finalHome || stored === finalAway))
    ? stored : null;
  const finalPair = { home: finalHome, away: finalAway, winner: finalWinner };

  // Synthetic liveData — status:'final' + winner drives all bracket highlighting logic
  const predictedLiveData = {};
  MATCHUPS.forEach((m, i) => {
    const winner = r32Winners[i] || null;
    const entry = { home: m.home, away: m.away, homeScore: null, awayScore: null,
                    status: winner ? 'final' : 'scheduled', winner,
                    penHome: null, penAway: null, duration: 'REGULAR' };
    predictedLiveData[`${m.home}-${m.away}`] = entry;
    predictedLiveData[`${m.away}-${m.home}`] = { ...entry, home: m.away, away: m.home };
  });

  const r16Map = {};
  r16Pairs.forEach(p => {
    if (!p.home || !p.away) return;
    const entry = { home: p.home, away: p.away, homeScore: null, awayScore: null,
                    status: p.winner ? 'final' : 'scheduled', winner: p.winner,
                    penHome: null, penAway: null, duration: 'REGULAR' };
    r16Map[`${p.home}-${p.away}`] = entry;
    r16Map[`${p.away}-${p.home}`] = { ...entry, home: p.away, away: p.home };
  });

  const qfMap = {};
  qfPairs.forEach(p => {
    if (!p.home || !p.away) return;
    const entry = { home: p.home, away: p.away, homeScore: null, awayScore: null,
                    status: p.winner ? 'final' : 'scheduled', winner: p.winner,
                    penHome: null, penAway: null, duration: 'REGULAR' };
    qfMap[`${p.home}-${p.away}`] = entry;
    qfMap[`${p.away}-${p.home}`] = { ...entry, home: p.away, away: p.home };
  });

  const sfMap = {};
  sfPairs.forEach(p => {
    if (!p.home || !p.away) return;
    const entry = { home: p.home, away: p.away, homeScore: null, awayScore: null,
                    status: p.winner ? 'final' : 'scheduled', winner: p.winner,
                    penHome: null, penAway: null, duration: 'REGULAR' };
    sfMap[`${p.home}-${p.away}`] = entry;
    sfMap[`${p.away}-${p.home}`] = { ...entry, home: p.away, away: p.home };
  });

  const predictedFinalMatch = finalHome && finalAway ? {
    home: finalHome, away: finalAway, homeScore: null, awayScore: null,
    status: finalWinner ? 'final' : 'scheduled', winner: finalWinner,
    penHome: null, penAway: null, duration: 'REGULAR',
  } : null;

  return {
    predictedLiveData,
    predictedInnerRounds: { R16: r16Map, QF: qfMap, SF: sfMap },
    predictedFinalMatch,
    r16Pairs, qfPairs, sfPairs, finalPair,
  };
}
