import React, { useMemo } from 'react'
import { FiShoppingCart, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Table from '../components/Table/Table'
import { useTranslation } from '../hooks/useTranslation'
import './Orders.css'

const STATUS_KEYS = {
  Completed: 'orders.completed',
  Processing: 'orders.processing',
  Shipped: 'orders.shipped',
  Pending: 'orders.pending',
  Cancelled: 'orders.cancelled',
}

const Orders = () => {
  const { t } = useTranslation()

  const orders = [
    { id: '#ORD-001', customer: 'John Doe', date: '2024-11-10', items: 3, total: '$1,547', status: 'Completed' },
    { id: '#ORD-002', customer: 'Jane Smith', date: '2024-11-11', items: 1, total: '$49', status: 'Processing' },
    { id: '#ORD-003', customer: 'Bob Johnson', date: '2024-11-11', items: 2, total: '$758', status: 'Shipped' },
    { id: '#ORD-004', customer: 'Alice Brown', date: '2024-11-12', items: 5, total: '$2,394', status: 'Pending' },
    { id: '#ORD-005', customer: 'Charlie Wilson', date: '2024-11-12', items: 1, total: '$79', status: 'Cancelled' },
  ]

  const tableColumns = useMemo(
    () => [
      { header: t('orders.orderId'), accessor: 'id' },
      { header: t('common.customer'), accessor: 'customer' },
      { header: t('common.date'), accessor: 'date' },
      { header: t('common.items'), accessor: 'items' },
      { header: t('common.total'), accessor: 'total' },
      {
        header: t('common.status'),
        accessor: 'status',
        render: (value) => {
          const statusClass =
            value === 'Completed'
              ? 'badge-success'
              : value === 'Processing' || value === 'Shipped'
                ? 'badge-warning'
                : value === 'Pending'
                  ? 'badge-primary'
                  : 'badge-danger'
          const label = STATUS_KEYS[value] ? t(STATUS_KEYS[value]) : value
          return <span className={`badge ${statusClass}`}>{label}</span>
        },
      },
      {
        header: t('common.actions'),
        accessor: 'id',
        render: () => (
          <div className="action-buttons">
            <button type="button" className="btn btn-secondary">
              {t('common.view')}
            </button>
          </div>
        ),
      },
    ],
    [t]
  )

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('orders.title')}</h1>
          <p className="page-subtitle">{t('orders.subtitle')}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title={t('orders.totalOrders')}
          value="1,847"
          change={12.3}
          icon={<FiShoppingCart />}
          color="primary"
        />
        <StatCard
          title={t('orders.completed')}
          value="1,592"
          change={8.5}
          icon={<FiCheckCircle />}
          color="success"
        />
        <StatCard
          title={t('orders.processing')}
          value="183"
          change={15.2}
          icon={<FiClock />}
          color="warning"
        />
        <StatCard
          title={t('orders.cancelled')}
          value="72"
          change={-5.7}
          icon={<FiXCircle />}
          color="danger"
        />
      </div>

      <div className="orders-filters">
        <select className="filter-select" aria-label={t('common.status')}>
          <option>{t('common.allStatus')}</option>
          <option>{t('orders.completed')}</option>
          <option>{t('orders.processing')}</option>
          <option>{t('orders.shipped')}</option>
          <option>{t('orders.pending')}</option>
          <option>{t('orders.cancelled')}</option>
        </select>
        <select className="filter-select" aria-label={t('common.date')}>
          <option>{t('dashboard.last7Days')}</option>
          <option>{t('dashboard.last30Days')}</option>
          <option>{t('dashboard.last90Days')}</option>
          <option>{t('common.allTime')}</option>
        </select>
      </div>

      <Table columns={tableColumns} data={orders} />
    </div>
  )
}

export default Orders
