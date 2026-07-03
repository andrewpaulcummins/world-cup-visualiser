import { useState, useCallback, useRef } from 'react';
import { MATCHUPS } from './data/matchups';
import { useScores } from './hooks/useScores';
import { useGoalDetector } from './hooks/useGoalDetector';
import { usePredictions } from './hooks/usePredictions';
import Header from './components/Header';
import BracketSvg from './components/BracketSvg';
import Legend from './components/Legend';
import LiveMatchCard from './components/LiveMatchCard';
import CelebrationSplash from './components/CelebrationSplash';
import GoalToast from './components/GoalToast';
import Tooltip from './components/Tooltip';

export default function App() {
  const { liveData, innerRounds, schedule, tournamentWinner, lastUpdated, apiStatus } = useScores();
  const { picks, setPick, getPick } = usePredictions();

  const [splashDismissed, setSplashDismissed] = useState(false);
  const [goalToast, setGoalToast]             = useState(null);
  const [selectedTeam, setSelectedTeam]       = useState(null);

  const previewWinner = new URLSearchParams(window.location.search).get('splash');

  useGoalDetector(liveData, setGoalToast);

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

  const leaveTimer = useRef(null);

  const handleLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false }));
    }, 180);
  }, []);

  const handleTooltipEnter = useCallback(() => {
    clearTimeout(leaveTimer.current);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    clearTimeout(leaveTimer.current);
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handlePick = useCallback((home, away, winner) => {
    setPick(home, away, winner);
  }, [setPick]);

  return (
    <>
      {(previewWinner || tournamentWinner) && !splashDismissed && (
        <CelebrationSplash winner={previewWinner || tournamentWinner} onDismiss={() => setSplashDismissed(true)} />
      )}
      <GoalToast toast={goalToast} onDismiss={() => setGoalToast(null)} />
      <Header lastUpdated={lastUpdated} apiStatus={apiStatus} picks={picks} />
      <BracketSvg
        matchups={MATCHUPS}
        liveData={liveData}
        innerRounds={innerRounds}
        onMatchEnter={handleMatchEnter}
        onMatchMove={handleMatchMove}
        onLeave={handleLeave}
        onRoundEnter={handleRoundEnter}
        selectedTeam={selectedTeam}
        onTeamSelect={setSelectedTeam}
        picks={picks}
      />
      <Legend />
      <LiveMatchCard liveData={liveData} schedule={schedule} />
      <Tooltip tooltip={tooltip} picks={picks} onPick={handlePick} onTooltipEnter={handleTooltipEnter} onTooltipLeave={handleTooltipLeave} />
    </>
  );
}
