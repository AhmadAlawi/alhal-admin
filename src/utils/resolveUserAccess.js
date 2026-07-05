import { decodeJwtPayload, extractAccessFromToken } from './jwtUtils'

const unwrapData = (response) => response?.data?.data ?? response?.data ?? response

export function normalizeRoleNames(roles) {
  if (!Array.isArray(roles)) return []
  return roles
    .map((role) => {
      if (typeof role === 'string') return role.trim()
      if (!role || typeof role !== 'object') return ''
      return String(role.roleName ?? role.RoleName ?? role.name ?? role.Name ?? '').trim()
    })
    .filter(Boolean)
}

export function normalizePermissionCodes(permissions) {
  if (!Array.isArray(permissions)) return []
  return permissions
    .map((perm) => {
      if (typeof perm === 'string') return perm.trim()
      if (!perm || typeof perm !== 'object') return ''
      return String(perm.code ?? perm.Code ?? perm.permissionCode ?? perm.PermissionCode ?? '').trim()
    })
    .filter(Boolean)
}

/**
 * Resolve roles/permissions from RBAC (DB) first, JWT claims as fallback only.
 */
export async function resolveUserAccess({ token, userId, fetchRbac }) {
  let roles = []
  let permissions = []
  let resolvedUserId = userId ?? null

  if (fetchRbac) {
    try {
      const response = await fetchRbac()
      const data = unwrapData(response)
      if (data) {
        if (data.userId != null) resolvedUserId = data.userId
        roles = normalizeRoleNames(data.roles)
        permissions = normalizePermissionCodes(data.permissions)
      }
    } catch (err) {
      console.warn('RBAC access lookup failed, falling back to JWT', err)
    }
  }

  if (!roles.length && token) {
    const fromJwt = extractAccessFromToken(token)
    roles = fromJwt.roles
    if (!permissions.length) permissions = fromJwt.permissions
    if (resolvedUserId == null) {
      const payload = decodeJwtPayload(token)
      resolvedUserId = payload?.sub != null ? String(payload.sub) : null
    }
  }

  return {
    userId: resolvedUserId,
    roles: [...new Set(roles)],
    permissions: [...new Set(permissions)],
  }
}
