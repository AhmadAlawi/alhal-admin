import React, { useEffect, useState } from 'react'
import { FiTrendingUp, FiSearch, FiRefreshCw, FiEye, FiXCircle, FiX } from 'react-icons/fi'
import auctionsService from '../services/auctionsService'
import { useTranslation } from '../hooks/useTranslation'
import { useCurrency } from '../contexts/CurrencyContext'
import './TransportRequests.css'
import './transport-shared.css'

function normalizeAuctionListItem(row) {
  if (!row || typeof row !== 'object') return null
  return {
    auctionId: row.auctionId ?? row.AuctionId,
    title: row.auctionTitle ?? row.AuctionTitle,
    status: row.status ?? row.Status ?? '',
    startTime: row.startTime ?? row.StartTime,
    endTime: row.endTime ?? row.EndTime,
    startingPrice: row.startingPrice ?? row.StartingPrice,
    currentPrice: row.currentPrice ?? row.CurrentPrice,
    bidsCount: row.bidsCount ?? row.BidsCount ?? 0,
    productNameAr: row.productNameAr ?? row.ProductNameAr,
    sellerName: row.sellerName ?? row.SellerName,
    sellerUserId: row.sellerUserId ?? row.SellerUserId,
  }
}

function extractAuctionList(response) {
  const root = response?.data?.data ?? response?.data ?? response
  const items = root?.Items ?? root?.items ?? []
  return {
    items: items.map(normalizeAuctionListItem).filter(Boolean),
    total: root?.TotalCount ?? root?.totalCount ?? items.length,
    totalPages: root?.TotalPages ?? root?.totalPages ?? 1,
  }
}

function normalizeAuctionDetail(row) {
  if (!row || typeof row !== 'object') return null
  return {
    ...row,
    auctionId: row.auctionId ?? row.AuctionId,
    title: row.auctionTitle ?? row.AuctionTitle,
    description: row.auctionDescription ?? row.AuctionDescription,
    status: row.status ?? row.Status ?? '',
    startTime: row.startTime ?? row.StartTime,
    endTime: row.endTime ?? row.EndTime,
    startingPrice: row.startingPrice ?? row.StartingPrice,
    currentPrice: row.currentPrice ?? row.CurrentPrice,
    winnerUserId: row.winnerUserId ?? row.WinnerUserId,
    sellerUserId: row.sellerUserId ?? row.SellerUserId,
    sellerName: row.sellerName ?? row.SellerName,
  }
}

function normalizeBid(row) {
  if (!row || typeof row !== 'object') return null
  return {
    bidId: row.bidId ?? row.BidId,
    bidderUserId: row.bidderUserId ?? row.BidderUserId,
    bidAmount: row.bidAmount ?? row.BidAmount,
    createdAt: row.createdAt ?? row.CreatedAt,
  }
}

