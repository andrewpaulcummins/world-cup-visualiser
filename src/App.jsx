import { useState, useCallback } from 'react';
import { MATCHUPS } from './data/matchups';
import { useScores } from './hooks/useScores';
import { useGoalDetector } from './hooks/useGoalDetector';
import { usePredictions } from './hooks/usePredictions';
import { useCommunityPicks } from './hooks/useCommunityPicks';
import Header from './components/Header';
import BracketSvg from './components/BracketSvg';
import GroupStage from './components/GroupStage';
import Legend from './components/Legend';
import LiveMatchCard from './components/LiveMatchCard';
import CelebrationSplash from './components/CelebrationSplash';
import GoalToast from './components/GoalToast';
import Tooltip from './components/Tooltip';
import PredictModal from './components/PredictModal';
import WelcomeModal from './components/WelcomeModal';
import PicksScore from './components/PicksScore';

export default function App() {
  const { liveData, innerRounds, schedule, groupStage, finalMatch, tournamentWinner, lastUpdated, apiStatus } = useScores();
  const { picks, setPick } = usePredictions();
  const { data: communityData, loading: communityLoading, fetchPicks, submitPick } = useCommunityPicks();

  const [view, setView]                   = useState('bracket');
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [goalToast, setGoalToast]             = useState(null);
  const [selectedTeam, setSelectedTeam]       = useState(null);
  const [modalInfo, setModalInfo]             = useState(null);
  const [elimMsg, setElimMsg]                 = useState(null);

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

  const handleMatchClick = useCallback((info) => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setModalInfo(info);
    fetchPicks(info.matchKey);
  }, [fetchPicks]);

  const handleModalPick = useCallback((pickedTeam) => {
    if (!modalInfo?.matchKey) return;
    const [home, away] = modalInfo.matchKey.split('-');
    setPick(home, away, pickedTeam);
    submitPick(modalInfo.matchKey, pickedTeam);
  }, [modalInfo, setPick, submitPick]);

  const handleModalClose = useCallback(() => setModalInfo(null), []);

  const handleEliminatedClick = useCallback((name) => {
    setElimMsg(name);
    setTimeout(() => setElimMsg(null), 2500);
  }, []);

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
      {elimMsg && (
        <div className="elim-toast">{elimMsg} have been eliminated</div>
      )}
      <Header lastUpdated={lastUpdated} apiStatus={apiStatus} picks={picks} />

      <div className="view-tabs">
        <button className={`view-tab${view === 'bracket' ? ' view-tab--active' : ''}`} onClick={() => setView('bracket')}>Bracket</button>
        <button className={`view-tab${view === 'groups'  ? ' view-tab--active' : ''}`} onClick={() => setView('groups')}>Groups</button>
      </div>

      {view === 'bracket' && (
        <>
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
            onEliminatedClick={handleEliminatedClick}
            picks={picks}
          />
          <Legend />
          <PicksScore picks={picks} liveData={liveData} />
        </>
      )}

      {view === 'groups' && <GroupStage groupStage={groupStage} />}

      <LiveMatchCard liveData={liveData} schedule={schedule} finalMatch={finalMatch} />
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
