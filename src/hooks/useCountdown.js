import { useState, useEffect } from 'react';

export function useCountdown(utcDate) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!utcDate) return;

    function tick() {
      const diff = new Date(utcDate) - Date.now();
      if (diff <= 0) { setText('Starting soon'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}m`);
      parts.push(`${String(s).padStart(2, '0')}s`);
      setText(parts.join(' '));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [utcDate]);

  return text;
}