const Auctions = () => {
  const { t } = useTranslation()
  const { formatMoney } = useCurrency()
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [selectedBids, setSelectedBids] = useState([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [closingId, setClosingId] = useState(null)

  useEffect(() => {
    fetchAuctions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, statusFilter])

  const fetchAuctions = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = { page: currentPage, pageSize }
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchTerm) params.searchTerm = searchTerm
      const response = await auctionsService.listAuctions(params)
      const parsed = extractAuctionList(response)
      setAuctions(parsed.items)
      setTotalPages(Math.max(1, Number(parsed.totalPages) || 1))
      setTotalCount(Number(parsed.total) || 0)
    } catch (err) {
      console.error('Failed to fetch auctions:', err)
      setError(err.message || t('auctions.error.load'))
      setAuctions([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (auction) => {
    try {
      const [detailRes, bidsRes] = await Promise.all([
        auctionsService.getAuction(auction.auctionId),
        auctionsService.getBids(auction.auctionId).catch(() => null),
      ])
      const detailRoot = detailRes?.data?.data ?? detailRes?.data ?? detailRes
      const bidsRoot = bidsRes ? (bidsRes?.data?.data ?? bidsRes?.data ?? bidsRes) : []
      const bidsList = Array.isArray(bidsRoot) ? bidsRoot : bidsRoot?.items ?? bidsRoot?.Items ?? []
      setSelectedAuction(normalizeAuctionDetail(detailRoot) || auction)
      setSelectedBids(bidsList.map(normalizeBid).filter(Boolean))
      setShowDetailModal(true)
    } catch (err) {
      console.error('Failed to fetch auction details:', err)
      setSelectedAuction(auction)
      setSelectedBids([])
      setShowDetailModal(true)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedAuction(null)
    setSelectedBids([])
  }

  const handleForceClose = async (auctionId) => {
    if (!window.confirm(t('auctions.confirmForceClose'))) return
    try {
      setClosingId(auctionId)
      await auctionsService.forceCloseAuction(auctionId)
      alert(t('auctions.forceCloseSuccess'))
      setShowDetailModal(false)
      fetchAuctions()
    } catch (err) {
      console.error('Failed to force-close auction:', err)
      alert(t('auctions.forceCloseError') + ': ' + (err.message || 'Unknown error'))
    } finally {
      setClosingId(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const key = typeof status === 'string' ? status.toLowerCase() : ''
    const statusMap = {
      open: { class: 'badge-info', label: t('auctions.status.open') },
      closed: { class: 'badge-success', label: t('auctions.status.closed') },
      cancelled: { class: 'badge-danger', label: t('auctions.status.cancelled') },
    }
    const statusInfo = statusMap[key] || { class: 'badge-secondary', label: key || '—' }
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  if (loading && auctions.length === 0 && !error) {
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
            <FiTrendingUp /> {t('auctions.title')}
          </h1>
          <p className="page-subtitle">{t('auctions.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchAuctions}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <FiX /> {error}
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={fetchAuctions}
            style={{ marginLeft: '1rem' }}
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="filters-section card">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder={t('auctions.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1)
                    fetchAuctions()
                  }
                }}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <label>{t('auctions.status.label')}:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="filter-select"
              >
                <option value="all">{t('common.all')}</option>
                <option value="open">{t('auctions.status.open')}</option>
                <option value="closed">{t('auctions.status.closed')}</option>
                <option value="cancelled">{t('auctions.status.cancelled')}</option>
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
                  <th>{t('auctions.id')}</th>
                  <th>{t('auctions.titleColumn')}</th>
                  <th>{t('auctions.product')}</th>
                  <th>{t('auctions.seller')}</th>
                  <th>{t('auctions.startingPrice')}</th>
                  <th>{t('auctions.currentPrice')}</th>
                  <th>{t('auctions.bids')}</th>
                  <th>{t('auctions.status.label')}</th>
                  <th>{t('auctions.endTime')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {auctions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-data">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  auctions.map((auction) => (
                    <tr key={auction.auctionId}>
                      <td>{auction.auctionId ?? '—'}</td>
                      <td>{auction.title ?? '—'}</td>
                      <td>{auction.productNameAr ?? '—'}</td>
                      <td>{auction.sellerName ?? auction.sellerUserId ?? '—'}</td>
                      <td>{auction.startingPrice != null ? formatMoney(auction.startingPrice) : '—'}</td>
                      <td>{auction.currentPrice != null ? formatMoney(auction.currentPrice) : '—'}</td>
                      <td>{auction.bidsCount ?? 0}</td>
                      <td>{getStatusBadge(auction.status)}</td>
                      <td>{formatDate(auction.endTime)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-icon"
                            onClick={() => handleViewDetails(auction)}
                            title={t('common.view')}
                          >
                            <FiEye />
                          </button>
                          {auction.status?.toLowerCase() === 'open' && (
                            <button
                              className="btn btn-sm btn-icon btn-danger"
                              onClick={() => handleForceClose(auction.auctionId)}
                              disabled={closingId === auction.auctionId}
                              title={t('auctions.forceClose')}
                            >
                              <FiXCircle />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {Number(totalPages) > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                {t('common.previous')}
              </button>
              <span className="pagination-info">
                {t('common.page')} {currentPage} {t('common.of')} {Number(totalPages)}
                {totalCount > 0 ? ` (${totalCount})` : ''}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentPage((p) => Math.min(Number(totalPages), p + 1))}
                disabled={currentPage >= Number(totalPages)}
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedAuction && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('auctions.details')}</h2>
              <button className="modal-close" onClick={closeDetailModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>{t('auctions.basicInfo')}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('auctions.id')}</label>
                    <span>{selectedAuction.auctionId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.titleColumn')}</label>
                    <span>{selectedAuction.title || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.seller')}</label>
                    <span>{selectedAuction.sellerName || selectedAuction.sellerUserId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.winner')}</label>
                    <span>{selectedAuction.winnerUserId || t('auctions.noWinnerYet')}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.startingPrice')}</label>
                    <span>{selectedAuction.startingPrice != null ? formatMoney(selectedAuction.startingPrice) : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.currentPrice')}</label>
                    <span>{selectedAuction.currentPrice != null ? formatMoney(selectedAuction.currentPrice) : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.status.label')}</label>
                    <span>{getStatusBadge(selectedAuction.status)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.startTime')}</label>
                    <span>{formatDate(selectedAuction.startTime)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('auctions.endTime')}</label>
                    <span>{formatDate(selectedAuction.endTime)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>{t('auctions.bids')} ({selectedBids.length})</h3>
                {selectedBids.length === 0 ? (
                  <p>{t('auctions.noBids')}</p>
                ) : (
                  <div className="offers-list">
                    {selectedBids
                      .slice()
                      .sort((a, b) => (b.bidAmount ?? 0) - (a.bidAmount ?? 0))
                      .map((bid) => (
                        <div key={bid.bidId} className="offer-item">
                          <div className="offer-header">
                            <strong>{t('auctions.bidder')} #{bid.bidderUserId}</strong>
                            <span>{formatMoney(bid.bidAmount)}</span>
                          </div>
                          <div className="offer-details">
                            <span>{formatDate(bid.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {selectedAuction.status?.toLowerCase() === 'open' && (
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleForceClose(selectedAuction.auctionId)}
                    disabled={closingId === selectedAuction.auctionId}
                  >
                    <FiXCircle /> {t('auctions.forceClose')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Auctions
