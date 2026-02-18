import { NavLink } from 'react-router-dom'
import '../assets/css/admin.css'

function AdminNav() {
  return (
    <div className="admin-subnav" style={{ padding: '12px 20px' }}>
      <nav className="admin-subnav-links" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'admin-subnav-link active' : 'admin-subnav-link'}>
          Overview
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-subnav-link active' : 'admin-subnav-link'}>
          Users
        </NavLink>
        <NavLink to="/admin/history" className={({ isActive }) => isActive ? 'admin-subnav-link active' : 'admin-subnav-link'}>
          Detection History
        </NavLink>
        <NavLink to="/admin/reviews" className={({ isActive }) => isActive ? 'admin-subnav-link active' : 'admin-subnav-link'}>
          Reviews
        </NavLink>
      </nav>
    </div>
  )
}

export default AdminNav