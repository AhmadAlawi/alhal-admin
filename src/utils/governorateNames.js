/**
 * Resolve governorate IDs or codes to display names (Arabic / English).
 */

export function buildGovernorateLookup(options = []) {
  const byId = new Map()
  const byKey = new Map()

  for (const g of options) {
    if (g?.id == null) continue
    const id = String(g.id)
    const nameAr = g.nameAr ?? g.name ?? ''
    const nameEn = g.nameEn ?? g.name ?? nameAr
    const entry = { id: g.id, nameAr, nameEn }
    byId.set(id, entry)
    if (nameAr) byKey.set(normalizeKey(nameAr), entry)
    if (nameEn) byKey.set(normalizeKey(nameEn), entry)
  }

  return { byId, byKey, options }
}

function normalizeKey(value) {
  return String(value).trim().toLowerCase()
}

export function resolveGovernorateLabel(value, lookup, language = 'ar') {
  if (value == null || value === '') return ''
  const raw = String(value).trim()
  const entry = lookup?.byId?.get(raw) ?? lookup?.byKey?.get(normalizeKey(raw))
  if (!entry) return raw
  return language === 'ar'
    ? entry.nameAr || entry.nameEn || raw
    : entry.nameEn || entry.nameAr || raw
}

export function mapChartGovernorateRows(rows, lookup, language, key = 'governorate') {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => ({
    ...row,
    [key]: resolveGovernorateLabel(row[key], lookup, language),
  }))
}
