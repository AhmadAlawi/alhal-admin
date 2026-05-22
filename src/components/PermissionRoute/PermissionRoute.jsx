import React from 'react'
import { useAccess } from '../../contexts/AccessContext'
import {
  canAccessAdmin,
  canAccessGov,
  canAccessLegacyAdmin,
} from '../../utils/accessControl'
import AccessDenied from '../AccessDenied/AccessDenied'
import './PermissionRoute.css'

/**
 * Route guard: superadmin bypasses all checks.
 * - permission: gov permission code
 * - legacyAdmin: admin or superadmin role
 * - rbacAdmin: platform.rbac.manage or superadmin
 */
const PermissionRoute = ({ children, permission, legacyAdmin, rbacAdmin }) => {
  const { roles, permissions, loading } = useAccess()
  const hasCachedAccess = roles.length > 0 || permissions.length > 0

  if (loading && !hasCachedAccess) {
    return (
      <div className="permission-route-loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  let allowed = false
  if (rbacAdmin) {
    allowed = canAccessAdmin(permissions, roles)
  } else if (legacyAdmin) {
    allowed = canAccessLegacyAdmin(roles)
  } else if (permission) {
    allowed = canAccessGov(permissions, roles, permission)
  } else {
    allowed = true
  }

  if (!allowed) {
    return <AccessDenied />
  }

  return children
}

export default PermissionRoute
