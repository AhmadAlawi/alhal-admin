import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '../../contexts/LocaleContext'
import Chart from './Chart'

const renderChart = (ui) => render(<LocaleProvider>{ui}</LocaleProvider>)

describe('Chart component', () => {
  it('renders empty state when data is empty', () => {
    renderChart(<Chart type="line" data={[]} title="Revenue" dataKey="value" xAxisKey="date" />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText(/no data available|لا توجد بيانات/i)).toBeInTheDocument()
  })

  it('renders line chart with data', () => {
    const data = [
      { date: 'May 1', value: 100 },
      { date: 'May 2', value: 200 },
    ]
    const { container } = renderChart(
      <Chart type="line" data={data} dataKey="value" xAxisKey="date" title="Trend" height={200} />
    )
    expect(screen.getByText('Trend')).toBeInTheDocument()
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
  })

  it('renders multi-series line via dataKeys', () => {
    const data = [{ date: 'May 1', supply: 10, demand: 8 }]
    const { container } = renderChart(
      <Chart
        type="line"
        data={data}
        dataKeys={[
          { dataKey: 'supply', name: 'Supply' },
          { dataKey: 'demand', name: 'Demand' },
        ]}
        xAxisKey="date"
        title="Supply vs Demand"
      />
    )
    expect(screen.getByText('Supply vs Demand')).toBeInTheDocument()
    expect(container.querySelector('.recharts-responsive-container, .chart-container')).toBeTruthy()
  })

  it('renders pie chart shell with title', () => {
    const data = [
      { name: 'Direct', value: 40 },
      { name: 'Auction', value: 60 },
    ]
    const { container } = renderChart(
      <Chart type="pie" data={data} dataKey="value" nameKey="name" title="Distribution" pieLabel />
    )
    expect(screen.getByText('Distribution')).toBeInTheDocument()
    expect(container.querySelector('.chart-container')).toBeTruthy()
  })
})
