import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Camera from './Camera'
import { apiService } from '../services/api'
import '../assets/css/dashboard.css'

function Dashboard({ isAuthenticated, setIsAuthenticated }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detectedImages, setDetectedImages] = useState({ custom: null, default: null })
  const [allDetections, setAllDetections] = useState([])
  const [activeModel, setActiveModel] = useState('custom')
  const [captureMode, setCaptureMode] = useState('upload')
  const [capturedImage, setCapturedImage] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showCamera, setShowCamera] = useState(false)
  // Reviews state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [myReviews, setMyReviews] = useState([])

  // Fetch user statistics on component mount
  useEffect(() => {
    const fetchUserStatistics = async () => {
      try {
        setStatsLoading(true)
        const response = await apiService.getUserStatistics()
        setUserStats(response.data.stats)
      } catch (error) {
        console.error('Error fetching user statistics:', error)
        toast.error('Failed to load statistics')
      } finally {
        setStatsLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchUserStatistics()
      // Fetch user's reviews
      ;(async () => {
        try {
          const res = await apiService.getMyReviews()
          const list = res.data?.reviews || []
          setMyReviews(list)
        } catch (err) {
          console.error('Error fetching reviews:', err)
        }
      })()
    }
  }, [isAuthenticated])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setCapturedImage(null)
      setResult(null)
      setDetectedImages({ custom: null, default: null })
      setAllDetections([])
    }
  }

  const handleCapture = (imageData) => {
    console.log('📸 Image captured from camera:', {
      dataUrlLength: imageData?.length,
      isDataUrl: imageData?.startsWith('data:image')
    })
    
    // Set both capturedImage and preview with the data URL
    setCapturedImage(imageData)
    setPreview(imageData)
    setSelectedFile(null)
    setResult(null)
    setDetectedImages({ custom: null, default: null })
    setAllDetections([])
    
    // Keep camera hidden after successful capture
    setShowCamera(false)
    
    toast.success('📸 Image captured! Click "Classify Waste" to analyze.', {
      duration: 3000,
    })
  }

  const switchMode = (mode) => {
    setCaptureMode(mode)
    setPreview(null)
    setSelectedFile(null)
    setCapturedImage(null)
    setResult(null)
    setDetectedImages({ custom: null, default: null })
    setAllDetections([])
    
    // Show camera component when switching to camera mode
    if (mode === 'camera') {
      setShowCamera(true)
    } else {
      setShowCamera(false)
    }
  }

  const handleClassify = async () => {
    if (!selectedFile && !capturedImage) {
      toast.error('Please select or capture an image first')
      return
    }

    setLoading(true)
    const formData = new FormData()

    if (capturedImage) {
      console.log('📤 Sending captured image to API')
      const blob = await fetch(capturedImage).then(r => r.blob())
      formData.append('image', blob, 'captured-image.jpg')
    } else {
      formData.append('image', selectedFile)
    }

    try {
      const response = await apiService.classifyWaste(formData)
      
      if (response.data.success) {
        const { classification, detected_image_custom, detected_image_default, all_detections } = response.data
        
        setResult(classification)
        setDetectedImages({
          custom: detected_image_custom || null,
          default: detected_image_default || null
        })
        setAllDetections(all_detections || [])
        
        toast.success('Classification completed successfully!', {
          duration: 3000,
          icon: '✅',
        })

        // Refresh statistics after classification
        try {
          const statsResponse = await apiService.getUserStatistics()
          setUserStats(statsResponse.data.stats)
        } catch (error) {
          console.error('Error refreshing statistics:', error)
        }
      }
    } catch (error) {
      console.error('Classification error:', error)
      const errorMessage = error.response?.data?.error || 'Classification failed. Please try again.'
      toast.error(errorMessage, {
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setDetectedImages({ custom: null, default: null })
    setAllDetections([])
    setCapturedImage(null)
    
    const fileInput = document.getElementById('file-input')
    if (fileInput) {
      fileInput.value = ''
    }

    // If in camera mode, show camera again
    if (captureMode === 'camera') {
      setShowCamera(true)
    }

    toast.success('Ready for new classification', {
      duration: 2000,
      icon: '✨',
    })
  }

  const handleRetakePhoto = () => {
    console.log('🔄 Retaking photo')
    setPreview(null)
    setCapturedImage(null)
    setResult(null)
    setDetectedImages({ custom: null, default: null })
    setAllDetections([])
    setShowCamera(true)
    
    toast.info('Camera reopened. Take a new photo.', {
      duration: 2000,
    })
  }

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewComment.trim()) {
      toast.error('Please provide a rating and comment')
      return
    }
    try {
      setReviewSubmitting(true)
      const payload = { rating: Number(reviewRating), comment: reviewComment.trim() }
      const res = await apiService.submitReview(payload)
      toast.success('Thanks for your feedback! Pending approval')
      // Update local list
      const newReview = res.data?.review
      if (newReview) {
        setMyReviews(prev => [newReview, ...prev])
      }
      setReviewRating(5)
      setReviewComment('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review'
      toast.error(msg)
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <div className="dashboard-container">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      
      {/* Hero Section */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1>Waste Classification Dashboard</h1>
          <p>Upload an image or use your camera to classify waste with AI</p>
        </div>
      </section>

      {/* User Statistics Section */}
      <section className="dashboard-stats-section">
        {!statsLoading && userStats && (
          <div className="statistics-grid">
            <div className="stat-card">
              <h3>Total Classifications</h3>
              <p className="stat-number">{userStats.totalClassifications}</p>
              <p className="stat-description">Items analyzed</p>
            </div>
            
            <div className="stat-card">
              <h3>Recyclable Items</h3>
              <p className="stat-number" style={{ color: '#10b981' }}>
                {userStats.recyclableCount}
              </p>
              <p className="stat-description">
                {userStats.totalClassifications > 0 
                  ? `${((userStats.recyclableCount / userStats.totalClassifications) * 100).toFixed(1)}% of total`
                  : '0% of total'
                }
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Non-Recyclable Items</h3>
              <p className="stat-number" style={{ color: '#ef4444' }}>
                {userStats.nonRecyclableCount}
              </p>
              <p className="stat-description">
                {userStats.totalClassifications > 0
                  ? `${((userStats.nonRecyclableCount / userStats.totalClassifications) * 100).toFixed(1)}% of total`
                  : '0% of total'
                }
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Average Confidence</h3>
              <p className="stat-number">{userStats.averageConfidence}%</p>
              <p className="stat-description">Model accuracy</p>
            </div>
            
            <div className="stat-card">
              <h3>Most Common Category</h3>
              <p className="stat-number" style={{ fontSize: '20px', textTransform: 'capitalize' }}>
                {userStats.mostCommonCategory}
              </p>
              <p className="stat-description">
                {userStats.categoryBreakdown[userStats.mostCommonCategory] || 0} items
              </p>
            </div>
            
            <div className="stat-card">
              <h3>Recent Activity</h3>
              <p className="stat-number" style={{ fontSize: '16px' }}>
                {userStats.recentActivity 
                  ? new Date(userStats.recentActivity).toLocaleDateString()
                  : 'No activity yet'
                }
              </p>
              <p className="stat-description">Last classification</p>
            </div>
          </div>
        )}

        {statsLoading && (
          <div className="statistics-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="stat-card" style={{ opacity: 0.6 }}>
                <h3>Loading...</h3>
                <p className="stat-number">--</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upload Section */}
      <section className="dashboard-upload-section">
        <div className="upload-section">
          {/* Mode Selector */}
          <div className="model-tabs" style={{ marginBottom: '1.5rem' }}>
            <button 
              className={`tab-btn ${captureMode === 'upload' ? 'active' : ''}`}
              onClick={() => switchMode('upload')}
              disabled={loading}
            >
              📁 Upload Image
            </button>
            <button 
              className={`tab-btn ${captureMode === 'camera' ? 'active' : ''}`}
              onClick={() => switchMode('camera')}
              disabled={loading}
            >
              📷 Use Camera
            </button>
          </div>

          {captureMode === 'upload' ? (
            <>
              <div className="file-input-container">
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  disabled={loading}
                />
                <label htmlFor="file-input" className="file-label">
                  <span className="file-icon">📁</span>
                  <span>{selectedFile ? selectedFile.name : 'Choose an image file'}</span>
                </label>
              </div>

              {preview && (
                <div className="preview-container">
                  <h4>📷 Image Preview</h4>
                  <img src={preview} alt="Preview" className="preview-image" />
                </div>
              )}

              <div className="button-group">
                <button 
                  onClick={handleClassify}
                  disabled={(!selectedFile && !capturedImage) || loading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {loading ? '🔄 Classifying...' : '🤖 Classify Waste'}
                </button>
                {result && (
                  <button 
                    onClick={handleReset}
                    className="btn"
                    style={{ flex: 1, backgroundColor: '#4CAF50', color: 'white' }}
                  >
                    ✨ New Classification
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Show Camera when showCamera is true and no preview */}
              {showCamera && !preview && (
                <Camera 
                  onCapture={handleCapture} 
                  isActive={true} 
                  onClose={() => {
                    setShowCamera(false)
                    switchMode('upload')
                  }} 
                />
              )}

              {/* Show Preview and buttons after capture */}
              {!showCamera && preview && (
                <>
                  <div className="preview-container">
                    <h4>📷 Captured Image Preview</h4>
                    <img src={preview} alt="Captured Preview" className="preview-image" />
                  </div>

                  <div className="button-group">
                    <button 
                      onClick={handleClassify}
                      disabled={loading}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      {loading ? '🔄 Classifying...' : '🤖 Classify Waste'}
                    </button>
                    {result ? (
                      <button 
                        onClick={handleReset}
                        className="btn"
                        style={{ flex: 1, backgroundColor: '#4CAF50', color: 'white' }}
                      >
                        ✨ New Classification
                      </button>
                    ) : (
                      <button 
                        onClick={handleRetakePhoto}
                        className="btn"
                        style={{ flex: 1, backgroundColor: '#ff9800', color: 'white' }}
                      >
                        📷 Retake Photo
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Show button to open camera if both closed and no preview */}
              {!showCamera && !preview && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <button 
                    onClick={() => setShowCamera(true)}
                    className="btn btn-primary"
                    style={{ padding: '16px 40px', fontSize: '1.1rem' }}
                  >
                    📷 Open Camera
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Detection Results Section */}
      {(detectedImages.custom || detectedImages.default) && (
        <section className="dashboard-results-section">
          <div className="detected-images-section">
            <h3>🎯 AI Detection Results</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Compare results from both AI models
            </p>
            
            <div className="model-tabs">
              <button 
                className={`tab-btn ${activeModel === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveModel('custom')}
                disabled={!detectedImages.custom}
              >
                🤖 Custom Model
                {detectedImages.custom && <span style={{ marginLeft: '5px', fontSize: '0.8rem' }}>✅</span>}
              </button>
              <button 
                className={`tab-btn ${activeModel === 'default' ? 'active' : ''}`}
                onClick={() => setActiveModel('default')}
                disabled={!detectedImages.default}
              >
                🔍 YOLOv5 Model
                {detectedImages.default && <span style={{ marginLeft: '5px', fontSize: '0.8rem' }}>✅</span>}
              </button>
            </div>

            <div className="detected-image-container">
              {activeModel === 'custom' && detectedImages.custom && (
                <div>
                  <h4 style={{ textAlign: 'center', color: '#4CAF50', marginBottom: '1rem' }}>
                    Custom Trained Model Results
                  </h4>
                  <img 
                    src={detectedImages.custom} 
                    alt="Custom Model Detection" 
                    className="detected-image"
                  />
                </div>
              )}
              
              {activeModel === 'default' && detectedImages.default && (
                <div>
                  <h4 style={{ textAlign: 'center', color: '#2563eb', marginBottom: '1rem' }}>
                    YOLOv5 Pre-trained Model Results
                  </h4>
                  <img 
                    src={detectedImages.default} 
                    alt="Default Model Detection" 
                    className="detected-image"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* All Detections Section */}
      {allDetections.length > 0 && (
        <section className="dashboard-detections-section">
          <div className="all-detections-section">
            <h3>🔍 All Detected Items</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Detailed breakdown of all items found in the image
            </p>
            <div className="detections-grid">
              {allDetections.map((detection, index) => (
                <div key={index} className="detection-card">
                  <div className="detection-header">
                    <span className="detection-item">🔹 {detection.item}</span>
                    <span className={`detection-type ${detection.type?.toLowerCase()}`}>
                      {detection.type}
                    </span>
                  </div>
                  <div className="detection-confidence">
                    Confidence: {(detection.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill" 
                      style={{ width: `${detection.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Primary Classification Result */}
      {result && (
        <section className="dashboard-classification-section">
          <div className="result-section">
            <h3>✅ Primary Classification Result</h3>
            <div className="result-card">
              <p><strong>🗑️ Waste Type:</strong> {result.wasteType}</p>
              <p><strong>📦 Category:</strong> <span className={`category-badge ${result.category?.toLowerCase()}`}>{result.category}</span></p>
              <p><strong>🎯 Confidence:</strong> <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{result.confidence}%</span></p>
              <p><strong>♻️ Recyclable:</strong> <span className={result.recyclable ? 'recyclable-yes' : 'recyclable-no'}>{result.recyclable ? 'Yes ✅' : 'No ❌'}</span></p>
              {result.disposal_instructions && (
                <div className="disposal-instructions">
                  <strong>📌 Disposal Instructions:</strong>
                  <p>{result.disposal_instructions}</p>
                </div>
              )}
              {result.description && (
                <p className="description"><strong>ℹ️ Description:</strong> {result.description}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="dashboard-reviews-section">
        <div className="review-section">
          <div className="review-header">
            <h3>📝 Share Your Feedback</h3>
            <p>
              Tell us what you think about WasteVision. Your review helps us improve.
            </p>
          </div>

          <div className="review-form">
            <div className="form-field field-rating">
              <label htmlFor="rating">Rating</label>
              <select
                id="rating"
                value={reviewRating}
                onChange={(e) => setReviewRating(e.target.value)}
                className="form-input"
              >
                {[5,4,3,2,1].map(r => (
                  <option key={r} value={r}>{r} ⭐</option>
                ))}
              </select>
            </div>
            <div className="form-field field-comment">
              <label htmlFor="comment">Comment</label>
              <textarea
                id="comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="form-input"
                placeholder="Share your experience, suggestions, or issues..."
              />
            </div>
            <div className="form-actions">
              <button
                onClick={handleSubmitReview}
                className="btn btn-primary"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>

          <div className="my-reviews">
            <h4>📣 Your Reviews</h4>
            {myReviews.length === 0 ? (
              <p className="reviews-empty">You haven’t posted any reviews yet.</p>
            ) : (
              <div className="reviews-list">
                {myReviews.map(rv => (
                  <div key={rv._id} className="review-card">
                    <div className="review-card-top">
                      <span className="review-rating">{rv.rating} ⭐</span>
                      <span className={`status-badge ${rv.status}`}>
                        {rv.status}
                      </span>
                    </div>
                    <p className="review-comment">{rv.comment}</p>
                    <div className="review-date">
                      {new Date(rv.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Dashboard