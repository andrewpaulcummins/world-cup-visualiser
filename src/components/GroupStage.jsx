import { useState } from 'react';
import { NAMES, FLAGS, flagUrl } from '../data/matchups';

function formatTime(utcDate) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(utcDate) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
}

function TeamFlag({ code, size = 18 }) {
  const url = code ? flagUrl(code) : null;
  if (url) return <img src={url} alt={code} style={{ width: size * 1.33, height: size, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />;
  return <span style={{ fontSize: size * 0.85 }}>{(code && FLAGS[code]) || ''}</span>;
}

function teamName(code) {
  return (code && NAMES[code]) || code || 'TBD';
}

function MatchRow({ m }) {
  const played = m.status === 'final';
  const live   = m.status === 'live';
  return (
    <div className={`gs-match-row${live ? ' gs-match-row--live' : ''}`}>
      <div className="gs-match-team gs-match-team--home">
        <TeamFlag code={m.home} size={14} />
        <span className={played && m.homeScore > m.awayScore ? 'gs-match-winner' : ''}>{teamName(m.home)}</span>
      </div>
      <div className="gs-match-score">
        {played || live
          ? <>{m.homeScore ?? '-'}<span className="gs-match-sep">-</span>{m.awayScore ?? '-'}</>
          : <span className="gs-match-date">{formatDate(m.utcDate)} {formatTime(m.utcDate)}</span>
        }
      </div>
      <div className="gs-match-team gs-match-team--away">
        <span className={played && m.awayScore > m.homeScore ? 'gs-match-winner' : ''}>{teamName(m.away)}</span>
        <TeamFlag code={m.away} size={14} />
      </div>
    </div>
  );
}

function GroupCard({ letter, data }) {
  const [showMatches, setShowMatches] = useState(false);
  const { name, standings, matches } = data;
  const played = matches.filter(m => m.status === 'final').length;

  return (
    <div className="gs-card">
      <div className="gs-card-header">
        <span className="gs-card-title">{name}</span>
        <span className="gs-card-played">{played}/{matches.length} played</span>
      </div>

      <table className="gs-table">
        <thead>
          <tr>
            <th className="gs-th gs-th--team">Team</th>
            <th className="gs-th" title="Played">P</th>
            <th className="gs-th" title="Won">W</th>
            <th className="gs-th" title="Drawn">D</th>
            <th className="gs-th" title="Lost">L</th>
            <th className="gs-th" title="Goal difference">GD</th>
            <th className="gs-th gs-th--pts" title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((t, idx) => (
            <tr key={t.code} className={`gs-row${idx < 2 ? ' gs-row--advance' : ''}`}>
              <td className="gs-td gs-td--team">
                <TeamFlag code={t.code} size={14} />
                <span className="gs-team-name">{teamName(t.code)}</span>
              </td>
              <td className="gs-td">{t.mp}</td>
              <td className="gs-td">{t.w}</td>
              <td className="gs-td">{t.d}</td>
              <td className="gs-td">{t.l}</td>
              <td className="gs-td">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
              <td className="gs-td gs-td--pts">{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="gs-matches-toggle" onClick={() => setShowMatches(o => !o)}>
        Matches <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showMatches ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {showMatches && (
        <div className="gs-matches">
          {matches.map((m, i) => <MatchRow key={i} m={m} />)}
        </div>
      )}
    </div>
  );
}

export default function GroupStage({ groupStage }) {
  const letters = Object.keys(groupStage).sort();

  if (!letters.length) {
    return (
      <div className="gs-empty">
        <p>Group stage data not available yet.</p>
        <p style={{ fontSize: '0.72rem', marginTop: 6 }}>This will populate once the API returns group stage fixtures.</p>
      </div>
    );
  }

  return (
    <div className="gs-wrap">
      <div className="gs-advance-note">
        <span className="gs-advance-dot" /> Top 2 from each group advance to Round of 32
      </div>
      <div className="gs-grid">
        {letters.map(l => <GroupCard key={l} letter={l} data={groupStage[l]} />)}
      </div>
    </div>
  );
}
