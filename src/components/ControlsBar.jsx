import { useState } from 'react';
import { shareBracket, downloadBracket } from '../utils/bracketActions';

export default function ControlsBar({ view, setView, bracketView, setBracketView }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="controls-bar">
      <div className="controls-row">
        <button className="ctrl-btn" onClick={() => shareBracket(setCopied)} title="Share bracket">
          {copied ? '✓ Copied' : '↗ Share'}
        </button>
        <button className="ctrl-btn" onClick={downloadBracket} title="Download bracket as image">
          ↓ Download
        </button>
      </div>
      <div className="controls-row">
        <button className={`ctrl-btn${view === 'bracket' ? ' ctrl-btn--active' : ''}`} onClick={() => setView('bracket')}>Bracket</button>
        <button className={`ctrl-btn${view === 'groups'  ? ' ctrl-btn--active' : ''}`} onClick={() => setView('groups')}>Groups</button>
        {view === 'bracket' && (
          <>
            <span className="ctrl-divider" />
            <button className={`ctrl-btn${bracketView === 'actual'    ? ' ctrl-btn--active' : ''}`} onClick={() => setBracketView('actual')}>Actual</button>
            <button className={`ctrl-btn${bracketView === 'predicted' ? ' ctrl-btn--active' : ''}`} onClick={() => setBracketView('predicted')}>My Bracket</button>
          </>
        )}
      </div>
    </div>
  );
}
