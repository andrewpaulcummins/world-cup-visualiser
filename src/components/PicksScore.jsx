import { NAMES } from '../data/matchups';

function getWinner(d) {
  if (!d || d.status !== 'final') return null;
  if (d.homeScore != null && d.awayScore != null) {
    if (d.homeScore > d.awayScore) return d.home;
    if (d.awayScore > d.homeScore) return d.away;
  }
  return d.winner || null;
}

export default function PicksScore({ picks, liveData }) {
  if (!picks || !liveData) return null;

  let correct = 0;
  let total = 0;

  for (const [key, picked] of Object.entries(picks)) {
    const [a, b] = key.split('-');
    const d = liveData[key] || liveData[`${b}-${a}`];
    if (!d || d.status !== 'final') continue;
    total++;
    if (getWinner(d) === picked) correct++;
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
