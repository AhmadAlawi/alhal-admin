import React, { useCallback, useEffect, useState } from 'react'
import { FiSliders, FiRefreshCw, FiX, FiSave } from 'react-icons/fi'
import marketLimitsService from '../services/marketLimitsService'
import { useTranslation } from '../hooks/useTranslation'
import './TransportRequests.css'
import './transport-shared.css'

const CONTEXT_TYPES = ['auction', 'tender', 'direct']

const emptyRow = (contextType) => ({
  contextType,
  minPrice: '',
  maxPrice: '',
  minQuantity: '',
  maxQuantity: '',
  isActive: true,
})

const MarketLimits = () => {
  const { t } = useTranslation()

  const [rows, setRows] = useState(() => CONTEXT_TYPES.map(emptyRow))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingType, setSavingType] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const existing = await marketLimitsService.getAll()
      setRows(
        CONTEXT_TYPES.map((ct) => {
          const found = existing.find((r) => r.contextType === ct)
          return found
            ? {
                contextType: ct,
                minPrice: found.minPrice ?? '',
                maxPrice: found.maxPrice ?? '',
                minQuantity: found.minQuantity ?? '',
                maxQuantity: found.maxQuantity ?? '',
                isActive: found.isActive,
              }
            : emptyRow(ct)
        })
      )
    } catch (err) {
      console.error('load market limits failed', err)
      setError(err.message || t('marketLimits.errors.load'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const updateRow = (contextType, patch) => {
    setRows((prev) => prev.map((r) => (r.contextType === contextType ? { ...r, ...patch } : r)))
  }

  const handleSave = async (contextType) => {
    const row = rows.find((r) => r.contextType === contextType)
    if (!row) return
    const min = row.minPrice === '' ? null : Number(row.minPrice)
    const max = row.maxPrice === '' ? null : Number(row.maxPrice)
    if (min != null && max != null && min > max) {
      alert(t('marketLimits.errors.priceOrder'))
      return
    }
    const minQ = row.minQuantity === '' ? null : Number(row.minQuantity)
    const maxQ = row.maxQuantity === '' ? null : Number(row.maxQuantity)
    if (minQ != null && maxQ != null && minQ > maxQ) {
      alert(t('marketLimits.errors.quantityOrder'))
      return
    }
    try {
      setSavingType(contextType)
      await marketLimitsService.upsert(row)
      await load()
    } catch (err) {
      console.error('save market limit failed', err)
      alert((t('marketLimits.errors.saveFailed')) + ': ' + (err.message || ''))
    } finally {
      setSavingType(null)
    }
  }

  return (
    <div className="transport-requests-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiSliders /> {t('marketLimits.title')}
          </h1>
          <p className="page-subtitle">{t('marketLimits.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={load}>
            <FiRefreshCw /> {t('common.refresh')}
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
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('marketLimits.context')}</th>
                <th>{t('marketLimits.minPrice')}</th>
                <th>{t('marketLimits.maxPrice')}</th>
                <th>{t('marketLimits.minQuantity')}</th>
                <th>{t('marketLimits.maxQuantity')}</th>
                <th>{t('common.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isBusy = savingType === row.contextType
                return (
                  <tr key={row.contextType}>
                    <td style={{ fontWeight: 600 }}>{t(`marketLimits.contexts.${row.contextType}`)}</td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 110 }}
                        value={row.minPrice}
                        onChange={(e) => updateRow(row.contextType, { minPrice: e.target.value })}
                        placeholder={t('marketLimits.unrestricted')}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 110 }}
                        value={row.maxPrice}
                        onChange={(e) => updateRow(row.contextType, { maxPrice: e.target.value })}
                        placeholder={t('marketLimits.unrestricted')}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 110 }}
                        value={row.minQuantity}
                        onChange={(e) => updateRow(row.contextType, { minQuantity: e.target.value })}
                        placeholder={t('marketLimits.unrestricted')}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 110 }}
                        value={row.maxQuantity}
                        onChange={(e) => updateRow(row.contextType, { maxQuantity: e.target.value })}
                        placeholder={t('marketLimits.unrestricted')}
                      />
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={row.isActive}
                          onChange={(e) => updateRow(row.contextType, { isActive: e.target.checked })}
                        />
                        {row.isActive ? t('locations.activate') : t('locations.inactive')}
                      </label>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSave(row.contextType)}
                        disabled={isBusy}
                      >
                        <FiSave /> {isBusy ? t('common.saving') : t('common.save')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default MarketLimits
