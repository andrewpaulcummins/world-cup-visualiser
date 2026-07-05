import { useState, useCallback, useMemo } from 'react';
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
import FlagBackground from './components/FlagBackground';
import Customise from './components/Customise';
import { useCustomise } from './hooks/useCustomise';
import { getTheme, getDim, DEFAULT_THEME } from './data/teamThemes';
import { buildPredictedData } from './hooks/usePredictedBracket';

export default function App() {
  const { liveData, innerRounds, schedule, recentResults, groupStage, finalMatch, tournamentWinner, lastUpdated, apiStatus } = useScores();
  const { picks, setPick, setPredictedPick } = usePredictions();
  const { data: communityData, loading: communityLoading, fetchPicks, submitPick } = useCommunityPicks();

  const { settings, update: updateCustomise } = useCustomise();
  const theme = settings.flagTeam ? getTheme(settings.flagTeam) : DEFAULT_THEME;
  const dim = getDim(theme.accent);

  const [view, setView]                   = useState('bracket');
  const [bracketView, setBracketView]     = useState('actual');
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [goalToast, setGoalToast]             = useState(null);
  const [selectedTeam, setSelectedTeam]       = useState(null);
  const [modalInfo, setModalInfo]             = useState(null);
  const [elimMsg, setElimMsg]                 = useState(null);

  const predictedData = useMemo(() => buildPredictedData(picks), [picks]);

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
    if (!info.isPredicted) fetchPicks(info.matchKey);
  }, [fetchPicks]);

  const handleModalPick = useCallback((pickedTeam) => {
    if (!modalInfo?.matchKey) return;
    if (modalInfo.predictedKey) {
      setPredictedPick(modalInfo.predictedKey, pickedTeam);
      return;
    }
    const [home, away] = modalInfo.matchKey.split('-');
    setPick(home, away, pickedTeam);
    submitPick(modalInfo.matchKey, pickedTeam);
  }, [modalInfo, setPick, setPredictedPick, submitPick]);

  const handleModalClose = useCallback(() => setModalInfo(null), []);

  const handleEliminatedClick = useCallback((name) => {
    setElimMsg(name);
    setTimeout(() => setElimMsg(null), 2500);
  }, []);

  const myPick = modalInfo?.matchKey
    ? (modalInfo.predictedKey
        ? (picks?.[modalInfo.predictedKey] || null)
        : (picks?.[modalInfo.matchKey] || picks?.[`${modalInfo.awayCode}-${modalInfo.homeCode}`] || null))
    : null;

  return (
    <>
      <FlagBackground theme={theme} intensity={settings.intensity} />
      <div className="app-content" style={{
        '--gold': theme.accent, '--gold-light': theme.accent, '--gold-dim': dim,
        '--tc1': theme.bg[0], '--tc2': theme.bg[1] ?? theme.bg[0], '--tc3': theme.bg[2] ?? theme.bg[1] ?? theme.bg[0],
      }}>
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
          <div className="bracket-view-toggle">
            <button className={`bvt-btn${bracketView === 'actual' ? ' bvt-btn--active' : ''}`} onClick={() => setBracketView('actual')}>Actual</button>
            <button className={`bvt-btn${bracketView === 'predicted' ? ' bvt-btn--active' : ''}`} onClick={() => setBracketView('predicted')}>My Bracket</button>
          </div>
          {bracketView === 'predicted' && (
            <div className="predicted-banner">Tap any ring node to pick a winner</div>
          )}
          <BracketSvg
            matchups={MATCHUPS}
            liveData={bracketView === 'predicted' ? predictedData.predictedLiveData : liveData}
            innerRounds={bracketView === 'predicted' ? predictedData.predictedInnerRounds : innerRounds}
            finalMatch={bracketView === 'predicted' ? predictedData.predictedFinalMatch : finalMatch}
            onMatchEnter={handleMatchEnter}
            onMatchMove={handleMatchMove}
            onLeave={handleLeave}
            onRoundEnter={handleRoundEnter}
            onMatchClick={handleMatchClick}
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
            onEliminatedClick={handleEliminatedClick}
            picks={picks}
            glowColor={theme.bg[0]}
            predictedMode={bracketView === 'predicted'}
            predictedMatchups={bracketView === 'predicted' ? predictedData : null}
          />
          <Legend />
          <PicksScore picks={picks} liveData={liveData} innerRounds={innerRounds} finalMatch={finalMatch} />
        </>
      )}

      {view === 'groups' && <GroupStage groupStage={groupStage} />}

      <LiveMatchCard liveData={liveData} schedule={schedule} recentResults={recentResults} finalMatch={finalMatch} />
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
      </div>
      <Customise settings={settings} onUpdate={updateCustomise} theme={theme} />
    </>
  );
}
