const items = [
  { color: '#707070', label: 'Scheduled' },
  { color: '#00E676', label: 'Live' },
  { color: '#3A8FFF', label: 'Winner' },
  { color: '#6A6A8A', label: 'Eliminated' },
];

export default function Legend() {
  return (
    <div className="legend">
      {items.map(({ color, label }) => (
        <div key={label} className="legend-item">
          <div className="legend-dot" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}
