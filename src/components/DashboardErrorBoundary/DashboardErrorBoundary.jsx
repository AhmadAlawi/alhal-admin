import React from 'react'
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { useTranslation } from '../../hooks/useTranslation'

function DashboardErrorFallback({ error, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="dashboard-error-boundary card">
      <FiAlertCircle size={32} />
      <h2>{t('dashboardErrors.renderError')}</h2>
      <p>{error?.message || t('dashboard.fetchError')}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        <FiRefreshCw /> {t('common.retry')}
      </button>
    </div>
  )
}

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Dashboard render error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <DashboardErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      )
    }
    return this.props.children
  }
}

export default DashboardErrorBoundary
