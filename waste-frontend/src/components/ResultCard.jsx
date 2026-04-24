const categoryAccent = {
  Plastic: "#2563eb",
  Organic: "#16a34a",
  Metal: "#64748b",
  Glass: "#0891b2",
  Paper: "#ca8a04",
  Error: "#dc2626",
};

function ResultCard({ image, onRetake, result }) {
  if (!result) return null;

  const confidence = Math.round(result.confidence * 100);
  const accent = categoryAccent[result.category] ?? "#2563eb";

  return (
    <section className="result-card" aria-live="polite">
      <div className="result-preview">
        <img src={image} alt="Captured waste item" />
      </div>

      <div className="result-body">
        <div className="result-header">
          <div>
            <p className="eyebrow">Detected category</p>
            <h2>{result.category}</h2>
          </div>
          <span className="result-badge" style={{ borderColor: accent, color: accent }}>
            {confidence}% match
          </span>
        </div>

        <div className="meter" aria-label={`Confidence ${confidence} percent`}>
          <span style={{ width: `${confidence}%`, backgroundColor: accent }} />
        </div>

        <dl className="result-details">
          <div>
            <dt>Recommended bin</dt>
            <dd>{result.bin ?? "Review locally"}</dd>
          </div>
          <div>
            <dt>Instruction</dt>
            <dd>{result.tip}</dd>
          </div>
        </dl>

        <button className="secondary-action" onClick={onRetake}>
          Retake Photo
        </button>
      </div>
    </section>
  );
}

export default ResultCard;
