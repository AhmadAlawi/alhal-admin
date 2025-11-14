import React from 'react'
import { FiShoppingCart, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import Table from '../components/Table/Table'
import './Orders.css'

const Orders = () => {
  const orders = [
    { 
      id: '#ORD-001', 
      customer: 'John Doe',
      date: '2024-11-10',
      items: 3,
      total: '$1,547',
      status: 'Completed'
    },
    { 
      id: '#ORD-002', 
      customer: 'Jane Smith',
      date: '2024-11-11',
      items: 1,
      total: '$49',
      status: 'Processing'
    },
    { 
      id: '#ORD-003', 
      customer: 'Bob Johnson',
      date: '2024-11-11',
      items: 2,
      total: '$758',
      status: 'Shipped'
    },
    { 
      id: '#ORD-004', 
      customer: 'Alice Brown',
      date: '2024-11-12',
      items: 5,
      total: '$2,394',
      status: 'Pending'
    },
    { 
      id: '#ORD-005', 
      customer: 'Charlie Wilson',
      date: '2024-11-12',
      items: 1,
      total: '$79',
      status: 'Cancelled'
    },
  ]

  const tableColumns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Customer', accessor: 'customer' },
    { header: 'Date', accessor: 'date' },
    { header: 'Items', accessor: 'items' },
    { header: 'Total', accessor: 'total' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => {
        const statusClass = value === 'Completed' ? 'badge-success' :
                          value === 'Processing' || value === 'Shipped' ? 'badge-warning' :
                          value === 'Pending' ? 'badge-primary' : 'badge-danger'
        return <span className={`badge ${statusClass}`}>{value}</span>
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: () => (
        <div className="action-buttons">
          <button className="btn btn-secondary">View</button>
        </div>
      )
    }
  ]

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Track and manage customer orders</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Orders"
          value="1,847"
          change={12.3}
          icon={<FiShoppingCart />}
          color="primary"
        />
        <StatCard
          title="Completed"
          value="1,592"
          change={8.5}
          icon={<FiCheckCircle />}
          color="success"
        />
        <StatCard
          title="Processing"
          value="183"
          change={15.2}
          icon={<FiClock />}
          color="warning"
        />
        <StatCard
          title="Cancelled"
          value="72"
          change={-5.7}
          icon={<FiXCircle />}
          color="danger"
        />
      </div>

      <div className="orders-filters">
        <select className="filter-select">
          <option>All Status</option>
          <option>Completed</option>
          <option>Processing</option>
          <option>Shipped</option>
          <option>Pending</option>
          <option>Cancelled</option>
        </select>
        <select className="filter-select">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>All Time</option>
        </select>
      </div>

      <Table columns={tableColumns} data={orders} />
    </div>
  )
}

export default Orders

