import React, { useState, useEffect } from 'react'
import { FiStar, FiFilter, FiRefreshCw, FiEye, FiUser, FiMessageSquare, FiAlertCircle, FiX } from 'react-icons/fi'
import feedbackService from '../services/feedbackService'
import { useTranslation } from '../hooks/useTranslation'
import './Feedback.css'

const Feedback = () => {
  const { t } = useTranslation()
  
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [userIdFilter, setUserIdFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('')
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  
  // Selected feedback for detail view
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [ratingSummary, setRatingSummary] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const feedbackTypes = [
    { value: 'general', label: t('feedback.general') },
    { value: 'communication', label: t('feedback.communication') },
    { value: 'delivery', label: t('feedback.delivery') },
    { value: 'product_quality', label: t('feedback.productQuality') },
    { value: 'service', label: t('feedback.service') }
  ]

  const ratingOptions = [
    { value: '5', label: '⭐⭐⭐⭐⭐ (5)' },
    { value: '4', label: '⭐⭐⭐⭐ (4)' },
    { value: '3', label: '⭐⭐⭐ (3)' },
    { value: '2', label: '⭐⭐ (2)' },
    { value: '1', label: '⭐ (1)' }
  ]

  useEffect(() => {
    // For admin view, we'll show all feedbacks
    // In a real app, you'd have an endpoint to get all feedbacks
    // For now, we'll use a placeholder or fetch from a specific user
    fetchFeedbacks()
  }, [userIdFilter, ratingFilter, feedbackTypeFilter, showPublicOnly, showVerifiedOnly])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // If userIdFilter is set, fetch feedbacks for that user
      if (userIdFilter) {
        const response = await feedbackService.getFeedbacksReceived(Number(userIdFilter))
        if (response.success && response.data) {
          let feedbacksData = response.data.feedbacks || response.data || []
          
          // Apply filters
          if (ratingFilter) {
            feedbacksData = feedbacksData.filter(f => f.rating === Number(ratingFilter))
          }
          if (feedbackTypeFilter) {
            feedbacksData = feedbacksData.filter(f => f.feedbackType === feedbackTypeFilter)
          }
          if (showPublicOnly) {
            feedbacksData = feedbacksData.filter(f => f.isPublic === true)
          }
          if (showVerifiedOnly) {
            feedbacksData = feedbacksData.filter(f => f.isVerified === true)
          }
          
          setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : [])
        } else {
          setFeedbacks([])
        }
      } else {
        // No user filter - show empty or placeholder
        setFeedbacks([])
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err)
      setError(err.message || 'Failed to load feedbacks')
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (feedbackId) => {
    try {
      const response = await feedbackService.getFeedback(feedbackId)
      if (response.success && response.data) {
        setSelectedFeedback(response.data)
        setShowDetailModal(true)
        
        // Fetch rating summary for the user who received the feedback
        if (response.data.givenToUserId) {
          await fetchRatingSummary(response.data.givenToUserId)
        }
      }
    } catch (err) {
      console.error('Failed to fetch feedback details:', err)
      alert('Failed to load feedback details: ' + (err.message || 'Unknown error'))
    }
  }

  const fetchRatingSummary = async (userId) => {
    try {
      setLoadingSummary(true)
      const response = await feedbackService.getUserRatingSummary(userId)
      if (response.success && response.data) {
        setRatingSummary(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch rating summary:', err)
      setRatingSummary(null)
    } finally {
      setLoadingSummary(false)
    }
  }

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const getFeedbackTypeLabel = (type) => {
    const found = feedbackTypes.find(ft => ft.value === type)
    return found ? found.label : type
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="feedback-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('feedback.title')}</h1>
          <p className="page-subtitle">{t('feedback.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchFeedbacks}>
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
            <label>{t('feedback.userId')}</label>
            <input
              type="number"
              className="filter-select"
              placeholder={t('feedback.userIdPlaceholder')}
              value={userIdFilter}
              onChange={(e) => {
                setUserIdFilter(e.target.value || '')
              }}
            />
            <small className="filter-hint">{t('feedback.userIdHint')}</small>
          </div>

          <div className="filter-group">
            <label>{t('feedback.rating')}</label>
            <select
              className="filter-select"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="">{t('common.all')}</option>
              {ratingOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('feedback.feedbackType')}</label>
            <select
              className="filter-select"
              value={feedbackTypeFilter}
              onChange={(e) => setFeedbackTypeFilter(e.target.value)}
            >
              <option value="">{t('common.all')}</option>
              {feedbackTypes.map(ft => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showPublicOnly}
                onChange={(e) => setShowPublicOnly(e.target.checked)}
              />
              {t('feedback.publicOnly')}
            </label>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
              />
              {t('feedback.verifiedOnly')}
            </label>
          </div>
        </div>
      </div>

      {/* Rating Summary (if user filter is set) */}
      {userIdFilter && ratingSummary && (
        <div className="rating-summary card">
          <h3>{t('feedback.ratingSummary')} - User #{userIdFilter}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <label>{t('feedback.averageRating')}</label>
              <span className="summary-value large">
                {ratingSummary.averageRating?.toFixed(1) || '0.0'} ⭐
              </span>
            </div>
            <div className="summary-item">
              <label>{t('feedback.totalRatings')}</label>
              <span className="summary-value">{ratingSummary.totalRatings || 0}</span>
            </div>
            <div className="summary-item">
              <label>5 ⭐</label>
              <span className="summary-value">{ratingSummary.rating5Count || 0}</span>
            </div>
            <div className="summary-item">
              <label>4 ⭐</label>
              <span className="summary-value">{ratingSummary.rating4Count || 0}</span>
            </div>
            <div className="summary-item">
              <label>3 ⭐</label>
              <span className="summary-value">{ratingSummary.rating3Count || 0}</span>
            </div>
            <div className="summary-item">
              <label>2 ⭐</label>
              <span className="summary-value">{ratingSummary.rating2Count || 0}</span>
            </div>
            <div className="summary-item">
              <label>1 ⭐</label>
              <span className="summary-value">{ratingSummary.rating1Count || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Feedbacks Table */}
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
        ) : !userIdFilter ? (
          <div className="empty-state">
            <FiUser />
            <p>{t('feedback.enterUserId')}</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state">
            <FiStar />
            <p>{t('common.noData')}</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('feedback.feedbackId')}</th>
                    <th>{t('feedback.rating')}</th>
                    <th>{t('feedback.feedbackType')}</th>
                    <th>{t('feedback.givenBy')}</th>
                    <th>{t('feedback.givenTo')}</th>
                    <th>{t('feedback.comment')}</th>
                    <th>{t('feedback.isPublic')}</th>
                    <th>{t('feedback.isVerified')}</th>
                    <th>{t('feedback.createdAt')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((feedback) => (
                    <tr key={feedback.feedbackId}>
                      <td>#{feedback.feedbackId}</td>
                      <td>
                        <span className="rating-display">
                          {getRatingStars(feedback.rating)} ({feedback.rating})
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-type">
                          {getFeedbackTypeLabel(feedback.feedbackType)}
                        </span>
                      </td>
                      <td>#{feedback.givenByUserId}</td>
                      <td>{feedback.givenToUserId ? `#${feedback.givenToUserId}` : '-'}</td>
                      <td className="comment-cell">
                        {feedback.comment ? (
                          feedback.comment.length > 50 
                            ? `${feedback.comment.substring(0, 50)}...` 
                            : feedback.comment
                        ) : '-'}
                      </td>
                      <td>
                        {feedback.isPublic ? (
                          <span className="badge badge-success">{t('common.yes')}</span>
                        ) : (
                          <span className="badge badge-default">{t('common.no')}</span>
                        )}
                      </td>
                      <td>
                        {feedback.isVerified ? (
                          <span className="badge badge-verified">{t('common.yes')}</span>
                        ) : (
                          <span className="badge badge-default">{t('common.no')}</span>
                        )}
                      </td>
                      <td>{formatDate(feedback.createdAt)}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => handleViewDetails(feedback.feedbackId)}
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
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('feedback.feedbackDetails')} #{selectedFeedback.feedbackId}</h2>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>{t('feedback.basicInfo')}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('feedback.rating')}</label>
                    <span className="rating-display large">
                      {getRatingStars(selectedFeedback.rating)} ({selectedFeedback.rating}/5)
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('feedback.feedbackType')}</label>
                    <span>{getFeedbackTypeLabel(selectedFeedback.feedbackType)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('feedback.comment')}</label>
                    <span>{selectedFeedback.comment || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('feedback.givenBy')}</label>
                    <span>#{selectedFeedback.givenByUserId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('feedback.givenTo')}</label>
                    <span>{selectedFeedback.givenToUserId ? `#${selectedFeedback.givenToUserId}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('feedback.conversationId')}</label>
                    <span>#{selectedFeedback.conversationId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('feedback.isPublic')}</label>
                    <span>{selectedFeedback.isPublic ? t('common.yes') : t('common.no')}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('feedback.isVerified')}</label>
                    <span>
                      {selectedFeedback.isVerified ? (
                        <span className="badge badge-verified">{t('common.yes')}</span>
                      ) : (
                        t('common.no')
                      )}
                    </span>
                  </div>
                  {selectedFeedback.relatedOrderId && (
                    <div className="detail-item">
                      <label>{t('feedback.relatedOrder')}</label>
                      <span>#{selectedFeedback.relatedOrderId}</span>
                    </div>
                  )}
                  {selectedFeedback.relatedAuctionId && (
                    <div className="detail-item">
                      <label>{t('feedback.relatedAuction')}</label>
                      <span>#{selectedFeedback.relatedAuctionId}</span>
                    </div>
                  )}
                  {selectedFeedback.relatedTenderId && (
                    <div className="detail-item">
                      <label>{t('feedback.relatedTender')}</label>
                      <span>#{selectedFeedback.relatedTenderId}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>{t('feedback.createdAt')}</label>
                    <span>{formatDate(selectedFeedback.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Rating Summary */}
              {ratingSummary && (
                <div className="detail-section">
                  <h3>{t('feedback.userRatingSummary')}</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <label>{t('feedback.averageRating')}</label>
                      <span className="summary-value large">
                        {ratingSummary.averageRating?.toFixed(1) || '0.0'} ⭐
                      </span>
                    </div>
                    <div className="summary-item">
                      <label>{t('feedback.totalRatings')}</label>
                      <span className="summary-value">{ratingSummary.totalRatings || 0}</span>
                    </div>
                    <div className="summary-item">
                      <label>5 ⭐</label>
                      <span className="summary-value">{ratingSummary.rating5Count || 0}</span>
                    </div>
                    <div className="summary-item">
                      <label>4 ⭐</label>
                      <span className="summary-value">{ratingSummary.rating4Count || 0}</span>
                    </div>
                    <div className="summary-item">
                      <label>3 ⭐</label>
                      <span className="summary-value">{ratingSummary.rating3Count || 0}</span>
                    </div>
                    <div className="summary-item">
                      <label>2 ⭐</label>
                      <span className="summary-value">{ratingSummary.rating2Count || 0}</span>
                    </div>
                    <div className="summary-item">
                      <label>1 ⭐</label>
                      <span className="summary-value">{ratingSummary.rating1Count || 0}</span>
                    </div>
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

export default Feedback
