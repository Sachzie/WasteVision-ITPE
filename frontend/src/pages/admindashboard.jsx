import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { apiService } from '../services/api'
import AdminNav from '../components/AdminNav'
import { getUser } from '../services/auth'
import '../assets/css/admin.css'

function AdminDashboard({ isAuthenticated, setIsAuthenticated }) {
  const [users, setUsers] = useState([])
  const [activities, setActivities] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [usersRes, activitiesRes, reviewsRes] = await Promise.all([
          apiService.getAllUsers(),
          apiService.getAllActivities(),
          apiService.getAllReviews()
        ])
        setUsers(usersRes.data.users || [])
        setActivities(activitiesRes.data.activities || [])
        setReviews(reviewsRes.data.reviews || [])
      } catch (error) {
        console.error('Error fetching admin data:', error)
        toast.error('Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }
    if (isAuthenticated) fetchData()
  }, [isAuthenticated])

  const currentUser = getUser()

  return (
    <div className="admin-container admin-large">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <section className="admin-hero">
        <div className="admin-hero-content">
          <h1>Admin Dashboard</h1>
          <p>System oversight, user management, and detection monitoring</p>
        </div>
      </section>

      <AdminNav />

      <section className="admin-stats">
        <div className="admin-stats-grid">
          <div className="admin-card">
            <h3>Total Users</h3>
            <p className="admin-number">{users.length}</p>
            <p className="admin-desc">Registered accounts</p>
          </div>
          <div className="admin-card">
            <h3>Total Detections</h3>
            <p className="admin-number">{activities.length}</p>
            <p className="admin-desc">System-wide activity</p>
          </div>
        </div>
      </section>

      <section className="admin-content">
        <div className="admin-card">
          <div className="admin-card-header"><h2>Overview</h2></div>
          <div className="admin-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <div className="admin-card">
                <h3>Total Users</h3>
                <p className="admin-number">{users.length}</p>
                <p className="admin-desc">Registered accounts</p>
              </div>
              <div className="admin-card">
                <h3>Total Detections</h3>
                <p className="admin-number">{activities.length}</p>
                <p className="admin-desc">System-wide activity</p>
              </div>
              <div className="admin-card">
                <h3>Total Reviews</h3>
                <p className="admin-number">{reviews.length}</p>
                <p className="admin-desc">User feedback</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default AdminDashboard