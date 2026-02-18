import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { apiService } from '../services/api'
import { saveToken, saveUser } from '../services/auth'
import '../assets/css/auth.css'
import animation  from '../assets/vid/animation.mp4'

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
})

function Login({ setIsAuthenticated }) {
  const navigate = useNavigate()

  const handleSubmit = async (values, { setSubmitting }) => {
    const loadingToast = toast.loading('Logging in...')

    try {
      const response = await apiService.login(values)
      const { token, user } = response.data
      
      saveToken(token)
      saveUser(user)
      setIsAuthenticated(true)
      
      toast.success(`Welcome back, ${user.name}!`, {
        id: loadingToast,
        duration: 3000,
      })
      
      // If admin login is selected, ensure user is admin
      if (values.adminLogin) {
        if (user.role === 'admin') {
          navigate('/admin')
        } else {
          toast.error('Your account is not an admin', { duration: 3000 })
          navigate('/dashboard')
        }
      } else {
        // Default redirect based on role
        if (user.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(errorMessage, {
        id: loadingToast,
        duration: 4000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-left">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="auth-video-bg"
        >
          <source src={animation} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay for better text readability */}
        <div className="auth-video-overlay"></div>
        
        <div className="auth-brand">
          <h1 className="brand-title">WasteVision</h1>
          <p className="brand-subtitle">Smart Waste Classification System</p>
        </div>
      </div>
      
      <div className="auth-right">
        {/* Home Button */}
        <Link to="/" className="btn-home">
          <i className="fas fa-home"></i>
          <span>Back to Home</span>
        </Link>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to continue</p>
          </div>
          
          <Formik
            initialValues={{
              email: '',
              password: '',
              rememberMe: false,
              adminLogin: false
            }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ errors, touched, isSubmitting, values }) => (
              <Form className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      className={`form-input ${
                        touched.email 
                          ? errors.email 
                            ? 'input-error' 
                            : 'input-success'
                          : ''
                      }`}
                    />
                    {touched.email && (
                      <span className="input-icon">
                        {errors.email ? (
                          <svg className="icon-error" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="currentColor"/>
                          </svg>
                        ) : (
                          <svg className="icon-success" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z" fill="currentColor"/>
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                  <ErrorMessage name="email" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <Field name="password">
                      {({ field, form }) => (
                        <div className="password-wrapper">
                          <input
                            {...field}
                            type={form.values.showPassword ? 'text' : 'password'}
                            id="password"
                            placeholder="Enter your password"
                            className={`form-input ${
                              touched.password 
                                ? errors.password 
                                  ? 'input-error' 
                                  : 'input-success'
                                : ''
                            }`}
                          />
                          {touched.password && (
                            <span className="input-icon password-icon">
                              {errors.password ? (
                                <svg className="icon-error" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="currentColor"/>
                                </svg>
                              ) : (
                                <svg className="icon-success" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z" fill="currentColor"/>
                                </svg>
                              )}
                            </span>
                          )}
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => form.setFieldValue('showPassword', !form.values.showPassword)}
                          >
                            {form.values.showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      )}
                    </Field>
                  </div>
                  <ErrorMessage name="password" component="div" className="error-message" />
                </div>
                
                <div className="form-options">
                  <label className="checkbox-label">
                    <Field type="checkbox" name="rememberMe" />
                    <span>Remember me</span>
                  </label>
                  <label className="checkbox-label" style={{ marginLeft: '12px' }}>
                    <Field type="checkbox" name="adminLogin" />
                    <span>Admin login</span>
                  </label>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </Form>
            )}
          </Formik>
          
          <div className="auth-footer">
            <p>
              Don't have an account? 
              <Link to="/register" className="text-link-primary"> Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login