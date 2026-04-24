import React, { useEffect, useState, useRef } from "react";

function Dashboard() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    breakdown: { plastic: 0, organic: 0, metal: 0, glass: 0, paper: 0 }
  });
  const [error, setError] = useState("");

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
        setError("");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please allow camera permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Capture and classify image
  const captureAndClassify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsClassifying(true);
    setError("");
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Convert to blob for upload
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', file);
      
      // Call backend API
      const res = await fetch('http://localhost:5000/api/classify-waste', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        throw new Error('Classification failed');
      }
      
      const data = await res.json();
      setResult(data);
      
      // Refresh history and stats
      fetchHistory();
      fetchStats();
    } catch (err) {
      console.error("Classification error:", err);
      setError("Failed to classify. Make sure backend is running.");
    } finally {
      setIsClassifying(false);
    }
  };

  // Fetch history from backend
  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/history');
      const data = await res.json();
      setHistory(data.items || []);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  // Fetch disposal tip for a category
  const fetchDisposalTip = async (category) => {
    try {
      const res = await fetch(`http://localhost:5000/api/disposal-methods/${category.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        return data.tip;
      }
    } catch (err) {
      console.error("Disposal tip fetch error:", err);
    }
    return "";
  };

  useEffect(() => {
    fetchHistory();
    fetchStats();
    
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{ padding: "30px", fontFamily: 'Arial, sans-serif' }}>
      <h1>♻️ Waste Segregation Dashboard</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          color: '#c00', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {/* Camera Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          border: '2px solid #4CAF50', 
          borderRadius: '10px',
          padding: '10px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>📷 Camera</h3>
          <div style={{ position: 'relative', width: '320px', height: '240px', backgroundColor: '#000' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {!isCameraOn && (
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff'
              }}>
                Camera off
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            {!isCameraOn ? (
              <button 
                onClick={startCamera}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Turn On Camera
              </button>
            ) : (
              <button 
                onClick={stopCamera}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Turn Off Camera
              </button>
            )}
            
            <button 
              onClick={captureAndClassify}
              disabled={!isCameraOn || isClassifying}
              style={{
                padding: '10px 20px',
                backgroundColor: isCameraOn ? '#2196F3' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: isCameraOn ? 'pointer' : 'not-allowed'
              }}
            >
              {isClassifying ? 'Classifying...' : '🔍 Classify Waste'}
            </button>
          </div>
        </div>

        {/* Result Display */}
        <div style={{ 
          border: '2px solid #2196F3', 
          borderRadius: '10px',
          padding: '20px',
          minWidth: '300px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>📊 Classification Result</h3>
          {result ? (
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                {result.category}
              </div>
              <div style={{ marginTop: '10px' }}>
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </div>
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                💡 {result.tip}
              </div>
            </div>
          ) : (
            <div style={{ color: '#666' }}>
              Capture an image to classify waste
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ marginTop: '30px' }}>
        <h2>📈 Statistics</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
          <div style={{ 
            padding: '15px 25px', 
            backgroundColor: '#e8f5e9', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2E7D32' }}>
              {stats.totalItems}
            </div>
            <div>Total Scans</div>
          </div>
          
          <div style={{ 
            padding: '15px 25px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1565C0' }}>
              {stats.breakdown.plastic}
            </div>
            <div>Plastic</div>
          </div>
          
          <div style={{ 
            padding: '15px 25px', 
            backgroundColor: '#fff3e0', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#E65100' }}>
              {stats.breakdown.organic}
            </div>
            <div>Organic</div>
          </div>
          
          <div style={{ 
            padding: '15px 25px', 
            backgroundColor: '#f3e5f5', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7B1FA2' }}>
              {stats.breakdown.metal}
            </div>
            <div>Metal</div>
          </div>
          
          <div style={{ 
            padding: '15px 25px', 
            backgroundColor: '#e0f2f1', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00695C' }}>
              {stats.breakdown.glass}
            </div>
            <div>Glass</div>
          </div>
          
          <div style={{ 
            padding: '15px 25px', 
            backgroundColor: '#fafafa', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#616161' }}>
              {stats.breakdown.paper}
            </div>
            <div>Paper</div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div style={{ marginTop: '30px' }}>
        <h2>📋 Classification History</h2>
        {history.length > 0 ? (
          <table border="1" cellPadding="10" style={{ marginTop: '10px', width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f5f5f5' }}>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Confidence</th>
                <th>Tip</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.id?.slice(0, 8)}</td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      backgroundColor: item.category === 'Plastic' ? '#e3f2fd' :
                                     item.category === 'Organic' ? '#fff3e0' :
                                     item.category === 'Metal' ? '#f3e5f5' :
                                     item.category === 'Glass' ? '#e0f2f1' : '#fafafa'
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td>{(item.confidence * 100).toFixed(1)}%</td>
                  <td>{item.tip}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ marginTop: '10px', color: '#666' }}>
            No classification history yet. Start classifying waste!
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;