import { MATCHUPS } from '../data/matchups';

function getWinner(d) {
  if (!d || d.status !== 'final') return null;
  if (d.homeScore != null && d.awayScore != null) {
    if (d.homeScore > d.awayScore) return d.home;
    if (d.awayScore > d.homeScore) return d.away;
  }
  return d.winner || null;
}

export default function PicksScore({ picks, liveData, innerRounds, finalMatch }) {
  if (!picks || !liveData) return null;

  let correct = 0, total = 0;
  const seen = new Set();

  function evalMatch(d) {
    if (!d || d.status !== 'final' || !d.home || !d.away) return;
    // Deduplicate: each match appears twice in inner round maps (both key orderings)
    const ck = [d.home, d.away].sort().join('-');
    if (seen.has(ck)) return;
    seen.add(ck);
    const picked = picks[`${d.home}-${d.away}`] || picks[`${d.away}-${d.home}`] || null;
    if (!picked) return;
    total++;
    if (getWinner(d) === picked) correct++;
  }

  MATCHUPS.forEach(m => evalMatch(liveData[`${m.home}-${m.away}`]));

  for (const map of [innerRounds?.R16, innerRounds?.QF, innerRounds?.SF]) {
    if (map) Object.values(map).forEach(evalMatch);
  }

  evalMatch(finalMatch);

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
