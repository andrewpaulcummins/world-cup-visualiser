import { useState, useCallback } from 'react';

const WORKER = 'https://wc-scores.andrewpaulcummins.workers.dev';

function getUserId() {
  let id = localStorage.getItem('wc26-uid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('wc26-uid', id);
  }
  return id;
}

export function useCommunityPicks() {
  const [data, setData]       = useState(null);   // { homeCount, awayCount, total }
  const [loading, setLoading] = useState(false);

  const fetchPicks = useCallback(async (matchKey) => {
    if (!matchKey) return;
    setLoading(true);
    setData(null);
    try {
      const r = await fetch(`${WORKER}/picks/${encodeURIComponent(matchKey)}`);
      if (r.ok) setData(await r.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  const submitPick = useCallback(async (matchKey, pickedTeam) => {
    if (!matchKey || !pickedTeam) return;
    const userId = getUserId();
    try {
      const r = await fetch(`${WORKER}/picks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, matchKey, pickedTeam }),
      });
      if (r.ok) setData(await r.json());
    } catch (_) {}
  }, []);

  return { data, loading, fetchPicks, submitPick };
}
