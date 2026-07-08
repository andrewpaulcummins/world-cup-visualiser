export default function Header({ lastUpdated, apiStatus, picks }) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })
    : 'Loading…';

  const pickCount = picks ? Object.keys(picks).length : 0;
  const isErr = apiStatus?.type === 'err';

  return (
    <header className="site-header">
      <h1>
        <span className="hdr-title-eyebrow">World Cup</span>
        <span className="hdr-title-year">2026</span>
      </h1>
      <div className="hdr-rule" />
      <p>Knockout Bracket</p>
      <div className="status-bar">
        <span className="live-dot" />
        <span>Last updated: {timeStr}</span>
        <span>·</span>
        <span>Updates every 30s</span>
        {pickCount > 0 && <span className="hdr-picks">· {pickCount} pick{pickCount !== 1 ? 's' : ''} saved</span>}
        {isErr && <span style={{ color: '#FF4444', fontSize: '0.68rem' }}>· {apiStatus.message}</span>}
      </div>
    </header>
  );
}
