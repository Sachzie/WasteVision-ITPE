import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AdminNav from '../components/AdminNav'
import { apiService } from '../services/api'
import ImageModal from '../components/ImageModal'
import '../assets/css/admin.css'

function AdminHistory({ isAuthenticated, setIsAuthenticated }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await apiService.getAllActivities()
        setActivities(res.data.activities || [])
      } catch (error) {
        console.error('Error fetching activities:', error)
        toast.error('Failed to load detection history')
      } finally {
        setLoading(false)
      }
    }
    if (isAuthenticated) fetchData()
  }, [isAuthenticated])

  return (
    <div className="admin-container admin-large">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      <section className="admin-hero">
        <div className="admin-hero-content">
          <h1>Admin • Detection History</h1>
          <p>System-wide detection records across all users</p>
        </div>
      </section>

      <AdminNav />

      <section className="admin-content">
        <div className="admin-card">
          <div className="admin-card-header"><h2>Detections</h2></div>
          <div className="admin-card-body admin-history-large">
            <table className="admin-table admin-compact-table admin-history-table" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Date</th>
                  <th style={{ width: '24%' }}>User</th>
                  <th style={{ width: '12%' }}>Item</th>
                  <th style={{ width: '10%' }}>Category</th>
                  <th style={{ width: '6%' }}>Conf.</th>
                  <th style={{ width: '17%' }}>Original</th>
                  <th style={{ width: '17%' }}>Detected</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(a => {
                  const firstItem = (a.items && a.items[0]) || {}
                  const confPercent = firstItem.confidence ? (firstItem.confidence <= 1 ? Math.round(firstItem.confidence * 100) : Math.round(firstItem.confidence)) : 0
                  return (
                    <tr key={a._id}>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                      <td style={{ wordBreak: 'break-word' }}>{a.user?.name} ({a.user?.email})</td>
                      <td style={{ textTransform: 'capitalize' }}>{firstItem.item || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{firstItem.type || '—'}</td>
                      <td>{confPercent}%</td>
                      <td>
                        {a.image?.url ? (
                          <img
                            src={a.image.url}
                            alt="original"
                            className="admin-history-img admin-history-img-large"
                            onClick={() => { setImageSrc(a.image.url); setIsImageOpen(true) }}
                          />
                        ) : '—'}
                      </td>
                      <td>
                        {a.detectedImage?.url ? (
                          <img
                            src={a.detectedImage.url}
                            alt="detected"
                            className="admin-history-img admin-history-img-large"
                            onClick={() => { setImageSrc(a.detectedImage.url); setIsImageOpen(true) }}
                          />
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ImageModal src={imageSrc} isOpen={isImageOpen} onClose={() => setIsImageOpen(false)} />

      <Footer />
    </div>
  )
}

export default AdminHistory