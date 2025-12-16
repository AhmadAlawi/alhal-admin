import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import authService from '../../services/authService'
import './ProtectedRoute.css'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true // Prevent state updates if component unmounts
    
    const checkAuth = async () => {
      try {
        // Check if token exists in localStorage
        const hasToken = authService.isAuthenticated()
        
        if (!hasToken) {
          if (isMounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
          }
          return
        }
        
        // Verify token by calling /api/auth/me
        try {
          const userResponse = await authService.getCurrentUser()
          
          // Extract user info from response if needed
          if (userResponse?.data?.userId || userResponse?.data?.data?.userId) {
            const userId = userResponse.data.userId || userResponse.data.data.userId
            if (userId && !localStorage.getItem('userId')) {
              localStorage.setItem('userId', userId.toString())
            }
          }
          
          if (isMounted) {
            setIsAuthenticated(true)
            setIsLoading(false)
          }
        } catch (error) {
          // Token might be invalid or expired
          // Clear invalid token
          authService.logout()
          if (isMounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
        }
      }
    }

    checkAuth()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [location.pathname]) // Re-check only when pathname changes

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

