export default function Legend() {
  return (
    <div className="legend">
      <div className="legend-item">
        <div className="legend-dot legend-dot--scheduled" />
        Scheduled
      </div>
      <div className="legend-item">
        <div className="legend-dot legend-dot--live" />
        Live
      </div>
      <div className="legend-divider" />
      <button
        className="legend-info-btn"
        onClick={() => window.dispatchEvent(new CustomEvent('wc26-show-help'))}
        aria-label="How it works"
        title="How it works"
      >
        ⓘ How it works
      </button>
    </div>
  );
}
