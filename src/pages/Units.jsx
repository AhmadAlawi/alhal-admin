import React, { useCallback, useEffect, useState } from 'react'
import { FiPackage, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiX, FiEye, FiEyeOff } from 'react-icons/fi'
import unitsService from '../services/unitsService'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import './TransportRequests.css'
import './transport-shared.css'

const emptyForm = {
  code: '',
  nameAr: '',
  nameEn: '',
  unitType: 'weight',
  factorToBase: '1',
  isBaseUnit: false,
  sortOrder: '0',
}

const Units = () => {
  const { t } = useTranslation()
  const { language } = useLocale()

  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const [modal, setModal] = useState(null) // { mode: 'create'|'edit', row }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const list = await unitsService.getAllForAdmin()
      list.sort((a, b) => a.unitType.localeCompare(b.unitType) || a.sortOrder - b.sortOrder)
      setUnits(list)
    } catch (err) {
      console.error('load units failed', err)
      setError(err.message || t('units.errors.load'))
      setUnits([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm(emptyForm)
    setModal({ mode: 'create', row: null })
  }

  const openEdit = (row) => {
    setForm({
      code: row.code,
      nameAr: row.nameAr,
      nameEn: row.nameEn,
      unitType: row.unitType,
      factorToBase: String(row.factorToBase),
      isBaseUnit: row.isBaseUnit,
      sortOrder: String(row.sortOrder),
    })
    setModal({ mode: 'edit', row })
  }

  const closeModal = () => {
    setModal(null)
    setForm(emptyForm)
    setSaving(false)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.nameAr.trim() || !form.nameEn.trim() || !form.unitType.trim()) {
      alert(t('units.errors.required'))
      return
    }
    const factor = Number(form.factorToBase)
    if (!Number.isFinite(factor) || factor <= 0) {
      alert(t('units.errors.invalidFactor'))
      return
    }
    try {
      setSaving(true)
      if (modal.mode === 'create') {
        await unitsService.create(form)
      } else {
        await unitsService.update(modal.row.unitId, { ...form, isActive: modal.row.isActive })
      }
      closeModal()
      load()
    } catch (err) {
      console.error('save unit failed', err)
      alert((t('units.errors.saveFailed')) + ': ' + (err.message || ''))
      setSaving(false)
    }
  }

  const handleToggle = async (row) => {
    try {
      setBusyId(row.unitId)
      await unitsService.toggleActive(row.unitId)
      load()
    } catch (err) {
      console.error('toggle unit failed', err)
      alert((t('units.errors.toggleFailed')) + ': ' + (err.message || ''))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(t('units.confirmDelete'))) return
    try {
      setBusyId(row.unitId)
      await unitsService.remove(row.unitId)
      load()
    } catch (err) {
      console.error('delete unit failed', err)
      alert((t('units.errors.deleteFailed')) + ': ' + (err.message || ''))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="transport-requests-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiPackage /> {t('units.title')}
          </h1>
          <p className="page-subtitle">{t('units.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={load}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> {t('common.add')}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <FiX /> {error}
        </div>
      )}

      <div className="table-container card">
        {loading ? (
          <div className="loading-container" style={{ padding: '1.5rem' }}>
            <div className="spinner"></div>
          </div>
        ) : units.length === 0 ? (
          <p className="no-data" style={{ padding: '1rem' }}>{t('common.noData')}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('units.code')}</th>
                <th>{t('units.name')}</th>
                <th>{t('units.unitType')}</th>
                <th>{t('units.factorToBase')}</th>
                <th>{t('units.baseUnit')}</th>
                <th>{t('common.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {units.map((row) => {
                const isBusy = busyId === row.unitId
                return (
                  <tr key={row.unitId}>
                    <td><code>{row.code}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{language === 'ar' ? row.nameAr : row.nameEn}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
                        {language === 'ar' ? row.nameEn : row.nameAr}
                      </div>
                    </td>
                    <td>{row.unitType}</td>
                    <td>{row.factorToBase}</td>
                    <td>{row.isBaseUnit ? <span className="badge badge-success">{t('units.base')}</span> : ''}</td>
                    <td>
                      {row.isActive ? (
                        <span className="badge badge-success">{t('locations.activate')}</span>
                      ) : (
                        <span className="badge badge-secondary">{t('locations.inactive')}</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'end' }}>
                      <button
                        className="btn btn-sm btn-icon"
                        title={t('common.edit')}
                        onClick={() => openEdit(row)}
                        disabled={isBusy}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="btn btn-sm btn-icon"
                        title={row.isActive ? t('locations.deactivate') : t('locations.activate')}
                        onClick={() => handleToggle(row)}
                        disabled={isBusy}
                      >
                        {row.isActive ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-danger"
                        title={t('common.delete')}
                        onClick={() => handleDelete(row)}
                        disabled={isBusy}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>{modal.mode === 'create' ? t('common.add') : t('common.edit')} — {t('units.unit')}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('units.code')} *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.trim().toLowerCase() }))}
                  className="form-input"
                  dir="ltr"
                  placeholder="kg"
                />
              </div>
              <div className="form-group">
                <label>{t('locations.nameAr')} *</label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                  className="form-input"
                  dir="rtl"
                />
              </div>
              <div className="form-group">
                <label>{t('locations.nameEn')} *</label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  className="form-input"
                  dir="ltr"
                />
              </div>
              <div className="form-group">
                <label>{t('units.unitType')} *</label>
                <input
                  type="text"
                  value={form.unitType}
                  onChange={(e) => setForm((f) => ({ ...f, unitType: e.target.value.trim().toLowerCase() }))}
                  className="form-input"
                  dir="ltr"
                  placeholder="weight"
                />
              </div>
              <div className="form-group">
                <label>{t('units.factorToBase')} *</label>
                <input
                  type="number"
                  step="any"
                  value={form.factorToBase}
                  onChange={(e) => setForm((f) => ({ ...f, factorToBase: e.target.value }))}
                  className="form-input"
                  dir="ltr"
                />
                <small style={{ color: 'var(--text-muted, #888)' }}>{t('units.factorHint')}</small>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.isBaseUnit}
                    onChange={(e) => setForm((f) => ({ ...f, isBaseUnit: e.target.checked }))}
                  />{' '}
                  {t('units.isBaseUnit')}
                </label>
              </div>
              <div className="form-group">
                <label>{t('units.sortOrder')}</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="form-input"
                  dir="ltr"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                  {t('common.cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Units
