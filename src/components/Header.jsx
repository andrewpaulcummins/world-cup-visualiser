export default function Header({ lastUpdated }) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })
    : 'Loading…';

  return (
    <header className="site-header">
      <h1>FIFA World Cup 2026</h1>
      <p>Round of 32 — Knockout Bracket</p>
      <div className="status-bar">
        <span className="live-dot" />
        <span>Last updated: {timeStr}</span>
        <span>·</span>
        <span>Updates every 30s</span>
      </div>
    </header>
  );
}
