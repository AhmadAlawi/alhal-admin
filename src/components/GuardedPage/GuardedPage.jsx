import React, { useState } from 'react'
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute'
import PermissionRoute from '../PermissionRoute/PermissionRoute'
import Layout from '../Layout/Layout'
import PageErrorBoundary from '../PageErrorBoundary/PageErrorBoundary'

const GuardedPage = ({ children, permission, legacyAdmin, rbacAdmin, pageName }) => {
  const [retryKey, setRetryKey] = useState(0)
  return (
    <ProtectedRoute>
      <Layout>
        <PermissionRoute
          permission={permission}
          legacyAdmin={legacyAdmin}
          rbacAdmin={rbacAdmin}
        >
          <PageErrorBoundary
            key={retryKey}
            pageName={pageName}
            onRetry={() => setRetryKey((k) => k + 1)}
          >
            {children}
          </PageErrorBoundary>
        </PermissionRoute>
      </Layout>
    </ProtectedRoute>
  )
}

export default GuardedPage
