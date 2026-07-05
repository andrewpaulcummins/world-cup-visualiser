import { useState } from 'react';

const KEY = 'wc26_picks';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

export function usePredictions() {
  const [picks, setPicks] = useState(load);

  const setPick = (home, away, winner) => {
    setPicks(prev => {
      const key = `${home}-${away}`;
      let next;
      if (!winner || prev[key] === winner) {
        next = { ...prev };
        delete next[key];
      } else {
        next = { ...prev, [key]: winner };
      }
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const getPick = (home, away) =>
    picks[`${home}-${away}`] || picks[`${away}-${home}`] || null;

  const setPredictedPick = (key, winner) => {
    setPicks(prev => {
      const next = { ...prev };
      if (!winner || prev[key] === winner) {
        delete next[key];
      } else {
        next[key] = winner;
      }
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const score = (() => {
    let correct = 0, total = 0;
    for (const [key, pick] of Object.entries(picks)) {
      // key is "HOME-AWAY"; pick is winner code
      // we can't check correctness without liveData here — done in App
      if (pick) total++;
    }
    return { correct, total };
  })();

  return { picks, setPick, setPredictedPick, getPick, score };
}
