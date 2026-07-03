const statusItems = [
  { color: '#707070', label: 'Scheduled' },
  { color: '#00E676', label: 'Live' },
  { color: '#4CAF50', label: 'Winner' },
  { color: '#6A6A8A', label: 'Eliminated' },
];

export default function Legend() {
  return (
    <div className="legend">
      {statusItems.map(({ color, label }) => (
        <div key={label} className="legend-item">
          <div className="legend-dot" style={{ background: color }} />
          {label}
        </div>
      ))}
      <div className="legend-divider" />
      <div className="legend-hint">
        <span className="legend-hint-icon">◎</span> Click team — trace path to Final
      </div>
      <div className="legend-hint">
        <span className="legend-hint-icon" style={{ color: '#C9A84C' }}>◌</span> Hover unplayed match → pick a winner
      </div>
    </div>
  );
}
