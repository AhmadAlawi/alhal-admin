/**
 * Shared chart data normalization for admin dashboards.
 * Aligns with auction per-unit pricing and direct-listing total price APIs.
 */

export function safeChartNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Normalize API date strings for stable joins (price min/max series). */
export function normalizeChartDateKey(date) {
  if (!date) return ''
  try {
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return String(date)
    return d.toISOString().slice(0, 10)
  } catch {
    return String(date)
  }
}

export function formatChartShortDate(iso, locale = 'en-US') {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  } catch {
    return String(iso)
  }
}

/**
 * Price trends: average + optional min/max bands (per kg / per unit).
 */
export function formatPriceTrendsChart(raw, locale = 'en-US') {
  if (!raw) return []
  const avgSeries = Array.isArray(raw.averagePrice)
    ? raw.averagePrice
    : Array.isArray(raw.data)
      ? raw.data
      : []
  const minSeries = Array.isArray(raw.minPrice) ? raw.minPrice : []
  const maxSeries = Array.isArray(raw.maxPrice) ? raw.maxPrice : []

  const minByDate = new Map(
    minSeries.map((p) => [normalizeChartDateKey(p.date), safeChartNumber(p.value ?? p.minPrice)])
  )
  const maxByDate = new Map(
    maxSeries.map((p) => [normalizeChartDateKey(p.date), safeChartNumber(p.value ?? p.maxPrice)])
  )

  return avgSeries.map((item) => {
    const key = normalizeChartDateKey(item.date)
    return {
      date: formatChartShortDate(item.date, locale),
      avgPrice: safeChartNumber(item.value ?? item.avgPrice ?? item.price),
      minPrice: minByDate.get(key) ?? safeChartNumber(item.minPrice),
      maxPrice: maxByDate.get(key) ?? safeChartNumber(item.maxPrice),
    }
  })
}

export function formatSupplyDemandChart(raw, locale = 'en-US') {
  if (!raw) return []
  const supply = Array.isArray(raw.supply) ? raw.supply : []
  const demand = Array.isArray(raw.demand) ? raw.demand : []
  const demandByDate = new Map(
    demand.map((p) => [normalizeChartDateKey(p.date), safeChartNumber(p.value)])
  )
  return supply.map((item) => {
    const key = normalizeChartDateKey(item.date)
    return {
      date: formatChartShortDate(item.date, locale),
      supply: safeChartNumber(item.value),
      demand: demandByDate.get(key) ?? 0,
    }
  })
}

export function formatPriceVolatilityChart(raw, locale = 'en-US') {
  if (!raw) return []
  const points = Array.isArray(raw.data)
    ? raw.data
    : Array.isArray(raw.volatility)
      ? raw.volatility
      : Array.isArray(raw.points)
        ? raw.points
        : []
  return points.map((item) => ({
    date: formatChartShortDate(item.date ?? item.period, locale),
    volatility: safeChartNumber(item.value ?? item.volatility ?? item.stdDev),
    avgPrice: safeChartNumber(item.avgPrice ?? item.averagePrice),
  }))
}

/** Pie / bar distribution rows */
export function formatDistributionChart(
  rows,
  nameKeys = ['name', 'nameAr', 'nameEn', 'label', 'category', 'type', 'userType', 'status']
) {
  if (!Array.isArray(rows)) return { data: [], nameKey: 'name', valueKey: 'value' }
  const data = rows.map((item, index) => {
    const nameKey = nameKeys.find((k) => item[k] != null) || 'name'
    const valueKey =
      item.value != null
        ? 'value'
        : item.count != null
          ? 'count'
          : item.revenue != null
            ? 'revenue'
            : 'value'
    const label =
      item[nameKey] ??
      item.nameAr ??
      item.nameEn ??
      item.name ??
      item.label ??
      item.userType ??
      item.status ??
      `—`
    return {
      name: String(label).trim() || `#${index + 1}`,
      value: safeChartNumber(item[valueKey] ?? item.value ?? item.count),
    }
  })
  return { data, nameKey: 'name', valueKey: 'value' }
}

/**
 * Direct listing: display total price; derive per-unit for labels only.
 * @see DIRECT_LISTING_TOTAL_PRICE.md
 */
export function formatDirectListingPrice(listing) {
  if (!listing) return { totalPrice: 0, pricePerUnit: 0, qty: 0 }
  const qty = safeChartNumber(listing.availableQty ?? listing.qty, 0)
  const totalPrice = safeChartNumber(
    listing.totalPrice ?? listing.price ?? listing.subtotal,
    0
  )
  const pricePerUnit =
    listing.pricePerUnit != null
      ? safeChartNumber(listing.pricePerUnit)
      : qty > 0
        ? totalPrice / qty
        : 0
  return { totalPrice, pricePerUnit, qty }
}

/**
 * Auction chart: prefer per-unit close/current, not lot bid total.
 * @see MOBILE_AUCTION_LIVE_CHART.md
 */
export function formatAuctionCandleChart(candles, locale = 'en-US') {
  if (!Array.isArray(candles)) return []
  return candles.map((c) => ({
    date: formatChartShortDate(c.time ?? c.date, locale),
    open: safeChartNumber(c.open),
    high: safeChartNumber(c.high),
    low: safeChartNumber(c.low),
    close: safeChartNumber(c.close),
    volume: safeChartNumber(c.volumeQty ?? c.bidCount),
  }))
}

export function resolveAuctionDisplayPrice(auction) {
  if (!auction) return 0
  return safeChartNumber(
    auction.currentPricePerUnit ??
      auction.pricing?.currentPricePerUnit ??
      auction.close ??
      auction.currentPrice
  )
}

export function hasChartData(data) {
  return Array.isArray(data) && data.length > 0
}
