import { useState } from 'react';
import { MATCHUPS, NAMES, flagUrl } from '../data/matchups';
import { DEFAULT_THEME } from '../data/teamThemes';

const TEAMS = [...new Set(MATCHUPS.flatMap(m => [m.home, m.away]))]
  .filter(Boolean)
  .sort((a, b) => (NAMES[a] || a).localeCompare(NAMES[b] || b));

const INTENSITIES = ['low', 'medium', 'high'];

function hexToRgba(hex, alpha) {
  const n = parseInt((hex || '#888888').replace('#', ''), 16);
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

function textColor(hex) {
  const n = parseInt((hex || '#888888').replace('#', ''), 16);
  const lum = 0.2126 * ((n >> 16) & 0xff) + 0.7152 * ((n >> 8) & 0xff) + 0.0722 * (n & 0xff);
  return lum > 130 ? '#000000' : '#ffffff';
}

export default function Customise({ settings, onUpdate, theme = DEFAULT_THEME }) {
  const [open, setOpen] = useState(false);

  const accent = theme.accent;
  const c1 = theme.bg[0];
  const c2 = theme.bg[1] ?? c1;
  const c3 = theme.bg[2] ?? c2;

  // Panel: gradient from all 3 flag colors so all national colours are represented
  const panelStyle = {
    '--cust-primary': accent,
    background: `linear-gradient(145deg, ${hexToRgba(c1, 0.15)} 0%, ${hexToRgba(c2, 0.08)} 50%, ${hexToRgba(c3, 0.06)} 100%), #0d0d18`,
    borderColor: hexToRgba(c1, 0.45),
  };

  const fabStyle = {
    background: `linear-gradient(135deg, ${c1}, ${c2})`,
    color: textColor(c1),
    boxShadow: `0 4px 24px ${hexToRgba(c1, 0.5)}`,
  };

  // Active states use gradient of flag colours
  const activeItemStyle = {
    borderColor: accent,
    background: `linear-gradient(135deg, ${hexToRgba(c1, 0.25)}, ${hexToRgba(c2, 0.15)})`,
  };

  const activeNameStyle = { color: accent };

  const activeToggleStyle = {
    borderColor: accent,
    background: `linear-gradient(135deg, ${hexToRgba(c1, 0.3)}, ${hexToRgba(c2, 0.18)})`,
    color: accent,
  };

  const titleStyle = { color: c2 };

  return (
    <>
      {open && (
        <div className="cust-panel" style={panelStyle}>
          <div className="cust-header">
            <span className="cust-title" style={titleStyle}>// CUSTOMISE</span>
            <button className="cust-close" onClick={() => setOpen(false)}>✕ close</button>
          </div>

          <div className="cust-section">
            <div className="cust-label">YOUR TEAM</div>
            <div className="cust-sublabel">Sets accent colour &amp; background glow</div>
            <div className="cust-flag-grid">
              <button
                className="cust-flag-item"
                style={!settings.flagTeam ? activeItemStyle : {}}
                onClick={() => onUpdate('flagTeam', null)}
                title="Default"
              >
                <span className="cust-flag-random">⚽</span>
                <span className="cust-flag-name" style={!settings.flagTeam ? activeNameStyle : {}}>Default</span>
              </button>
              {TEAMS.map(code => {
                const isActive = settings.flagTeam === code;
                return (
                  <button
                    key={code}
                    className="cust-flag-item"
                    style={isActive ? activeItemStyle : {}}
                    onClick={() => onUpdate('flagTeam', code)}
                    title={NAMES[code] || code}
                  >
                    <img src={flagUrl(code)} alt={NAMES[code] || code} className="cust-flag-img" />
                    <span className="cust-flag-name" style={isActive ? activeNameStyle : {}}>{NAMES[code] || code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cust-section">
            <div className="cust-label">GLOW INTENSITY</div>
            <div className="cust-toggles">
              {INTENSITIES.map(v => (
                <button
                  key={v}
                  className="cust-toggle"
                  style={settings.intensity === v ? activeToggleStyle : {}}
                  onClick={() => onUpdate('intensity', v)}
                >{v.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button className="cust-fab" style={fabStyle} onClick={() => setOpen(o => !o)}>
        ⚽ Customise
      </button>
    </>
  );
}
