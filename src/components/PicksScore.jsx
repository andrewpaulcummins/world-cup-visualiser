import { MATCHUPS } from '../data/matchups';

function getWinner(d) {
  if (!d || d.status !== 'final') return null;
  if (d.homeScore != null && d.awayScore != null) {
    if (d.homeScore > d.awayScore) return d.home;
    if (d.awayScore > d.homeScore) return d.away;
  }
  return d.winner || null;
}

// Check a single slot: positional pick (e.g. r16_0) takes priority,
// falls back to team-code pick (e.g. "POR-ESP"). Returns null if no pick or match unfinished.
function evalSlot(picks, d, posKey, teamA, teamB) {
  if (!d || d.status !== 'final') return null;
  const actual = getWinner(d);
  if (!actual) return null;
  const picked = picks[posKey]
    || picks[`${teamA}-${teamB}`] || picks[`${teamB}-${teamA}`];
  if (!picked) return null;
  return { picked, actual };
}

export default function PicksScore({ picks, liveData, innerRounds, finalMatch }) {
  if (!picks || !liveData) return null;

  let correct = 0, total = 0;

  function tally(result) {
    if (!result) return;
    total++;
    if (result.picked === result.actual) correct++;
  }

  // ── R32 ───────────────────────────────────────────────────────────────────
  MATCHUPS.forEach(m => {
    const d = liveData[`${m.home}-${m.away}`];
    if (!d || d.status !== 'final') return;
    const picked = picks[`${m.home}-${m.away}`] || picks[`${m.away}-${m.home}`];
    if (!picked) return;
    total++;
    if (getWinner(d) === picked) correct++;
  });

  // ── R16 (8 slots) ─────────────────────────────────────────────────────────
  const r16Winners = Array(8).fill(null);
  for (let j = 0; j < 8; j++) {
    const m0 = MATCHUPS[j * 2], m1 = MATCHUPS[j * 2 + 1];
    if (!m0 || !m1) continue;
    const w0 = getWinner(liveData[`${m0.home}-${m0.away}`]);
    const w1 = getWinner(liveData[`${m1.home}-${m1.away}`]);
    if (!w0 || !w1) continue;
    const r16 = innerRounds?.R16;
    const d = r16?.[`${w0}-${w1}`] || r16?.[`${w1}-${w0}`];
    r16Winners[j] = getWinner(d);
    tally(evalSlot(picks, d, `r16_${j}`, w0, w1));
  }

  // ── QF (4 slots) ──────────────────────────────────────────────────────────
  const qfWinners = Array(4).fill(null);
  for (let k = 0; k < 4; k++) {
    const w0 = r16Winners[k * 2], w1 = r16Winners[k * 2 + 1];
    if (!w0 || !w1) continue;
    const qf = innerRounds?.QF;
    const d = qf?.[`${w0}-${w1}`] || qf?.[`${w1}-${w0}`];
    qfWinners[k] = getWinner(d);
    tally(evalSlot(picks, d, `qf_${k}`, w0, w1));
  }

  // ── SF (2 slots) ──────────────────────────────────────────────────────────
  const sfWinners = Array(2).fill(null);
  for (let l = 0; l < 2; l++) {
    const w0 = qfWinners[l * 2], w1 = qfWinners[l * 2 + 1];
    if (!w0 || !w1) continue;
    const sf = innerRounds?.SF;
    const d = sf?.[`${w0}-${w1}`] || sf?.[`${w1}-${w0}`];
    sfWinners[l] = getWinner(d);
    tally(evalSlot(picks, d, `sf_${l}`, w0, w1));
  }

  // ── Final ─────────────────────────────────────────────────────────────────
  const fw0 = sfWinners[0], fw1 = sfWinners[1];
  if (fw0 && fw1 && finalMatch) {
    tally(evalSlot(picks, finalMatch, 'pred_final', fw0, fw1));
  }

  if (total === 0) return null;

  const pct = Math.round((correct / total) * 100);

  return (
    <div className="picks-score">
      <span className="picks-score-label">Your picks</span>
      <span className="picks-score-value">{correct}/{total} correct</span>
      <span className="picks-score-pct">{pct}%</span>
    </div>
  );
}
