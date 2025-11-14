import React, { useState, useEffect } from 'react'
import { FiUsers, FiSearch, FiFilter, FiUserCheck, FiUserX, FiShield, FiEye, FiRefreshCw, FiAlertCircle } from 'react-icons/fi'
import adminService from '../services/adminService'
import './Users.css'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserDetail, setSelectedUserDetail] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [userSummary, setUserSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // Available roles (based on the API)
  const availableRoles = ['Farmer', 'Trader', 'Transporter', 'GovEmployee', 'AgriService', 'Admin']

  useEffect(() => {
    fetchUsers()
  }, [currentPage, pageSize])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminService.getUsers({ page: currentPage, pageSize })
      
      // Parse API response structure: { success: true, data: { users: [], pagination: {} } }
      if (response.success && response.data) {
        const usersData = response.data.users || []
        const pagination = response.data.pagination || {}
        
        setUsers(Array.isArray(usersData) ? usersData : [])
        
        // Update pagination state from API response
        if (pagination.totalPages) {
          setTotalPages(pagination.totalPages)
        }
        if (pagination.totalCount) {
          setTotalCount(pagination.totalCount)
        }
        if (pagination.hasNext !== undefined) {
          setHasNext(pagination.hasNext)
        }
        if (pagination.hasPrevious !== undefined) {
          setHasPrevious(pagination.hasPrevious)
        }
      } else {
        // Fallback for different response structures
        const usersData = response.data?.users || response.data?.data || response.data || response || []
        setUsers(Array.isArray(usersData) ? usersData : [])
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError(err.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserActive({ userId, isActive: !currentStatus })
      // Update local state
      setUsers(users.map(user => 
        user.userId === userId ? { ...user, isActive: !currentStatus } : user
      ))
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      alert('Failed to update user status: ' + (err.message || 'Unknown error'))
    }
  }

  const handleAssignRole = async (userId, roleName) => {
    try {
      await adminService.assignRole({ userId, roleName })
      // Refresh user list
      fetchUsers()
      alert(`Role "${roleName}" assigned successfully!`)
    } catch (err) {
      console.error('Failed to assign role:', err)
      alert('Failed to assign role: ' + (err.message || 'Unknown error'))
    }
  }

  const handleRemoveRole = async (userId, roleName) => {
    if (!window.confirm(`Are you sure you want to remove the "${roleName}" role from this user?`)) {
      return
    }
    
    try {
      await adminService.removeRole({ userId, roleName })
      // Refresh user list
      fetchUsers()
      alert(`Role "${roleName}" removed successfully!`)
    } catch (err) {
      console.error('Failed to remove role:', err)
      alert('Failed to remove role: ' + (err.message || 'Unknown error'))
    }
  }

  const handleViewDetails = async (user) => {
    setSelectedUserDetail(user)
    setShowDetailModal(true)
    setLoadingSummary(true)
    
    try {
      // Fetch user summary
      const summary = await adminService.getUserSummary({ userId: user.userId })
      setUserSummary(summary.data || summary)
    } catch (err) {
      console.error('Failed to fetch user summary:', err)
      setUserSummary(null)
    } finally {
      setLoadingSummary(false)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedUserDetail(null)
    setUserSummary(null)
  }

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (user.fullName && user.fullName.toLowerCase().includes(search)) ||
      (user.email && user.email.toLowerCase().includes(search)) ||
      (user.phone && user.phone.toLowerCase().includes(search)) ||
      (user.userId && user.userId.toString().includes(search))
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiUsers /> User Management
          </h1>
          <p className="page-subtitle">Manage users, roles, and permissions</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchUsers}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section card">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="page-size-selector">
          <label>Show:</label>
          <select value={pageSize} onChange={(e) => {
            setPageSize(Number(e.target.value))
            setCurrentPage(1)
          }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <FiAlertCircle /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message card">
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="users-table-container card">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.userId}>
                      <td className="user-id">#{user.userId}</td>
                      <td className="user-name">{user.fullName || 'N/A'}</td>
                      <td className="user-email">{user.email || 'N/A'}</td>
                      <td className="user-phone">{user.phone || 'N/A'}</td>
                      <td className="user-roles">
                        {user.roles && user.roles.length > 0 ? (
                          <div className="roles-list">
                            {user.roles.map((role, idx) => (
                              <span key={idx} className="role-badge">
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">No roles</span>
                        )}
                      </td>
                      <td className="user-status">
                        <div className="status-badges">
                          <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {user.isBlocked && (
                            <span className="status-badge status-danger" title="User is blocked">
                              Blocked
                            </span>
                          )}
                          {user.isBlacklisted && (
                            <span className="status-badge status-danger" title="User is blacklisted">
                              Blacklisted
                            </span>
                          )}
                          {!user.isVerified && (
                            <span className="status-badge status-inactive" title="User not verified">
                              Unverified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="user-created">{formatDate(user.createdAt)}</td>
                      <td className="user-actions">
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-primary"
                            onClick={() => handleViewDetails(user)}
                            title="View Details"
                          >
                            <FiEye />
                          </button>
                          <button
                            className={`btn-icon ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleActive(user.userId, user.isActive)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <FiUserX /> : <FiUserCheck />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!hasPrevious && currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages} ({totalCount} total users)
              </span>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={!hasNext && currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {showDetailModal && selectedUserDetail && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiUsers /> User Details
              </h2>
              <button className="modal-close" onClick={closeDetailModal}>×</button>
            </div>
            
            <div className="modal-body">
              {/* User Info */}
              <div className="detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>User ID:</label>
                    <span>#{selectedUserDetail.userId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{selectedUserDetail.fullName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedUserDetail.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedUserDetail.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedUserDetail.isActive ? 'status-active' : 'status-inactive'}`}>
                      {selectedUserDetail.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Verified:</label>
                    <span className={`status-badge ${selectedUserDetail.isVerified ? 'status-active' : 'status-inactive'}`}>
                      {selectedUserDetail.isVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Blocked:</label>
                    <span className={`status-badge ${selectedUserDetail.isBlocked ? 'status-danger' : 'status-active'}`}>
                      {selectedUserDetail.isBlocked ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Blacklisted:</label>
                    <span className={`status-badge ${selectedUserDetail.isBlacklisted ? 'status-danger' : 'status-active'}`}>
                      {selectedUserDetail.isBlacklisted ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Registration Complete:</label>
                    <span className={`status-badge ${selectedUserDetail.isRegistrationComplete ? 'status-active' : 'status-inactive'}`}>
                      {selectedUserDetail.isRegistrationComplete ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Documents Approved:</label>
                    <span className={`status-badge ${selectedUserDetail.isDocumentsApproved ? 'status-active' : 'status-inactive'}`}>
                      {selectedUserDetail.isDocumentsApproved ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Created At:</label>
                    <span>{formatDate(selectedUserDetail.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Roles Management */}
              <div className="detail-section">
                <h3><FiShield /> Roles Management</h3>
                <div className="roles-management">
                  <div className="current-roles">
                    <h4>Current Roles:</h4>
                    {selectedUserDetail.roles && selectedUserDetail.roles.length > 0 ? (
                      <div className="roles-list">
                        {selectedUserDetail.roles.map((role, idx) => (
                          <div key={idx} className="role-item">
                            <span className="role-badge">{role}</span>
                            <button
                              className="btn-remove-role"
                              onClick={() => handleRemoveRole(selectedUserDetail.userId, role)}
                              title="Remove role"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No roles assigned</p>
                    )}
                  </div>
                  
                  <div className="add-role">
                    <h4>Assign New Role:</h4>
                    <div className="role-buttons">
                      {availableRoles
                        .filter(role => !selectedUserDetail.roles?.includes(role))
                        .map((role, idx) => (
                          <button
                            key={idx}
                            className="btn btn-outline btn-sm"
                            onClick={() => handleAssignRole(selectedUserDetail.userId, role)}
                          >
                            + {role}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Activity Summary */}
              {loadingSummary ? (
                <div className="detail-section">
                  <p>Loading user activity...</p>
                </div>
              ) : userSummary?.data ? (
                <div className="detail-section">
                  <h3>Activity Summary</h3>
                  <div className="activity-grid">
                    {userSummary.data.auctions && (
                      <div className="activity-card">
                        <h4>Auctions</h4>
                        <div className="activity-stats">
                          <div className="stat">
                            <span>Open:</span>
                            <strong>{userSummary.data.auctions.openAuctions || 0}</strong>
                          </div>
                          <div className="stat">
                            <span>Closed:</span>
                            <strong>{userSummary.data.auctions.closedAuctions || 0}</strong>
                          </div>
                          <div className="stat">
                            <span>Total Bids:</span>
                            <strong>{userSummary.data.auctions.totalBidsOnAuctions || 0}</strong>
                          </div>
                          <div className="stat">
                            <span>Winning Sum:</span>
                            <strong>${(userSummary.data.auctions.winningSum || 0).toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {userSummary.data.tenders && (
                      <div className="activity-card">
                        <h4>Tenders</h4>
                        <div className="activity-stats">
                          <div className="stat">
                            <span>Open:</span>
                            <strong>{userSummary.data.tenders.openTenders || 0}</strong>
                          </div>
                          <div className="stat">
                            <span>Closed:</span>
                            <strong>{userSummary.data.tenders.closedTenders || 0}</strong>
                          </div>
                          <div className="stat">
                            <span>Offers Received:</span>
                            <strong>{userSummary.data.tenders.offersReceived || 0}</strong>
                          </div>
                          <div className="stat">
                            <span>Awarded Value:</span>
                            <strong>${(userSummary.data.tenders.awardedValue || 0).toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {userSummary.data.directSale && (
                      <div className="activity-card">
                        <h4>Direct Sales</h4>
                        <div className="activity-stats">
                          {userSummary.data.directSale.seller && (
                            <>
                              <div className="stat">
                                <span>Sold Orders:</span>
                                <strong>{userSummary.data.directSale.seller.soldOrdersCount || 0}</strong>
                              </div>
                              <div className="stat">
                                <span>Sold Value:</span>
                                <strong>${(userSummary.data.directSale.seller.soldValue || 0).toLocaleString()}</strong>
                              </div>
                            </>
                          )}
                          {userSummary.data.directSale.buyer && (
                            <>
                              <div className="stat">
                                <span>Bought Orders:</span>
                                <strong>{userSummary.data.directSale.buyer.boughtOrdersCount || 0}</strong>
                              </div>
                              <div className="stat">
                                <span>Bought Value:</span>
                                <strong>${(userSummary.data.directSale.buyer.boughtValue || 0).toLocaleString()}</strong>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {userSummary.data.period && (
                    <p className="summary-period">
                      Period: {formatDate(userSummary.data.period.from)} - {formatDate(userSummary.data.period.to)}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="detail-section">
                <div className="detail-actions">
                  <button
                    className={`btn ${selectedUserDetail.isActive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => {
                      handleToggleActive(selectedUserDetail.userId, selectedUserDetail.isActive)
                      closeDetailModal()
                    }}
                  >
                    {selectedUserDetail.isActive ? (
                      <><FiUserX /> Deactivate User</>
                    ) : (
                      <><FiUserCheck /> Activate User</>
                    )}
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

export default Users
