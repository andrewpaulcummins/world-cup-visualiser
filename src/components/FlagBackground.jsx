import { DEFAULT_THEME } from '../data/teamThemes';

const OPACITY_MAP = { low: 0.08, medium: 0.16, high: 0.26 };

const BLOB_STYLES = [
  'theme-bg-glow--1',
  'theme-bg-glow--2',
  'theme-bg-glow--3',
];

export default function ThemeBackground({ theme = DEFAULT_THEME, intensity = 'low' }) {
  const opacity = OPACITY_MAP[intensity] ?? OPACITY_MAP.low;
  const colors = theme.bg || [theme.accent];

  return (
    <div className="theme-bg" aria-hidden="true">
      {colors.map((color, i) => (
        <div
          key={i}
          className={`theme-bg-glow ${BLOB_STYLES[i] || BLOB_STYLES[0]}`}
          style={{ background: color, opacity }}
        />
      ))}
    </div>
  );
}
