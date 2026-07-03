import { useState, useEffect, useRef } from 'react';
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

export default function FlagBackground() {
  const queue = useRef(shuffle(TEAMS));
  const qIdx = useRef(1);

  const [layers, setLayers] = useState([
    { team: queue.current[0], on: true },
    { team: queue.current[1], on: false },
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      qIdx.current++;
      if (qIdx.current >= queue.current.length) {
        queue.current = shuffle(TEAMS);
        qIdx.current = 0;
      }
      const nextTeam = queue.current[qIdx.current];

      setLayers(prev => {
        const offIdx = prev[0].on ? 1 : 0;
        return prev.map((layer, i) => ({
          team: i === offIdx ? nextTeam : layer.team,
          on: i === offIdx,
        }));
      });
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="flag-bg" aria-hidden="true">
      {layers.map((layer, i) => (
        <div
          key={i}
          className={`flag-bg-layer${layer.on ? ' flag-bg-layer--on' : ''}`}
          style={{ backgroundImage: `url(${flagUrl(layer.team)})` }}
        />
      ))}
    </div>
  );
}
