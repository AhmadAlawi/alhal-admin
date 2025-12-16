import React, { useState, useEffect } from 'react'
import { FiMessageSquare, FiFilter, FiRefreshCw, FiEye, FiCheck, FiX, FiClock, FiUser, FiSend, FiAlertCircle } from 'react-icons/fi'
import ticketingService from '../services/ticketingService'
import { useTranslation } from '../hooks/useTranslation'
import './Tickets.css'

const Tickets = () => {
  const { t } = useTranslation()
  
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  
  // Selected ticket for detail view
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketMessages, setTicketMessages] = useState([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    priority: '',
    assignedToUserId: null,
    resolutionNotes: ''
  })
  
  // New message form
  const [newMessage, setNewMessage] = useState({
    body: '',
    isInternal: false,
    attachmentUrls: []
  })

  const categories = [
    { value: 'technical', label: t('tickets.technical') },
    { value: 'billing', label: t('tickets.billing') },
    { value: 'account', label: t('tickets.account') },
    { value: 'general', label: t('tickets.general') },
    { value: 'complaint', label: t('tickets.complaint') }
  ]

  const priorities = [
    { value: 'low', label: t('tickets.low') },
    { value: 'medium', label: t('tickets.medium') },
    { value: 'high', label: t('tickets.high') },
    { value: 'urgent', label: t('tickets.urgent') }
  ]

  const statusOptions = [
    { value: 'open', label: t('tickets.open') },
    { value: 'in_progress', label: t('tickets.inProgress') },
    { value: 'waiting_customer', label: t('tickets.waitingCustomer') },
    { value: 'resolved', label: t('tickets.resolved') },
    { value: 'closed', label: t('tickets.closed') }
  ]

  useEffect(() => {
    fetchTickets()
  }, [currentPage, pageSize, statusFilter, priorityFilter, categoryFilter, assignedToFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        pageSize: pageSize
      }
      
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (categoryFilter) params.category = categoryFilter
      if (assignedToFilter) params.assignedToUserId = assignedToFilter
      
      const response = await ticketingService.getAllTickets(params)
      
      if (response.success && response.data) {
        const ticketsData = response.data.tickets || response.data || []
        setTickets(Array.isArray(ticketsData) ? ticketsData : [])
        setTotalCount(response.data.totalCount || response.meta?.totalCount || ticketsData.length)
      } else {
        setTickets([])
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
      setError(err.message || 'Failed to load tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketMessages = async (ticketId) => {
    try {
      setLoadingMessages(true)
      const response = await ticketingService.getTicketMessages(ticketId)
      if (response.success && response.data) {
        const messages = response.data.messages || response.data || []
        setTicketMessages(Array.isArray(messages) ? messages : [])
      } else {
        setTicketMessages([])
      }
    } catch (err) {
      console.error('Failed to fetch ticket messages:', err)
      setTicketMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleViewDetails = async (ticketId) => {
    try {
      const response = await ticketingService.getTicket(ticketId)
      if (response.success && response.data) {
        setSelectedTicket(response.data)
        setUpdateForm({
          status: response.data.status || '',
          priority: response.data.priority || '',
          assignedToUserId: response.data.assignedToUserId || null,
          resolutionNotes: response.data.resolutionNotes || ''
        })
        setShowDetailModal(true)
        await fetchTicketMessages(ticketId)
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err)
      alert('Failed to load ticket details: ' + (err.message || 'Unknown error'))
    }
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return
    
    try {
      await ticketingService.updateTicket(selectedTicket.ticketId, updateForm)
      alert(t('tickets.updateSuccess'))
      setShowDetailModal(false)
      fetchTickets()
    } catch (err) {
      console.error('Failed to update ticket:', err)
      alert('Failed to update ticket: ' + (err.message || 'Unknown error'))
    }
  }

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.body.trim()) return
    
    try {
      // Get current user ID from localStorage or context
      const userId = localStorage.getItem('userId') || 1 // Fallback to 1 if not available
      
      await ticketingService.addTicketMessage(selectedTicket.ticketId, {
        senderUserId: Number(userId),
        body: newMessage.body,
        isInternal: newMessage.isInternal,
        attachmentUrls: newMessage.attachmentUrls.length > 0 
          ? JSON.stringify(newMessage.attachmentUrls) 
          : null
      })
      
      setNewMessage({ body: '', isInternal: false, attachmentUrls: [] })
      await fetchTicketMessages(selectedTicket.ticketId)
      await fetchTickets() // Refresh ticket list
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Failed to send message: ' + (err.message || 'Unknown error'))
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open': return 'badge-open'
      case 'in_progress': return 'badge-progress'
      case 'waiting_customer': return 'badge-waiting'
      case 'resolved': return 'badge-resolved'
      case 'closed': return 'badge-closed'
      default: return 'badge-default'
    }
  }

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'low': return 'badge-low'
      case 'medium': return 'badge-medium'
      case 'high': return 'badge-high'
      case 'urgent': return 'badge-urgent'
      default: return 'badge-default'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="tickets-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('tickets.title')}</h1>
          <p className="page-subtitle">{t('tickets.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchTickets}>
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
            <label>{t('tickets.status')}</label>
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
            <label>{t('tickets.priority')}</label>
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">{t('common.all')}</option>
              {priorities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('tickets.category')}</label>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">{t('common.all')}</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('tickets.assignedTo')}</label>
            <input
              type="number"
              className="filter-select"
              placeholder={t('tickets.userIdPlaceholder')}
              value={assignedToFilter}
              onChange={(e) => {
                setAssignedToFilter(e.target.value || '')
                setCurrentPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
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
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <FiMessageSquare />
            <p>{t('common.noData')}</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('tickets.ticketId')}</th>
                    <th>{t('tickets.subject')}</th>
                    <th>{t('tickets.category')}</th>
                    <th>{t('tickets.priority')}</th>
                    <th>{t('tickets.status')}</th>
                    <th>{t('tickets.createdBy')}</th>
                    <th>{t('tickets.assignedTo')}</th>
                    <th>{t('tickets.createdAt')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.ticketId}>
                      <td>#{ticket.ticketId}</td>
                      <td>{ticket.subject || '-'}</td>
                      <td>
                        <span className="badge badge-category">
                          {categories.find(c => c.value === ticket.category)?.label || ticket.category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
                          {priorities.find(p => p.value === ticket.priority)?.label || ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                          {statusOptions.find(s => s.value === ticket.status)?.label || ticket.status}
                        </span>
                      </td>
                      <td>#{ticket.createdByUserId}</td>
                      <td>{ticket.assignedToUserId ? `#${ticket.assignedToUserId}` : '-'}</td>
                      <td>{formatDate(ticket.createdAt)}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => handleViewDetails(ticket.ticketId)}
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
      {showDetailModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('tickets.ticketDetails')} #{selectedTicket.ticketId}</h2>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {/* Ticket Info */}
              <div className="detail-section">
                <h3>{t('tickets.basicInfo')}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('tickets.subject')}</label>
                    <span>{selectedTicket.subject || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.description')}</label>
                    <span>{selectedTicket.description || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.category')}</label>
                    <span>{categories.find(c => c.value === selectedTicket.category)?.label || selectedTicket.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.priority')}</label>
                    <span className={`badge ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                      {priorities.find(p => p.value === selectedTicket.priority)?.label || selectedTicket.priority}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.status')}</label>
                    <span className={`badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                      {statusOptions.find(s => s.value === selectedTicket.status)?.label || selectedTicket.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.createdBy')}</label>
                    <span>#{selectedTicket.createdByUserId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.assignedTo')}</label>
                    <span>{selectedTicket.assignedToUserId ? `#${selectedTicket.assignedToUserId}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.createdAt')}</label>
                    <span>{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('tickets.resolvedAt')}</label>
                    <span>{formatDate(selectedTicket.resolvedAt)}</span>
                  </div>
                  {selectedTicket.customerSatisfactionRating && (
                    <div className="detail-item">
                      <label>{t('tickets.satisfactionRating')}</label>
                      <span>{'⭐'.repeat(selectedTicket.customerSatisfactionRating)} ({selectedTicket.customerSatisfactionRating}/5)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Ticket Form */}
              <div className="detail-section">
                <h3>{t('tickets.updateTicket')}</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('tickets.status')}</label>
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
                    <label>{t('tickets.priority')}</label>
                    <select
                      className="form-control"
                      value={updateForm.priority}
                      onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}
                    >
                      {priorities.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('tickets.assignTo')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={updateForm.assignedToUserId || ''}
                      onChange={(e) => setUpdateForm({ ...updateForm, assignedToUserId: e.target.value ? Number(e.target.value) : null })}
                      placeholder={t('tickets.userIdPlaceholder')}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('tickets.resolutionNotes')}</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={updateForm.resolutionNotes}
                    onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
                    placeholder={t('tickets.resolutionNotesPlaceholder')}
                  />
                </div>
                <button className="btn btn-primary" onClick={handleUpdateTicket}>
                  {t('common.save')}
                </button>
              </div>

              {/* Messages Section */}
              <div className="detail-section">
                <h3>{t('tickets.messages')}</h3>
                {loadingMessages ? (
                  <p>{t('common.loading')}</p>
                ) : (
                  <div className="messages-container">
                    {ticketMessages.length === 0 ? (
                      <p className="empty-messages">{t('tickets.noMessages')}</p>
                    ) : (
                      ticketMessages.map((message) => (
                        <div key={message.ticketMessageId} className={`message-item ${message.isInternal ? 'internal' : ''}`}>
                          <div className="message-header">
                            <span className="message-sender">#{message.senderUserId}</span>
                            {message.isInternal && <span className="badge badge-internal">{t('tickets.internal')}</span>}
                            <span className="message-time">{formatDate(message.sentAt)}</span>
                          </div>
                          <div className="message-body">{message.body}</div>
                          {message.attachmentUrls && (() => {
                            try {
                              const attachments = JSON.parse(message.attachmentUrls)
                              return attachments.length > 0 && (
                                <div className="message-attachments">
                                  {attachments.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                      {t('tickets.attachment')} {idx + 1}
                                    </a>
                                  ))}
                                </div>
                              )
                            } catch {
                              return null
                            }
                          })()}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* New Message Form */}
                <div className="new-message-form">
                  <h4>{t('tickets.addMessage')}</h4>
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newMessage.body}
                      onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                      placeholder={t('tickets.messagePlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newMessage.isInternal}
                        onChange={(e) => setNewMessage({ ...newMessage, isInternal: e.target.checked })}
                      />
                      {t('tickets.internalNote')}
                    </label>
                  </div>
                  <button className="btn btn-primary" onClick={handleSendMessage}>
                    <FiSend /> {t('tickets.send')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tickets
