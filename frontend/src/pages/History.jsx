import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import '../assets/css/history.css'
import { exportHistoryToPDF } from '../services/pdfExport'
import { exportRecordDetailToPDF } from '../services/pdfModalExport'

function History({ isAuthenticated, setIsAuthenticated }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingRecordPDF, setExportingRecordPDF] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await apiService.getHistory()
      
      const records = Array.isArray(response.data) 
        ? response.data 
        : response.data.records || []
      
      setHistory(records)
      setError('')
    } catch (err) {
      console.error('Error fetching history:', err)
      setError('Failed to load history. Please try again.')
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (recordId) => {
    try {
      const response = await apiService.getRecordById(recordId)
      setSelectedRecord(response.data.record)
      setShowModal(true)
    } catch (err) {
      console.error('Error fetching record details:', err)
      toast.error('Failed to load record details')
    }
  }

  const handleDeleteClick = (e, record) => {
    e.stopPropagation()
    setRecordToDelete(record)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return

    try {
      setDeleting(true)
      await apiService.deleteRecord(recordToDelete._id)
      
      setHistory(history.filter(record => record._id !== recordToDelete._id))
      
      toast.success('Record deleted successfully')
      setShowDeleteModal(false)
      setRecordToDelete(null)
    } catch (err) {
      console.error('Error deleting record:', err)
      toast.error('Failed to delete record. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setRecordToDelete(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedRecord(null)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleExportPDF = async () => {
    if (history.length === 0) {
      toast.error('No classification history to export')
      return
    }

    setExportingPDF(true)
    const loadingToast = toast.loading('🔄 Generating PDF report...')

    try {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
      
      const result = await exportHistoryToPDF(history, userInfo)
      
      if (result.success) {
        toast.success(`📄 PDF exported successfully: ${result.fileName}`, {
          id: loadingToast,
          duration: 4000
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF. Please try again.', {
        id: loadingToast,
        duration: 5000
      })
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportRecordPDF = async () => {
    if (!selectedRecord) return

    setExportingRecordPDF(true)
    const loadingToast = toast.loading('🔄 Generating PDF report...')

    try {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
      
      const result = await exportRecordDetailToPDF(selectedRecord, userInfo)
      
      if (result.success) {
        toast.success(`📄 PDF exported successfully: ${result.fileName}`, {
          id: loadingToast,
          duration: 4000
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF. Please try again.', {
        id: loadingToast,
        duration: 5000
      })
    } finally {
      setExportingRecordPDF(false)
    }
  }

  return (
    <div className="history-container">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      
      {/* Hero Section */}
      <section className="history-hero">
        <div className="history-hero-content">
          <h1>Classification History</h1>
          <p>View and manage your waste classification records</p>
        </div>
      </section>

      {/* Header with Export Button */}
      <section className="history-header-section">
        <div className="history-header-wrapper">
          <h2>Your Classification Records</h2>
          {history.length > 0 && (
            <button 
              className="btn-export-pdf"
              onClick={handleExportPDF}
              disabled={exportingPDF}
            >
              {exportingPDF ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Generating PDF...
                </>
              ) : (
                <>
                  <i className="fas fa-file-pdf"></i>
                  Export to PDF
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* History Grid Section */}
      <section className="history-grid-section">
        {loading && (
          <div className="loading-message">
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
            Loading history...
          </div>
        )}

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle" style={{ marginRight: '10px' }}></i>
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="empty-state">
            <p>📭 No classification history yet.</p>
            <p>Start by uploading an image in the Dashboard!</p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="history-grid">
            {history.map((record) => (
              <div 
                key={record._id} 
                className="history-card"
                onClick={() => handleViewDetails(record._id)}
              >
                {record.image && (
                  <div className="history-image">
                    <img src={record.image.url} alt="Classified waste" />
                  </div>
                )}
                <div className="history-content">
                  <div className="history-date">
                    {formatDate(record.createdAt)}
                  </div>
                  {record.items && record.items.length > 0 && (
                    <div className="history-summary">
                      <p>{record.items[0].item}</p>
                      <span className={`type-badge ${record.items[0].type?.toLowerCase()}`}>
                        {record.items[0].type}
                      </span>
                      <p className="confidence-text">
                        Confidence: {Math.round(record.items[0].confidence * 100)}%
                      </p>
                    </div>
                  )}
                  <div className="history-actions">
                    <button 
                      className="btn-view-details"
                      onClick={() => handleViewDetails(record._id)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={(e) => handleDeleteClick(e, record)}
                      title="Delete record"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Details Modal */}
      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Classification Details</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  className="btn-export-pdf"
                  onClick={handleExportRecordPDF}
                  disabled={exportingRecordPDF}
                  style={{ 
                    padding: '8px 15px', 
                    fontSize: '14px',
                    minWidth: '140px'
                  }}
                >
                  {exportingRecordPDF ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-pdf"></i>
                      Export PDF
                    </>
                  )}
                </button>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
            </div>
            <div className="modal-body-large">
              <div className="detail-images">
                <div className="detail-image-section">
                  <h4>Original Image</h4>
                  <img src={selectedRecord.image.url} alt="Original" className="detail-img" />
                </div>
                {selectedRecord.detectedImage && (
                  <div className="detail-image-section">
                    <h4>Detected Image (with bounding boxes)</h4>
                    <img src={selectedRecord.detectedImage.url} alt="Detected" className="detail-img" />
                  </div>
                )}
              </div>
              
              <div className="detail-info">
                <h4>Classification Information</h4>
                <div className="detail-date">
                  <strong>Date:</strong> {formatDate(selectedRecord.createdAt)}
                </div>
                
                {selectedRecord.items && selectedRecord.items.map((item, index) => (
                  <div key={index} className="detail-item">
                    <div className="detail-row">
                      <strong>Item:</strong> {item.item}
                    </div>
                    <div className="detail-row">
                      <strong>Type:</strong> 
                      <span className={`type-badge ${item.type?.toLowerCase()}`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Confidence:</strong> {Math.round(item.confidence * 100)}%
                    </div>
                    <div className="detail-row">
                      <strong>Recyclable:</strong> 
                      <span className={item.recyclable ? 'recyclable-yes' : 'recyclable-no'}>
                        {item.recyclable ? 'Yes ✅' : 'No ❌'}
                      </span>
                    </div>
                    {item.disposalMethod && (
                      <div className="detail-row disposal-method">
                        <strong>Disposal Method:</strong>
                        <p>{item.disposalMethod}</p>
                      </div>
                    )}
                    {item.description && (
                      <div className="detail-row">
                        <strong>Description:</strong> {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={cancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this record?</p>
              {recordToDelete.items && recordToDelete.items.length > 0 && (
                <div className="delete-preview">
                  <strong>{recordToDelete.items[0].item}</strong>
                  <p className="delete-date">{formatDate(recordToDelete.createdAt)}</p>
                </div>
              )}
              <p className="warning-text">⚠️ This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default History