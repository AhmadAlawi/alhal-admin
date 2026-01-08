import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import authService from '../../services/authService'
import './ProtectedRoute.css'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let timeoutId = null
    
    const checkAuth = async () => {
      try {
        // Simple token check - no API call to prevent loops
        const hasToken = authService.isAuthenticated()
        
        if (!hasToken) {
          if (isMounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
          }
          return
        }
        
        // Only verify token if we haven't checked recently (prevent loops)
        const lastCheck = sessionStorage.getItem('authLastCheck')
        const now = Date.now()
        const checkCooldown = 30000 // 30 seconds cooldown
        
        if (lastCheck && (now - parseInt(lastCheck)) < checkCooldown) {
          // Use cached result to prevent API loops
          if (isMounted) {
            setIsAuthenticated(true)
            setIsLoading(false)
          }
          return
        }
        
        // Verify token by calling /api/auth/me (with timeout)
        try {
          const userResponse = await Promise.race([
            authService.getCurrentUser(),
            new Promise((_, reject) => 
              timeoutId = setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ])
          
          if (timeoutId) clearTimeout(timeoutId)
          
          // Extract user info from response if needed
          if (userResponse?.data?.userId || userResponse?.data?.data?.userId) {
            const userId = userResponse.data.userId || userResponse.data.data.userId
            if (userId && !localStorage.getItem('userId')) {
              localStorage.setItem('userId', userId.toString())
            }
          }
          
          sessionStorage.setItem('authLastCheck', now.toString())
          
          if (isMounted) {
            setIsAuthenticated(true)
            setIsLoading(false)
          }
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId)
          
          // On error, just check token existence (don't clear - might be network issue)
          if (isMounted) {
            setIsAuthenticated(hasToken) // Use token existence as fallback
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
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, []) // Only run once on mount - no re-checks

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

