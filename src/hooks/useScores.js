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
  URU:'URU', KOR:'KOR', IRN:'IRN', KSA:'KSA', SRB:'SRB', ROU:'ROU',
  DEN:'DEN', TUR:'TUR', UKR:'UKR', POL:'POL', HUN:'HUN', SVK:'SVK',
  SVN:'SVN', VEN:'VEN', PAN:'PAN', CRC:'CRC', HON:'HON', NZL:'NZL',
  NGA:'NGA', CMR:'CMR', IRQ:'IRQ', UZB:'UZB', JOR:'JOR', MLI:'MLI',
  SLV:'SLV', JAM:'JAM', TTO:'TTO', ZAM:'ZAM', BFA:'BFA', TAN:'TAN',
  CZE:'CZE', GRE:'GRE', WAL:'WAL', WLS:'WAL', ISR:'ISR', ALB:'ALB',
  MKD:'MKD', ISL:'ISL', FIN:'FIN', IRL:'IRL', SCO:'SCO', TUN:'TUN',
  ZIM:'ZIM', KEN:'KEN', UGA:'UGA', ANG:'ANG', MOZ:'MOZ', GUI:'GUI',
  ETH:'ETH', QAT:'QAT', ARE:'ARE', OMN:'OMN', BHR:'BHR', KUW:'KUW',
  VIE:'VIE', THA:'THA', IDN:'IDN', PHL:'PHL', IND:'IND', BOL:'BOL',
  PER:'PER', CHI:'CHI', GUA:'GUA', NIC:'NIC', CUB:'CUB', HAI:'HAI',
  TRI:'TTO', DOM:'DOM',
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
  'Uruguay':'URU', 'South Korea':'KOR', 'Korea Republic':'KOR',
  'Iran':'IRN', 'Saudi Arabia':'KSA', 'Serbia':'SRB', 'Romania':'ROU',
  'Denmark':'DEN', 'Turkey':'TUR', 'Ukraine':'UKR', 'Poland':'POL',
  'Hungary':'HUN', 'Slovakia':'SVK', 'Slovenia':'SVN', 'Venezuela':'VEN',
  'Panama':'PAN', 'Costa Rica':'CRC', 'Honduras':'HON', 'New Zealand':'NZL',
  'Nigeria':'NGA', 'Cameroon':'CMR', 'Iraq':'IRQ', 'Uzbekistan':'UZB',
  'Jordan':'JOR', 'Mali':'MLI', 'El Salvador':'SLV', 'Jamaica':'JAM',
  'Trinidad and Tobago':'TTO', 'Zambia':'ZAM', 'Burkina Faso':'BFA',
  'Tanzania':'TAN', 'Czechia':'CZE', 'Czech Republic':'CZE', 'Greece':'GRE',
  'Wales':'WAL', 'Israel':'ISR', 'Albania':'ALB', 'North Macedonia':'MKD',
  'Iceland':'ISL', 'Finland':'FIN', 'Republic of Ireland':'IRL', 'Ireland':'IRL',
  'Scotland':'SCO', 'Tunisia':'TUN', 'Zimbabwe':'ZIM', 'Kenya':'KEN',
  'Uganda':'UGA', 'Angola':'ANG', 'Mozambique':'MOZ', 'Guinea':'GUI',
  'Ethiopia':'ETH', 'Qatar':'QAT', 'United Arab Emirates':'ARE', 'UAE':'ARE',
  'Oman':'OMN', 'Bahrain':'BHR', 'Kuwait':'KUW', 'Vietnam':'VIE',
  'Thailand':'THA', 'Indonesia':'IDN', 'Philippines':'PHL', 'India':'IND',
  'Bolivia':'BOL', 'Peru':'PER', 'Chile':'CHI', 'Guatemala':'GUA',
  'Nicaragua':'NIC', 'Cuba':'CUB', 'Haiti':'HAI',
  'Trinidad & Tobago':'TTO', 'Dominican Republic':'DOM',
};

function lookup(code, name) {
  if (!code && !name) return null;
  return TEAM_LOOKUP[code] || TEAM_LOOKUP[name] || code || name || null;
}

function getRoundLabel(round) {
  if (!round) return '';
  if (/group/i.test(round))           return 'Group Stage';
  if (/32/i.test(round))              return 'Round of 32';
  if (/16/i.test(round))              return 'Round of 16';
  if (/quarter/i.test(round))         return 'Quarter-Final';
  if (/semi/i.test(round))            return 'Semi-Final';
  if (/3rd|third|place/i.test(round)) return '3rd Place Play-off';
  if (/final/i.test(round))           return 'Final';
  return round;
}

