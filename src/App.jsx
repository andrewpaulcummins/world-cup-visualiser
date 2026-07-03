import { useState, useCallback } from 'react';
import { MATCHUPS } from './data/matchups';
import { useScores } from './hooks/useScores';
import { useGoalDetector } from './hooks/useGoalDetector';
import { usePredictions } from './hooks/usePredictions';
import { useCommunityPicks } from './hooks/useCommunityPicks';
import Header from './components/Header';
import BracketSvg from './components/BracketSvg';
import Legend from './components/Legend';
import LiveMatchCard from './components/LiveMatchCard';
import CelebrationSplash from './components/CelebrationSplash';
import GoalToast from './components/GoalToast';
import Tooltip from './components/Tooltip';
import PredictModal from './components/PredictModal';
import WelcomeModal from './components/WelcomeModal';

export default function App() {
  const { liveData, innerRounds, schedule, tournamentWinner, lastUpdated, apiStatus } = useScores();
  const { picks, setPick } = usePredictions();
  const { data: communityData, loading: communityLoading, fetchPicks, submitPick } = useCommunityPicks();

  const [splashDismissed, setSplashDismissed] = useState(false);
  const [goalToast, setGoalToast]             = useState(null);
  const [selectedTeam, setSelectedTeam]       = useState(null);
  const [modalInfo, setModalInfo]             = useState(null);

  const previewWinner = new URLSearchParams(window.location.search).get('splash');

  useGoalDetector(liveData, setGoalToast);

  // On touch devices skip tooltips entirely — tapping opens the modal directly
  const isTouch = window.matchMedia('(hover: none)').matches;

  const [tooltip, setTooltip] = useState({ visible: false, type: 'match', match: null, data: null, info: null, x: 0, y: 0 });

  const handleMatchEnter = useCallback((e, match, data) => {
    if (isTouch) return;
    setTooltip({ visible: true, type: 'match', match, data, info: null, x: e.clientX, y: e.clientY });
  }, [isTouch]);

  const handleRoundEnter = useCallback((e, info) => {
    if (isTouch) return;
    setTooltip({ visible: true, type: 'inner', match: null, data: null, info, x: e.clientX, y: e.clientY });
  }, [isTouch]);

  const handleMatchMove = useCallback((e) => {
    if (isTouch) return;
    setTooltip(prev => prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev);
  }, [isTouch]);

  const handleLeave = useCallback(() => {
    if (isTouch) return;
    setTooltip(prev => ({ ...prev, visible: false }));
  }, [isTouch]);

  // Open predict modal — triggered by clicking a connector dot
  const handleMatchClick = useCallback((info) => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setModalInfo(info);
    fetchPicks(info.matchKey);
  }, [fetchPicks]);

  // Pick in modal: update local predictions + submit to community DB
  const handleModalPick = useCallback((pickedTeam) => {
    if (!modalInfo?.matchKey) return;
    const [home, away] = modalInfo.matchKey.split('-');
    setPick(home, away, pickedTeam);
    submitPick(modalInfo.matchKey, pickedTeam);
  }, [modalInfo, setPick, submitPick]);

  const handleModalClose = useCallback(() => setModalInfo(null), []);

  // Derive user's current pick for the open modal
  const myPick = modalInfo?.matchKey
    ? (picks?.[modalInfo.matchKey] || picks?.[`${modalInfo.awayCode}-${modalInfo.homeCode}`] || null)
    : null;

  return (
    <>
      <WelcomeModal />
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
        onMatchClick={handleMatchClick}
        selectedTeam={selectedTeam}
        onTeamSelect={setSelectedTeam}
        picks={picks}
      />
      <Legend />
      <LiveMatchCard liveData={liveData} schedule={schedule} />
      <Tooltip tooltip={tooltip} />
      {modalInfo && (
        <PredictModal
          info={modalInfo}
          communityData={communityData}
          loading={communityLoading}
          myPick={myPick}
          onPick={handleModalPick}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
