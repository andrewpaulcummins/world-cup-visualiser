import { useState, useEffect, useCallback } from 'react';
import { MATCHUPS } from '../data/matchups';

const REFRESH_MS = 30 * 1000;
// Always call the Cloudflare Worker — it proxies api-football.com, handles auth + caching.
const SCORES_URL = 'https://wc-scores.andrewpaulcummins.workers.dev';

// Map api-football team code / full name → our internal FIFA TLA
const TEAM_LOOKUP = {
  GER:'GER', FRA:'FRA', BRA:'BRA', JPN:'JPN', NED:'NED', MAR:'MAR',
  ENG:'ENG', USA:'USA', ESP:'ESP', POR:'POR', ARG:'ARG', COL:'COL',
  GHA:'GHA', AUS:'AUS', CHE:'CHE', BEL:'BEL', SEN:'SEN', CRO:'CRO',
  CAN:'CAN', RSA:'RSA', PAR:'PAR', SWE:'SWE', NOR:'NOR', ECU:'ECU',
  MEX:'MEX', EGY:'EGY', COD:'COD', CIV:'CIV', BIH:'BIH', DZA:'DZA',
  CPV:'CPV', AUT:'AUT',
  // Alternate codes api-football sometimes uses
  SUI:'CHE', ALG:'DZA', CGO:'COD', BOS:'BIH', CVE:'CPV', SAF:'RSA',
  // Full name fallbacks
  'Germany':'GER', 'France':'FRA', 'Brazil':'BRA', 'Japan':'JPN',
  'Netherlands':'NED', 'Morocco':'MAR', 'England':'ENG', 'United States':'USA',
  'Spain':'ESP', 'Portugal':'POR', 'Argentina':'ARG', 'Colombia':'COL',
  'Ghana':'GHA', 'Australia':'AUS', 'Switzerland':'CHE', 'Belgium':'BEL',
  'Senegal':'SEN', 'Croatia':'CRO', 'Canada':'CAN', 'South Africa':'RSA',
  'Paraguay':'PAR', 'Sweden':'SWE', 'Norway':'NOR', 'Ecuador':'ECU',
  'Mexico':'MEX', 'Egypt':'EGY', 'DR Congo':'COD', "Côte d'Ivoire":'CIV',
  'Ivory Coast':'CIV', 'Bosnia and Herzegovina':'BIH', 'Bosnia':'BIH',
  'Algeria':'DZA', 'Cape Verde':'CPV', 'Austria':'AUT',
};

// api-football uses { code, name } on team objects
function resolveTeam(t) {
  return TEAM_LOOKUP[t.code] || TEAM_LOOKUP[t.name] || t.code;
}

// api-football fixture.status.short codes
function mapStatus(short) {
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short))            return 'final';
  return 'scheduled';
}

function buildSeedData() {
  const data = {};
  MATCHUPS.forEach(m => {
    data[`${m.home}-${m.away}`] = {
      home: m.home, away: m.away,
      homeScore: null, awayScore: null, status: 'scheduled',
    };
  });
  return data;
}

export function useScores() {
  const [liveData, setLiveData]       = useState(buildSeedData);
  const [innerRounds, setInnerRounds] = useState({ R16: {} });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus]     = useState(null);

  const fetchScores = useCallback(async () => {
    setApiStatus({ type: 'loading', message: 'Fetching scores…' });
    try {
      const res = await fetch(`${SCORES_URL}?t=${Date.now()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const fixtures = json.response;
      if (!Array.isArray(fixtures)) throw new Error('Unexpected API format');

      const matchupSet = new Set(
        MATCHUPS.flatMap(m => [`${m.home}-${m.away}`, `${m.away}-${m.home}`])
      );

      console.log('[WC API] total fixtures:', fixtures.length);

      const updated = buildSeedData();
      const r16Map = {};

      for (const f of fixtures) {
        const home  = resolveTeam(f.teams.home);
        const away  = resolveTeam(f.teams.away);
        const round = f.league?.round || '';
        const short = f.fixture.status.short;

        // ── Round of 16 fixtures → inner-ring tooltip data ────────────────────
        if (/16/i.test(round) && home && away) {
          const status   = mapStatus(short);
          const hs       = f.goals.home ?? null;
          const as       = f.goals.away ?? null;
          const winner   = f.teams.home.winner ? home : f.teams.away.winner ? away : null;
          const e = { home, away, utcDate: f.fixture.date, status, homeScore: hs, awayScore: as, winner };
          r16Map[`${home}-${away}`] = e;
          r16Map[`${away}-${home}`] = { ...e, home: away, away: home, homeScore: as, awayScore: hs };
          continue;
        }

        // ── R32 bracket matches ───────────────────────────────────────────────
        const inBracket = matchupSet.has(`${home}-${away}`) || matchupSet.has(`${away}-${home}`);
        if (!inBracket) continue;

        const status    = mapStatus(short);
        const elapsed   = f.fixture.status.elapsed;
        const homeScore = f.goals.home ?? null;
        const awayScore = f.goals.away ?? null;
        const minuteStr = status === 'live' && elapsed ? `${elapsed}'` : null;
        const duration  = short === 'PEN' ? 'PENALTY_SHOOTOUT'
                        : short === 'AET' ? 'EXTRA_TIME'
                        : 'REGULAR';
        const penHome   = f.score?.penalty?.home ?? null;
        const penAway   = f.score?.penalty?.away ?? null;
        const winner    = f.teams.home.winner ? home : f.teams.away.winner ? away : null;

        console.log(`[WC] ${home} v ${away} | round=${round} | status=${short} | elapsed=${elapsed} | goals=${homeScore}-${awayScore}`);

        const entry = { home, away, homeScore, awayScore, status, minuteStr, duration, penHome, penAway, winner, utcDate: f.fixture.date };
        updated[`${home}-${away}`] = entry;
        updated[`${away}-${home}`] = {
          ...entry, home: away, away: home,
          homeScore: awayScore, awayScore: homeScore,
          penHome: penAway, penAway: penHome,
        };
      }

      setLiveData(updated);
      setInnerRounds({ R16: r16Map });
      setLastUpdated(new Date());
      setApiStatus(null);
    } catch (e) {
      console.warn('Score fetch failed:', e);
      setApiStatus({ type: 'err', message: `Fetch failed — ${e.message}` });
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const id = setInterval(fetchScores, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchScores]);

  return { liveData, innerRounds, lastUpdated, fetchScores, apiStatus, setApiStatus };
}
