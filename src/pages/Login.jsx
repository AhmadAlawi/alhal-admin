import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiMail, FiLock, FiLogIn, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import authService from '../services/authService'
import { useTranslation } from '../hooks/useTranslation'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    EmailOrPhone: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.EmailOrPhone || !formData.password) {
        setError(t('login.fillAllFields'))
        setLoading(false)
        return
      }

      const response = await authService.login({
        EmailOrPhone: formData.EmailOrPhone,
        password: formData.password
      })

       const isSuccess = response?.success === true || response?.data?.success === true
       
       if (isSuccess && localStorage.getItem('authToken')) {
         const from = location.state?.from?.pathname || '/dashboard'
         navigate(from, { replace: true })
       } else {
         setError(t('login.loginFailed'))
       }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || t('login.loginFailedRetry'))
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
            <h1>{t('login.adminDashboard')}</h1>
            <p>{t('login.signInToContinue')}</p>
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
                 {t('login.emailOrPhone')}
               </label>
               <input
                 type="text"
                 id="EmailOrPhone"
                 name="EmailOrPhone"
                 value={formData.EmailOrPhone}
                 onChange={handleChange}
                 placeholder={t('login.emailPlaceholder')}
                 required
                 disabled={loading}
                 autoComplete="username"
               />
             </div>

            <div className="form-group">
              <label htmlFor="password">
                <FiLock />
                {t('login.password')}
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('login.passwordPlaceholder')}
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
                  {t('login.signingIn')}
                </>
              ) : (
                <>
                  <FiLogIn />
                  {t('login.signIn')}
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {t('login.forgotPasswordLink')}{' '}
              <a href="#reset">{t('login.resetLink')}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
