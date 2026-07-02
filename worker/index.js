const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

const LIVE_STATUS = new Set(['IN_PLAY', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (!env.FOOTBALL_KEY) {
      return new Response(
        JSON.stringify({ error: 'FOOTBALL_KEY secret not configured in Worker' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    const url = new URL(request.url);

    // Match detail endpoint: /match/:id  → goal scorers for live card
    const matchRoute = url.pathname.match(/^\/match\/(\d+)$/);
    if (matchRoute) {
      const r = await fetch(`https://api.football-data.org/v4/matches/${matchRoute[1]}`, {
        headers: { 'X-Auth-Token': env.FOOTBALL_KEY },
      });
      const txt = await r.text();
      return new Response(txt, { headers: { 'Content-Type': 'application/json', ...CORS } });
    }

    // Debug endpoint: bypass cache, return raw API response
    if (url.pathname === '/debug') {
      const r = await fetch(API_URL, { headers: { 'X-Auth-Token': env.FOOTBALL_KEY } });
      const txt = await r.text();
      return new Response(txt, { headers: { 'Content-Type': 'application/json', ...CORS } });
    }

    const cache = caches.default;
    const cacheKey = new Request('https://wc26-fixtures.internal/v2');

    // Serve from Cloudflare edge cache if still fresh
    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.arrayBuffer();
      return new Response(body, {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // Cache miss — hit football-data.org
    const upstream = await fetch(API_URL, {
      headers: { 'X-Auth-Token': env.FOOTBALL_KEY },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream API error: ${upstream.status}` }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    const body = await upstream.text();

    // Adaptive TTL: 60 s when a match is live, 15 min otherwise
    let ttl = 900;
    try {
      const { matches } = JSON.parse(body);
      if (Array.isArray(matches) && matches.some(m => LIVE_STATUS.has(m.status))) {
        ttl = 60;
      }
    } catch (_) { /* non-fatal */ }

    // Store in Cloudflare edge cache
    await cache.put(
      cacheKey,
      new Response(body, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${ttl}` },
      })
    );

    return new Response(body, {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  },
};
