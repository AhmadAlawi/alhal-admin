import React from 'react'
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi'

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
        <div className="dashboard-error-boundary card">
          <FiAlertCircle size={32} />
          <h2>تعذر عرض لوحة التحكم</h2>
          <p>{this.state.error?.message || 'حدث خطأ غير متوقع'}</p>
          <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
            <FiRefreshCw /> إعادة المحاولة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default DashboardErrorBoundary
