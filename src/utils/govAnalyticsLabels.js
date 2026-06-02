/** Normalize API enum / English labels for Arabic UI */
const EN_LABELS_AR = {
  farmer: 'مزارع',
  traders: 'تاجر',
  trader: 'تاجر',
  transporter: 'ناقل',
  transporters: 'ناقل',
  buyer: 'مشتري',
  admin: 'مسؤول',
  unknown: 'غير محدد',
  unspecified: 'غير محدد',
  undefined: 'غير محدد',
  null: 'غير محدد',
  other: 'أخرى',
  auction: 'مزاد',
  auctions: 'مزادات',
  tender: 'مناقصة',
  tenders: 'مناقصات',
  direct: 'بيع مباشر',
  'direct sale': 'بيع مباشر',
  pending: 'قيد الانتظار',
  active: 'نشط',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  canceled: 'ملغى',
  open: 'مفتوح',
  closed: 'مغلق',
  won: 'فائز',
  lost: 'خاسر',
  gunny: 'جوالة (بدون تغليف)',
  sack: 'كيس',
  box: 'صندوق',
  crate: 'صندوق خشبي',
  bulk: 'سائب',
}

export function translateAnalyticsLabel(value, language = 'ar') {
  if (value == null || value === '') return value
  const raw = String(value).trim()
  if (language !== 'ar') return raw

  if (raw === 'جوالة') return 'جوالة (بدون تغليف)'

  const key = raw.toLowerCase().replace(/\s+/g, ' ')
  if (EN_LABELS_AR[key]) return EN_LABELS_AR[key]

  if (/^#?\d+$/.test(raw)) return raw

  return raw
}

export function translateRowValues(row, language = 'ar') {
  if (!row || language !== 'ar') return row
  const out = { ...row }
  Object.keys(out).forEach((k) => {
    const v = out[k]
    if (typeof v === 'string') out[k] = translateAnalyticsLabel(v, language)
  })
  return out
}
