import { useEffect } from 'react';
import { FLAGS, NAMES, flagUrl } from '../data/matchups';

const STAGE_LABELS = { R32: 'Group Stage', R16: 'Round of 16', QF: 'Quarter-final', SF: 'Semi-final', F: 'Final' };

function PctBar({ pct, color }) {
  return (
    <div className="pm-bar-track">
      <div className="pm-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function TeamBlock({ code, label, myPick, canPick, onPick }) {
  const url   = code ? flagUrl(code) : null;
  const name  = label || (code ? (NAMES[code] || code) : 'TBD');
  const isPicked = myPick === code;
  return (
    <div className={`pm-team${isPicked ? ' pm-team--picked' : ''}`}>
      {url
        ? <img src={url} alt={code} className="pm-flag" />
        : <span className="pm-flag-emoji">{(code && FLAGS[code]) || '🏳️'}</span>
      }
      <div className="pm-team-name">{name}</div>
      {canPick && code && (
        <button
          className={`pm-pick-btn${isPicked ? ' pm-pick-btn--active' : ''}`}
          onClick={() => onPick(code)}>
          {isPicked ? '✓ Picked' : 'Pick'}
        </button>
      )}
    </div>
  );
}

export default function PredictModal({ info, communityData, loading, myPick, onPick, onClose }) {
  if (!info) return null;

  const { homeCode, awayCode, homeLabel, awayLabel, stage, status, matchKey } = info;
  const canPick = status === 'scheduled' && homeCode && awayCode && matchKey;

  const total     = communityData?.total    || 0;
  const homeCount = communityData?.homeCount || 0;
  const awayCount = communityData?.awayCount || 0;
  const homePct   = total > 0 ? Math.round((homeCount / total) * 100) : 50;
  const awayPct   = total > 0 ? 100 - homePct : 50;

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="pm-stage">{STAGE_LABELS[stage] || stage || 'Match'}</div>

        <div className="pm-teams">
          <TeamBlock code={homeCode} label={homeLabel} myPick={myPick} canPick={canPick} onPick={onPick} />
          <div className="pm-vs">vs</div>
          <TeamBlock code={awayCode} label={awayLabel} myPick={myPick} canPick={canPick} onPick={onPick} />
        </div>

        <div className="pm-community">
          <div className="pm-community-title">
            {!matchKey
              ? 'Teams not yet decided'
              : loading
              ? 'Loading community picks…'
              : total > 0
              ? `${total.toLocaleString()} ${total === 1 ? 'pick' : 'picks'} so far`
              : 'No picks yet — be the first!'}
          </div>
          {!loading && total > 0 && (
            <div className="pm-bars">
              <div className="pm-bar-row">
                <span className="pm-bar-label">{homeCode || '—'}</span>
                <PctBar pct={homePct} color="#3A8FFF" />
                <span className="pm-bar-pct">{homePct}%</span>
              </div>
              <div className="pm-bar-row">
                <span className="pm-bar-label">{awayCode || '—'}</span>
                <PctBar pct={awayPct} color="#C9A84C" />
                <span className="pm-bar-pct">{awayPct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
