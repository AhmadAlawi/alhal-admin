import React, { useState } from 'react'
import { FiRefreshCw, FiSearch, FiUser } from 'react-icons/fi'
import rbacService, { unwrapData } from '../../services/rbacService'
import { useTranslation } from '../../hooks/useTranslation'
import './Rbac.css'

const RbacUserAccess = () => {
  const { t } = useTranslation()
  const [userIdInput, setUserIdInput] = useState('')
  const [access, setAccess] = useState(null)
  const [allRoles, setAllRoles] = useState([])
  const [selectedRoleIds, setSelectedRoleIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchAccess = async () => {
    const userId = userIdInput.trim()
    if (!userId) return
    try {
      setLoading(true)
      const [rolesRes, accessRes] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getUserAccess(userId),
      ])
      const rolesCatalog = unwrapData(rolesRes)
      const data = unwrapData(accessRes)
      const catalog = Array.isArray(rolesCatalog) ? rolesCatalog : []
      setAllRoles(catalog)
      setAccess(data)

      let ids = []
      if (Array.isArray(data?.roleIds)) {
        ids = data.roleIds
      } else if (Array.isArray(data?.roles)) {
        ids = data.roles
          .map((r) => (typeof r === 'object' ? r.roleId ?? r.id : null))
          .filter(Boolean)
        if (!ids.length) {
          const names = data.roles.map((r) => (typeof r === 'string' ? r : r.roleName))
          ids = catalog
            .filter((r) => names.includes(r.roleName))
            .map((r) => r.roleId ?? r.id)
        }
      }
      setSelectedRoleIds(ids)
    } catch (err) {
      alert(err.message)
      setAccess(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    await fetchAccess()
  }

  const toggleRole = (roleId) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const saveRoles = async () => {
    const userId = userIdInput.trim()
    if (!userId) return
    try {
      setSaving(true)
      await rbacService.setUserRoles(userId, selectedRoleIds)
      alert(t('rbac.reloginReminder'))
      await fetchAccess()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const roleNames =
    access?.roles?.map((r) => (typeof r === 'string' ? r : r.roleName)) || []
  const effectivePerms = access?.permissions || []

  return (
    <>
      <form className="rbac-toolbar" onSubmit={handleSearch}>
        <input
          type="number"
          min="1"
          placeholder={t('rbac.userIdPlaceholder')}
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          style={{ maxWidth: 200 }}
        />
        <button type="submit" className="rbac-btn primary" disabled={loading}>
          <FiSearch /> {t('common.search')}
        </button>
        <button
          type="button"
          className="rbac-btn"
          onClick={fetchAccess}
          disabled={loading || !userIdInput.trim()}
        >
          <FiRefreshCw /> {t('common.refresh')}
        </button>
      </form>

      {loading && <p>{t('common.loading')}</p>}

      {access && !loading && (
        <div className="rbac-user-access-panel">
          <div className="rbac-table-wrap" style={{ marginBottom: '1.5rem' }}>
            <h3>
              <FiUser /> {t('rbac.currentAccess')} — {access.userId ?? userIdInput}
            </h3>
            <p>
              <strong>{t('rbac.roles')}:</strong>{' '}
              {roleNames.length ? roleNames.join(', ') : t('common.none')}
            </p>
            <p>
              <strong>{t('rbac.effectivePermissions')}:</strong>
            </p>
            <ul className="rbac-perm-list">
              {effectivePerms.map((code) => (
                <li key={code}>
                  <span className="rbac-code">{code}</span>
                </li>
              ))}
              {!effectivePerms.length && <li>{t('common.none')}</li>}
            </ul>
          </div>

          <h3>{t('rbac.assignRoles')}</h3>
          <p className="text-muted">{t('rbac.assignRolesHint')}</p>
          <div className="rbac-perm-matrix">
            {allRoles.map((role) => {
              const id = role.roleId ?? role.id
              const scopeClass =
                (role.scope || '').toLowerCase() === 'platform'
                  ? 'platform'
                  : role.scope === 'government'
                    ? 'government'
                    : 'market'
              return (
                <div key={id} className="rbac-perm-row">
                  <input
                    type="checkbox"
                    id={`role-${id}`}
                    checked={selectedRoleIds.includes(id)}
                    onChange={() => toggleRole(id)}
                  />
                  <label htmlFor={`role-${id}`}>
                    {role.roleName}{' '}
                    <span className={`rbac-badge ${scopeClass}`}>{role.scope}</span>
                  </label>
                </div>
              )
            })}
          </div>
          <div className="rbac-toolbar" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="rbac-btn primary"
              onClick={saveRoles}
              disabled={saving}
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default RbacUserAccess
