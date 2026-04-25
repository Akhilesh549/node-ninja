import { useState } from "react";
import Loader from "../components/Loader";
import ResultCard from "../components/ResultCard";
import WasteScanner from "../components/WasteScanner";
import { classifyImage } from "../utils/api";

function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [error, setError] = useState("");

  const handleCapture = async (imageSrc) => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 260);
    setImage(imageSrc);
    setResult(null);
    setError("");
    setLoading(true);

    try {
      const classification = await classifyImage(imageSrc);
      setResult(classification);
    } catch (captureError) {
      setError(captureError.message || "Could not classify the image.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setResult(null);
    setLoading(false);
    setError("");
  };

  return (
    <main className="page">
      {showFlash && <div className="flash-overlay" />}

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Live waste classifier</p>
          <h1>Sort waste correctly from a camera snapshot.</h1>
          <p>
            Capture an item, get a category, and see the recommended disposal
            action in one flow.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="scanner-column">
            {!image ? (
              <WasteScanner disabled={loading} onCapture={handleCapture} />
            ) : (
              <ResultCard image={image} onRetake={handleRetake} result={result} />
            )}
          </div>

          <aside className="status-panel">
            <h2>Scan status</h2>
            {loading && <Loader />}
            {!loading && !image && (
              <p className="muted-text">
                Place one waste item clearly inside the frame and capture it.
              </p>
            )}
            {!loading && result && (
              <p className="muted-text">
                Result ready. Retake the photo if the item was blurry or partly
                outside the frame.
              </p>
            )}
            {error && <p className="form-error">{error}</p>}

            <div className="quick-guide">
              <h3>Supported classes</h3>
              <div className="class-list">
                <span>Plastic</span>
                <span>Organic</span>
                <span>Metal</span>
                <span>Glass</span>
                <span>Paper</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Home;
