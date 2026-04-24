import { useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'

function App() {
  const webcamRef = useRef(null)
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showFlash, setShowFlash] = useState(false)

  const classifyImage = async (imageData) => {
    // Simulate API processing with random delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    const categories = [
      { category: 'Plastic', confidence: 0.92, tip: '♻️ Recycle this item' },
      { category: 'Organic', confidence: 0.88, tip: '🌱 Compost this waste' },
      { category: 'Metal', confidence: 0.95, tip: '🔧 Recycle at metal facility' },
      { category: 'Glass', confidence: 0.91, tip: '🏠 Recycle in glass bin' },
      { category: 'Paper', confidence: 0.89, tip: '📄 Recycle in paper bin' }
    ]
    return categories[Math.floor(Math.random() * categories.length)]
  }

  const handleCapture = async () => {
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 300)
    
    const imageSrc = webcamRef.current.getScreenshot()
    setImage(imageSrc)
    setLoading(true)
    try {
      const classificationResult = await classifyImage(imageSrc)
      setResult(classificationResult)
    } catch (error) {
      console.error('Classification error:', error)
      setResult({
        category: 'Error',
        confidence: 0,
        tip: 'Could not classify image'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetake = () => {
    setImage(null)
    setResult(null)
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      {showFlash && <div style={styles.flashOverlay}></div>}
      
      <header style={styles.header}>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>♻️ Waste Segregation AI</h1>
          <div style={styles.titleUnderline}></div>
        </div>
        <p style={styles.subtitle}>Smart waste classification with AI-powered detection</p>
      </header>

      <main style={styles.main}>
        {!image ? (
          <div style={styles.cameraSection}>
            <div style={styles.cameraWrapper}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 400, height: 400 }}
                style={styles.webcam}
              />
              <div style={styles.cameraRing}></div>
            </div>
            <button
              onClick={handleCapture}
              style={styles.captureButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 8px 20px rgba(39, 174, 96, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <span style={styles.buttonIcon}>📸</span>
              <span>Capture Image</span>
            </button>
            <p style={styles.hint}>Position the waste item in the frame and click capture</p>
          </div>
        ) : (
          <div style={styles.imageSection}>
            <div style={styles.imageContainer}>
              <img
                src={image}
                alt="Captured"
                style={styles.capturedImage}
              />
              <div style={styles.imageOverlay}></div>
            </div>
            <button
              onClick={handleRetake}
              style={styles.retakeButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 8px 20px rgba(192, 57, 43, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <span style={styles.buttonIcon}>🔄</span>
              <span>Retake Photo</span>
            </button>
          </div>
        )}

        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.loaderContainer}>
              <div style={styles.spinner}></div>
              <div style={styles.pulseRing}></div>
            </div>
            <p style={styles.loadingText}>Analyzing waste...</p>
            <div style={styles.loadingBar}>
              <div style={styles.loadingBarFill}></div>
            </div>
          </div>
        )}

        {result && !loading && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <h2 style={styles.resultTitle}>✓ Classification Complete</h2>
              <div style={styles.confidentBadge}>
                {result.confidence > 0.9 ? '⭐ High Confidence' : '⚠️ Check Result'}
              </div>
            </div>
            
            <div style={styles.resultContent}>
              <div style={styles.categoryBox}>
                <p style={styles.label}>Waste Category</p>
                <p style={styles.category}>{result.category}</p>
                <div style={styles.categoryIcon}>
                  {result.category === 'Plastic' && '🍾'}
                  {result.category === 'Organic' && '🍎'}
                  {result.category === 'Metal' && '🥫'}
                  {result.category === 'Glass' && '🍷'}
                  {result.category === 'Paper' && '📰'}
                </div>
              </div>

              <div style={styles.confidenceBox}>
                <p style={styles.label}>Confidence Score</p>
                <div style={styles.progressContainer}>
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${result.confidence * 100}%`}}></div>
                  </div>
                  <p style={styles.confidence}>{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div style={styles.tipBox}>
                <p style={styles.label}>Disposal Instructions</p>
                <p style={styles.tip}>{result.tip}</p>
              </div>

              <div style={styles.actionButtons}>
                <button style={styles.successButton}>✓ Save Result</button>
                <button style={styles.infoButton}>ℹ️ Learn More</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>🌍 Making waste management smarter, one item at a time</p>
        <div style={styles.footerLinks}>
          <span>v1.0.0</span> • <span>Powered by AI</span>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  },
  flashOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    animation: 'cameraFlash 0.3s ease-out',
    pointerEvents: 'none',
    zIndex: 1000
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    marginTop: '20px',
    animation: 'slideDown 0.6s ease'
  },
  titleContainer: {
    position: 'relative',
    display: 'inline-block'
  },
  title: {
    fontSize: '2.8rem',
    color: '#2c3e50',
    margin: '0 0 10px 0',
    fontWeight: '800',
    letterSpacing: '-1px',
    animation: 'textGlow 2s ease-in-out infinite'
  },
  titleUnderline: {
    height: '4px',
    background: 'linear-gradient(90deg, #27ae60, #3498db, #e74c3c)',
    borderRadius: '2px',
    width: '200px',
    margin: '0 auto',
    animation: 'expandWidth 0.8s ease'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#7f8c8d',
    margin: '15px 0 0 0',
    fontWeight: '500',
    animation: 'fadeIn 0.8s ease 0.2s both'
  },
  main: {
    maxWidth: '550px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    alignItems: 'center',
    animation: 'fadeIn 0.8s ease 0.4s both'
  },
  cameraSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '25px',
    width: '100%',
    animation: 'scaleIn 0.5s ease'
  },
  cameraWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px'
  },
  webcam: {
    borderRadius: '20px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    animation: 'popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  cameraRing: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    right: '-8px',
    bottom: '-8px',
    border: '2px solid #27ae60',
    borderRadius: '24px',
    animation: 'pulse 2s ease-in-out infinite',
    pointerEvents: 'none'
  },
  hint: {
    fontSize: '0.9rem',
    color: '#7f8c8d',
    fontStyle: 'italic',
    margin: '0',
    animation: 'fadeInUp 0.8s ease 0.6s both'
  },
  captureButton: {
    padding: '16px 40px',
    fontSize: '1.1rem',
    fontWeight: '700',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '220px',
    justifyContent: 'center',
    animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.4s both'
  },
  buttonIcon: {
    fontSize: '1.4rem'
  },
  imageSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '25px',
    width: '100%',
    animation: 'fadeIn 0.5s ease'
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
  },
  capturedImage: {
    borderRadius: '20px',
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    animation: 'scaleUp 0.5s ease'
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%)',
    pointerEvents: 'none'
  },
  retakeButton: {
    padding: '14px 36px',
    fontSize: '1rem',
    fontWeight: '700',
    backgroundColor: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'fadeInUp 0.6s ease 0.2s both'
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '50px 40px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '100%',
    animation: 'slideUp 0.5s ease'
  },
  loaderContainer: {
    position: 'relative',
    width: '70px',
    height: '70px',
    margin: '0 auto 20px'
  },
  spinner: {
    width: '70px',
    height: '70px',
    border: '4px solid #ecf0f1',
    borderTop: '4px solid #27ae60',
    borderRight: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    position: 'absolute'
  },
  pulseRing: {
    width: '70px',
    height: '70px',
    border: '3px solid transparent',
    borderRadius: '50%',
    borderTop: '3px solid rgba(39, 174, 96, 0.3)',
    animation: 'pulseSpin 2s linear infinite',
    position: 'absolute'
  },
  loadingText: {
    fontSize: '1.2rem',
    color: '#2c3e50',
    margin: '0 0 20px 0',
    fontWeight: '600'
  },
  loadingBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#ecf0f1',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '20px'
  },
  loadingBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #27ae60, #3498db)',
    animation: 'loadingProgress 2s ease-in-out infinite'
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
    width: '100%',
    animation: 'slideUp 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    border: '2px solid #ecf0f1'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '2px solid #ecf0f1'
  },
  resultTitle: {
    fontSize: '1.6rem',
    color: '#2c3e50',
    margin: '0',
    fontWeight: '700'
  },
  confidentBadge: {
    backgroundColor: '#ecf0f1',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#27ae60',
    animation: 'fadeIn 0.6s ease 0.2s both'
  },
  resultContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  categoryBox: {
    padding: '20px',
    backgroundColor: 'linear-gradient(135deg, #ecf0f1 0%, #d5dbdb 100%)',
    borderRadius: '15px',
    textAlign: 'center',
    border: '2px solid #3498db',
    position: 'relative',
    animation: 'fadeInUp 0.6s ease 0.2s both'
  },
  categoryIcon: {
    fontSize: '3rem',
    marginTop: '10px',
    animation: 'bounce 1s ease-in-out infinite'
  },
  label: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 10px 0',
    fontWeight: '700'
  },
  category: {
    fontSize: '2rem',
    color: '#2c3e50',
    margin: '0',
    fontWeight: '800'
  },
  confidenceBox: {
    padding: '20px',
    backgroundColor: 'linear-gradient(135deg, #ecf0f1 0%, #d5dbdb 100%)',
    borderRadius: '15px',
    border: '2px solid #f39c12',
    animation: 'fadeInUp 0.6s ease 0.3s both'
  },
  progressContainer: {
    marginTop: '15px'
  },
  progressBar: {
    width: '100%',
    height: '14px',
    backgroundColor: '#bdc3c7',
    borderRadius: '7px',
    overflow: 'hidden',
    marginBottom: '12px',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
    transition: 'width 1s ease-out',
    borderRadius: '7px',
    boxShadow: '0 0 10px rgba(39, 174, 96, 0.5)'
  },
  confidence: {
    fontSize: '1.3rem',
    color: '#2c3e50',
    margin: '0',
    fontWeight: '700'
  },
  tipBox: {
    padding: '20px',
    backgroundColor: 'linear-gradient(135deg, #ecf0f1 0%, #d5dbdb 100%)',
    borderRadius: '15px',
    border: '2px solid #e74c3c',
    animation: 'fadeInUp 0.6s ease 0.4s both'
  },
  tip: {
    fontSize: '1.05rem',
    color: '#2c3e50',
    margin: '10px 0 0 0',
    lineHeight: '1.6',
    fontWeight: '600'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    animation: 'fadeInUp 0.6s ease 0.5s both'
  },
  successButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  infoButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  footer: {
    marginTop: '80px',
    color: '#7f8c8d',
    fontSize: '0.9rem',
    textAlign: 'center',
    animation: 'fadeIn 0.8s ease 1s both'
  },
  footerLinks: {
    marginTop: '10px',
    fontSize: '0.85rem',
    opacity: 0.7
  }
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulseSpin {
    to { transform: rotate(-360deg); }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes scaleUp {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes popIn {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
    }
    70% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7);
    }
    50% {
      opacity: 0.8;
      box-shadow: 0 0 0 10px rgba(39, 174, 96, 0);
    }
  }

  @keyframes expandWidth {
    from { width: 0; }
    to { width: 200px; }
  }

  @keyframes textGlow {
    0%, 100% {
      text-shadow: 0 0 10px rgba(39, 174, 96, 0), 0 0 20px rgba(39, 174, 96, 0);
    }
    50% {
      text-shadow: 0 0 10px rgba(39, 174, 96, 0.3), 0 0 20px rgba(39, 174, 96, 0.1);
    }
  }

  @keyframes cameraFlash {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes loadingProgress {
    0% { width: 0%; }
    50% { width: 100%; }
    100% { width: 100%; }
  }

  * {
    box-sizing: border-box;
  }
`
document.head.appendChild(styleSheet)

export default App
