/**
 * Decode JWT payload (no signature verification — client-side hints only).
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

const ROLE_CLAIM_KEYS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role',
]

const PERM_CLAIM_KEYS = ['perm', 'permission', 'permissions']

function collectClaimValues(payload, keys) {
  if (!payload) return []
  const values = []
  for (const key of keys) {
    if (payload[key] == null) continue
    const v = payload[key]
    if (Array.isArray(v)) values.push(...v)
    else values.push(v)
  }
  return values.map((s) => String(s).trim()).filter(Boolean)
}

/**
 * Extract roles and permissions from JWT access token.
 */
export function extractAccessFromToken(token) {
  const payload = decodeJwtPayload(token)
  const roles = collectClaimValues(payload, ROLE_CLAIM_KEYS)
  const permissions = collectClaimValues(payload, PERM_CLAIM_KEYS)
  return {
    roles: [...new Set(roles)],
    permissions: [...new Set(permissions)],
  }
}

export function persistAccessToStorage({ roles, permissions, userId }) {
  const userStr = localStorage.getItem('user')
  let user = {}
  if (userStr) {
    try {
      user = JSON.parse(userStr)
    } catch {
      user = {}
    }
  }
  user.roles = roles
  user.permissions = permissions
  if (userId != null) user.userId = userId
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem(
    'userAccess',
    JSON.stringify({ roles, permissions, updatedAt: Date.now() })
  )
}

export function readStoredAccess() {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return {
        roles: user.roles || [],
        permissions: user.permissions || [],
        userId: user.userId,
      }
    } catch {
      /* fall through */
    }
  }
  const accessStr = localStorage.getItem('userAccess')
  if (accessStr) {
    try {
      const access = JSON.parse(accessStr)
      return {
        roles: access.roles || [],
        permissions: access.permissions || [],
      }
    } catch {
      /* fall through */
    }
  }
  return { roles: [], permissions: [] }
}
