import React from 'react'
import './StatCard.css'

const StatCard = ({ title, value, change, icon, color = 'primary' }) => {
  const isPositive = change >= 0

  return (
    <div className="stat-card card">
      <div className="stat-card-content">
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value}</h3>
          {change !== undefined && (
            <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
              <span>{isPositive ? '↑' : '↓'} {Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`stat-icon stat-icon-${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default StatCard

