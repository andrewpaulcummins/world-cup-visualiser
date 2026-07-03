import { useState, useEffect } from 'react';

const DEFAULTS = { flagTeam: null, waveSpeed: 'normal', intensity: 'low' };
const KEY = 'wc26-customise';

export function useCustomise() {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; }
    catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return { settings, update };
}
