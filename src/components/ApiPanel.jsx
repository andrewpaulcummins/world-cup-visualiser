import { useState } from 'react';

export default function ApiPanel({ getApiKey, saveApiKey, fetchScores, apiStatus, setApiStatus }) {
  const [open, setOpen]           = useState(false);
  const [inputVal, setInputVal]   = useState('');
  const [localStatus, setLocalStatus] = useState(null);

  function handleToggle() {
    setOpen(prev => {
      if (!prev) {
        const saved = getApiKey();
        setInputVal(saved);
        if (saved) setLocalStatus({ type: 'ok', message: '✓ Key loaded from localStorage' });
      }
      return !prev;
    });
  }

  function handleSave() {
    const val = inputVal.trim();
    if (val.length < 8) {
      setLocalStatus({ type: 'err', message: 'Please enter a valid API key.' });
      return;
    }
    saveApiKey(val);
    setLocalStatus({ type: 'ok', message: '✓ Saved! Fetching scores…' });
    fetchScores();
  }

  const status = apiStatus || localStatus;

  return (
    <div className="api-panel">
      <button className={`api-toggle${open ? ' active' : ''}`} onClick={handleToggle}>
        ⚙ Use your own API key
      </button>
      {open && (
        <div className="api-form">
          <p>
            Enter your free{' '}
            <a href="https://www.football-data.org/client/register" target="_blank" rel="noreferrer">
              football-data.org API key
            </a>{' '}
            to fetch live World Cup scores.
            <br />
            Saved only in your browser — never sent anywhere except api.football-data.org.
          </p>
          <div className="api-row">
            <input
              type="password"
              className="api-input"
              placeholder="Your football-data.org key"
              autoComplete="off"
              spellCheck={false}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button className="api-save-btn" onClick={handleSave}>
              Save &amp; Refresh
            </button>
          </div>
          {status && (
            <div className={`api-status ${status.type}`}>{status.message}</div>
          )}
        </div>
      )}
    </div>
  );
}
