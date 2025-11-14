import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiMail, FiLock, FiLogIn, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import authService from '../services/authService'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    EmailOrPhone: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [navigate, location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form
      if (!formData.EmailOrPhone || !formData.password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      // Call login API
      const response = await authService.login({
        EmailOrPhone: formData.EmailOrPhone,
        password: formData.password
      })

       // Check if login was successful
       // The authService.login() already handles storing token and user data
       // Response structure: { success: true, data: { success: true, data: { accessToken, userId, ... } } }
       const isSuccess = response?.success === true || response?.data?.success === true
       
       if (isSuccess && localStorage.getItem('authToken')) {
         // Redirect to dashboard or previous page
         const from = location.state?.from?.pathname || '/dashboard'
         navigate(from, { replace: true })
       } else {
         setError('Login failed. Please check your credentials.')
       }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <FiLogIn />
            </div>
            <h1>Admin Dashboard</h1>
            <p>Sign in to continue</p>
          </div>

          {error && (
            <div className="error-message">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
             <div className="form-group">
               <label htmlFor="EmailOrPhone">
                 <FiMail />
                 Email or Phone
               </label>
               <input
                 type="text"
                 id="EmailOrPhone"
                 name="EmailOrPhone"
                 value={formData.EmailOrPhone}
                 onChange={handleChange}
                 placeholder="Enter your email or phone number"
                 required
                 disabled={loading}
                 autoComplete="username"
               />
             </div>

            <div className="form-group">
              <label htmlFor="password">
                <FiLock />
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <FiLogIn />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Forgot your password? <a href="#reset">Reset it here</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

