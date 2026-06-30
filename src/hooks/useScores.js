import { useState, useEffect, useCallback } from 'react';
import { MATCHUPS } from '../data/matchups';

const LS_KEY = 'wc2026_fdorg_key';
const REFRESH_MS = 5 * 60 * 1000;

const IS_PROD = import.meta.env.PROD;

// In production: fetch server-generated scores.json from the same origin (no CORS).
// In dev: proxy through Vite with the user's API key.
const BUILT_IN_KEY = import.meta.env.VITE_FOOTBALL_KEY || '';
const SCORES_URL = IS_PROD
  ? `${import.meta.env.BASE_URL}scores.json`
  : '/api/football/competitions/WC/matches';

// Map football-data.org TLA and name variants → our internal FIFA codes
const TEAM_LOOKUP = {
  // Standard TLAs (usually match)
  GER:'GER', FRA:'FRA', BRA:'BRA', JPN:'JPN', NED:'NED', MAR:'MAR',
  ENG:'ENG', USA:'USA', ESP:'ESP', POR:'POR', ARG:'ARG', COL:'COL',
  GHA:'GHA', AUS:'AUS', CHE:'CHE', BEL:'BEL', SEN:'SEN', CRO:'CRO',
  CAN:'CAN', RSA:'RSA', PAR:'PAR', SWE:'SWE', NOR:'NOR', ECU:'ECU',
  MEX:'MEX', EGY:'EGY', COD:'COD', CIV:'CIV', BIH:'BIH', DZA:'DZA',
  CPV:'CPV',
  // Alternate TLAs football-data.org sometimes uses
  SUI:'CHE', ALG:'DZA', CGO:'COD', BOS:'BIH', CVE:'CPV', SAF:'RSA',
  // Full name fallbacks
  'Germany':'GER', 'France':'FRA', 'Brazil':'BRA', 'Japan':'JPN',
  'Netherlands':'NED', 'Morocco':'MAR', 'England':'ENG', 'United States':'USA',
  'Spain':'ESP', 'Portugal':'POR', 'Argentina':'ARG', 'Colombia':'COL',
  'Ghana':'GHA', 'Australia':'AUS', 'Switzerland':'CHE', 'Belgium':'BEL',
  'Senegal':'SEN', 'Croatia':'CRO', 'Canada':'CAN', 'South Africa':'RSA',
  'Paraguay':'PAR', 'Sweden':'SWE', 'Norway':'NOR', 'Ecuador':'ECU',
  'Mexico':'MEX', 'Egypt':'EGY', 'DR Congo':'COD', "Côte d'Ivoire":'CIV',
  'Ivory Coast':'CIV', 'Bosnia and Herzegovina':'BIH', 'Algeria':'DZA',
  'Cape Verde':'CPV',
};

function resolveTeam(t) {
  return TEAM_LOOKUP[t.tla] || TEAM_LOOKUP[t.name] || t.tla;
}

function mapStatus(s) {
  if (['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(s)) return 'live';
  if (s === 'FINISHED') return 'final';
  return 'scheduled';
}

// football-data.org free tier omits the `minute` field entirely.
// Estimate from kick-off time: first half 0-45', HT break ~15 min, second half 45-90'.
function estimateMinuteStr(utcDate, apiStatus) {
  if (apiStatus === 'HALFTIME') return 'HT';
  const elapsed = Math.floor((Date.now() - new Date(utcDate)) / 60000);
  if (elapsed < 0) return null;
  if (elapsed <= 45) return `${elapsed}'`;
  if (elapsed <= 60) return "45+'";                          // halftime or stoppage
  return `${Math.min(elapsed - 15, 90)}'`;                  // second half (15 min HT)
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
  const [liveData, setLiveData]     = useState(buildSeedData);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus]   = useState(null);

  const getApiKey  = () => localStorage.getItem(LS_KEY) || BUILT_IN_KEY;
  const saveApiKey = (key) => localStorage.setItem(LS_KEY, key.trim());

  const fetchScores = useCallback(async () => {
    const key = getApiKey();
    if (!IS_PROD && !key) return; // dev requires a key; prod fetches scores.json directly

    setApiStatus({ type: 'loading', message: 'Fetching scores…' });
    try {
      const url = IS_PROD ? `${SCORES_URL}?t=${Date.now()}` : SCORES_URL;
      const res = await fetch(url, IS_PROD ? {} : { headers: { 'X-Auth-Token': key } });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }

      const { matches } = await res.json();

      // Only process matches that appear in our bracket
      const matchupSet = new Set(
        MATCHUPS.flatMap(m => [`${m.home}-${m.away}`, `${m.away}-${m.home}`])
      );

      console.log('[WC API] total matches returned:', matches.length);
      const updated = buildSeedData();
      for (const m of matches) {
        const home = resolveTeam(m.homeTeam);
        const away = resolveTeam(m.awayTeam);
        const inBracket = matchupSet.has(`${home}-${away}`) || matchupSet.has(`${away}-${home}`);
        if (!inBracket) continue;
        console.log(`[WC] ${home} v ${away} | status=${m.status} | stage=${m.stage} | ft=${JSON.stringify(m.score?.fullTime)} | winner=${m.score?.winner}`);

        const status = mapStatus(m.status);
        const ft = m.score?.fullTime;
        const ht = m.score?.halfTime;
        const homeScore = ft?.home ?? ht?.home ?? null;
        const awayScore = ft?.away ?? ht?.away ?? null;
        const minuteStr = status === 'live'
          ? estimateMinuteStr(m.utcDate, m.status)
          : null;

        // Penalty / AET info
        const duration = m.score?.duration ?? 'REGULAR';
        const penHome  = m.score?.penalties?.home ?? null;
        const penAway  = m.score?.penalties?.away ?? null;
        // API-declared winner handles pens / AET correctly (score may be level at 90')
        const apiWinner = m.score?.winner;
        const winnerCode = apiWinner === 'HOME_TEAM' ? home
                         : apiWinner === 'AWAY_TEAM' ? away
                         : null;

        const entry = { home, away, homeScore, awayScore, status, minuteStr, duration, penHome, penAway, winner: winnerCode };
        updated[`${home}-${away}`] = entry;
        // Reversed-key entry for BracketSvg lookup — swap pen scores too
        updated[`${away}-${home}`] = { ...entry, home: away, away: home, homeScore: awayScore, awayScore: homeScore, penHome: penAway, penAway: penHome };
      }

      setLiveData(updated);
      setLastUpdated(new Date());
      setApiStatus(null);
    } catch (e) {
      console.warn('Score fetch failed:', e);
      setApiStatus({ type: 'err', message: `Fetch failed — ${e.message}` });
    }
  }, []);

  useEffect(() => {
    if (IS_PROD || getApiKey()) fetchScores();
    const id = setInterval(() => { if (IS_PROD || getApiKey()) fetchScores(); }, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchScores]);

  return { liveData, lastUpdated, fetchScores, apiStatus, setApiStatus, getApiKey, saveApiKey, hasBuiltinKey: IS_PROD || !!BUILT_IN_KEY };
}
