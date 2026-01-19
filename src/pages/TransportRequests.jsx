import React, { useState, useEffect } from 'react'
import { FiPackage, FiSearch, FiRefreshCw, FiEye, FiTrash2, FiBell, FiX } from 'react-icons/fi'
import transportService from '../services/transportService'
import { useTranslation } from '../hooks/useTranslation'
import './TransportRequests.css'

const TransportRequests = () => {
  const { t } = useTranslation()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchRequests()
  }, [currentPage, pageSize, statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page: currentPage,
        pageSize: pageSize
      }
      const response = await transportService.getTransportRequests(params)
      
      if (response.items) {
        setRequests(response.items || [])
        setTotalPages(response.totalPages || 1)
        setTotalCount(response.total || 0)
      } else if (Array.isArray(response)) {
        setRequests(response)
      } else if (response.data) {
        setRequests(Array.isArray(response.data) ? response.data : [])
      } else {
        setRequests([])
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
      setError(err.message || t('transport.error.loadRequests'))
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (requestId) => {
    if (!window.confirm(t('transport.requests.confirmDelete'))) {
      return
    }

    try {
      await transportService.deleteTransportRequest(requestId)
      setRequests(requests.filter(r => r.transportRequestId !== requestId))
      alert(t('transport.requests.deleteSuccess'))
    } catch (err) {
      console.error('Failed to delete request:', err)
      alert(t('transport.requests.deleteError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const handleNotify = async (requestId) => {
    try {
      await transportService.notifyTransporters(requestId)
      alert(t('transport.requests.notifySuccess'))
    } catch (err) {
      console.error('Failed to notify transporters:', err)
      alert(t('transport.requests.notifyError') + ': ' + (err.message || 'Unknown error'))
    }
  }

  const handleViewDetails = async (request) => {
    try {
      const details = await transportService.getTransportRequestById(request.transportRequestId)
      setSelectedRequest(details)
      setShowDetailModal(true)
    } catch (err) {
      console.error('Failed to fetch request details:', err)
      setSelectedRequest(request)
      setShowDetailModal(true)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedRequest(null)
  }

  const filteredRequests = requests.filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false
    }
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (request.transportRequestId && request.transportRequestId.toString().includes(search)) ||
      (request.fromRegion && request.fromRegion.toLowerCase().includes(search)) ||
      (request.toRegion && request.toRegion.toLowerCase().includes(search)) ||
      (request.productType && request.productType.toLowerCase().includes(search))
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { class: 'badge-info', label: t('transport.requests.status.open') },
      pending: { class: 'badge-warning', label: t('transport.requests.status.pending') },
      negotiating: { class: 'badge-primary', label: t('transport.requests.status.negotiating') },
      completed: { class: 'badge-success', label: t('transport.requests.status.completed') },
      cancelled: { class: 'badge-danger', label: t('transport.requests.status.cancelled') }
    }
    const statusInfo = statusMap[status] || { class: 'badge-secondary', label: status }
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  if (loading && requests.length === 0) {
    return (
      <div className="transport-requests-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transport-requests-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiPackage /> {t('transport.requests.title')}
          </h1>
          <p className="page-subtitle">{t('transport.requests.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchRequests}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <FiX /> {error}
        </div>
      )}

      <div className="filters-section card">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder={t('transport.requests.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>{t('transport.requests.status')}:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-select"
          >
            <option value="all">{t('common.all')}</option>
            <option value="open">{t('transport.requests.status.open')}</option>
            <option value="pending">{t('transport.requests.status.pending')}</option>
            <option value="negotiating">{t('transport.requests.status.negotiating')}</option>
            <option value="completed">{t('transport.requests.status.completed')}</option>
            <option value="cancelled">{t('transport.requests.status.cancelled')}</option>
          </select>
        </div>
        <div className="page-size-selector">
          <label>{t('common.show')}:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="filter-select"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="table-container card">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('transport.requests.id')}</th>
              <th>{t('transport.requests.orderId')}</th>
              <th>{t('transport.requests.fromRegion')}</th>
              <th>{t('transport.requests.toRegion')}</th>
              <th>{t('transport.requests.distance')}</th>
              <th>{t('transport.requests.weight')}</th>
              <th>{t('transport.requests.productType')}</th>
              <th>{t('transport.requests.status')}</th>
              <th>{t('transport.requests.createdAt')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.transportRequestId}>
                  <td>{request.transportRequestId}</td>
                  <td>{request.orderId || request.contextId || 'N/A'}</td>
                  <td>{request.fromRegion || 'N/A'}</td>
                  <td>{request.toRegion || 'N/A'}</td>
                  <td>{request.distanceKm ? `${request.distanceKm} km` : 'N/A'}</td>
                  <td>{request.weightKg ? `${request.weightKg} kg` : 'N/A'}</td>
                  <td>{request.productType || 'N/A'}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-icon"
                        onClick={() => handleViewDetails(request)}
                        title={t('common.view')}
                      >
                        <FiEye />
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-info"
                        onClick={() => handleNotify(request.transportRequestId)}
                        title={t('transport.requests.notify')}
                      >
                        <FiBell />
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-danger"
                        onClick={() => handleDelete(request.transportRequestId)}
                        title={t('common.delete')}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            {t('common.previous')}
          </button>
          <span className="pagination-info">
            {t('common.page')} {currentPage} {t('common.of')} {totalPages}
          </span>
          <button
            className="btn btn-outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {showDetailModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('transport.requests.details')}</h2>
              <button className="modal-close" onClick={closeDetailModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>{t('transport.requests.basicInfo')}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('transport.requests.id')}</label>
                    <span>{selectedRequest.transportRequestId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.orderId')}</label>
                    <span>{selectedRequest.orderId || selectedRequest.contextId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.buyerUserId')}</label>
                    <span>{selectedRequest.buyerUserId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.fromRegion')}</label>
                    <span>{selectedRequest.fromRegion || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.toRegion')}</label>
                    <span>{selectedRequest.toRegion || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.distance')}</label>
                    <span>{selectedRequest.distanceKm ? `${selectedRequest.distanceKm} km` : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.weight')}</label>
                    <span>{selectedRequest.weightKg ? `${selectedRequest.weightKg} kg` : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.productType')}</label>
                    <span>{selectedRequest.productType || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.status')}</label>
                    <span>{getStatusBadge(selectedRequest.status)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('transport.requests.createdAt')}</label>
                    <span>{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                </div>
              </div>
              {selectedRequest.offers && selectedRequest.offers.length > 0 && (
                <div className="detail-section">
                  <h3>{t('transport.requests.offers')} ({selectedRequest.offers.length})</h3>
                  <div className="offers-list">
                    {selectedRequest.offers.map((offer, idx) => (
                      <div key={idx} className="offer-item">
                        <div className="offer-header">
                          <strong>{t('transport.offers.offer')} #{offer.offerId}</strong>
                          <span className={`badge ${offer.status === 'accepted' ? 'badge-success' : offer.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {offer.status}
                          </span>
                        </div>
                        <div className="offer-details">
                          <span>{t('transport.offers.price')}: {offer.offeredPrice} {t('transport.currency')}</span>
                          <span>{t('transport.offers.transporterId')}: {offer.transporterId}</span>
                        </div>
                        {offer.notes && (
                          <div className="offer-notes">
                            {offer.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransportRequests
