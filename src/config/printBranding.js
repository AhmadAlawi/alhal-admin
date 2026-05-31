/**
 * Platform print branding — edit here or override stamp via localStorage key `printStampText`.
 */
export const PRINT_BRANDING = {
  logoUrl: '/platform-logo.svg',
  platformNameAr: 'منصة رزق',
  platformNameEn: 'Rizq Platform',
  platformSubtitleAr: 'منصة إدارة أسواق رزق',
  platformSubtitleEn: 'Government market administration platform',
  stampTextAr: 'منصة رزق — وثيقة رسمية',
  stampTextEn: 'Rizq Platform — Official Document',
  stampOrgAr: 'الجمهورية العربية السورية',
  stampOrgEn: 'Syrian Arab Republic',
}

const STAMP_STORAGE_KEY = 'printStampText'

export function getPrintBranding(language = 'ar') {
  const isAr = language === 'ar'
  const customStamp = typeof localStorage !== 'undefined' ? localStorage.getItem(STAMP_STORAGE_KEY) : null

  return {
    logoUrl: PRINT_BRANDING.logoUrl,
    platformName: isAr ? PRINT_BRANDING.platformNameAr : PRINT_BRANDING.platformNameEn,
    platformSubtitle: isAr ? PRINT_BRANDING.platformSubtitleAr : PRINT_BRANDING.platformSubtitleEn,
    stampText: customStamp || (isAr ? PRINT_BRANDING.stampTextAr : PRINT_BRANDING.stampTextEn),
    stampOrg: isAr ? PRINT_BRANDING.stampOrgAr : PRINT_BRANDING.stampOrgEn,
  }
}

export function setPrintStampText(text) {
  if (typeof localStorage === 'undefined') return
  if (text) localStorage.setItem(STAMP_STORAGE_KEY, text)
  else localStorage.removeItem(STAMP_STORAGE_KEY)
}
