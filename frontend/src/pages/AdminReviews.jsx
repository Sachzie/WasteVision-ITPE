import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AdminNav from '../components/AdminNav'
import { apiService } from '../services/api'
import '../assets/css/admin.css'

function AdminReviews({ isAuthenticated, setIsAuthenticated }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await apiService.getAllReviews()
        setReviews(res.data.reviews || [])
      } catch (error) {
        console.error('Error fetching reviews:', error)
        toast.error('Failed to load reviews')
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
          <h1>Admin • Reviews</h1>
          <p>Moderate user-submitted ratings and comments</p>
        </div>
      </section>

      <AdminNav />

      <section className="admin-content">
        <div className="admin-card">
          <div className="admin-card-header"><h2>User Reviews</h2></div>
          <div className="admin-card-body">
            <table className="admin-table" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th style={{ width: '40%' }}>Comment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(rv => (
                  <tr key={rv._id}>
                    <td>{new Date(rv.createdAt).toLocaleString()}</td>
                    <td>{rv.user?.name} ({rv.user?.email})</td>
                    <td>{rv.rating} ⭐</td>
                    <td style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{rv.comment}</td>
                    <td style={{ textTransform: 'capitalize' }}>{rv.status}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{ background: '#10b981', color: '#fff' }}
                          onClick={async () => {
                            try {
                              await apiService.updateReviewStatus(rv._id, 'approved')
                              setReviews(prev => prev.map(r => r._id === rv._id ? { ...r, status: 'approved' } : r))
                              toast.success('Review approved')
                            } catch (err) {
                              toast.error('Failed to approve')
                            }
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn"
                          style={{ background: '#ef4444', color: '#fff' }}
                          onClick={async () => {
                            try {
                              await apiService.updateReviewStatus(rv._id, 'rejected')
                              setReviews(prev => prev.map(r => r._id === rv._id ? { ...r, status: 'rejected' } : r))
                              toast.success('Review rejected')
                            } catch (err) {
                              toast.error('Failed to reject')
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default AdminReviews