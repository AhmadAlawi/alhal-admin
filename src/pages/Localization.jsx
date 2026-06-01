import React, { useMemo, useRef, useState } from 'react'
import {
  FiDownload,
  FiGlobe,
  FiRotateCcw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi'
import { useLocale } from '../contexts/LocaleContext'
import { useTranslation, baseTranslations } from '../hooks/useTranslation'
import { flattenTranslations, getNamespace } from '../utils/translationUtils'
import './Localization.css'

const LANGUAGES = [
  { code: 'ar', labelKey: 'localization.languageArabic' },
  { code: 'en', labelKey: 'localization.languageEnglish' },
]

const Localization = () => {
  const { t } = useTranslation()
  const {
    language: uiLanguage,
    changeLanguage,
    translationOverrides,
    setTranslationOverride,
    removeTranslationOverride,
    resetTranslationOverrides,
    importTranslationOverrides,
  } = useLocale()

  const [editLang, setEditLang] = useState(uiLanguage)
  const [search, setSearch] = useState('')
  const [namespace, setNamespace] = useState('all')
  const [showOverridesOnly, setShowOverridesOnly] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [status, setStatus] = useState(null)
  const fileRef = useRef(null)

  const baseFlat = useMemo(
    () => flattenTranslations(baseTranslations[editLang] || baseTranslations.ar),
    [editLang]
  )

  const overrides = translationOverrides[editLang] || {}

  const namespaces = useMemo(() => {
    const set = new Set(Object.keys(baseFlat).map(getNamespace))
    Object.keys(overrides).forEach((k) => set.add(getNamespace(k)))
    return ['all', ...Array.from(set).sort()]
  }, [baseFlat, overrides])

  const rows = useMemo(() => {
    const keys = new Set([...Object.keys(baseFlat), ...Object.keys(overrides)])
    let list = Array.from(keys).map((key) => ({
      key,
      defaultValue: baseFlat[key] ?? '',
      customValue: overrides[key] ?? '',
      isOverride: key in overrides,
    }))

    if (namespace !== 'all') {
      list = list.filter((r) => getNamespace(r.key) === namespace)
    }
    if (showOverridesOnly) {
      list = list.filter((r) => r.isOverride)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.key.toLowerCase().includes(q) ||
          r.defaultValue.toLowerCase().includes(q) ||
          r.customValue.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => a.key.localeCompare(b.key))
  }, [baseFlat, overrides, namespace, showOverridesOnly, search])

  const draftValue = useCallback(
    (key) => (drafts[key] !== undefined ? drafts[key] : overrides[key] ?? ''),
    [drafts, overrides]
  )

  const handleDraftChange = (key, value) => {
    setDrafts((prev) => ({ ...prev, [key]: value }))
  }

  const saveRow = (key) => {
    const value = drafts[key]
    if (value === undefined) return
    if (value.trim() === '' || value === baseFlat[key]) {
      removeTranslationOverride(editLang, key)
    } else {
      setTranslationOverride(editLang, key, value.trim())
    }
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setStatus({ type: 'success', message: t('localization.saved') })
  }

  const handleAddKey = () => {
    const key = newKey.trim()
    const value = newValue.trim()
    if (!key || !value) {
      setStatus({ type: 'error', message: t('localization.keyValueRequired') })
      return
    }
    setTranslationOverride(editLang, key, value)
    setNewKey('')
    setNewValue('')
    setStatus({ type: 'success', message: t('localization.added') })
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(translationOverrides, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alhal-translations-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        importTranslationOverrides(data)
        setStatus({ type: 'success', message: t('localization.importSuccess') })
      } catch {
        setStatus({ type: 'error', message: t('localization.importError') })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const overrideCount = Object.keys(overrides).length

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
          <button type="button" className="btn btn-outline" onClick={handleExport}>
            <FiDownload /> {t('localization.export')}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => fileRef.current?.click()}
          >
            <FiUpload /> {t('localization.import')}
          </button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
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
            <label>{t('localization.editLanguage')}</label>
            <select
              className="filter-select"
              value={editLang}
              onChange={(e) => {
                setEditLang(e.target.value)
                setDrafts({})
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {t(lang.labelKey)}
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
        <div className="toolbar-row">
          <div className="form-group compact">
            <label>{t('localization.namespace')}</label>
            <select
              className="filter-select"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
            >
              <option value="all">{t('localization.allNamespaces')}</option>
              {namespaces.filter((n) => n !== 'all').map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showOverridesOnly}
              onChange={(e) => setShowOverridesOnly(e.target.checked)}
            />
            {t('localization.overridesOnly')} ({overrideCount})
          </label>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => resetTranslationOverrides(editLang)}
          >
            <FiRotateCcw /> {t('localization.resetLanguage')}
          </button>
        </div>
      </div>

      <div className="localization-add card">
        <h3>{t('localization.addOverride')}</h3>
        <div className="add-row">
          <input
            type="text"
            className="filter-select"
            placeholder={t('localization.keyPlaceholder')}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            type="text"
            className="filter-select"
            placeholder={t('localization.valuePlaceholder')}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={handleAddKey}>
            {t('common.add')}
          </button>
        </div>
      </div>

      <div className="localization-table-wrap card">
        <div className="table-meta">
          {t('localization.showingCount', { count: rows.length })}
        </div>
        <div className="localization-table-scroll">
          <table className="localization-table">
            <thead>
              <tr>
                <th>{t('localization.key')}</th>
                <th>{t('localization.defaultValue')}</th>
                <th>{t('localization.customValue')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-cell">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const hasDraft = drafts[row.key] !== undefined
                  const current = draftValue(row.key)
                  const changed =
                    hasDraft &&
                    current !== (overrides[row.key] ?? '') &&
                    (current !== row.defaultValue || row.isOverride)
                  return (
                    <tr key={row.key} className={row.isOverride ? 'row-override' : ''}>
                      <td className="cell-key">
                        <code>{row.key}</code>
                        {row.isOverride && (
                          <span className="override-badge">{t('localization.modified')}</span>
                        )}
                      </td>
                      <td className="cell-default">{row.defaultValue || '—'}</td>
                      <td>
                        <input
                          type="text"
                          className="filter-select cell-input"
                          value={current}
                          placeholder={row.defaultValue}
                          onChange={(e) => handleDraftChange(row.key, e.target.value)}
                        />
                      </td>
                      <td className="cell-actions">
                        {(hasDraft || changed) && (
                          <button
                            type="button"
                            className="btn-icon"
                            title={t('common.save')}
                            onClick={() => saveRow(row.key)}
                          >
                            <FiSave />
                          </button>
                        )}
                        {row.isOverride && (
                          <button
                            type="button"
                            className="btn-icon danger"
                            title={t('localization.resetKey')}
                            onClick={() => {
                              removeTranslationOverride(editLang, row.key)
                              setDrafts((prev) => {
                                const next = { ...prev }
                                delete next[row.key]
                                return next
                              })
                            }}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="localization-note">{t('localization.storageNote')}</p>
    </div>
  )
}

export default Localization
