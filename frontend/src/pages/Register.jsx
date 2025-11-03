import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { apiService } from '../services/api'
import '../assets/css/auth.css'
import animation  from '../assets/vid/animation.mp4'

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Full name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/[a-zA-Z]/, 'Password must contain at least one letter')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  agreeToTerms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
})

function Register() {
  const navigate = useNavigate()

  const handleSubmit = async (values, { setSubmitting }) => {
    const loadingToast = toast.loading('Creating your account...')

    try {
      await apiService.register({
        name: values.name,
        email: values.email,
        password: values.password
      })
      
      toast.success('Registration successful! Redirecting to login...', {
        id: loadingToast,
        duration: 2000,
      })
      
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.'
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
            <h2>Create Account</h2>
            <p>Sign up to start classifying waste with AI</p>
          </div>
          
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              agreeToTerms: false,
              showPassword: false,
              showConfirmPassword: false
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="auth-form">
                {/* ...existing form fields... */}
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <Field
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter your full name"
                      className={`form-input ${
                        touched.name 
                          ? errors.name 
                            ? 'input-error' 
                            : 'input-success'
                          : ''
                      }`}
                    />
                    {touched.name && (
                      <span className="input-icon">
                        {errors.name ? (
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
                  <ErrorMessage name="name" component="div" className="error-message" />
                </div>

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
                            placeholder="At least 6 characters"
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <Field name="confirmPassword">
                      {({ field, form }) => (
                        <div className="password-wrapper">
                          <input
                            {...field}
                            type={form.values.showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            placeholder="Re-enter your password"
                            className={`form-input ${
                              touched.confirmPassword 
                                ? errors.confirmPassword 
                                  ? 'input-error' 
                                  : 'input-success'
                                : ''
                            }`}
                          />
                          {touched.confirmPassword && (
                            <span className="input-icon password-icon">
                              {errors.confirmPassword ? (
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
                            onClick={() => form.setFieldValue('showConfirmPassword', !form.values.showConfirmPassword)}
                          >
                            {form.values.showConfirmPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      )}
                    </Field>
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className="error-message" />
                </div>

                <div className="terms-agreement">
                  <label className="checkbox-label">
                    <Field type="checkbox" name="agreeToTerms" />
                    <span>
                      I agree to the <Link to="/terms" className="inline-link">Terms of Service</Link> and <Link to="/privacy" className="inline-link">Privacy Policy</Link>
                    </span>
                  </label>
                  <ErrorMessage name="agreeToTerms" component="div" className="error-message" />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </Form>
            )}
          </Formik>
          
          <div className="auth-footer">
            <p>
              Already have an account? 
              <Link to="/login" className="text-link-primary"> Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register