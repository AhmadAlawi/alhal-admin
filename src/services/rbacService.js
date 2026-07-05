import apiClient from './api'

const BASE = '/api/admin/rbac'

export function unwrapData(response) {
  return response?.data?.data ?? response?.data ?? response
}

export const rbacService = {
  getMyAccess: (opts) => apiClient.get(`${BASE}/me/access`, {}, opts),

  getPermissions: () => apiClient.get(`${BASE}/permissions`),
  createPermission: (body) => apiClient.post(`${BASE}/permissions`, body),
  updatePermission: (id, body) => apiClient.put(`${BASE}/permissions/${id}`, body),
  deletePermission: (id) => apiClient.delete(`${BASE}/permissions/${id}`),

  getRoles: (scope) => apiClient.get(`${BASE}/roles`, scope ? { scope } : {}),
  getRole: (id) => apiClient.get(`${BASE}/roles/${id}`),
  createRole: (body) => apiClient.post(`${BASE}/roles`, body),
  updateRole: (id, body) => apiClient.put(`${BASE}/roles/${id}`, body),
  deleteRole: (id) => apiClient.delete(`${BASE}/roles/${id}`),
  setRolePermissions: (id, permissionIds) =>
    apiClient.put(`${BASE}/roles/${id}/permissions`, { permissionIds }),

  getUserAccess: (userId) => apiClient.get(`${BASE}/users/${userId}/access`),
  setUserRoles: (userId, roleIds) =>
    apiClient.put(`${BASE}/users/${userId}/roles`, { roleIds }),
}

export default rbacService
