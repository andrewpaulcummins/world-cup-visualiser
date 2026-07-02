import { useState, useCallback } from 'react';
import { MATCHUPS } from './data/matchups';
import { useScores } from './hooks/useScores';
import { useGoalDetector } from './hooks/useGoalDetector';
import Header from './components/Header';
import BracketSvg from './components/BracketSvg';
import Legend from './components/Legend';
import LiveMatchCard from './components/LiveMatchCard';
import Tooltip from './components/Tooltip';

export default function App() {
  const { liveData, innerRounds, lastUpdated, apiStatus } = useScores();
  useGoalDetector(liveData);

  const [tooltip, setTooltip] = useState({ visible: false, type: 'match', match: null, data: null, info: null, x: 0, y: 0 });

  const handleMatchEnter = useCallback((e, match, data) => {
    setTooltip({ visible: true, type: 'match', match, data, info: null, x: e.clientX, y: e.clientY });
  }, []);

  const handleRoundEnter = useCallback((e, info) => {
    setTooltip({ visible: true, type: 'inner', match: null, data: null, info, x: e.clientX, y: e.clientY });
  }, []);

  const handleMatchMove = useCallback((e) => {
    setTooltip(prev => prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev);
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <>
      <Header lastUpdated={lastUpdated} apiStatus={apiStatus} />
      <BracketSvg
        matchups={MATCHUPS}
        liveData={liveData}
        innerRounds={innerRounds}
        onMatchEnter={handleMatchEnter}
        onMatchMove={handleMatchMove}
        onLeave={handleLeave}
        onRoundEnter={handleRoundEnter}
      />
      <Legend />
      <LiveMatchCard liveData={liveData} />
      <Tooltip tooltip={tooltip} />
    </>
  );
}
