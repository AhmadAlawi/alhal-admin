import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import authService from '../services/authService'
import rbacService, { unwrapData } from '../services/rbacService'
import {
  extractAccessFromToken,
  persistAccessToStorage,
  readStoredAccess,
} from '../utils/jwtUtils'
import {
  canAccessAdmin,
  canAccessGov,
  canAccessLegacyAdmin,
  hasPermission,
  hasRole,
  isSuperAdmin,
} from '../utils/accessControl'

const AccessContext = createContext(null)

function readInitialAccess() {
  if (!authService.isAuthenticated()) {
    return { roles: [], permissions: [], userId: null, hasCache: false }
  }
  const token = localStorage.getItem('authToken')
  if (token) {
    const fromJwt = extractAccessFromToken(token)
    if (fromJwt.roles.length || fromJwt.permissions.length) {
      return { ...fromJwt, userId: authService.getUserId(), hasCache: true }
    }
  }
  const stored = readStoredAccess()
  const hasCache = !!(stored.roles?.length || stored.permissions?.length)
  return {
    roles: stored.roles || [],
    permissions: stored.permissions || [],
    userId: stored.userId ?? authService.getUserId(),
    hasCache,
  }
}

export function AccessProvider({ children }) {
  const initial = readInitialAccess()
  const [roles, setRoles] = useState(initial.roles)
  const [permissions, setPermissions] = useState(initial.permissions)
  const [userId, setUserId] = useState(initial.userId)
  const [loading, setLoading] = useState(
    () => authService.isAuthenticated() && !initial.hasCache
  )

  const applyAccess = useCallback((nextRoles, nextPerms, nextUserId) => {
    setRoles(nextRoles)
    setPermissions(nextPerms)
    if (nextUserId != null) setUserId(nextUserId)
    persistAccessToStorage({
      roles: nextRoles,
      permissions: nextPerms,
      userId: nextUserId ?? authService.getUserId(),
    })
  }, [])

  const refreshAccess = useCallback(async (options = {}) => {
    const { silent = false } = options

    if (!authService.isAuthenticated()) {
      setRoles([])
      setPermissions([])
      setUserId(null)
      setLoading(false)
      return
    }

    if (!silent && !roles.length && !permissions.length) {
      setLoading(true)
    }

    const token = localStorage.getItem('authToken')
    let nextRoles = roles
    let nextPerms = permissions
    let nextUserId = authService.getUserId()

    if (token) {
      const fromJwt = extractAccessFromToken(token)
      if (fromJwt.roles.length) nextRoles = fromJwt.roles
      if (fromJwt.permissions.length) nextPerms = fromJwt.permissions
    }

    try {
      const response = await rbacService.getMyAccess()
      const data = unwrapData(response)
      if (data) {
        if (data.userId != null) nextUserId = data.userId
        if (Array.isArray(data.roles)) nextRoles = data.roles
        if (Array.isArray(data.permissions)) nextPerms = data.permissions
      }
    } catch (err) {
      console.warn('Could not refresh access from RBAC API, using JWT/localStorage', err)
    }

    applyAccess(nextRoles, nextPerms, nextUserId)
    setLoading(false)
  }, [applyAccess, roles, permissions])

  const refreshRef = useRef(refreshAccess)
  refreshRef.current = refreshAccess

  useEffect(() => {
    const onAuthChange = () => {
      if (!authService.isAuthenticated()) {
        setRoles([])
        setPermissions([])
        setUserId(null)
        setLoading(false)
        return
      }
      const cached = readInitialAccess()
      if (cached.hasCache) {
        setRoles(cached.roles)
        setPermissions(cached.permissions)
        setLoading(false)
      }
      refreshRef.current({ silent: cached.hasCache })
    }

    window.addEventListener('auth-login', onAuthChange)
    window.addEventListener('auth-logout', onAuthChange)

    if (authService.isAuthenticated()) {
      refreshRef.current({ silent: initial.hasCache })
    } else {
      setLoading(false)
    }

    return () => {
      window.removeEventListener('auth-login', onAuthChange)
      window.removeEventListener('auth-logout', onAuthChange)
    }
  }, [])

  const value = {
    roles,
    permissions,
    userId,
    loading,
    refreshAccess,
    hasRole: (name) => hasRole(roles, name),
    hasPermission: (code) => hasPermission(permissions, code),
    isSuperAdmin: () => isSuperAdmin(roles),
    canAccessAdmin: () => canAccessAdmin(permissions, roles),
    canAccessGov: (code) => canAccessGov(permissions, roles, code),
    canAccessLegacyAdmin: () => canAccessLegacyAdmin(roles),
  }

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) {
    throw new Error('useAccess must be used within AccessProvider')
  }
  return ctx
}

export default AccessContext
