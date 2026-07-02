import { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MATCHUPS } from '../data/matchups';

function fireConfetti() {
  // Two bursts from either side, gold/white WC theme
  const colors = ['#F0D080', '#C9A84C', '#ffffff', '#FFD700', '#FFF0A0'];

  confetti({
    particleCount: 120,
    spread: 80,
    origin: { x: 0.25, y: 0.55 },
    colors,
    gravity: 0.9,
    scalar: 1.1,
  });

  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { x: 0.75, y: 0.55 },
      colors,
      gravity: 0.9,
      scalar: 1.1,
    });
  }, 120);

  // Trailing burst from top centre
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.3 },
      colors,
      startVelocity: 25,
    });
  }, 300);
}

export function useGoalDetector(liveData) {
  // null = not yet initialised (don't fire on first data load)
  const prevData = useRef(null);

  useEffect(() => {
    if (!liveData) return;

    if (prevData.current === null) {
      prevData.current = liveData;
      return;
    }

    for (const match of MATCHUPS) {
      const key = `${match.home}-${match.away}`;
      const curr = liveData[key];
      const prev = prevData.current[key];

      if (!curr || !prev) continue;
      if (curr.status !== 'live') continue;
      if (curr.homeScore == null || curr.awayScore == null) continue;
      if (prev.homeScore == null || prev.awayScore == null) continue;

      const scored = (curr.homeScore + curr.awayScore) > (prev.homeScore + prev.awayScore);
      if (scored) {
        fireConfetti();
        break; // one burst per poll even if multiple goals
      }
    }

    prevData.current = liveData;
  }, [liveData]);
}
