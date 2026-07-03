import { useState, useRef, useCallback } from 'react';

export function usePinchZoom() {
  const [scale, setScale] = useState(1);
  const pointers = useRef(new Map());
  const lastDist = useRef(null);

  const onPointerDown = useCallback((e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length < 2) { lastDist.current = null; return; }
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (lastDist.current !== null) {
      const ratio = dist / lastDist.current;
      setScale(s => Math.max(1, Math.min(4, s * ratio)));
    }
    lastDist.current = dist;
  }, []);

  const onPointerUp = useCallback((e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastDist.current = null;
  }, []);

  const reset = useCallback(() => setScale(1), []);

  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };

  const style = scale > 1
    ? { transform: `scale(${scale})`, transformOrigin: 'center center', touchAction: 'none' }
    : { touchAction: 'none' };

  return { scale, style, reset, handlers };
}
