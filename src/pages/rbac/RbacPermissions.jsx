import React, { useEffect, useMemo, useState } from 'react'
import { FiEdit2, FiLock, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import rbacService, { unwrapData } from '../../services/rbacService'
import { useTranslation } from '../../hooks/useTranslation'
import './Rbac.css'

const MODULES = ['RBAC', 'Analytics', 'Alerts', 'Market', 'Pricing', 'Transport']

const RbacPermissions = () => {
  const { t } = useTranslation()
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    module: 'Analytics',
  })

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await rbacService.getPermissions()
      const data = unwrapData(res)
      setPermissions(Array.isArray(data) ? data : data?.items || [])
    } catch (err) {
      setError(err.message)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    const map = {}
    for (const p of permissions) {
      const mod = p.module || 'Other'
      if (!map[mod]) map[mod] = []
      map[mod].push(p)
    }
    return map
  }, [permissions])

  const openCreate = () => {
    setForm({ code: '', nameAr: '', nameEn: '', description: '', module: 'Analytics' })
    setModal('create')
  }

  const openEdit = (p) => {
    setForm({
      id: p.permissionId ?? p.id,
      nameAr: p.nameAr || '',
      nameEn: p.nameEn || '',
      description: p.description || '',
      module: p.module || 'Analytics',
    })
    setModal('edit')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (modal === 'create') {
        await rbacService.createPermission({
          code: form.code.trim().toLowerCase(),
          nameAr: form.nameAr,
          nameEn: form.nameEn || undefined,
          description: form.description || undefined,
          module: form.module,
        })
      } else {
        await rbacService.updatePermission(form.id, {
          nameAr: form.nameAr,
          nameEn: form.nameEn || undefined,
          description: form.description || undefined,
          module: form.module,
        })
      }
      setModal(null)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (p) => {
    if (p.isSystem) return
    if (!window.confirm(t('rbac.confirmDeletePermission'))) return
    try {
      await rbacService.deletePermission(p.permissionId ?? p.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return <p>{t('common.loading')}</p>
  }

  return (
    <>
      <div className="rbac-toolbar">
        <button type="button" className="rbac-btn primary" onClick={openCreate}>
          <FiPlus /> {t('rbac.addPermission')}
        </button>
        <button type="button" className="rbac-btn" onClick={load}>
          <FiRefreshCw /> {t('common.refresh')}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {Object.keys(grouped).length === 0 ? (
        <div className="rbac-empty">{t('common.noData')}</div>
      ) : (
        Object.entries(grouped).map(([module, items]) => (
          <div key={module} className="rbac-module-group">
            <h3>{module}</h3>
            <div className="rbac-table-wrap">
              <table className="rbac-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('rbac.code')}</th>
                    <th>{t('rbac.nameAr')}</th>
                    <th>{t('rbac.module')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => {
                    const id = p.permissionId ?? p.id
                    return (
                      <tr key={id}>
                        <td>{id}</td>
                        <td>
                          <span className="rbac-code" title={p.code}>
                            {p.code}
                          </span>
                        </td>
                        <td title={p.nameEn || ''}>{p.nameAr}</td>
                        <td>{p.module}</td>
                        <td className="rbac-actions-cell">
                          {p.isSystem && <FiLock className="rbac-lock" title={t('rbac.systemLocked')} />}
                          <button type="button" className="rbac-btn" onClick={() => openEdit(p)}>
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            className="rbac-btn danger"
                            disabled={p.isSystem}
                            onClick={() => handleDelete(p)}
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
          </div>
        ))
      )}

      {modal && (
        <div className="rbac-modal-overlay" onClick={() => setModal(null)}>
          <div className="rbac-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal === 'create' ? t('rbac.addPermission') : t('rbac.editPermission')}</h3>
            <form onSubmit={handleSave}>
              {modal === 'create' && (
                <div className="rbac-form-group">
                  <label>{t('rbac.code')}</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="gov.custom.action"
                    required
                  />
                </div>
              )}
              <div className="rbac-form-group">
                <label>{t('rbac.nameAr')}</label>
                <input
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  required
                />
              </div>
              <div className="rbac-form-group">
                <label>{t('rbac.nameEn')}</label>
                <input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
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
                <label>{t('rbac.module')}</label>
                <select
                  value={form.module}
                  onChange={(e) => setForm({ ...form, module: e.target.value })}
                >
                  {MODULES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
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
    </>
  )
}

export default RbacPermissions
