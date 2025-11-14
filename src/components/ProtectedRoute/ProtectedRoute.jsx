import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import authService from '../../services/authService'
import './ProtectedRoute.css'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists in localStorage
        const hasToken = authService.isAuthenticated()
        console.log('ProtectedRoute: Checking authentication, hasToken:', hasToken)
        
        if (!hasToken) {
          console.log('ProtectedRoute: No token found, user not authenticated')
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
        // Verify token by calling /api/auth/me
        // This will send the token as a query parameter
        try {
          console.log('ProtectedRoute: Validating token with /api/auth/me')
          const userResponse = await authService.getCurrentUser()
          console.log('ProtectedRoute: Token validated successfully', userResponse)
          
          // Extract user info from response if needed
          if (userResponse?.data?.userId || userResponse?.data?.data?.userId) {
            const userId = userResponse.data.userId || userResponse.data.data.userId
            if (userId && !localStorage.getItem('userId')) {
              localStorage.setItem('userId', userId.toString())
            }
          }
          
          setIsAuthenticated(true)
        } catch (error) {
          // Token might be invalid or expired
          console.error('ProtectedRoute: Token validation failed:', error)
          console.error('Error details:', {
            message: error.message,
            status: error.status
          })
          
          // Clear invalid token
          authService.logout()
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('ProtectedRoute: Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    // Show loading spinner or skeleton
    return (
      <div className="protected-route-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute

