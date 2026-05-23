import { describe, it, expect } from 'vitest'
import {
  unwrapDashboardPayload,
  unwrapRealTimePayload,
  safeNum,
  fmtNum,
} from './dashboardNormalize'

describe('dashboardNormalize', () => {
  it('unwraps ApiResponse dashboard payload', () => {
    const inner = { overview: { totalUsers: 10 }, marketAnalysis: { totalRevenue: { value: 1 } } }
    expect(unwrapDashboardPayload({ success: true, data: inner })).toEqual(inner)
  })

  it('unwraps real-time payload', () => {
    const rt = { timestamp: '2026-05-23', todayStats: { newUsers: 2 } }
    expect(unwrapRealTimePayload({ success: true, data: rt })).toEqual(rt)
    expect(unwrapRealTimePayload(rt)).toEqual(rt)
  })

  it('safeNum handles invalid values', () => {
    expect(safeNum('abc', 5)).toBe(5)
    expect(safeNum('42')).toBe(42)
  })

  it('fmtNum formats numbers', () => {
    expect(fmtNum(1000)).toMatch(/1,?000/)
  })
})
