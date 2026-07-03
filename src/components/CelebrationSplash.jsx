import { useEffect, useRef } from 'react';
import { NAMES, FLAGS, flagUrl } from '../data/matchups';
import { getTheme } from '../data/teamThemes';

const CONFETTI_COUNT = 240;

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function makeParticle(w, h, palette) {
  return {
    x: randomBetween(0, w),
    y: randomBetween(-h, 0),
    w: randomBetween(6, 15),
    h: randomBetween(3, 7),
    color: palette[Math.floor(Math.random() * palette.length)],
    speedX: randomBetween(-2, 2),
    speedY: randomBetween(2.5, 5.5),
    rot: randomBetween(0, 360),
    rotSpeed: randomBetween(-4, 4),
    opacity: randomBetween(0.7, 1),
  };
}

export default function CelebrationSplash({ winner, onDismiss }) {
  const theme    = getTheme(winner);
  const palette  = [...theme.bg, '#FFFFFF', theme.bg[0]]; // flag colors + white
  const flagSrc  = flagUrl(winner);
  const name     = NAMES[winner] || winner;
  const emoji    = FLAGS[winner] || '';
  const canvasRef = useRef(null);

  // Gradient string for CHAMPIONS text and glow
  const gradientStyle = theme.bg.length >= 2
    ? `linear-gradient(135deg, ${theme.bg.join(', ')})`
    : theme.bg[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    let particles = Array.from({ length: CONFETTI_COUNT }, () =>
      makeParticle(canvas.width, canvas.height, palette)
    );
    let raf;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.x += p.speedX;
        p.y += p.speedY;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height + 20) {
          Object.assign(p, makeParticle(canvas.width, canvas.height, palette));
          p.y = -20;
        }
      });
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [winner]);

  return (
    <div className="splash-overlay" onClick={onDismiss}>
      <canvas ref={canvasRef} className="splash-canvas" />
      <div className="splash-content" onClick={e => e.stopPropagation()}>
        <div className="splash-glow" style={{
          background: `radial-gradient(circle, ${theme.bg[0]}66 0%, ${(theme.bg[1] ?? theme.bg[0])}33 45%, transparent 70%)`,
        }} />
        <p className="splash-pre">FIFA World Cup 2026</p>
        <h1 className="splash-title" style={{
          background: gradientStyle,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 20px ${theme.bg[0]}99)`,
        }}>CHAMPIONS</h1>
        {flagSrc
          ? <img src={flagSrc} alt={name} className="splash-flag" />
          : <span className="splash-flag-emoji">{emoji}</span>
        }
        <h2 className="splash-team" style={{ color: theme.accent }}>{name}</h2>
        <p className="splash-sub">🏆 World Cup Winners 2026 🏆</p>
        <button className="splash-btn" style={{
          borderColor: theme.accent,
          color: theme.accent,
        }} onClick={onDismiss}>Continue to Bracket</button>
      </div>
    </div>
  );
}
