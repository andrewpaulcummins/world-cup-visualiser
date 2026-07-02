const API_URL = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

const LIVE_STATUS = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (!env.APIF_KEY) {
      return new Response(
        JSON.stringify({ error: 'APIF_KEY secret not configured in Worker' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    const cache = caches.default;
    const cacheKey = new Request('https://wc26-fixtures.internal/v1');

    // Serve from Cloudflare edge cache if still fresh
    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.arrayBuffer();
      return new Response(body, {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // Cache miss — hit api-football.com
    const upstream = await fetch(API_URL, {
      headers: { 'x-apisports-key': env.APIF_KEY },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream API error: ${upstream.status}` }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    const body = await upstream.text();

    // Adaptive TTL: 90 s when a match is live, 15 min otherwise
    // This keeps api-football.com calls well within the 100-req/day free quota.
    let ttl = 900;
    try {
      const { response } = JSON.parse(body);
      if (Array.isArray(response) && response.some(f => LIVE_STATUS.has(f.fixture.status.short))) {
        ttl = 90;
      }
    } catch (_) { /* non-fatal */ }

    // Store in Cloudflare edge cache with the chosen TTL
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
