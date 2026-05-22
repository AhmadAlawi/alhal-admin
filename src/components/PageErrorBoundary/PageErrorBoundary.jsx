import React from 'react'
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi'

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error(`Page error (${this.props.pageName || 'unknown'}):`, error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-error-boundary card">
          <FiAlertCircle size={28} />
          <h2>حدث خطأ في الصفحة</h2>
          <p>{this.state.error?.message || 'تعذر عرض المحتوى'}</p>
          <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
            <FiRefreshCw /> إعادة المحاولة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default PageErrorBoundary
