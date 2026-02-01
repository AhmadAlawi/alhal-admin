import React, { useState, useEffect } from 'react'
import { FiBell, FiSend, FiCalendar, FiTrash2, FiX } from 'react-icons/fi'
import { useTranslation } from '../../hooks/useTranslation'
import adminPushNotificationService from '../../services/adminPushNotificationService'
import './AdminPushNotifications.css'

const AdminPushNotifications = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('send')
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Send Now form
  const [sendForm, setSendForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    clickAction: '',
    userSegment: 'All',
    newUsersDays: 7,
    roleName: '',
    userIds: '',
  })

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    clickAction: '',
    scheduledAt: '',
    userSegment: 'All',
    newUsersDays: 7,
    roleName: '',
    userIds: '',
    repeatType: 'None',
    repeatCount: '',
  })

  const fetchScheduled = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminPushNotificationService.listScheduled({ page: 1, pageSize: 20 })
      const items = res?.data ?? res?.items ?? (Array.isArray(res) ? res : [])
      setScheduled(Array.isArray(items) ? items : [])
    } catch (err) {
      setError(err.message || 'Failed to load scheduled notifications')
      setScheduled([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduled()
  }, [])

  const clearMessages = () => {
    setTimeout(() => {
      setError(null)
      setSuccess(null)
    }, 5000)
  }

  const buildPayload = (form, isSchedule = false) => {
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      userSegment: form.userSegment,
    }
    if (form.imageUrl?.trim()) payload.imageUrl = form.imageUrl.trim()
    if (form.clickAction?.trim()) payload.clickAction = form.clickAction.trim()
    if (form.userSegment === 'NewUsers' && form.newUsersDays) {
      payload.newUsersDays = Number(form.newUsersDays) || 7
    }
    if (form.userSegment === 'ByRole' && form.roleName?.trim()) {
      payload.roleName = form.roleName.trim()
    }
    if (form.userSegment === 'SpecificUserIds' && form.userIds?.trim()) {
      payload.userIds = form.userIds.split(',').map((id) => Number(id.trim())).filter(Boolean)
    }
    if (isSchedule) {
      payload.scheduledAt = form.scheduledAt
      payload.repeatType = form.repeatType || 'None'
      if (form.repeatType !== 'None' && form.repeatCount?.trim()) {
        payload.repeatCount = Number(form.repeatCount) || null
      }
    }
    return payload
  }

  const handleSendNow = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = buildPayload(sendForm, false)
      const res = await adminPushNotificationService.sendNow(payload)
      const count = res?.data?.sentCount ?? res?.sentCount ?? 0
      setSuccess(t('dashboard.sendSuccess', { count: String(count) }) || `Notification sent to ${count} devices`)
      setSendForm({ ...sendForm, title: '', body: '' })
      clearMessages()
    } catch (err) {
      setError(err.message || 'Failed to send notification')
      clearMessages()
    } finally {
      setSending(false)
    }
  }

  const handleSchedule = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = buildPayload(scheduleForm, true)
      // Convert datetime-local to ISO UTC string
      if (payload.scheduledAt) {
        payload.scheduledAt = new Date(payload.scheduledAt).toISOString()
      }
      await adminPushNotificationService.schedule(payload)
      setSuccess(t('dashboard.scheduleSuccess') || 'Notification scheduled successfully')
      setScheduleForm({ ...scheduleForm, title: '', body: '', scheduledAt: '' })
      fetchScheduled()
      clearMessages()
    } catch (err) {
      setError(err.message || 'Failed to schedule notification')
      clearMessages()
    } finally {
      setSending(false)
    }
  }

  const handleCancelScheduled = async (id) => {
    if (!window.confirm(t('dashboard.confirmCancelScheduled') || 'Are you sure you want to cancel this scheduled notification?')) return
    setError(null)
    setSuccess(null)
    try {
      await adminPushNotificationService.cancelScheduled(id)
      setSuccess(t('dashboard.cancelSuccess') || 'Scheduled notification cancelled')
      fetchScheduled()
      clearMessages()
    } catch (err) {
      setError(err.message || 'Failed to cancel')
      clearMessages()
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString()
  }

  return (
    <div className="admin-push-notifications card">
      <div className="push-notif-header">
        <h3><FiBell /> {t('dashboard.pushNotifications')}</h3>
        <p className="push-notif-subtitle">{t('dashboard.pushNotificationsSubtitle')}</p>
      </div>

      {error && (
        <div className="push-notif-error">
          <FiX /> {error}
        </div>
      )}
      {success && (
        <div className="push-notif-success">
          <FiSend /> {success}
        </div>
      )}

      <div className="push-notif-tabs">
        <button
          className={`push-notif-tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          <FiSend /> {t('dashboard.sendNow')}
        </button>
        <button
          className={`push-notif-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <FiCalendar /> {t('dashboard.schedule')}
        </button>
        <button
          className={`push-notif-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => { setActiveTab('list'); fetchScheduled() }}
        >
          <FiBell /> {t('dashboard.scheduledList')}
        </button>
      </div>

      {activeTab === 'send' && (
        <form onSubmit={handleSendNow} className="push-notif-form">
          <div className="form-row">
            <label>{t('dashboard.titleLabel')} *</label>
            <input
              type="text"
              value={sendForm.title}
              onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
              required
              placeholder="Notification title"
            />
          </div>
          <div className="form-row">
            <label>{t('dashboard.bodyLabel')} *</label>
            <textarea
              value={sendForm.body}
              onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
              required
              rows={3}
              placeholder="Notification message"
            />
          </div>
          <div className="form-row">
            <label>{t('dashboard.userSegment')}</label>
            <select
              value={sendForm.userSegment}
              onChange={(e) => setSendForm({ ...sendForm, userSegment: e.target.value })}
            >
              <option value="All">{t('dashboard.segmentAll')}</option>
              <option value="NewUsers">{t('dashboard.segmentNewUsers')}</option>
              <option value="ByRole">{t('dashboard.segmentByRole')}</option>
              <option value="SpecificUserIds">{t('dashboard.segmentSpecific')}</option>
            </select>
          </div>
          {sendForm.userSegment === 'NewUsers' && (
            <div className="form-row">
              <label>{t('dashboard.newUsersDays')}</label>
              <input
                type="number"
                min={1}
                value={sendForm.newUsersDays}
                onChange={(e) => setSendForm({ ...sendForm, newUsersDays: e.target.value })}
              />
            </div>
          )}
          {sendForm.userSegment === 'ByRole' && (
            <div className="form-row">
              <label>{t('dashboard.roleName')}</label>
              <input
                type="text"
                value={sendForm.roleName}
                onChange={(e) => setSendForm({ ...sendForm, roleName: e.target.value })}
                placeholder="farmer, trader, transporter"
              />
            </div>
          )}
          {sendForm.userSegment === 'SpecificUserIds' && (
            <div className="form-row">
              <label>{t('dashboard.userIds')}</label>
              <input
                type="text"
                value={sendForm.userIds}
                onChange={(e) => setSendForm({ ...sendForm, userIds: e.target.value })}
                placeholder="1, 2, 3"
              />
            </div>
          )}
          <div className="form-row">
            <label>{t('dashboard.imageUrl')}</label>
            <input
              type="url"
              value={sendForm.imageUrl}
              onChange={(e) => setSendForm({ ...sendForm, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="form-row">
            <label>{t('dashboard.clickAction')}</label>
            <input
              type="text"
              value={sendForm.clickAction}
              onChange={(e) => setSendForm({ ...sendForm, clickAction: e.target.value })}
              placeholder="/dashboard"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? t('common.loading') : <><FiSend /> {t('dashboard.sendNow')}</>}
          </button>
        </form>
      )}

      {activeTab === 'schedule' && (
        <form onSubmit={handleSchedule} className="push-notif-form">
          <div className="form-row">
            <label>{t('dashboard.titleLabel')} *</label>
            <input
              type="text"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
              required
              placeholder="Notification title"
            />
          </div>
          <div className="form-row">
            <label>{t('dashboard.bodyLabel')} *</label>
            <textarea
              value={scheduleForm.body}
              onChange={(e) => setScheduleForm({ ...scheduleForm, body: e.target.value })}
              required
              rows={3}
              placeholder="Notification message"
            />
          </div>
          <div className="form-row">
            <label>{t('dashboard.scheduledAt')} *</label>
            <input
              type="datetime-local"
              value={scheduleForm.scheduledAt}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <label>{t('dashboard.repeatType')}</label>
            <select
              value={scheduleForm.repeatType}
              onChange={(e) => setScheduleForm({ ...scheduleForm, repeatType: e.target.value })}
            >
              <option value="None">{t('dashboard.repeatNone')}</option>
              <option value="Daily">{t('dashboard.repeatDaily')}</option>
              <option value="Weekly">{t('dashboard.repeatWeekly')}</option>
            </select>
          </div>
          {scheduleForm.repeatType !== 'None' && (
            <div className="form-row">
              <label>{t('dashboard.repeatCount')}</label>
              <input
                type="number"
                min={1}
                value={scheduleForm.repeatCount}
                onChange={(e) => setScheduleForm({ ...scheduleForm, repeatCount: e.target.value })}
                placeholder="Leave empty for indefinite"
              />
            </div>
          )}
          <div className="form-row">
            <label>{t('dashboard.userSegment')}</label>
            <select
              value={scheduleForm.userSegment}
              onChange={(e) => setScheduleForm({ ...scheduleForm, userSegment: e.target.value })}
            >
              <option value="All">{t('dashboard.segmentAll')}</option>
              <option value="NewUsers">{t('dashboard.segmentNewUsers')}</option>
              <option value="ByRole">{t('dashboard.segmentByRole')}</option>
              <option value="SpecificUserIds">{t('dashboard.segmentSpecific')}</option>
            </select>
          </div>
          {scheduleForm.userSegment === 'NewUsers' && (
            <div className="form-row">
              <label>{t('dashboard.newUsersDays')}</label>
              <input
                type="number"
                min={1}
                value={scheduleForm.newUsersDays}
                onChange={(e) => setScheduleForm({ ...scheduleForm, newUsersDays: e.target.value })}
              />
            </div>
          )}
          {scheduleForm.userSegment === 'ByRole' && (
            <div className="form-row">
              <label>{t('dashboard.roleName')}</label>
              <input
                type="text"
                value={scheduleForm.roleName}
                onChange={(e) => setScheduleForm({ ...scheduleForm, roleName: e.target.value })}
                placeholder="farmer, trader, transporter"
              />
            </div>
          )}
          {scheduleForm.userSegment === 'SpecificUserIds' && (
            <div className="form-row">
              <label>{t('dashboard.userIds')}</label>
              <input
                type="text"
                value={scheduleForm.userIds}
                onChange={(e) => setScheduleForm({ ...scheduleForm, userIds: e.target.value })}
                placeholder="1, 2, 3"
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? t('common.loading') : <><FiCalendar /> {t('dashboard.schedule')}</>}
          </button>
        </form>
      )}

      {activeTab === 'list' && (
        <div className="push-notif-list">
          {loading ? (
            <p className="push-notif-loading">{t('common.loading')}</p>
          ) : scheduled.length === 0 ? (
            <p className="push-notif-empty">{t('dashboard.noScheduled')}</p>
          ) : (
            <div className="push-notif-table">
              {scheduled.map((item) => (
                <div key={item.scheduledPushNotificationId} className="push-notif-item">
                  <div className="push-notif-item-main">
                    <strong>{item.title}</strong>
                    <p className="push-notif-item-body">{item.body}</p>
                    <div className="push-notif-item-meta">
                      <span>{t('dashboard.scheduledAt')}: {formatDate(item.scheduledAt)}</span>
                      <span>{t('dashboard.userSegment')}: {item.userSegment}</span>
                      {item.repeatType !== 'None' && (
                        <span>{t('dashboard.repeatType')}: {item.repeatType} {item.repeatCount ? `(${item.repeatCount}x)` : '(indefinite)'}</span>
                      )}
                      <span>{t('dashboard.executedCount')}: {item.executedCount}</span>
                      <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span>
                    </div>
                  </div>
                  {item.status === 'Pending' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleCancelScheduled(item.scheduledPushNotificationId)}
                      title={t('dashboard.cancelScheduled')}
                    >
                      <FiTrash2 /> {t('dashboard.cancelScheduled')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPushNotifications
