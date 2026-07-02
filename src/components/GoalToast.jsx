import { useEffect } from 'react';
import { NAMES, FLAGS } from '../data/matchups';

export default function GoalToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onDismiss, 6000);
    return () => clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const { home, away, homeScore, awayScore, minuteStr, scoringTeam } = toast;

  return (
    <div className="goal-toast" onClick={onDismiss}>
      <div className="goal-toast-icon">⚽</div>
      <div className="goal-toast-body">
        <div className="goal-toast-title">GOAL!</div>
        <div className="goal-toast-match">
          {FLAGS[home]} {NAMES[home] || home}
          <span className="goal-toast-score"> {homeScore}–{awayScore} </span>
          {NAMES[away] || away} {FLAGS[away]}
        </div>
        {minuteStr && <div className="goal-toast-minute">{minuteStr}</div>}
      </div>
    </div>
  );
}
