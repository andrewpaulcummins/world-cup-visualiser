import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1C1608"/>
      <stop offset="100%" stop-color="#0A0A0F"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#C9A84C" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#C9A84C" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8E878"/>
      <stop offset="45%" stop-color="#C9A84C"/>
      <stop offset="100%" stop-color="#7A5C10"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="180" height="180" fill="url(#bg)"/>

  <!-- Ambient glow -->
  <circle cx="90" cy="82" r="72" fill="url(#glow)"/>

  <!-- Outer gold ring -->
  <circle cx="90" cy="90" r="82" fill="none" stroke="url(#gold)" stroke-width="2.5" stroke-opacity="0.6"/>

  <!-- Inner thin ring -->
  <circle cx="90" cy="90" r="76" fill="none" stroke="#C9A84C" stroke-width="0.75" stroke-opacity="0.3"/>

  <!-- "WC" text -->
  <text x="90" y="84"
    text-anchor="middle"
    font-family="Arial Black, Impact, sans-serif"
    font-weight="900"
    font-size="58"
    fill="url(#gold)"
    letter-spacing="-2">WC</text>

  <!-- Divider -->
  <rect x="42" y="93" width="96" height="1.5" fill="#C9A84C" opacity="0.45" rx="1"/>

  <!-- "2026" text -->
  <text x="90" y="122"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="300"
    font-size="21"
    fill="#C9A84C"
    letter-spacing="7">2026</text>
</svg>`;

await sharp(Buffer.from(svg))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');

console.log('✓ public/apple-touch-icon.png generated');
