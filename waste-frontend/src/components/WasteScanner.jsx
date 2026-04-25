import { useRef, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 720,
  height: 720,
  facingMode: "environment",
};

function WasteScanner({ disabled, onCapture }) {
  const webcamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      setCameraError("Camera is not ready. Allow camera access and try again.");
      return;
    }

    setCameraError("");
    onCapture(imageSrc);
  };

  return (
    <section className="scanner-panel" aria-label="Waste scanner">
      <div className="camera-frame">
        <Webcam
          audio={false}
          className="camera-feed"
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMediaError={() =>
            setCameraError("Camera access was blocked or unavailable.")
          }
        />
        <div className="scan-corners" aria-hidden="true" />
      </div>

      {cameraError && <p className="form-error">{cameraError}</p>}

      <button className="primary-action" disabled={disabled} onClick={handleCapture}>
        <span aria-hidden="true">[ ]</span>
        Capture Image
      </button>
    </section>
  );
}

export default WasteScanner;
