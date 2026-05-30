import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiDownload,
  FiEdit3,
  FiLoader,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from 'react-icons/fi'
import Chart from '../components/Chart/Chart'
import Table from '../components/Table/Table'
import reportBuilderService from '../services/reportBuilderService'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../contexts/LocaleContext'
import {
  buildChartPropsFromResults,
  extractVisualization,
  resultsToTableColumns,
  stripQueryDefinition,
} from '../utils/reportBuilderUtils'
import './SavedReports.css'

const SavedReports = () => {
  const { t } = useTranslation()
  const { language } = useLocale()
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [runningId, setRunningId] = useState(null)
  const [activeReport, setActiveReport] = useState(null)
  const [results, setResults] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await reportBuilderService.listSaved()
      setReports(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      setError(e.message)
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const runReport = async (report) => {
    setRunningId(report.id)
    setActiveReport(report)
    setResults(null)
    setError(null)
    try {
      const query = stripQueryDefinition(report.definition)
      const res = await reportBuilderService.execute(query)
      setResults(res?.data || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setRunningId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('savedReports.confirmDelete'))) return
    setActionLoading(id)
    try {
      await reportBuilderService.deleteSaved(id)
      if (activeReport?.id === id) {
        setActiveReport(null)
        setResults(null)
      }
      await loadReports()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleExport = async (report) => {
    setActionLoading(`export-${report.id}`)
    try {
      await reportBuilderService.exportCsv(stripQueryDefinition(report.definition))
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const visualization = useMemo(
    () => extractVisualization(activeReport?.definition),
    [activeReport]
  )

  const tableColumns = useMemo(() => resultsToTableColumns(results?.columns), [results])
  const chartProps = useMemo(
    () => buildChartPropsFromResults(results, visualization),
    [results, visualization]
  )

  const formatDate = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')
  }

  return (
    <div className="saved-reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('savedReports.title')}</h1>
          <p className="page-subtitle">{t('savedReports.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={loadReports} disabled={loading}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
          <Link to="/reports/builder" className="btn btn-primary">
            <FiPlus /> {t('savedReports.createNew')}
          </Link>
        </div>
      </div>

      {error && <div className="saved-reports-error">{error}</div>}

      <div className="saved-reports-layout">
        <div className="saved-reports-list card">
          {loading ? (
            <div className="saved-reports-loading">
              <FiLoader className="spin" /> {t('common.loading')}
            </div>
          ) : reports.length === 0 ? (
            <div className="saved-reports-empty">
              <FiBarChart2 size={40} />
              <p>{t('savedReports.empty')}</p>
              <Link to="/reports/builder" className="btn btn-primary">
                {t('savedReports.createFirst')}
              </Link>
            </div>
          ) : (
            <div className="saved-reports-table-wrap">
              <table className="saved-reports-table">
                <thead>
                  <tr>
                    <th>{t('savedReports.name')}</th>
                    <th>{t('savedReports.createdAt')}</th>
                    <th>{t('savedReports.updatedAt')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className={activeReport?.id === report.id ? 'active' : ''}>
                      <td>
                        <button
                          type="button"
                          className="report-name-btn"
                          onClick={() => runReport(report)}
                        >
                          {report.name}
                        </button>
                      </td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>{formatDate(report.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            title={t('savedReports.run')}
                            disabled={runningId === report.id}
                            onClick={() => runReport(report)}
                          >
                            {runningId === report.id ? <FiLoader className="spin" /> : <FiPlay />}
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title={t('savedReports.edit')}
                            onClick={() => navigate(`/reports/builder?edit=${report.id}`)}
                          >
                            <FiEdit3 />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title={t('savedReports.export')}
                            disabled={actionLoading === `export-${report.id}`}
                            onClick={() => handleExport(report)}
                          >
                            {actionLoading === `export-${report.id}` ? <FiLoader className="spin" /> : <FiDownload />}
                          </button>
                          <button
                            type="button"
                            className="btn-icon danger"
                            title={t('common.delete')}
                            disabled={actionLoading === report.id}
                            onClick={() => handleDelete(report.id)}
                          >
                            {actionLoading === report.id ? <FiLoader className="spin" /> : <FiTrash2 />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="saved-reports-viewer card">
          {!activeReport ? (
            <div className="viewer-placeholder">
              <FiBarChart2 size={48} />
              <p>{t('savedReports.selectToRun')}</p>
            </div>
          ) : (
            <>
              <div className="viewer-header">
                <h3>{activeReport.name}</h3>
                <div className="viewer-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/reports/builder?edit=${activeReport.id}`)}
                  >
                    <FiEdit3 /> {t('savedReports.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleExport(activeReport)}
                    disabled={actionLoading === `export-${activeReport.id}`}
                  >
                    <FiDownload /> {t('savedReports.export')}
                  </button>
                </div>
              </div>

              {runningId === activeReport.id && (
                <div className="saved-reports-loading">
                  <FiLoader className="spin" /> {t('savedReports.running')}
                </div>
              )}

              {results && !runningId && (
                <div className="viewer-results">
                  {chartProps && (
                    <div className="viewer-chart">
                      <Chart {...chartProps} height={300} />
                    </div>
                  )}
                  <Table columns={tableColumns} data={results.rows || []} />
                  <p className="viewer-meta">
                    {t('reportBuilder.showingRows', {
                      shown: results.rows?.length || 0,
                      total: results.pagination?.totalCount ?? results.rows?.length ?? 0,
                    })}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SavedReports
