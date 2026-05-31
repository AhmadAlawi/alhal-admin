import { PERMISSIONS } from '../utils/accessControl'

/** Fallback when GET /api/gov/analytics/entities is unavailable */
export const FALLBACK_GOV_ENTITIES = [
  { entityId: 'agriculture', nameAr: 'وزارة الزراعة', nameEn: 'Ministry of Agriculture' },
  { entityId: 'agriculture-guidance', nameAr: 'قسم الإرشاد الزراعي', nameEn: 'Agricultural Guidance' },
  { entityId: 'commerce', nameAr: 'وزارة التجارة', nameEn: 'Ministry of Commerce' },
  { entityId: 'commerce-trade', nameAr: 'الاستيراد والتصدير', nameEn: 'Import & Export' },
  { entityId: 'farmers-union', nameAr: 'الاتحاد العام للفلاحين', nameEn: 'Farmers Union' },
  { entityId: 'governorate', nameAr: 'المحافظة', nameEn: 'Governorate' },
  { entityId: 'transport', nameAr: 'وزارة النقل', nameEn: 'Ministry of Transport' },
  { entityId: 'cooperatives', nameAr: 'الجمعيات التعاونية', nameEn: 'Cooperatives' },
  { entityId: 'market-admin', nameAr: 'إدارة أسواق الهال', nameEn: 'Market Administration' },
  { entityId: 'market-complaints', nameAr: 'الشكاوى والتقييمات', nameEn: 'Complaints & Ratings' },
  { entityId: 'shared', nameAr: 'تحليلات مشتركة', nameEn: 'Shared Analytics' },
]

export const ENTITY_ANALYTICS_NAV = {
  type: 'entity-analytics-group',
  labelKey: 'nav.entityAnalytics',
  permission: PERMISSIONS.GOV_DASHBOARD,
  basePath: '/gov/entity-analytics',
}
