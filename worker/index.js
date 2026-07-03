const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const AF_HOST = 'https://v3.football.api-sports.io';

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

// Flexible name → TLA map for matching api-football.com team names
const AF_TEAM_NAMES = {
  ARG:['Argentina'], AUS:['Australia'], AUT:['Austria'], BEL:['Belgium'],
  BFA:['Burkina Faso'], BIH:['Bosnia'], BRA:['Brazil'], CAN:['Canada'],
  CHE:['Switzerland'], CHI:['Chile'], CIV:["Ivory Coast","Côte d'Ivoire"],
  COD:['DR Congo','Congo DR'], COL:['Colombia'], CPV:['Cape Verde'],
  CRC:['Costa Rica'], CRO:['Croatia'], CUB:['Cuba'], CZE:['Czechia','Czech Republic'],
  DEN:['Denmark'], DOM:['Dominican'], DZA:['Algeria'], ECU:['Ecuador'],
  EGY:['Egypt'], ENG:['England'], ESP:['Spain'], ETH:['Ethiopia'],
  FIN:['Finland'], FRA:['France'], GER:['Germany'], GHA:['Ghana'],
  GRE:['Greece'], GUA:['Guatemala'], GUI:['Guinea'], HAI:['Haiti'],
  HON:['Honduras'], HUN:['Hungary'], IND:['India'], IRE:['Ireland','Republic of Ireland'],
  IRL:['Ireland','Republic of Ireland'], IRN:['Iran'], IRQ:['Iraq'],
  ISL:['Iceland'], ISR:['Israel'], JAM:['Jamaica'], JOR:['Jordan'],
  JPN:['Japan'], KEN:['Kenya'], KOR:['South Korea','Korea Republic'],
  KSA:['Saudi Arabia'], KUW:['Kuwait'], MAR:['Morocco'], MEX:['Mexico'],
  MKD:['North Macedonia'], MLI:['Mali'], MOZ:['Mozambique'], NED:['Netherlands'],
  NGA:['Nigeria'], NIC:['Nicaragua'], NOR:['Norway'], NZL:['New Zealand'],
  OMN:['Oman'], PAN:['Panama'], PAR:['Paraguay'], PER:['Peru'],
  PHL:['Philippines'], POL:['Poland'], POR:['Portugal'], QAT:['Qatar'],
  ROU:['Romania'], RSA:['South Africa'], SCO:['Scotland'], SEN:['Senegal'],
  SLV:['El Salvador'], SRB:['Serbia'], SVK:['Slovakia'], SVN:['Slovenia'],
  SWE:['Sweden'], TAN:['Tanzania'], THA:['Thailand'], TTO:['Trinidad'],
  TUN:['Tunisia'], TUR:['Turkey'], UGA:['Uganda'], UKR:['Ukraine'],
  URU:['Uruguay'], USA:['United States','USA'], UZB:['Uzbekistan'],
  VEN:['Venezuela'], VIE:['Vietnam'], WAL:['Wales'], ZAM:['Zambia'], ZIM:['Zimbabwe'],
};

function teamNameMatches(apiName, code) {
  const candidates = AF_TEAM_NAMES[code] || [code];
  const n = apiName.toLowerCase();
  return candidates.some(c => n.includes(c.toLowerCase()) || c.toLowerCase().includes(n));
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

    // ── Goal scorers from api-football.com: GET /af-events?home=EGY&away=AUS&date=YYYY-MM-DD ──
    if (url.pathname === '/af-events' && request.method === 'GET') {
      const home = url.searchParams.get('home');
      const away = url.searchParams.get('away');
      const date = url.searchParams.get('date');
      if (!home || !away || !date || !env.APIFOOTBALL_KEY) return json({ goals: [] });

      const afH = { 'x-apisports-key': env.APIFOOTBALL_KEY };

      // Step 1: get day's WC fixtures — cache 1 hour (fixture IDs don't change)
      const fixCacheKey = new Request(`https://af-internal/fixtures-${date}`);
      let fixData;
      const cachedFix = await cache.match(fixCacheKey);
      if (cachedFix) {
        fixData = await cachedFix.json();
      } else {
        const r = await fetch(`${AF_HOST}/fixtures?date=${date}&league=1&season=2026`, { headers: afH });
        fixData = await r.json();
        await cache.put(fixCacheKey, new Response(JSON.stringify(fixData), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=3600' },
        }));
      }

      // Find the fixture matching our home/away team codes
      const fix = (fixData.response || []).find(f =>
        (teamNameMatches(f.teams.home.name, home) && teamNameMatches(f.teams.away.name, away)) ||
        (teamNameMatches(f.teams.home.name, away) && teamNameMatches(f.teams.away.name, home))
      );
      if (!fix) return json({ goals: [] });

      const fid = fix.fixture.id;
      const homeId = fix.teams.home.id;

      // Step 2: get events — cache 60 seconds
      const evCacheKey = new Request(`https://af-internal/events-${fid}`);
      let evData;
      const cachedEv = await cache.match(evCacheKey);
      if (cachedEv) {
        evData = await cachedEv.json();
      } else {
        const r = await fetch(`${AF_HOST}/fixtures/events?fixture=${fid}`, { headers: afH });
        evData = await r.json();
        await cache.put(evCacheKey, new Response(JSON.stringify(evData), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' },
        }));
      }

      const goals = (evData.response || [])
        .filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty')
        .map(e => ({
          minute: e.time.elapsed,
          scorer: { name: e.player.name },
          // Map team.id back to the TLA codes we received
          team: { tla: e.team.id === homeId ? home : away },
          ownGoal: e.detail === 'Own Goal',
        }));

      return json({ goals, fixtureId: fid });
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
