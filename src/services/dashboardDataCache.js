import dashboardService from './dashboardService'
import { unwrapDashboardPayload } from '../utils/dashboardNormalize'
import { safeNum } from '../utils/dashboardNormalize'

const autoFillCache = new Map()
const autoFillInflight = new Map()
const productionCache = new Map()
const productionInflight = new Map()

function cacheKey(params) {
  return JSON.stringify(params || {})
}

export function clearDashboardDataCache() {
  autoFillCache.clear()
  productionCache.clear()
}

export async function getSharedAutoFillData(params = {}) {
  const key = cacheKey(params)
  if (autoFillCache.has(key)) return autoFillCache.get(key)

  if (autoFillInflight.has(key)) return autoFillInflight.get(key)

  const promise = dashboardService
    .getAutoFillData(params)
    .then((res) => {
      const dashboard = unwrapDashboardPayload(res)
      autoFillCache.set(key, dashboard)
      autoFillInflight.delete(key)
      return dashboard
    })
    .catch((err) => {
      autoFillInflight.delete(key)
      throw err
    })

  autoFillInflight.set(key, promise)
  return promise
}

export async function getSharedProductionByCategory(year) {
  const key = String(year)
  if (productionCache.has(key)) return productionCache.get(key)

  if (productionInflight.has(key)) return productionInflight.get(key)

  const promise = dashboardService
    .getProductionByCategory({ year })
    .then((res) => {
      const data = res?.data?.data ?? res?.data ?? res
      const slices = Array.isArray(data?.slices) ? data.slices : []
      const rows = slices.map((slice) => ({
        nameAr: slice.nameAr,
        nameEn: slice.nameEn,
        value: safeNum(slice.value),
      }))
      productionCache.set(key, rows)
      productionInflight.delete(key)
      return rows
    })
    .catch((err) => {
      productionInflight.delete(key)
      throw err
    })

  productionInflight.set(key, promise)
  return promise
}
