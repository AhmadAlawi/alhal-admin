import React, { useEffect, useState } from 'react'
import { FiEdit2, FiLock, FiPlus, FiRefreshCw, FiShield, FiTrash2 } from 'react-icons/fi'
import rbacService, { unwrapData } from '../../services/rbacService'
import { useTranslation } from '../../hooks/useTranslation'
import './Rbac.css'

const SCOPES = [
  { value: '', labelKey: 'rbac.allScopes' },
  { value: 'government', labelKey: 'rbac.scopeGovernment' },
  { value: 'platform', labelKey: 'rbac.scopePlatform' },
  { value: 'market', labelKey: 'rbac.scopeMarket' },
]

function scopeBadgeClass(scope) {
  const s = (scope || '').toLowerCase()
  if (s === 'platform') return 'platform'
  if (s === 'government') return 'government'
  return 'market'
}

const RbacRoles = () => {
  const { t } = useTranslation()
  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [scopeFilter, setScopeFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [matrixRole, setMatrixRole] = useState(null)
  const [selectedPermIds, setSelectedPermIds] = useState([])
  const [form, setForm] = useState({ roleName: '', description: '', scope: 'government' })

  const loadRoles = async () => {
    const res = await rbacService.getRoles(scopeFilter || undefined)
    const data = unwrapData(res)
    setRoles(Array.isArray(data) ? data : [])
  }

  const loadPermissions = async () => {
    const res = await rbacService.getPermissions()
    const data = unwrapData(res)
    setAllPermissions(Array.isArray(data) ? data : [])
  }

  const load = async () => {
    try {
      setLoading(true)
      await Promise.all([loadRoles(), loadPermissions()])
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [scopeFilter])

  const openCreate = () => {
    setForm({ roleName: '', description: '', scope: 'government' })
    setModal('create')
  }

  const openEdit = (role) => {
    setForm({
      id: role.roleId ?? role.id,
      roleName: role.roleName || '',
      description: role.description || '',
      scope: role.scope || 'government',
      isSystem: role.isSystem,
    })
    setModal('edit')
  }

  const openMatrix = (role) => {
    const codes = role.permissionCodes || []
    const ids = allPermissions
      .filter((p) => codes.includes(p.code))
      .map((p) => p.permissionId ?? p.id)
    setSelectedPermIds(ids)
    setMatrixRole(role)
  }

  const togglePerm = (id) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const saveRole = async (e) => {
    e.preventDefault()
    try {
      if (modal === 'create') {
        await rbacService.createRole({
          roleName: form.roleName,
          description: form.description || undefined,
          scope: form.scope,
        })
      } else {
        await rbacService.updateRole(form.id, {
          roleName: form.isSystem ? undefined : form.roleName,
          description: form.description || undefined,
          scope: form.scope,
        })
      }
      setModal(null)
      loadRoles()
    } catch (err) {
      alert(err.message)
    }
  }

  const saveMatrix = async () => {
    try {
      const id = matrixRole.roleId ?? matrixRole.id
      await rbacService.setRolePermissions(id, selectedPermIds)
      setMatrixRole(null)
      loadRoles()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (role) => {
    if (role.isSystem) return
    if (!window.confirm(t('rbac.confirmDeleteRole'))) return
    try {
      await rbacService.deleteRole(role.roleId ?? role.id)
      loadRoles()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p>{t('common.loading')}</p>

  return (
    <>
      <div className="rbac-toolbar">
        <button type="button" className="rbac-btn primary" onClick={openCreate}>
          <FiPlus /> {t('rbac.addRole')}
        </button>
        <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {t(s.labelKey)}
            </option>
          ))}
        </select>
        <button type="button" className="rbac-btn" onClick={load}>
          <FiRefreshCw /> {t('common.refresh')}
        </button>
      </div>

      <div className="rbac-table-wrap">
        <table className="rbac-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('rbac.roleName')}</th>
              <th>{t('rbac.scope')}</th>
              <th>{t('rbac.permissionsCount')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const id = role.roleId ?? role.id
              const codes = role.permissionCodes || []
              return (
                <tr key={id}>
                  <td>{id}</td>
                  <td>
                    {role.isSystem && <FiLock className="rbac-lock" />}{' '}
                    {role.roleName}
                  </td>
                  <td>
                    <span className={`rbac-badge ${scopeBadgeClass(role.scope)}`}>
                      {role.scope}
                    </span>
                  </td>
                  <td>{codes.length}</td>
                  <td className="rbac-actions-cell">
                    <button type="button" className="rbac-btn" onClick={() => openMatrix(role)}>
                      <FiShield /> {t('rbac.permissionsMatrix')}
                    </button>
                    <button type="button" className="rbac-btn" onClick={() => openEdit(role)}>
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      className="rbac-btn danger"
                      disabled={role.isSystem}
                      onClick={() => handleDelete(role)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="rbac-modal-overlay" onClick={() => setModal(null)}>
          <div className="rbac-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal === 'create' ? t('rbac.addRole') : t('rbac.editRole')}</h3>
            <form onSubmit={saveRole}>
              <div className="rbac-form-group">
                <label>{t('rbac.roleName')}</label>
                <input
                  value={form.roleName}
                  onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                  disabled={form.isSystem}
                  required
                />
              </div>
              <div className="rbac-form-group">
                <label>{t('common.description')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="rbac-form-group">
                <label>{t('rbac.scope')}</label>
                <select
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                >
                  <option value="government">{t('rbac.scopeGovernment')}</option>
                  <option value="platform">{t('rbac.scopePlatform')}</option>
                  <option value="market">{t('rbac.scopeMarket')}</option>
                </select>
              </div>
              <div className="rbac-modal-actions">
                <button type="button" className="rbac-btn" onClick={() => setModal(null)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="rbac-btn primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {matrixRole && (
        <div className="rbac-modal-overlay" onClick={() => setMatrixRole(null)}>
          <div className="rbac-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h3>
              {t('rbac.permissionsMatrix')}: {matrixRole.roleName}
            </h3>
            <div className="rbac-perm-matrix">
              {allPermissions.map((p) => {
                const pid = p.permissionId ?? p.id
                return (
                  <div key={pid} className="rbac-perm-row">
                    <input
                      type="checkbox"
                      id={`perm-${pid}`}
                      checked={selectedPermIds.includes(pid)}
                      onChange={() => togglePerm(pid)}
                    />
                    <label htmlFor={`perm-${pid}`}>
                      {p.nameAr}{' '}
                      <span className="rbac-code" title={p.code}>
                        ({p.code})
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
            <div className="rbac-modal-actions">
              <button type="button" className="rbac-btn" onClick={() => setMatrixRole(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="rbac-btn primary" onClick={saveMatrix}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default RbacRoles
