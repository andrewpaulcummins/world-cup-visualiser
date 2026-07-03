import { useEffect, useRef } from 'react';
import { MATCHUPS, flagUrl } from '../data/matchups';

const TEAMS = [...new Set(MATCHUPS.flatMap(m => [m.home, m.away]))].filter(Boolean);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SLICES       = 160;    // vertical strips to distort
const MAX_OPACITY  = 0.09;   // how faint the flag is
const WAVE_AMP     = 38;     // max wave height in px
const WAVE_FREQ    = 3.8;    // ripple cycles across flag
const WAVE_SPEED   = 2.2;    // animation speed
const SHOW_FRAMES  = 420;    // ~7s at 60fps before fadeout
const FADE_STEP    = 0.018;  // opacity change per frame

export default function FlagBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const queue = shuffle([...TEAMS]);
    let qIdx = 0;
    let img = new Image();
    img.src = flagUrl(queue[qIdx]);

    let t      = 0;
    let alpha  = 0;
    let frame  = 0;
    let phase  = 'fadein'; // fadein | show | fadeout

    function loadNext() {
      qIdx = (qIdx + 1) % queue.length;
      if (qIdx === 0) queue.splice(0, queue.length, ...shuffle([...TEAMS]));
      img = new Image();
      img.src = flagUrl(queue[qIdx]);
      alpha = 0;
      phase = 'fadein';
      frame = 0;
      t     = 0;
    }

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let raf;
    function draw() {
      raf = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!img.complete || !img.naturalWidth) { t += 0.016; return; }

      // Flag fills full width, centred vertically at ~55% of viewport height
      const flagH  = H * 0.55;
      const flagY  = (H - flagH) / 2;
      const sliceW = W / SLICES;

      ctx.save();
      ctx.globalAlpha = alpha * MAX_OPACITY;

      for (let i = 0; i < SLICES; i++) {
        const progress = i / SLICES;
        // Wave amplitude grows quadratically towards the trailing (right) edge
        const amp    = WAVE_AMP * progress * progress;
        const waveY  = amp * Math.sin(progress * Math.PI * WAVE_FREQ - t * WAVE_SPEED);
        const srcX   = progress * img.naturalWidth;
        const srcW   = img.naturalWidth / SLICES;

        ctx.drawImage(
          img,
          srcX, 0, srcW, img.naturalHeight,
          i * sliceW, flagY + waveY, sliceW + 0.5, flagH,
        );
      }

      ctx.restore();

      // Phase state machine
      t     += 0.016;
      frame += 1;

      if (phase === 'fadein') {
        alpha = Math.min(1, alpha + FADE_STEP);
        if (alpha >= 1) { phase = 'show'; frame = 0; }
      } else if (phase === 'show') {
        if (frame >= SHOW_FRAMES) phase = 'fadeout';
      } else {
        alpha = Math.max(0, alpha - FADE_STEP);
        if (alpha <= 0) loadNext();
      }
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="flag-bg-canvas" aria-hidden="true" />;
}
