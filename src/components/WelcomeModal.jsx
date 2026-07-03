import { useState, useEffect } from 'react';

const STORAGE_KEY = 'wc26-welcomed';

const FEATURES = [
  {
    icon: '◎',
    iconColor: '#E8E0CC',
    title: 'Trace any team to the Final',
    desc: 'Tap a team flag on the bracket to highlight their path all the way to the centre.',
  },
  {
    icon: '◌',
    iconColor: '#C9A84C',
    title: 'Make your predictions',
    desc: 'Tap a connector dot between matches to pick a winner. See the split of what everyone else thinks in real time.',
  },
  {
    icon: '⚡',
    iconColor: '#00E676',
    title: 'Live scores',
    desc: 'The bracket updates every 30 seconds during matches. Goal toasts pop up when someone scores.',
  },
  {
    icon: '↗',
    iconColor: '#6aaeff',
    title: 'Share or download',
    desc: 'Grab a PNG snapshot of the full bracket or copy the link to send to friends.',
  },
];

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = e => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="wm-backdrop" onClick={dismiss}>
      <div className="wm-modal" onClick={e => e.stopPropagation()}>
        <div className="wm-header">
          <div className="wm-title">World Cup 2026</div>
          <div className="wm-subtitle">Here's how it works</div>
        </div>
        <div className="wm-divider" />
        <ul className="wm-features">
          {FEATURES.map(f => (
            <li key={f.title} className="wm-feature">
              <span className="wm-icon" style={{ color: f.iconColor }}>{f.icon}</span>
              <div>
                <div className="wm-feat-title">{f.title}</div>
                <div className="wm-feat-desc">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>
        <button className="wm-btn" onClick={dismiss}>Let's go</button>
      </div>
    </div>
  );
}
