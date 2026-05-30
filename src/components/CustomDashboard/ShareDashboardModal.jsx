import React, { useEffect, useState } from 'react'
import { FiShare2, FiUsers } from 'react-icons/fi'
import adminService from '../../services/adminService'
import { ShareDashboardError } from '../../services/customDashboardService'
import { useTranslation } from '../../hooks/useTranslation'
import './ShareDashboardModal.css'

const ShareDashboardModal = ({ open, dashboard, onClose, onShare }) => {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rejected, setRejected] = useState([])
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected([])
    setError(null)
    setRejected([])
    let cancelled = false
    setLoading(true)
    adminService
      .getUsers({ page: 1, pageSize: 100 })
      .then((res) => {
        if (cancelled) return
        const list = res?.data?.items ?? res?.data ?? res?.items ?? []
        setUsers(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setUsers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open || !dashboard) return null

  const toggleUser = (id) => {
    const sid = String(id)
    setSelected((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    )
  }

  const handleShare = async () => {
    if (!selected.length) {
      setError(t('customDashboard.selectUsersToShare'))
      return
    }
    setSharing(true)
    setError(null)
    setRejected([])
    try {
      await onShare(selected)
      onClose()
    } catch (e) {
      if (e instanceof ShareDashboardError && e.rejected?.length) {
        setRejected(e.rejected)
      }
      setError(e.message)
    } finally {
      setSharing(false)
    }
  }

  const userLabel = (u) =>
    u.fullName || u.name || u.email || `#${u.userId || u.id}`

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>
            <FiShare2 /> {t('customDashboard.shareDashboard')}
          </h3>
          <p>{dashboard.name}</p>
        </div>

        <p className="share-modal-hint">{t('customDashboard.shareHint')}</p>

        {(dashboard.requiredPermissions || []).length > 0 && (
          <div className="share-perms">
            <span>{t('customDashboard.requiredPermissions')}:</span>
            <div className="share-perm-tags">
              {dashboard.requiredPermissions.map((p) => (
                <span key={p} className="share-perm-tag">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && <div className="share-error">{error}</div>}

        {rejected.length > 0 && (
          <ul className="share-rejected-list">
            {rejected.map((r) => (
              <li key={r.userId}>
                {t('customDashboard.userRejected', { id: r.userId })}:{' '}
                {(r.missingPermissions || []).join(', ')}
              </li>
            ))}
          </ul>
        )}

        <div className="share-user-list">
          {loading && <p>{t('common.loading')}</p>}
          {!loading && users.length === 0 && (
            <p className="share-empty">{t('customDashboard.noUsersFound')}</p>
          )}
          {!loading &&
            users.map((u) => {
              const uid = String(u.userId || u.id)
              const checked = selected.includes(uid)
              const isRejected = rejected.some((r) => String(r.userId) === uid)
              return (
                <label
                  key={uid}
                  className={`share-user-item ${checked ? 'selected' : ''} ${isRejected ? 'rejected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUser(uid)}
                  />
                  <FiUsers />
                  <span>{userLabel(u)}</span>
                </label>
              )
            })}
        </div>

        <div className="share-modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleShare}
            disabled={sharing || !selected.length}
          >
            {sharing ? t('common.loading') : t('customDashboard.share')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareDashboardModal
