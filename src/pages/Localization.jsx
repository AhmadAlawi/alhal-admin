import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiDatabase,
  FiEdit2,
  FiGlobe,
  FiLoader,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
  FiZap,
} from 'react-icons/fi'
import { useLocale } from '../contexts/LocaleContext'
import localizationService, { translationForLang } from '../services/localizationService'
import { useTranslation } from '../hooks/useTranslation'
import './Localization.css'

const LANGUAGES = [
  { code: 'ar', labelKey: 'localization.languageArabic' },
  { code: 'en', labelKey: 'localization.languageEnglish' },
]

const EMPTY_CREATE_FORM = {
  key: '',
  category: '',
  description: '',
  ar: '',
  en: '',
}

const Localization = () => {
  const { t } = useTranslation()
  const { language: uiLanguage, changeLanguage } = useLocale()

  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM)
  const [editForm, setEditForm] = useState(null)
  const [editLoading, setEditLoading] = useState(false)

  const categories = useMemo(() => {
    const set = new Set(keys.map((k) => k.category).filter(Boolean))
    if (category) set.add(category)
    return Array.from(set).sort()
  }, [keys, category])

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const result = await localizationService.getKeys({
        search: search.trim() || undefined,
        category: category || undefined,
        page,
        pageSize,
      })
      setKeys(result.items)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
    } catch (err) {
      setKeys([])
      setStatus({ type: 'error', message: err.message || t('localization.loadError') })
    } finally {
      setLoading(false)
    }
  }, [search, category, page, pageSize, t])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  useEffect(() => {
    setPage(1)
  }, [search, category])

  const openCreateModal = () => {
    setCreateForm(EMPTY_CREATE_FORM)
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateForm(EMPTY_CREATE_FORM)
  }

  const openEditModal = async (row) => {
    setShowEditModal(true)
    setEditLoading(true)
    setEditForm(null)
    try {
      const detail = await localizationService.getKeyById(row.id)
      setEditForm({
        id: detail.id,
        key: detail.key,
        category: detail.category,
        description: detail.description,
        isActive: detail.isActive,
        translations: {
          ar: translationForLang(detail, 'ar'),
          en: translationForLang(detail, 'en'),
        },
        translationIds: {
          ar: detail.translations.find((tr) => tr.languageCode === 'ar')?.id ?? null,
          en: detail.translations.find((tr) => tr.languageCode === 'en')?.id ?? null,
        },
      })
    } catch (err) {
      setShowEditModal(false)
      setStatus({ type: 'error', message: err.message || t('localization.loadError') })
    } finally {
      setEditLoading(false)
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditForm(null)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const key = createForm.key.trim()
    if (!key) {
      setStatus({ type: 'error', message: t('localization.keyRequired') })
      return
    }

    const payload = {
      key,
      category: createForm.category.trim() || undefined,
      description: createForm.description.trim() || undefined,
      translations: {},
    }
    if (createForm.ar.trim()) payload.translations.ar = createForm.ar.trim()
    if (createForm.en.trim()) payload.translations.en = createForm.en.trim()

    setActionLoading(true)
    try {
      await localizationService.createKey(payload)
      closeCreateModal()
      setStatus({ type: 'success', message: t('localization.created') })
      fetchKeys()
    } catch (err) {
      setStatus({ type: 'error', message: err.message || t('localization.saveError') })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editForm?.id) return

    setActionLoading(true)
    try {
      await localizationService.updateKey(editForm.id, {
        category: editForm.category.trim() || null,
        description: editForm.description.trim() || null,
        isActive: editForm.isActive,
      })

      for (const lang of ['ar', 'en']) {
        const value = editForm.translations[lang]?.trim() ?? ''
        if (value) {
          await localizationService.upsertTranslation(editForm.id, {
            languageCode: lang,
            value,
            isActive: true,
          })
        } else if (editForm.translationIds[lang]) {
          await localizationService.deleteTranslation(editForm.translationIds[lang])
        }
      }

      closeEditModal()
      setStatus({ type: 'success', message: t('localization.saved') })
      fetchKeys()
    } catch (err) {
      setStatus({ type: 'error', message: err.message || t('localization.saveError') })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteKey = async (row) => {
    if (!window.confirm(t('localization.confirmDeleteKey', { key: row.key }))) return
    setActionLoading(true)
    try {
      await localizationService.deleteKey(row.id)
      setStatus({ type: 'success', message: t('localization.deleted') })
      fetchKeys()
    } catch (err) {
      setStatus({ type: 'error', message: err.message || t('localization.deleteError') })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSyncCatalog = async () => {
    if (!window.confirm(t('localization.confirmSyncCatalog'))) return
    setActionLoading(true)
    try {
      await localizationService.syncCatalog()
      setStatus({ type: 'success', message: t('localization.syncSuccess') })
      fetchKeys()
    } catch (err) {
      setStatus({ type: 'error', message: err.message || t('localization.syncError') })
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearCache = async () => {
    setActionLoading(true)
    try {
      await localizationService.clearCache()
      setStatus({ type: 'success', message: t('localization.cacheCleared') })
    } catch (err) {
      setStatus({ type: 'error', message: err.message || t('localization.cacheError') })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="localization-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiGlobe /> {t('localization.title')}
          </h1>
          <p className="page-subtitle">{t('localization.subtitle')}</p>
        </div>
        <div className="localization-header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSyncCatalog}
            disabled={actionLoading}
          >
            <FiDatabase /> {t('localization.syncCatalog')}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClearCache}
            disabled={actionLoading}
          >
            <FiZap /> {t('localization.clearCache')}
          </button>
          <button type="button" className="btn btn-outline" onClick={fetchKeys} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} /> {t('common.refresh')}
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <FiPlus /> {t('localization.addKey')}
          </button>
        </div>
      </div>

      {status && (
        <div className={`localization-status localization-status-${status.type}`}>
          {status.message}
          <button type="button" className="status-close" onClick={() => setStatus(null)}>
            ×
          </button>
        </div>
      )}

      <div className="localization-toolbar card">
        <div className="toolbar-row">
          <div className="form-group compact">
            <label>{t('localization.uiLanguage')}</label>
            <select
              className="filter-select"
              value={uiLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {t(lang.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group compact">
            <label>{t('localization.category')}</label>
            <select
              className="filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t('localization.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group compact flex-grow">
            <label>{t('common.search')}</label>
            <div className="search-input-wrap">
              <FiSearch />
              <input
                type="search"
                className="filter-select"
                placeholder={t('localization.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="localization-table-wrap card">
        <div className="table-meta">
          {t('localization.showingCount', { count: totalCount })}
        </div>
        <div className="localization-table-scroll">
          {loading ? (
            <div className="localization-loading">
              <FiLoader className="spin" /> {t('common.loading')}
            </div>
          ) : (
            <table className="localization-table">
              <thead>
                <tr>
                  <th>{t('localization.key')}</th>
                  <th>{t('localization.category')}</th>
                  <th>{t('localization.description')}</th>
                  <th>{t('localization.languageArabic')}</th>
                  <th>{t('localization.languageEnglish')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      {t('localization.emptyHint')}
                    </td>
                  </tr>
                ) : (
                  keys.map((row) => (
                    <tr key={row.id ?? row.key} className={row.isActive === false ? 'row-inactive' : ''}>
                      <td className="cell-key">
                        <code>{row.key}</code>
                      </td>
                      <td>{row.category || '—'}</td>
                      <td className="cell-description">{row.description || '—'}</td>
                      <td className="cell-translation">{translationForLang(row, 'ar') || '—'}</td>
                      <td className="cell-translation">{translationForLang(row, 'en') || '—'}</td>
                      <td>
                        <span className={`status-badge ${row.isActive !== false ? 'active' : 'inactive'}`}>
                          {row.isActive !== false ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="btn-icon"
                          title={t('common.edit')}
                          onClick={() => openEditModal(row)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title={t('common.delete')}
                          onClick={() => handleDeleteKey(row)}
                          disabled={actionLoading}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="localization-pagination">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('common.previous')}
            </button>
            <span className="pagination-info">
              {t('common.page')} {page} {t('common.of')} {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>

      <p className="localization-note">{t('localization.serverNote')}</p>

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('localization.addKey')}</h2>
              <button type="button" className="modal-close" onClick={closeCreateModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label>{t('localization.key')} *</label>
                <input
                  type="text"
                  className="filter-select"
                  placeholder="success.custom_message"
                  value={createForm.key}
                  onChange={(e) => setCreateForm((f) => ({ ...f, key: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('localization.category')}</label>
                  <input
                    type="text"
                    className="filter-select"
                    placeholder="success"
                    value={createForm.category}
                    onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>{t('localization.description')}</label>
                  <input
                    type="text"
                    className="filter-select"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('localization.languageArabic')}</label>
                <textarea
                  className="filter-select"
                  rows={2}
                  value={createForm.ar}
                  onChange={(e) => setCreateForm((f) => ({ ...f, ar: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>{t('localization.languageEnglish')}</label>
                <textarea
                  className="filter-select"
                  rows={2}
                  value={createForm.en}
                  onChange={(e) => setCreateForm((f) => ({ ...f, en: e.target.value }))}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeCreateModal}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? t('common.loading') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('localization.editKey')}</h2>
              <button type="button" className="modal-close" onClick={closeEditModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {editLoading || !editForm ? (
                <div className="localization-loading">
                  <FiLoader className="spin" /> {t('common.loading')}
                </div>
              ) : (
                <form onSubmit={handleUpdate}>
                  <div className="form-group">
                    <label>{t('localization.key')}</label>
                    <input type="text" className="filter-select" value={editForm.key} readOnly disabled />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('localization.category')}</label>
                      <input
                        type="text"
                        className="filter-select"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, category: e.target.value }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('localization.description')}</label>
                      <input
                        type="text"
                        className="filter-select"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, description: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, isActive: e.target.checked }))
                      }
                    />
                    {t('common.active')}
                  </label>
                  <div className="form-group">
                    <label>{t('localization.languageArabic')}</label>
                    <textarea
                      className="filter-select"
                      rows={3}
                      value={editForm.translations.ar}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          translations: { ...f.translations, ar: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('localization.languageEnglish')}</label>
                    <textarea
                      className="filter-select"
                      rows={3}
                      value={editForm.translations.en}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          translations: { ...f.translations, en: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={closeEditModal}>
                      {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading ? t('common.loading') : t('common.save')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Localization
