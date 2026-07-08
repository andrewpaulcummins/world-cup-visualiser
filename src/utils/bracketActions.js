async function toDataUri(url) {
  try {
    const fullUrl = url.startsWith('/') ? `${location.origin}${url}` : url;
    const res  = await fetch(fullUrl, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function shareBracket(setCopied) {
  const url  = window.location.href.split('?')[0]; // strip preview params
  const text = 'Follow the FIFA World Cup 2026 knockout bracket live!';

  if (navigator.share) {
    try { await navigator.share({ title: 'World Cup 2026 Live Bracket', text, url }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }

  // Fallback: copy URL
  try {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  } catch { /* ignore */ }
}

export async function downloadBracket() {
  const svg = document.querySelector('.bracket-svg');
  if (!svg) return;

  const SIZE = 1800;
  let svgStr = new XMLSerializer().serializeToString(svg);

  // Collect every image URL referenced in the SVG (cross-origin flags + same-origin trophy)
  const found = new Set();
  for (const [, u] of svgStr.matchAll(/href="(https?:\/\/[^"]+)"/g)) found.add(u);
  for (const [, u] of svgStr.matchAll(/href="(\/[^"]+\.(webp|png|jpg|svg|gif))"/g)) found.add(u);

  // Fetch each one and replace with a data URI so the canvas isn't tainted
  await Promise.all([...found].map(async u => {
    const data = await toDataUri(u);
    if (data) svgStr = svgStr.split(u).join(data);
  }));

  const sized  = svgStr.replace('<svg', `<svg width="${SIZE}" height="${SIZE}"`);
  const blob   = new Blob([sized], { type: 'image/svg+xml;charset=utf-8' });
  const objUrl = URL.createObjectURL(blob);

  const canvas = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE });
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = '#0A0A0F';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    Object.assign(document.createElement('a'), {
      download: 'wc2026-bracket.png',
      href: canvas.toDataURL('image/png'),
    }).click();
    URL.revokeObjectURL(objUrl);
  };
  img.onerror = () => {
    Object.assign(document.createElement('a'), {
      download: 'wc2026-bracket.svg',
      href: objUrl,
    }).click();
  };
  img.src = objUrl;
}
