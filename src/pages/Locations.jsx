import React, { useCallback, useEffect, useState } from 'react'
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiX, FiEye, FiEyeOff } from 'react-icons/fi'
import governoratesService from '../services/governoratesService'
import citiesService from '../services/citiesService'
import areasService from '../services/areasService'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import './TransportRequests.css'
import './transport-shared.css'

const LEVELS = ['governorate', 'city', 'area']

const emptyForm = { nameAr: '', nameEn: '', description: '' }

const Locations = () => {
  const { t } = useTranslation()
  const { language } = useLocale()

  const [governorates, setGovernorates] = useState([])
  const [cities, setCities] = useState([])
  const [areas, setAreas] = useState([])

  const [selectedGov, setSelectedGov] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)

  const [loadingGov, setLoadingGov] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [error, setError] = useState(null)

  // modal: { level, mode: 'create'|'edit', row }
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const loadGovernorates = useCallback(async () => {
    try {
      setLoadingGov(true)
      setError(null)
      const list = await governoratesService.getAllForAdmin({ language })
      setGovernorates(list)
    } catch (err) {
      console.error('load governorates failed', err)
      setError(err.message || t('locations.errors.loadGovernorates'))
      setGovernorates([])
    } finally {
      setLoadingGov(false)
    }
  }, [language, t])

  const loadCities = useCallback(
    async (governorateId) => {
      if (governorateId == null) {
        setCities([])
        return
      }
      try {
        setLoadingCities(true)
        const list = await citiesService.getAllForAdmin(governorateId, { language })
        setCities(list)
      } catch (err) {
        console.error('load cities failed', err)
        setCities([])
      } finally {
        setLoadingCities(false)
      }
    },
    [language]
  )

  const loadAreas = useCallback(
    async (cityId) => {
      if (cityId == null) {
        setAreas([])
        return
      }
      try {
        setLoadingAreas(true)
        const list = await areasService.getAllForAdmin(cityId, { language })
        setAreas(list)
      } catch (err) {
        console.error('load areas failed', err)
        setAreas([])
      } finally {
        setLoadingAreas(false)
      }
    },
    [language]
  )

  useEffect(() => {
    loadGovernorates()
  }, [loadGovernorates])

  useEffect(() => {
    setSelectedCity(null)
    setAreas([])
    loadCities(selectedGov?.governorateId ?? null)
  }, [selectedGov, loadCities])

  useEffect(() => {
    loadAreas(selectedCity?.cityId ?? null)
  }, [selectedCity, loadAreas])

  const openCreate = (level) => {
    setForm(emptyForm)
    setModal({ level, mode: 'create', row: null })
  }

  const openEdit = (level, row) => {
    setForm({
      nameAr: row.nameAr || '',
      nameEn: row.nameEn || '',
      description: row.description || '',
    })
    setModal({ level, mode: 'edit', row })
  }

  const closeModal = () => {
    setModal(null)
    setForm(emptyForm)
    setSaving(false)
  }

  const serviceFor = (level) =>
    level === 'governorate' ? governoratesService : level === 'city' ? citiesService : areasService

  const refreshLevel = (level) => {
    if (level === 'governorate') loadGovernorates()
    else if (level === 'city') loadCities(selectedGov?.governorateId ?? null)
    else loadAreas(selectedCity?.cityId ?? null)
  }

  const handleSave = async () => {
    if (!modal) return
    if (!form.nameAr.trim() || !form.nameEn.trim()) {
      alert(t('locations.errors.nameRequired'))
      return
    }
    const { level, mode, row } = modal
    const svc = serviceFor(level)
    const payload = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      description: form.description.trim() || null,
    }
    if (level === 'city') payload.governorateId = selectedGov?.governorateId
    if (level === 'area') payload.cityId = selectedCity?.cityId

    try {
      setSaving(true)
      if (mode === 'create') {
        await svc.create(payload)
      } else {
        await svc.update(row[`${level}Id`], { ...payload, isActive: row.isActive })
      }
      closeModal()
      refreshLevel(level)
    } catch (err) {
      console.error('save location failed', err)
      alert((t('locations.errors.saveFailed')) + ': ' + (err.message || ''))
      setSaving(false)
    }
  }

  const handleToggle = async (level, row) => {
    const svc = serviceFor(level)
    const id = row[`${level}Id`]
    try {
      setBusyId(`${level}-${id}`)
      await svc.toggleActive(id)
      refreshLevel(level)
    } catch (err) {
      console.error('toggle failed', err)
      alert((t('locations.errors.toggleFailed')) + ': ' + (err.message || ''))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (level, row) => {
    if (!window.confirm(t('locations.confirmDelete'))) return
    const svc = serviceFor(level)
    const id = row[`${level}Id`]
    try {
      setBusyId(`${level}-${id}`)
      await svc.remove(id)
      if (level === 'governorate' && selectedGov?.governorateId === id) setSelectedGov(null)
      if (level === 'city' && selectedCity?.cityId === id) setSelectedCity(null)
      refreshLevel(level)
    } catch (err) {
      console.error('delete failed', err)
      alert((t('locations.errors.deleteFailed')) + ': ' + (err.message || ''))
    } finally {
      setBusyId(null)
    }
  }

  const renderColumn = ({ level, title, rows, loading, selectedId, onSelect, disabled, disabledHint }) => (
    <div className="table-container card" style={{ flex: 1, minWidth: 260 }}>
      <div
        className="page-header"
        style={{ padding: '0.75rem 1rem', marginBottom: 0, alignItems: 'center' }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => openCreate(level)}
          disabled={disabled}
        >
          <FiPlus /> {t('common.add')}
        </button>
      </div>

      {disabled ? (
        <p className="no-data" style={{ padding: '1rem' }}>{disabledHint}</p>
      ) : loading ? (
        <div className="loading-container" style={{ padding: '1.5rem' }}>
          <div className="spinner"></div>
        </div>
      ) : rows.length === 0 ? (
        <p className="no-data" style={{ padding: '1rem' }}>{t('common.noData')}</p>
      ) : (
        <table className="data-table">
          <tbody>
            {rows.map((row) => {
              const id = row[`${level}Id`]
              const isBusy = busyId === `${level}-${id}`
              return (
                <tr
                  key={id}
                  onClick={() => onSelect && onSelect(row)}
                  style={{
                    cursor: onSelect ? 'pointer' : 'default',
                    background: selectedId === id ? 'var(--color-primary-50, #eef6ff)' : undefined,
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {language === 'ar' ? row.nameAr : row.nameEn} {!row.isActive && (
                        <span className="badge badge-secondary">{t('locations.inactive')}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
                      {language === 'ar' ? row.nameEn : row.nameAr}
                      {level === 'governorate' && row.citiesCount != null ? ` · ${row.citiesCount} ${t('locations.citiesShort')}` : ''}
                      {level === 'city' && row.areasCount != null ? ` · ${row.areasCount} ${t('locations.areasShort')}` : ''}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'end' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-sm btn-icon"
                      title={t('common.edit')}
                      onClick={() => openEdit(level, row)}
                      disabled={isBusy}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="btn btn-sm btn-icon"
                      title={row.isActive ? t('locations.deactivate') : t('locations.activate')}
                      onClick={() => handleToggle(level, row)}
                      disabled={isBusy}
                    >
                      {row.isActive ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button
                      className="btn btn-sm btn-icon btn-danger"
                      title={t('common.delete')}
                      onClick={() => handleDelete(level, row)}
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
  )

  return (
    <div className="transport-requests-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiMapPin /> {t('locations.title')}
          </h1>
          <p className="page-subtitle">{t('locations.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={loadGovernorates}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <FiX /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {renderColumn({
          level: 'governorate',
          title: t('locations.governorates'),
          rows: governorates,
          loading: loadingGov,
          selectedId: selectedGov?.governorateId,
          onSelect: setSelectedGov,
        })}
        {renderColumn({
          level: 'city',
          title: selectedGov
            ? `${t('locations.cities')} — ${language === 'ar' ? selectedGov.nameAr : selectedGov.nameEn}`
            : t('locations.cities'),
          rows: cities,
          loading: loadingCities,
          selectedId: selectedCity?.cityId,
          onSelect: setSelectedCity,
          disabled: !selectedGov,
          disabledHint: t('locations.pickGovernorate'),
        })}
        {renderColumn({
          level: 'area',
          title: selectedCity
            ? `${t('locations.areas')} — ${language === 'ar' ? selectedCity.nameAr : selectedCity.nameEn}`
            : t('locations.areas'),
          rows: areas,
          loading: loadingAreas,
          disabled: !selectedCity,
          disabledHint: t('locations.pickCity'),
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>
                {modal.mode === 'create' ? t('common.add') : t('common.edit')} —{' '}
                {t(`locations.${modal.level}`)}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
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
                <label>{t('locations.description')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="form-input"
                  rows={2}
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

export default Locations
export { LEVELS }
