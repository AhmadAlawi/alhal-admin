import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '../../contexts/LocaleContext'
import Chart from './Chart'
import { getCompatibleChartTypes } from './chartTypeUtils'

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
    expect(container.querySelector('.echarts-for-react')).toBeTruthy()
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
    expect(container.querySelector('.echarts-for-react, .chart-container')).toBeTruthy()
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

  it('shows type switcher for compatible chart types', () => {
    const data = [
      { date: 'May 1', value: 100 },
      { date: 'May 2', value: 200 },
    ]
    renderChart(
      <Chart type="line" data={data} dataKey="value" xAxisKey="date" title="Trend" height={200} />
    )

    expect(screen.getByRole('group', { name: /change chart type|تغيير نوع الرسم/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /line|خطي/i })).toHaveClass('active')
    expect(screen.getByRole('button', { name: /bar|أعمدة/i })).toBeInTheDocument()
  })

  it('hides type switcher when allowTypeChange is false', () => {
    const data = [{ date: 'May 1', value: 100 }]
    renderChart(
      <Chart
        type="line"
        data={data}
        dataKey="value"
        xAxisKey="date"
        title="Trend"
        allowTypeChange={false}
      />
    )
    expect(screen.queryByRole('group', { name: /change chart type|تغيير نوع الرسم/i })).not.toBeInTheDocument()
  })
})

describe('getCompatibleChartTypes', () => {
  it('returns multi-series options', () => {
    expect(
      getCompatibleChartTypes({
        type: 'composed',
        dataKeys: [{ dataKey: 'a' }, { dataKey: 'b' }],
        xAxisKey: 'date',
        dataKey: 'a',
      })
    ).toEqual(['line', 'bar', 'composed'])
  })

  it('includes pie for single series with category key', () => {
    expect(
      getCompatibleChartTypes({
        type: 'bar',
        dataKeys: [],
        xAxisKey: 'name',
        dataKey: 'value',
      })
    ).toContain('pie')
  })
})
