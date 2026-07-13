import { describe, it, expect } from 'vitest'
import {
  normalizeGovernorate,
  normalizeCity,
  normalizeArea,
  cleanLocationName,
} from './locationNormalize'

describe('locationNormalize — PascalCase API payloads', () => {
  it('governorate: PascalCase NameAr/NameEn/GovernorateId', () => {
    const g = normalizeGovernorate(
      { GovernorateId: 5, NameAr: 'دمشق', NameEn: 'Damascus', IsActive: true, CitiesCount: 1 },
      'ar'
    )
    expect(g).not.toBeNull()
    expect(g.id).toBe(5)
    expect(g.name).toBe('دمشق')
    expect(g.nameEn).toBe('Damascus')
    expect(g.isActive).toBe(true)
    expect(g.citiesCount).toBe(1)
  })

  it('governorate: English language picks NameEn', () => {
    const g = normalizeGovernorate({ GovernorateId: 2, NameAr: 'حلب', NameEn: 'Aleppo' }, 'en')
    expect(g.name).toBe('Aleppo')
  })

  it('governorate: cleans embedded newlines', () => {
    const g = normalizeGovernorate({ GovernorateId: 1, NameAr: 'الحسكة\r\nالحسكة', NameEn: 'Al-Hasakeh' }, 'ar')
    expect(g.name).toBe('الحسكة الحسكة')
  })

  it('governorate: still handles camelCase', () => {
    const g = normalizeGovernorate({ governorateId: 9, nameAr: 'حمص', nameEn: 'Homs' }, 'ar')
    expect(g.id).toBe(9)
    expect(g.name).toBe('حمص')
  })

  it('city: PascalCase CityId/NameAr', () => {
    const c = normalizeCity({ CityId: 12, GovernorateId: 5, NameAr: 'المزة', NameEn: 'Mazzeh' }, 'ar')
    expect(c.cityId).toBe(12)
    expect(c.name).toBe('المزة')
    expect(c.governorateId).toBe(5)
  })

  it('area: PascalCase AreaId/NameAr', () => {
    const a = normalizeArea({ AreaId: 3, CityId: 12, NameAr: 'حي', NameEn: 'District' }, 'ar')
    expect(a.areaId).toBe(3)
    expect(a.name).toBe('حي')
  })

  it('cleanLocationName collapses newlines/spaces', () => {
    expect(cleanLocationName('الحسكة\r\nالحسكة')).toBe('الحسكة الحسكة')
  })
})
