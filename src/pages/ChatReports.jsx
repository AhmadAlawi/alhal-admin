import React, { useState, useEffect } from 'react'
import { FiAlertCircle, FiFilter, FiRefreshCw, FiEye, FiCheck, FiX, FiClock, FiUser } from 'react-icons/fi'
import reportingService from '../services/reportingService'
import { useTranslation } from '../hooks/useTranslation'
import './ChatReports.css'

const ChatReports = () => {
  const { t } = useTranslation()
  
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [reportTypeFilter, setReportTypeFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  
  // Selected report for detail view
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    adminNotes: '',
    assignedToUserId: null
  })

  const reportTypes = [
    { value: 'spam', label: t('chatReports.spam') },
    { value: 'harassment', label: t('chatReports.harassment') },
    { value: 'inappropriate_content', label: t('chatReports.inappropriateContent') },
    { value: 'scam', label: t('chatReports.scam') },
    { value: 'other', label: t('chatReports.other') }
  ]

  const statusOptions = [
    { value: 'pending', label: t('chatReports.pending') },
    { value: 'under_review', label: t('chatReports.underReview') },
    { value: 'resolved', label: t('chatReports.resolved') },
    { value: 'dismissed', label: t('chatReports.dismissed') }
  ]

  useEffect(() => {
    fetchReports()
  }, [currentPage, pageSize, statusFilter, reportTypeFilter, assignedToFilter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        pageSize: pageSize
      }
      
      if (statusFilter) params.status = statusFilter
      if (reportTypeFilter) params.reportType = reportTypeFilter
      if (assignedToFilter) params.assignedToUserId = assignedToFilter
      
      const response = await reportingService.getAllReports(params)
      
      if (response.success && response.data) {
        const reportsData = response.data.reports || response.data || []
        setReports(Array.isArray(reportsData) ? reportsData : [])
        setTotalCount(response.data.totalCount || response.meta?.totalCount || reportsData.length)
      } else {
        setReports([])
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setError(err.message || 'Failed to load reports')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (reportId) => {
    try {
      const response = await reportingService.getReport(reportId)
      if (response.success && response.data) {
        setSelectedReport(response.data)
        setUpdateForm({
          status: response.data.status || '',
          adminNotes: response.data.adminNotes || '',
          assignedToUserId: response.data.assignedToUserId || null
        })
        setShowDetailModal(true)
      }
    } catch (err) {
      console.error('Failed to fetch report details:', err)
      alert('Failed to load report details: ' + (err.message || 'Unknown error'))
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedReport) return
    
    try {
      await reportingService.updateReportStatus(selectedReport.reportId, {
        status: updateForm.status,
        adminNotes: updateForm.adminNotes,
        assignedToUserId: updateForm.assignedToUserId
      })
      
      alert(t('chatReports.updateSuccess'))
      setShowDetailModal(false)
      fetchReports()
    } catch (err) {
      console.error('Failed to update report:', err)
      alert('Failed to update report: ' + (err.message || 'Unknown error'))
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending'
      case 'under_review': return 'badge-review'
      case 'resolved': return 'badge-resolved'
      case 'dismissed': return 'badge-dismissed'
      default: return 'badge-default'
    }
  }

  const getReportTypeLabel = (type) => {
    const found = reportTypes.find(rt => rt.value === type)
    return found ? found.label : type
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const parseEvidenceUrls = (urlsString) => {
    if (!urlsString) return []
    try {
      return JSON.parse(urlsString)
    } catch {
      return []
    }
  }

  return (
    <div className="chat-reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('chatReports.title')}</h1>
          <p className="page-subtitle">{t('chatReports.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchReports}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-panel card">
        <div className="filters-header">
          <h3><FiFilter /> {t('common.filter')}</h3>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label>{t('chatReports.status')}</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">{t('common.all')}</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('chatReports.reportType')}</label>
            <select
              className="filter-select"
              value={reportTypeFilter}
              onChange={(e) => {
                setReportTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">{t('common.all')}</option>
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('chatReports.assignedTo')}</label>
            <input
              type="number"
              className="filter-select"
              placeholder={t('chatReports.userIdPlaceholder')}
              value={assignedToFilter}
              onChange={(e) => {
                setAssignedToFilter(e.target.value || '')
                setCurrentPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card">
        {loading ? (
          <div className="loading-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <FiAlertCircle />
            <p>{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <FiAlertCircle />
            <p>{t('common.noData')}</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('chatReports.reportId')}</th>
                    <th>{t('chatReports.type')}</th>
                    <th>{t('chatReports.title')}</th>
                    <th>{t('chatReports.reportedBy')}</th>
                    <th>{t('chatReports.reportedUser')}</th>
                    <th>{t('chatReports.status')}</th>
                    <th>{t('chatReports.createdAt')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.reportId}>
                      <td>#{report.reportId}</td>
                      <td>
                        <span className="badge badge-type">
                          {getReportTypeLabel(report.reportType)}
                        </span>
                      </td>
                      <td>{report.title || '-'}</td>
                      <td>#{report.reportedByUserId}</td>
                      <td>{report.reportedUserId ? `#${report.reportedUserId}` : '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                          {statusOptions.find(s => s.value === report.status)?.label || report.status}
                        </span>
                      </td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => handleViewDetails(report.reportId)}
                          title={t('common.view')}
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                {t('common.previous')}
              </button>
              <span className="pagination-info">
                {t('common.page')} {currentPage} {t('common.of')} {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                className="btn btn-outline"
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                {t('common.next')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('chatReports.reportDetails')} #{selectedReport.reportId}</h2>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>{t('chatReports.basicInfo')}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('chatReports.type')}</label>
                    <span>{getReportTypeLabel(selectedReport.reportType)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.status')}</label>
                    <span className={`badge ${getStatusBadgeClass(selectedReport.status)}`}>
                      {statusOptions.find(s => s.value === selectedReport.status)?.label || selectedReport.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.title')}</label>
                    <span>{selectedReport.title || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.description')}</label>
                    <span>{selectedReport.description || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.reportedBy')}</label>
                    <span>#{selectedReport.reportedByUserId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.reportedUser')}</label>
                    <span>{selectedReport.reportedUserId ? `#${selectedReport.reportedUserId}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.conversationId')}</label>
                    <span>#{selectedReport.conversationId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.relatedMessageId')}</label>
                    <span>{selectedReport.relatedMessageId ? `#${selectedReport.relatedMessageId}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.createdAt')}</label>
                    <span>{formatDate(selectedReport.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('chatReports.resolvedAt')}</label>
                    <span>{formatDate(selectedReport.resolvedAt)}</span>
                  </div>
                </div>
              </div>

              {selectedReport.evidenceUrls && parseEvidenceUrls(selectedReport.evidenceUrls).length > 0 && (
                <div className="detail-section">
                  <h3>{t('chatReports.evidence')}</h3>
                  <div className="evidence-list">
                    {parseEvidenceUrls(selectedReport.evidenceUrls).map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="evidence-link">
                        {t('chatReports.evidenceLink')} {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>{t('chatReports.updateReport')}</h3>
                <div className="form-group">
                  <label>{t('chatReports.status')}</label>
                  <select
                    className="form-control"
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('chatReports.adminNotes')}</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={updateForm.adminNotes}
                    onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                    placeholder={t('chatReports.adminNotesPlaceholder')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('chatReports.assignTo')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={updateForm.assignedToUserId || ''}
                    onChange={(e) => setUpdateForm({ ...updateForm, assignedToUserId: e.target.value ? Number(e.target.value) : null })}
                    placeholder={t('chatReports.userIdPlaceholder')}
                  />
                </div>
                <button className="btn btn-primary" onClick={handleUpdateStatus}>
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatReports
