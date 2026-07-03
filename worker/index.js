const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

const LIVE_STATUS = new Set(['IN_PLAY', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function getAggregate(db, matchKey) {
  const { results } = await db
    .prepare('SELECT picked_team, COUNT(*) as cnt FROM picks WHERE match_key = ? GROUP BY picked_team')
    .bind(matchKey)
    .all();
  const [home, away] = matchKey.split('-');
  const counts = Object.fromEntries(results.map(r => [r.picked_team, Number(r.cnt)]));
  const homeCount = counts[home] || 0;
  const awayCount = counts[away] || 0;
  return { homeCount, awayCount, total: homeCount + awayCount };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const cache = caches.default;

    // ── Community picks: GET /picks/:matchKey ──────────────────────────────────
    const picksGet = url.pathname.match(/^\/picks\/([A-Z]{2,4}-[A-Z]{2,4})$/);
    if (picksGet && request.method === 'GET') {
      if (!env.DB) return json({ homeCount: 0, awayCount: 0, total: 0 });
      const matchKey = picksGet[1];
      return json(await getAggregate(env.DB, matchKey));
    }

    // ── Community picks: POST /picks ───────────────────────────────────────────
    if (url.pathname === '/picks' && request.method === 'POST') {
      if (!env.DB) return json({ error: 'DB not configured' }, 503);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
      const { userId, matchKey, pickedTeam } = body || {};
      if (!userId || !matchKey || !pickedTeam) return json({ error: 'Missing fields' }, 400);
      await env.DB
        .prepare('INSERT OR REPLACE INTO picks (user_id, match_key, picked_team, updated_at) VALUES (?, ?, ?, ?)')
        .bind(userId, matchKey, pickedTeam, Date.now())
        .run();
      return json(await getAggregate(env.DB, matchKey));
    }

    if (!env.FOOTBALL_KEY) {
      return json({ error: 'FOOTBALL_KEY secret not configured in Worker' }, 500);
    }

    // ── Match detail: /match/:id  (kept for compatibility) ─────────────────────
    const matchRoute = url.pathname.match(/^\/match\/(\d+)$/);
    if (matchRoute) {
      const r = await fetch(`https://api.football-data.org/v4/matches/${matchRoute[1]}`, {
        headers: { 'X-Auth-Token': env.FOOTBALL_KEY },
      });
      const txt = await r.text();
      return new Response(txt, { headers: { 'Content-Type': 'application/json', ...CORS } });
    }

    // ── Debug: bypass cache ────────────────────────────────────────────────────
    if (url.pathname === '/debug') {
      const r = await fetch(API_URL, { headers: { 'X-Auth-Token': env.FOOTBALL_KEY } });
      const txt = await r.text();
      return new Response(txt, { headers: { 'Content-Type': 'application/json', ...CORS } });
    }

    const cacheKey = new Request('https://wc26-fixtures.internal/v2');

    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.arrayBuffer();
      return new Response(body, { headers: { 'Content-Type': 'application/json', ...CORS } });
    }

    const upstream = await fetch(API_URL, { headers: { 'X-Auth-Token': env.FOOTBALL_KEY } });

    if (!upstream.ok) {
      return json({ error: `Upstream API error: ${upstream.status}` }, upstream.status);
    }

    const body = await upstream.text();

    let ttl = 900;
    try {
      const { matches } = JSON.parse(body);
      if (Array.isArray(matches) && matches.some(m => LIVE_STATUS.has(m.status))) ttl = 60;
    } catch (_) {}

    await cache.put(
      cacheKey,
      new Response(body, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${ttl}` },
      })
    );

    return new Response(body, { headers: { 'Content-Type': 'application/json', ...CORS } });
  },
};
