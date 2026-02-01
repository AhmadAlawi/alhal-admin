import apiClient from './api';

const BASE = '/api/admin/push-notifications';

/**
 * Admin Push Notification Service
 * Send notifications on demand, schedule for later, target user segments.
 * @see ADMIN_PUSH_NOTIFICATION_DOCUMENTATION.md
 */
export const adminPushNotificationService = {
  /**
   * Send push notification immediately
   * @param {object} dto - AdminPushNotificationDto
   * @param {string} dto.title - Notification title
   * @param {string} dto.body - Notification body
   * @param {string} [dto.imageUrl] - Optional image URL
   * @param {string} [dto.clickAction] - Deep link or action when user taps
   * @param {object} [dto.data] - Additional key-value data
   * @param {string} [dto.userSegment] - All | NewUsers | ByRole | SpecificUserIds
   * @param {number} [dto.newUsersDays] - For NewUsers: registered in last N days
   * @param {string} [dto.roleName] - For ByRole: farmer, trader, transporter, etc.
   * @param {number[]} [dto.userIds] - For SpecificUserIds: list of user IDs
   */
  sendNow: (dto) => apiClient.post(`${BASE}/send`, dto),

  /**
   * Schedule push notification for later
   * @param {object} dto - ScheduleAdminPushNotificationDto
   * @param {string} dto.title - Notification title
   * @param {string} dto.body - Notification body
   * @param {string} dto.scheduledAt - ISO datetime (UTC)
   * @param {string} [dto.imageUrl] - Optional image URL
   * @param {string} [dto.clickAction] - Deep link or action
   * @param {object} [dto.data] - Additional data
   * @param {string} [dto.userSegment] - All | NewUsers | ByRole | SpecificUserIds
   * @param {number} [dto.newUsersDays] - For NewUsers
   * @param {string} [dto.roleName] - For ByRole
   * @param {number[]} [dto.userIds] - For SpecificUserIds
   * @param {string} [dto.repeatType] - None | Daily | Weekly
   * @param {number} [dto.repeatCount] - How many times to repeat (null = indefinite)
   */
  schedule: (dto) => apiClient.post(`${BASE}/schedule`, dto),

  /**
   * List scheduled notifications
   * @param {object} params - Query params
   * @param {string} [params.status] - Pending | Completed | Cancelled
   * @param {number} [params.page] - Page number
   * @param {number} [params.pageSize] - Items per page
   */
  listScheduled: (params = {}) => apiClient.get(`${BASE}/scheduled`, params),

  /**
   * Cancel a pending scheduled notification
   * @param {number} id - ScheduledPushNotificationId
   */
  cancelScheduled: (id) => apiClient.delete(`${BASE}/scheduled/${id}`),
};

export default adminPushNotificationService;
