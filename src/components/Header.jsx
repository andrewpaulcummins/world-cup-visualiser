import { useState, useCallback } from 'react';

async function shareBracket(setCopied) {
  const url  = window.location.href.split('?')[0]; // strip preview params
  const text = 'Follow the FIFA World Cup 2026 knockout bracket live!';

  if (navigator.share) {
    try { await navigator.share({ title: 'FIFA World Cup 2026 — Live Bracket', text, url }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }

  // Fallback: copy URL
  try {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  } catch { /* ignore */ }
}

async function downloadBracket() {
  const svg = document.querySelector('.bracket-svg');
  if (!svg) return;

  const SIZE = 1800;
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  // Add explicit size so canvas renders correctly
  const sized = svgStr.replace('<svg', `<svg width="${SIZE}" height="${SIZE}"`);
  const blob  = new Blob([sized], { type: 'image/svg+xml' });
  const url   = URL.createObjectURL(blob);

  const canvas = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE });
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = '#0A0A0F';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const img = new Image();
  img.onload = () => {
    try {
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const a = Object.assign(document.createElement('a'), {
        download: 'wc2026-bracket.png',
        href: canvas.toDataURL('image/png'),
      });
      a.click();
    } catch { /* CORS taint — fall back to SVG download */
      const a = Object.assign(document.createElement('a'), {
        download: 'wc2026-bracket.svg',
        href: url,
      });
      a.click();
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export default function Header({ lastUpdated, apiStatus, picks }) {
  const [copied, setCopied] = useState(false);

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })
    : 'Loading…';

  const pickCount = picks ? Object.keys(picks).length : 0;
  const isErr = apiStatus?.type === 'err';

  return (
    <header className="site-header">
      <h1>FIFA World Cup 2026</h1>
      <p>Round of 32 — Knockout Bracket</p>
      <div className="status-bar">
        <span className="live-dot" />
        <span>Last updated: {timeStr}</span>
        <span>·</span>
        <span>Updates every 30s</span>
        {pickCount > 0 && <span className="hdr-picks">· {pickCount} pick{pickCount !== 1 ? 's' : ''} saved</span>}
        {isErr && <span style={{ color: '#FF4444', fontSize: '0.68rem' }}>· {apiStatus.message}</span>}
      </div>
      <div className="hdr-actions">
        <button className="hdr-btn" onClick={() => shareBracket(setCopied)} title="Share bracket">
          {copied ? '✓ Link copied!' : '↗ Share'}
        </button>
        <button className="hdr-btn" onClick={downloadBracket} title="Download bracket as image">
          ↓ Download
        </button>
      </div>
    </header>
  );
}
