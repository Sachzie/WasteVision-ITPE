import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AdminNav from '../components/AdminNav'
import { apiService } from '../services/api'
import '../assets/css/admin.css'

function AdminUsers({ isAuthenticated, setIsAuthenticated }) {
  const [users, setUsers] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [usersRes, activitiesRes] = await Promise.all([
          apiService.getAllUsers(),
          apiService.getAllActivities()
        ])
        setUsers(usersRes.data.users || [])
        setActivities(activitiesRes.data.activities || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    if (isAuthenticated) fetchData()
  }, [isAuthenticated])

  const filteredUsers = users.filter(u => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="admin-container admin-large">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />

      <section className="admin-hero">
        <div className="admin-hero-content">
          <h1>Admin • Users</h1>
          <p>Manage user accounts and overview activity counts</p>
        </div>
      </section>

      <AdminNav />

      <section className="admin-content">
        <div className="admin-toolbar">
          <div className="admin-toolbar-left">
            <h2>Users</h2>
          </div>
          <div className="admin-toolbar-right">
            <input
              type="text"
              placeholder="Search name, email, role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="admin-search"
            />
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-body">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Avatar</th>
                  <th>Joined</th>
                  <th>Detections</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const detCount = activities.filter(a => a.user?._id === u._id).length
                  return (
                    <tr key={u._id || u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                      <td>
                        {u.avatar?.url ? (
                          <img src={u.avatar.url} alt="avatar" className="admin-avatar" />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td>{detCount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default AdminUsers