import { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MATCHUPS } from '../data/matchups';

function fireConfetti() {
  const colors = ['#F0D080', '#C9A84C', '#ffffff', '#FFD700', '#FFF0A0'];
  confetti({ particleCount: 120, spread: 80, origin: { x: 0.25, y: 0.55 }, colors, gravity: 0.9, scalar: 1.1 });
  setTimeout(() => {
    confetti({ particleCount: 120, spread: 80, origin: { x: 0.75, y: 0.55 }, colors, gravity: 0.9, scalar: 1.1 });
  }, 120);
  setTimeout(() => {
    confetti({ particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.3 }, colors, startVelocity: 25 });
  }, 300);
}

export function useGoalDetector(liveData, onGoal) {
  const prevData = useRef(null);

  useEffect(() => {
    if (!liveData) return;

    if (prevData.current === null) {
      prevData.current = liveData;
      return;
    }

    for (const match of MATCHUPS) {
      const key  = `${match.home}-${match.away}`;
      const curr = liveData[key];
      const prev = prevData.current[key];

      if (!curr || !prev) continue;
      if (curr.status !== 'live') continue;
      if (curr.homeScore == null || curr.awayScore == null) continue;
      if (prev.homeScore == null || prev.awayScore == null) continue;

      if ((curr.homeScore + curr.awayScore) > (prev.homeScore + prev.awayScore)) {
        fireConfetti();
        onGoal?.({
          home: match.home,
          away: match.away,
          homeScore: curr.homeScore,
          awayScore: curr.awayScore,
          minuteStr: curr.minuteStr,
          scoringTeam: curr.homeScore > prev.homeScore ? match.home : match.away,
        });
        break;
      }
    }

    prevData.current = liveData;
  }, [liveData, onGoal]);
}
