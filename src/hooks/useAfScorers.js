import { useState, useEffect } from 'react';

const WORKER = 'https://wc-scores.andrewpaulcummins.workers.dev';

export function useAfScorers(home, away, utcDate, isLive) {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (!home || !away || !utcDate || !isLive) return;
    const date = utcDate.slice(0, 10); // YYYY-MM-DD
    let cancelled = false;

    async function fetchGoals() {
      try {
        const r = await fetch(`${WORKER}/af-events?home=${home}&away=${away}&date=${date}`);
        const data = await r.json();
        if (!cancelled && Array.isArray(data.goals) && data.goals.length > 0) {
          setGoals(data.goals);
        }
      } catch {}
    }

    fetchGoals();
    const id = setInterval(fetchGoals, 5 * 60_000); // 5 min — matches worker cache TTL
    return () => { cancelled = true; clearInterval(id); };
  }, [home, away, utcDate, isLive]);

  return goals;
}