function computeStandings(matches) {
  const teams = {};
  for (const m of matches) {
    if (m.home && !teams[m.home]) teams[m.home] = { code: m.home, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    if (m.away && !teams[m.away]) teams[m.away] = { code: m.away, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  }
  for (const m of matches) {
    if (m.status !== 'final' || !m.home || !m.away) continue;
    const hs = m.homeScore ?? 0, as = m.awayScore ?? 0;
    teams[m.home].mp++; teams[m.home].gf += hs; teams[m.home].ga += as;
    teams[m.away].mp++; teams[m.away].gf += as; teams[m.away].ga += hs;
    if (hs > as)      { teams[m.home].w++; teams[m.home].pts += 3; teams[m.away].l++; }
    else if (hs < as) { teams[m.away].w++; teams[m.away].pts += 3; teams[m.home].l++; }
    else              { teams[m.home].d++; teams[m.home].pts++;     teams[m.away].d++; teams[m.away].pts++; }
  }
  return Object.values(teams)
    .map(t => ({ ...t, gd: t.gf - t.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.code.localeCompare(b.code));
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
      matchId:   raw.fixture.id || null,
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
      matchId:   raw.id || null,
      round:     raw.stage || '',
      group:     raw.group ? String(raw.group).replace(/^GROUP_/, '') : null,
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
      goals:     Array.isArray(raw.goals) ? raw.goals : [],
    };
  }
}

function isR16Round(round) { return /16/i.test(round) || round === 'LAST_16'; }
function isQFRound(round)  { return /quarter/i.test(round) || round === 'QUARTER_FINALS'; }
function isSFRound(round)  { return /semi/i.test(round) || round === 'SEMI_FINALS'; }
function isFinalRound(round) { return /^final$/i.test((round || '').trim()) || round === 'FINAL'; }

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
  const [groupStage, setGroupStage]         = useState({});
  const [finalMatch, setFinalMatch]         = useState(null);
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
      const qfMap      = {};
      const sfMap      = {};
      const scheduleArr = [];
      const groupData  = {};
      let   finalMatchData = null;

      for (const raw of rawList) {
        const f = normalise(raw, isAF);
        const { home, away, round, group, short, utcDate, homeScore, awayScore,
                penHome, penAway, homeWon, awayWon, minuteStr, duration } = f;

        const status      = mapStatus(short, utcDate);
        const roundLabel  = getRoundLabel(round);

        // Build schedule entry for every non-final match
        if (status !== 'final') {
          scheduleArr.push({ home, away, utcDate, status, homeScore, awayScore, roundLabel });
        }

        // Group stage matches → standings data
        if (round === 'GROUP_STAGE' && group && home && away) {
          if (!groupData[group]) groupData[group] = { matches: [] };
          groupData[group].matches.push({ home, away, homeScore, awayScore, status, utcDate });
          // Also update liveData for bracket matches so the live card shows scores + scorers
          const inBracketGS = matchupSet.has(`${home}-${away}`) || matchupSet.has(`${away}-${home}`);
          console.log(`[WC GS] ${home} v ${away} | status=${status} | ${homeScore}-${awayScore} | inBracket=${inBracketGS} | goals:`, f.goals);
          if (inBracketGS) {
            const winner = homeWon ? home : awayWon ? away : null;
            const e = { home, away, matchId: f.matchId, homeScore, awayScore, status, minuteStr, duration, penHome, penAway, winner, utcDate, goals: f.goals || [] };
            updated[`${home}-${away}`] = e;
            updated[`${away}-${home}`] = { ...e, home: away, away: home, homeScore: awayScore, awayScore: homeScore, penHome: penAway, penAway: penHome };
          }
          continue;
        }

        // QF fixtures
        if (isQFRound(round) && home && away) {
          const winner = homeWon ? home : awayWon ? away : null;
          const e = { home, away, utcDate, status, homeScore, awayScore, winner };
          qfMap[`${home}-${away}`] = e;
          qfMap[`${away}-${home}`] = { ...e, home: away, away: home, homeScore: awayScore, awayScore: homeScore };
          continue;
        }

        // SF fixtures
        if (isSFRound(round) && home && away) {
          const winner = homeWon ? home : awayWon ? away : null;
          const e = { home, away, utcDate, status, homeScore, awayScore, winner };
          sfMap[`${home}-${away}`] = e;
          sfMap[`${away}-${home}`] = { ...e, home: away, away: home, homeScore: awayScore, awayScore: homeScore };
          continue;
        }

        // Final fixture
        if (isFinalRound(round) && home && away) {
          const winner = homeWon ? home : awayWon ? away : null;
          if (winner) setTournamentWinner(winner);
          finalMatchData = { home, away, matchId: f.matchId, utcDate, status, homeScore, awayScore, penHome, penAway, winner, minuteStr, duration };
          continue;
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

        console.log(`[WC] ${home} v ${away} | status=${short}→${status} | ${homeScore}-${awayScore} | ${minuteStr || '-'} | goals:`, f.goals);

        const entry = { home, away, matchId: f.matchId, homeScore, awayScore, status, minuteStr, duration, penHome, penAway, winner, utcDate, goals: f.goals || [] };
        updated[`${home}-${away}`] = entry;
        updated[`${away}-${home}`] = {
          ...entry, home: away, away: home,
          homeScore: awayScore, awayScore: homeScore,
          penHome: penAway, penAway: penHome,
        };
      }

      scheduleArr.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

      const groupStageResult = {};
      for (const [letter, g] of Object.entries(groupData)) {
        groupStageResult[letter] = {
          name: `Group ${letter}`,
          matches: [...g.matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)),
          standings: computeStandings(g.matches),
        };
      }

      setLiveData(updated);
      setInnerRounds({ R16: r16Map, QF: qfMap, SF: sfMap });
      setSchedule(scheduleArr);
      setGroupStage(groupStageResult);
      setFinalMatch(finalMatchData);
      setLastUpdated(new Date());
      setApiStatus(null);
    } catch (e) {
      console.warn('Score fetch failed:', e);
      setApiStatus({ type: 'err', message: `Fetch failed: ${e.message}` });
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const id = setInterval(fetchScores, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchScores]);

  return { liveData, innerRounds, schedule, groupStage, finalMatch, tournamentWinner, lastUpdated, fetchScores, apiStatus, setApiStatus };
}
