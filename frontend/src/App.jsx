import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/admindashboard'
import AdminUsers from './pages/AdminUsers'
import AdminHistory from './pages/AdminHistory'
import AdminReviews from './pages/AdminReviews'
import History from './pages/History'
import Tips from './pages/Tips'
import Profile from './pages/Profile'
import { checkAuth, getUser } from './services/auth'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth()
      setIsAuthenticated(authenticated)
      setLoading(false)
    }
    verifyAuth()
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  // Protected routes - requires authentication
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />
  }

  // User-only routes - restrict admins and redirect them to admin panel
  const UserOnlyRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    const user = getUser()
    const isAdmin = user?.role === 'admin'
    return isAdmin ? <Navigate to="/admin" replace /> : children
  }

  // Public routes - redirect authenticated users by role
  const PublicRoute = ({ children }) => {
    if (!isAuthenticated) return children
    const user = getUser()
    const isAdmin = user?.role === 'admin'
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
  }

  // Admin routes - requires authentication and admin role
  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    const user = getUser()
    const isAdmin = user?.role === 'admin'
    return isAdmin ? children : <Navigate to="/dashboard" replace />
  }

  return (
    <Router>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/about" element={<About isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login setIsAuthenticated={setIsAuthenticated} />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/dashboard" element={
          <UserOnlyRoute>
            <Dashboard isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </UserOnlyRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsers isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </AdminRoute>
        } />
        <Route path="/admin/history" element={
          <AdminRoute>
            <AdminHistory isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </AdminRoute>
        } />
        <Route path="/admin/reviews" element={
          <AdminRoute>
            <AdminReviews isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </AdminRoute>
        } />
        <Route path="/history" element={
          <UserOnlyRoute>
            <History isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </UserOnlyRoute>
        } />
        <Route path="/tips" element={
          <UserOnlyRoute>
            <Tips isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </UserOnlyRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App