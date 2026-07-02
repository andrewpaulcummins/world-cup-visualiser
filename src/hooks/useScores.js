import { useState, useEffect, useCallback } from 'react';
import { MATCHUPS } from '../data/matchups';

const REFRESH_MS = 30 * 1000;
const SCORES_URL = 'https://wc-scores.andrewpaulcummins.workers.dev';

// Works for both api-football (code/name) and football-data.org (tla/name)
const TEAM_LOOKUP = {
  GER:'GER', FRA:'FRA', BRA:'BRA', JPN:'JPN', NED:'NED', MAR:'MAR',
  ENG:'ENG', USA:'USA', ESP:'ESP', POR:'POR', ARG:'ARG', COL:'COL',
  GHA:'GHA', AUS:'AUS', CHE:'CHE', BEL:'BEL', SEN:'SEN', CRO:'CRO',
  CAN:'CAN', RSA:'RSA', PAR:'PAR', SWE:'SWE', NOR:'NOR', ECU:'ECU',
  MEX:'MEX', EGY:'EGY', COD:'COD', CIV:'CIV', BIH:'BIH', DZA:'DZA',
  CPV:'CPV', AUT:'AUT',
  SUI:'CHE', ALG:'DZA', CGO:'COD', BOS:'BIH', CVE:'CPV', SAF:'RSA',
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

function lookup(code, name) {
  if (!code && !name) return null;
  return TEAM_LOOKUP[code] || TEAM_LOOKUP[name] || code || name || null;
}

function getRoundLabel(round) {
  if (!round) return '';
  if (/32/i.test(round))            return 'Round of 32';
  if (/16/i.test(round))            return 'Round of 16';
  if (/quarter/i.test(round))       return 'Quarter-Final';
  if (/semi/i.test(round))          return 'Semi-Final';
  if (/3rd|third|place/i.test(round)) return '3rd Place Play-off';
  if (/final/i.test(round))         return 'Final';
  return round;
}

// Handles status codes from both apis and the TIMED heuristic for football-data.org free tier
function mapStatus(short, utcDate) {
  // api-football.com
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short))            return 'final';
  // football-data.org
  if (['IN_PLAY', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(short)) return 'live';
  if (['FINISHED', 'AWARDED'].includes(short))                        return 'final';
  // football-data.org free tier: TIMED during live play — infer from kick-off
  if (utcDate) {
    const elapsed = (Date.now() - new Date(utcDate)) / 60000;
    if (elapsed >= 0 && elapsed < 115) return 'live';
  }
  return 'scheduled';
}

// Normalise a raw fixture from either API into a common shape
function normalise(raw, isAF) {
  if (isAF) {
    // api-football.com format
    const home = lookup(raw.teams.home.code, raw.teams.home.name);
    const away = lookup(raw.teams.away.code, raw.teams.away.name);
    const short = raw.fixture.status.short;
    const elapsed = raw.fixture.status.elapsed;
    const goals = raw.goals;
    return {
      home, away,
      round:     raw.league?.round || '',
      short,
      utcDate:   raw.fixture.date,
      homeScore: goals.home ?? null,
      awayScore: goals.away ?? null,
      penHome:   raw.score?.penalty?.home ?? null,
      penAway:   raw.score?.penalty?.away ?? null,
      homeWon:   raw.teams.home.winner === true,
      awayWon:   raw.teams.away.winner === true,
      minuteStr: ['1H','2H','HT','ET','BT','P','LIVE'].includes(short) && elapsed ? `${elapsed}'` : null,
      duration:  short === 'PEN' ? 'PENALTY_SHOOTOUT' : short === 'AET' ? 'EXTRA_TIME' : 'REGULAR',
    };
  } else {
    // football-data.org format
    const home = lookup(raw.homeTeam.tla, raw.homeTeam.name);
    const away = lookup(raw.awayTeam.tla, raw.awayTeam.name);
    const ft   = raw.score?.fullTime;
    const ht   = raw.score?.halfTime;
    const apiW = raw.score?.winner;
    const utcDate = raw.utcDate;
    const short = raw.status;
    const status = mapStatus(short, utcDate);
    const elapsed = Math.floor((Date.now() - new Date(utcDate)) / 60000);
    function estimateMin() {
      if (short === 'HALFTIME') return 'HT';
      if (elapsed <= 45) return `${elapsed}'`;
      if (elapsed <= 60) return "45+'";
      return `${Math.min(elapsed - 15, 90)}'`;
    }
    return {
      home, away,
      round:     raw.stage || '',
      short,
      utcDate,
      homeScore: ft?.home ?? ht?.home ?? null,
      awayScore: ft?.away ?? ht?.away ?? null,
      penHome:   raw.score?.penalties?.home ?? null,
      penAway:   raw.score?.penalties?.away ?? null,
      homeWon:   apiW === 'HOME_TEAM',
      awayWon:   apiW === 'AWAY_TEAM',
      minuteStr: status === 'live' ? estimateMin() : null,
      duration:  raw.score?.duration || 'REGULAR',
    };
  }
}

