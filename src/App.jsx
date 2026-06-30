import { useState, useCallback } from 'react';
import { MATCHUPS } from './data/matchups';
import { useScores } from './hooks/useScores';
import Header from './components/Header';
import BracketSvg from './components/BracketSvg';
import Legend from './components/Legend';
import ApiPanel from './components/ApiPanel';
import Tooltip from './components/Tooltip';

export default function App() {
  const { liveData, lastUpdated, fetchScores, apiStatus, setApiStatus, getApiKey, saveApiKey, hasBuiltinKey } = useScores();
  const [tooltip, setTooltip] = useState({ visible: false, match: null, data: null, x: 0, y: 0 });

  const handleMatchEnter = useCallback((e, match, data) => {
    setTooltip({ visible: true, match, data, x: e.clientX, y: e.clientY });
  }, []);

  const handleMatchMove = useCallback((e) => {
    setTooltip(prev => prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev);
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <>
      <Header lastUpdated={lastUpdated} />
      <BracketSvg
        matchups={MATCHUPS}
        liveData={liveData}
        onMatchEnter={handleMatchEnter}
        onMatchMove={handleMatchMove}
        onLeave={handleLeave}
      />
      <Legend />
      {!hasBuiltinKey && (
        <ApiPanel
          getApiKey={getApiKey}
          saveApiKey={saveApiKey}
          fetchScores={fetchScores}
          apiStatus={apiStatus}
          setApiStatus={setApiStatus}
        />
      )}
      <Tooltip tooltip={tooltip} />
    </>
  );
}
