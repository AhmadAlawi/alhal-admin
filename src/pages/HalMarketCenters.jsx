import React, { useCallback, useEffect, useState } from 'react'
import {
  FiEdit2,
  FiLoader,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import SyriaMap from '../components/SyriaMap/SyriaMap'
import halMarketCentersService from '../services/halMarketCentersService'
import governoratesService from '../services/governoratesService'
import citiesService from '../services/citiesService'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import '../components/SyriaMap/SyriaMap.css'

const EMPTY_FORM = {
  governorateId: '',
  cityId: '',
  nameAr: '',
  nameEn: '',
  latitude: '',
  longitude: '',
  address: '',
  isActive: true,
}

const HalMarketCenters = () => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const [centers, setCenters] = useState([])
  const [governorates, setGovernorates] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const label = (ar, en) => (language === 'ar' ? ar || en : en || ar)

  const fetchCenters = useCallback(async () => {
    setLoading(true)
    try {
      const list = await halMarketCentersService.list({ activeOnly: false })
      setCenters(Array.isArray(list) ? list : [])
    } catch (e) {
      setCenters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCenters()
    governoratesService.getOptions(language).then(setGovernorates).catch(() => {})
  }, [fetchCenters, language])

  useEffect(() => {
    if (!formData.governorateId) {
      setCities([])
      return
    }
    citiesService
      .getCitiesByGovernorate(formData.governorateId, { language })
      .then(setCities)
      .catch(() => setCities([]))
  }, [formData.governorateId, language])

  const openCreate = () => {
    setEditing(null)
    setFormData(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (center) => {
    setEditing(center)
    setFormData({
      governorateId: String(center.governorateId ?? ''),
      cityId: center.cityId != null ? String(center.cityId) : '',
      nameAr: center.nameAr || '',
      nameEn: center.nameEn || '',
      latitude: center.latitude ?? '',
      longitude: center.longitude ?? '',
      address: center.address || '',
      isActive: center.isActive !== false,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setFormData(EMPTY_FORM)
  }

  const handleMapPick = ({ latitude, longitude }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.governorateId || !formData.nameAr || !formData.latitude || !formData.longitude) {
      alert(t('syriaMaps.formRequired'))
      return
    }

    const payload = {
      governorateId: Number(formData.governorateId),
      cityId: formData.cityId ? Number(formData.cityId) : null,
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      address: formData.address.trim() || null,
      isActive: formData.isActive,
    }

    setSaving(true)
    try {
      const id = editing?.halMarketCenterId ?? editing?.id
      if (id) {
        await halMarketCentersService.update(id, payload)
        alert(t('syriaMaps.updated'))
      } else {
        await halMarketCentersService.create(payload)
        alert(t('syriaMaps.created'))
      }
      closeModal()
      fetchCenters()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (center) => {
    const id = center.halMarketCenterId ?? center.id
    if (!id || !window.confirm(t('syriaMaps.confirmDelete'))) return
    try {
      await halMarketCentersService.remove(id)
      alert(t('syriaMaps.deleted'))
      fetchCenters()
    } catch (err) {
      alert(err.message)
    }
  }

  const govName = (govId) => governorates.find((g) => String(g.id) === String(govId))?.name || `#${govId}`

  const previewData = {
    halMarketCenters: centers.filter((c) => c.latitude != null && c.longitude != null),
    bounds: null,
  }

  return (
    <div className="gov-entity-analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('syriaMaps.centersTitle')}</h1>
          <p className="page-subtitle">{t('syriaMaps.centersSubtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-outline" onClick={fetchCenters} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} /> {t('common.refresh')}
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> {t('syriaMaps.addCenter')}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0.75rem', marginBottom: '1.25rem' }}>
        <SyriaMap
          data={previewData}
          mapKind="farms"
          height={320}
          fitBounds={centers.length > 0}
          language={language}
          showLegend={false}
        />
      </div>

      <div className="card hal-centers-table-wrap">
        {loading ? (
          <div className="syria-map-loading">
            <FiLoader className="spin" /> {t('common.loading')}
          </div>
        ) : (
          <table className="hal-centers-table">
            <thead>
              <tr>
                <th>{t('syriaMaps.centerName')}</th>
                <th>{t('dashboard.governorate')}</th>
                <th>{t('syriaMaps.city')}</th>
                <th>{t('syriaMaps.coordinates')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {!centers.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    {t('common.noData')}
                  </td>
                </tr>
              )}
              {centers.map((center) => {
                const id = center.halMarketCenterId ?? center.id
                return (
                  <tr key={id}>
                    <td>{label(center.nameAr, center.nameEn)}</td>
                    <td>{center.governorateNameAr || govName(center.governorateId)}</td>
                    <td>{center.cityNameAr || (center.cityId ? `#${center.cityId}` : '—')}</td>
                    <td>
                      {center.latitude != null ? (
                        <>
                          <FiMapPin /> {center.latitude}, {center.longitude}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{center.isActive !== false ? t('common.active') : t('common.inactive')}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(center)}
                        title={t('common.edit')}
                      >
                        <FiEdit2 />
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-outline btn-sm danger"
                        onClick={() => handleDelete(center)}
                        title={t('common.delete')}
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>
                {editing ? t('syriaMaps.editCenter') : t('syriaMaps.addCenter')}
              </h2>
              <button type="button" className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="hal-form-grid">
                <div className="form-group">
                  <label>{t('dashboard.governorate')} *</label>
                  <select
                    required
                    value={formData.governorateId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        governorateId: e.target.value,
                        cityId: '',
                      }))
                    }
                  >
                    <option value="">{t('syriaMaps.selectGovernorate')}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('syriaMaps.city')}</label>
                  <select
                    value={formData.cityId}
                    disabled={!formData.governorateId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cityId: e.target.value }))}
                  >
                    <option value="">{t('syriaMaps.governorateLevel')}</option>
                    {cities.map((c) => (
                      <option key={c.cityId} value={c.cityId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('syriaMaps.nameAr')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nameAr: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>{t('syriaMaps.nameEn')}</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>{t('syriaMaps.latitude')} *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>{t('syriaMaps.longitude')} *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                  />
                </div>
                <div className="form-group full-width">
                  <label>{t('syriaMaps.address')}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="form-group full-width">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                    />{' '}
                    {t('common.active')}
                  </label>
                </div>
                <div className="form-group full-width">
                  <label>{t('syriaMaps.clickMapHint')}</label>
                  <div className="hal-form-map">
                    <SyriaMap
                      data={{ halMarketCenters: [] }}
                      mapKind="farms"
                      height={260}
                      fitBounds={false}
                      pickMode
                      onPick={handleMapPick}
                      pickMarker={{
                        latitude: formData.latitude ? Number(formData.latitude) : null,
                        longitude: formData.longitude ? Number(formData.longitude) : null,
                      }}
                      language={language}
                      showLegend={false}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HalMarketCenters