function isR16Round(round) {
  return /16/i.test(round) || round === 'LAST_16';
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
  const [liveData, setLiveData]             = useState(buildSeedData);
  const [innerRounds, setInnerRounds]       = useState({ R16: {} });
  const [schedule, setSchedule]             = useState([]);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [lastUpdated, setLastUpdated]       = useState(null);
  const [apiStatus, setApiStatus]           = useState(null);

  const fetchScores = useCallback(async () => {
    setApiStatus({ type: 'loading', message: 'Fetching scores…' });
    try {
      const res = await fetch(`${SCORES_URL}?t=${Date.now()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `HTTP ${res.status}`);
      }

      const json = await res.json();

      // Auto-detect which API the Worker is fronting
      const isAF   = Array.isArray(json.response);  // api-football.com
      const rawList = isAF ? json.response : (Array.isArray(json.matches) ? json.matches : null);
      if (!rawList) throw new Error('Unexpected API format');

      console.log(`[WC API] format=${isAF ? 'api-football' : 'football-data'} fixtures=${rawList.length}`);

      const matchupSet = new Set(
        MATCHUPS.flatMap(m => [`${m.home}-${m.away}`, `${m.away}-${m.home}`])
      );

      const updated    = buildSeedData();
      const r16Map     = {};
      const scheduleArr = [];

      for (const raw of rawList) {
        const f = normalise(raw, isAF);
        const { home, away, round, short, utcDate, homeScore, awayScore,
                penHome, penAway, homeWon, awayWon, minuteStr, duration } = f;

        const status      = mapStatus(short, utcDate);
        const roundLabel  = getRoundLabel(round);

        // Build schedule entry for every non-final match
        if (status !== 'final') {
          scheduleArr.push({ home, away, utcDate, status, homeScore, awayScore, roundLabel });
        }

        // Detect tournament winner from the Final
        if (status === 'final' && /^final$/i.test(round.trim())) {
          const w = homeWon ? home : awayWon ? away : null;
          if (w) setTournamentWinner(w);
        }

        // R16 fixtures → inner-ring tooltip data
        if (isR16Round(round) && home && away) {
          const winner = homeWon ? home : awayWon ? away : null;
          const e = { home, away, utcDate, status, homeScore, awayScore, winner };
          r16Map[`${home}-${away}`] = e;
          r16Map[`${away}-${home}`] = { ...e, home: away, away: home, homeScore: awayScore, awayScore: homeScore };
          continue;
        }

        const inBracket = matchupSet.has(`${home}-${away}`) || matchupSet.has(`${away}-${home}`);
        if (!inBracket) continue;

        const winner = homeWon ? home : awayWon ? away : null;

        console.log(`[WC] ${home} v ${away} | status=${short}→${status} | ${homeScore}-${awayScore} | ${minuteStr || '-'}`);

        const entry = { home, away, homeScore, awayScore, status, minuteStr, duration, penHome, penAway, winner, utcDate };
        updated[`${home}-${away}`] = entry;
        updated[`${away}-${home}`] = {
          ...entry, home: away, away: home,
          homeScore: awayScore, awayScore: homeScore,
          penHome: penAway, penAway: penHome,
        };
      }

      scheduleArr.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

      setLiveData(updated);
      setInnerRounds({ R16: r16Map });
      setSchedule(scheduleArr);
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

  return { liveData, innerRounds, schedule, tournamentWinner, lastUpdated, fetchScores, apiStatus, setApiStatus };
}
