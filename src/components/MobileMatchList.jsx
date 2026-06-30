import { FLAGS, NAMES } from '../data/matchups';

function statusLabel(status) {
  if (status === 'live') return { text: 'LIVE', cls: 'live' };
  if (status === 'final') return { text: 'FT', cls: 'final' };
  return { text: 'TBD', cls: 'scheduled' };
}

function MatchCard({ match, data }) {
  const d = data[`${match.home}-${match.away}`] || data[`${match.away}-${match.home}`] || null;
  const status = d ? d.status : 'scheduled';
  const badge = statusLabel(status);

  const homeScore = d ? (d.home === match.home ? d.homeScore : d.awayScore) : null;
  const awayScore = d ? (d.home === match.home ? d.awayScore : d.homeScore) : null;

  const winnerCode = d && d.status === 'final'
    ? (d.homeScore > d.awayScore ? d.home : d.awayScore > d.homeScore ? d.away : null)
    : null;

  const isHomeWin = winnerCode === match.home;
  const isAwayWin = winnerCode === match.away;

  return (
    <div className={`match-card match-card--${status}`}>
      <div className={`match-team ${isHomeWin ? 'winner' : ''}`}>
        <span className="match-flag">{FLAGS[match.home] || '⚽'}</span>
        <span className="match-name">{NAMES[match.home]}</span>
        {homeScore !== null && <span className="match-score">{homeScore}</span>}
      </div>

      <div className="match-vs">
        <span className={`status-badge status-badge--${badge.cls}`}>{badge.text}</span>
        {homeScore === null && <span className="match-vs-text">vs</span>}
        {d && status === 'live' && d.minute && (
          <span className="match-minute">{d.minute}'</span>
        )}
      </div>

      <div className={`match-team match-team--away ${isAwayWin ? 'winner' : ''}`}>
        {awayScore !== null && <span className="match-score">{awayScore}</span>}
        <span className="match-name match-name--right">{NAMES[match.away]}</span>
        <span className="match-flag">{FLAGS[match.away] || '⚽'}</span>
      </div>
    </div>
  );
}

export default function MobileMatchList({ matchups, liveData }) {
  return (
    <div className="mobile-list">
      <p className="mobile-list-title">Round of 32</p>
      {matchups.map(m => (
        <MatchCard key={m.id} match={m} data={liveData} />
      ))}
    </div>
  );
}
