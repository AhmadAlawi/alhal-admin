import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiX, FiCheck, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    isSupported
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.url) {
      window.location.href = notification.url;
    }
  };

  // Handle request permission
  const handleRequestPermission = async () => {
    // For testing, use userId 5
    const userId = 5;
    localStorage.setItem('userId', '5');
    console.log('User ID set to 5 for testing');
    
    // Request permission and register device with userId 5
    await requestPermission(userId);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <div className="notifications-actions">
              {notifications.length > 0 && (
                <>
                  <button
                    className="icon-button"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <FiCheck />
                  </button>
                  <button
                    className="icon-button"
                    onClick={clearAll}
                    title="Clear all"
                  >
                    <FiTrash2 />
                  </button>
                </>
              )}
              <button
                className="icon-button"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="notifications-body">
            {permission === 'default' && (
              <div className="notification-permission-request">
                <p>Enable notifications to receive updates</p>
                <button
                  className="btn btn-primary"
                  onClick={handleRequestPermission}
                >
                  Enable Notifications
                </button>
              </div>
            )}

            {permission === 'denied' && (
              <div className="notification-permission-denied">
                <p>Notifications are blocked. Please enable them in your browser settings.</p>
              </div>
            )}

            {permission === 'granted' && (
              <>
                {notifications.length === 0 ? (
                  <div className="notifications-empty">
                    <FiBell className="empty-icon" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-content">
                          {notification.icon && (
                            <img
                              src={notification.icon}
                              alt=""
                              className="notification-icon"
                            />
                          )}
                          <div className="notification-text">
                            <h4 className="notification-title">{notification.title}</h4>
                            <p className="notification-body">{notification.body}</p>
                            <span className="notification-time">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="notification-actions">
                          {!notification.read && (
                            <button
                              className="icon-button-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              title="Mark as read"
                            >
                              <FiCheck />
                            </button>
                          )}
                          <button
                            className="icon-button-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            title="Remove"
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;

