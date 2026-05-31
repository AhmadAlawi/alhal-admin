# Gov Entity Analytics — Dashboard Team Guide

This guide maps every report from **تحليلات الجهات في لوحة التحكم** to the new analytics API. Use it to wire dashboard widgets, filters, and chart components.

---

## Base URL & Auth

| Item | Value |
|------|--------|
| Base path | `/api/gov/analytics` |
| Permission | `gov.dashboard.view` (JWT Bearer) |
| Response wrapper | Standard `ApiResponse<T>` (`success`, `data`, `message`, `traceId`) |

All report endpoints are **read-only GET** (except batch POST).

---

## Quick Start

### 1. Load entity tabs

```http
GET /api/gov/analytics/entities
Authorization: Bearer {token}
```

Returns 11 entity groups (وزارة الزراعة، المحافظة، …) with `reportCount`.

### 2. Load widget catalog for an entity

```http
GET /api/gov/analytics/catalog?entityId=agriculture
GET /api/gov/analytics/catalog?visualizationType=kpi
```

Each catalog item includes:

| Field | Use in UI |
|-------|-----------|
| `reportId` | Stable slug — store in widget `config.reportId` |
| `titleAr` / `titleEn` | Widget title |
| `visualizationType` | Chart component selector |
| `endpoint` | Full path, e.g. `/api/gov/analytics/reports/total-offered-quantity` |
| `entityIds` | Which gov dashboards may show this widget |
| `supportedFilters` | Which query params to expose in filter bar |
| `isShared` | Same report reused across multiple entities |

### 3. Fetch report data

```http
GET /api/gov/analytics/reports/total-offered-quantity?days=30&governorateId=1&productId=5
```

### 4. Batch load (dashboard page with many widgets)

```http
POST /api/gov/analytics/reports/batch
Content-Type: application/json

{
  "reportIds": ["total-offered-quantity", "price-over-time", "auctions-by-status"],
  "filters": { "days": 30, "governorateId": 1, "productId": 5 }
}
```

---

## Shared Query Filters

Apply as query string on `GET /reports/{reportId}` or inside `filters` on batch POST.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | int | 30 | Look-back window when `from`/`to` omitted |
| `from` | datetime | — | Range start (ISO 8601) |
| `to` | datetime | — | Range end |
| `governorateId` | long | — | Filter by governorate FK |
| `governorate` | string | — | Filter by governorate name (Ar/En) |
| `productId` | long | — | Single product |
| `categoryId` | long | — | Product category |
| `cityId` | long | — | City (reserved) |
| `areaId` | long | — | Area / district |
| `fromGovernorateId` | long | — | Source governorate (trade/transport) |
| `toGovernorateId` | long | — | Destination governorate |
| `granularity` | string | `day` | `day` \| `week` \| `month` for line charts |
| `topN` | int | 10 | Table/column row limit |
| `year` | int | — | Reserved for yearly charts |
| `userRole` | string | — | Reserved (`farmer`, `trader`, `transporter`) |
| `saleType` | string | — | Reserved (`auction`, `tender`, `direct`) |

**Governorate-scoped dashboards** (المحافظة): always pass `governorateId` from the logged-in gov user's profile.

---

## Response Shape

Every report returns:

```json
{
  "success": true,
  "data": {
    "reportId": "total-offered-quantity",
    "titleAr": "إجمالي الكميات المعروضة",
    "titleEn": "Total Offered Quantity",
    "visualizationType": "kpi",
    "generatedAt": "2026-05-30T12:00:00Z",
    "appliedFilters": { "days": 30, "governorateId": 1, ... },
    "data": { /* type-specific — see below */ },
    "meta": null
  }
}
```

### Visualization types → `data` payload

| Type | C# type | Frontend component |
|------|---------|-------------------|
| `kpi` | `GovAnalyticsKpiData` | KPI card — `value`, `unitAr`, `changePercent`, optional `items[]` breakdown |
| `column` | `ColumnChartData` | Bar/column — `categories`, `series[].data`, `meta.unitAr` |
| `line` | `GovAnalyticsLineChartData` | Line — `categories`, `series[].data` (nullable points) |
| `donut` | `DonutChartData` | Pie/donut — `slices[].nameAr`, `value`, `percentage` |
| `table` | `GovAnalyticsTableData` | Data grid — `columns[]`, `rows[]` (key → value maps) |
| `map` | `GovAnalyticsMapData` | Syria map — `points[]` per governorate |
| `combo` | `GovAnalyticsComboData` | Table + column chart (e.g. complaints) |

**Existing chart DTOs** (`ColumnChartData`, `DonutChartData`) match `/api/gov/dashboard/charts/*` — reuse the same ECharts/Apex adapters.

---

## Entity IDs

| entityId | Arabic name |
|----------|-------------|
| `agriculture` | وزارة الزراعة |
| `agriculture-guidance` | وزارة الزراعة / قسم الإرشاد الزراعي |
| `commerce` | وزارة التجارة |
| `commerce-trade` | وزارة التجارة / الاستيراد والتصدير |
| `farmers-union` | الاتحاد العام للفلاحين |
| `governorate` | المحافظة |
| `transport` | وزارة النقل |
| `cooperatives` | الجمعيات التعاونية |
| `market-admin` | إدارة أسواق الهال |
| `market-complaints` | إدارة أسواق الهال / الشكاوى والتقييمات |
| `shared` | تحليلات مشتركة |

---

## Full Report Catalog (Word doc → API)

Reports marked **shared** appear once in the API; filter catalog with `entityId` to list widgets per dashboard.

### وزارة الزراعة

| Report (doc) | reportId | Type |
|--------------|----------|------|
| إجمالي الكميات المعروضة | `total-offered-quantity` | kpi |
| تغير السعر عبر الزمن | `price-over-time` | line |
| الكميات المعروضة حسب المحافظة مقابل الطلب | `supply-vs-demand-by-governorate` | column |
| المنتجات قليلة التوفر | `low-availability-products` | column |
| جودة المنتجات حسب المحافظة | `quality-by-governorate` | column |
| خريطة الإنتاج الزراعي | `production-map` | map |
| عدد المزارعين المسجلين | `registered-farmers-count` | kpi |
| المساحات الزراعية المسجلة | `registered-farm-areas` | table |
| المنتجات الأعلى إنتاجاً | `top-production-products` | column |
| المنتجات الأقل إنتاجاً | `low-production-products` | column |
| توزيع المنتجات حسب نوع الزراعة | `farming-type-distribution` | donut |
| توزيع المنتجات حسب نوع التغليف | `packaging-type-distribution` | donut |
| مقارنة الكميات حسب درجة الجودة | `quality-grade-comparison` | column |
| توزيع الأراضي حسب نوع ملكية الأرض | `land-ownership-distribution` | column |

### قسم الإرشاد الزراعي

| Report | reportId | Type |
|--------|----------|------|
| المنتجات التي تحتاج تحسين جودة | `products-needing-quality-improvement` | table |
| أكثر الأخطاء والشكاوى | `top-complaints-by-governorate` | column |
| المنتجات المناسبة للتوجيه الإرشادي | `products-for-guidance` | table |

### وزارة التجارة

| Report | reportId | Type |
|--------|----------|------|
| إجمالي الإيرادات | `total-revenue` | kpi |
| إجمالي المعاملات | `total-transactions` | kpi |
| متوسط السعر | `average-price` | kpi |
| تغير السعر عبر الزمن | `price-over-time` | line |
| مقارنة أسعار المحافظات | `governorate-price-comparison` | column |
| العرض مقابل الطلب | `supply-vs-demand` | column |
| مجموع كميات الصفقات الناجحة | `successful-deals-table` | table |
| الأسعار الحكومية مقارنة بأسعار التنفيذ | `gov-price-vs-execution` | line |
| عدد المزادات حسب الحالة | `auctions-by-status` | donut |
| عدد المناقصات حسب الحالة | `tenders-by-status` | donut |
| عدد العروض المباشرة حسب الحالة | `direct-listings-by-status` | donut |
| الكميات المباعة حسب نوع البيع | `sold-quantities-by-sale-type` | column |
| المنتجات الأكثر طلباً | `most-demanded-products` | column |

### الاستيراد والتصدير

| Report | reportId | Type |
|--------|----------|------|
| المنتجات ذات الكميات العالية | `high-quantity-products` | column |
| الكميات المتاحة | `available-quantity` | kpi |
| الكمية الخارجة من محافظة إلى أخرى | `cross-governorate-flow` | table |

### الاتحاد العام للفلاحين

| Report | reportId | Type |
|--------|----------|------|
| نشاط المستخدمين — المزارعون | `farmers-by-governorate` | column |
| متوسط سعر بيع الفلاح | `avg-farmer-sale-price` | line |
| الفلاحون الأكثر نشاطاً | `most-active-farmers` | table |
| تقييمات الفلاحين | `farmer-ratings` | table |
| جودة منتجات الفلاحين | `farmer-product-quality` | column |

### المحافظة

| Report | reportId | Type | Required filter |
|--------|----------|------|-----------------|
| ملخص | `governorate-summary` | kpi | `governorateId` |
| نشاط الأسواق | `market-activity-by-governorate` | column | |
| المنتجات الأكثر تداولاً | `top-traded-products-in-governorate` | column | `governorateId` |
| أسعار المحافظة vs الأخرى | `governorate-price-vs-others` | line | `governorateId`, `productId` |
| الشكاوى داخل المحافظة | `governorate-complaints` | table | `governorateId` |
| الحسابات النشطة | `active-accounts-in-governorate` | kpi | `governorateId` |
| حركة المنتجات | `product-movement-within-governorate` | table | `governorateId` |
| المناطق الأعلى نشاطاً | `most-active-areas` | column | `governorateId` |
| المناطق الأعلى شكاوى | `most-complaints-areas` | column | `governorateId` |

### وزارة النقل

| Report | reportId | Type |
|--------|----------|------|
| متوسط زمن النقل | `avg-transport-time` | line |
| متوسط كلفة النقل | `avg-transport-cost` | line |
| عدد الرحلات | `trip-count` | column |
| الرحلات الداخلة والخارجة | `inbound-outbound-trips` | column |
| كفاءة الناقلين | `carrier-efficiency` | table |
| متوسط كلفة النقل للطن | `avg-cost-per-ton` | kpi |
| النقل حسب نوع المنتج | `transport-by-product-type` | column |
| أكثر خطوط النقل | `top-transport-routes` | column |
| الشكاوى المرتبطة بالنقل | `transport-complaints` | table |

Use `fromGovernorateId` / `toGovernorateId` for route filters.

### الجمعيات التعاونية

| Report | reportId | Type |
|--------|----------|------|
| عدد الجمعيات النشطة | `active-cooperatives-count` | kpi |
| أعضاء الجمعية الأكثر نشاطاً | `most-active-cooperative-members` | table |
| أداء الجمعيات | `cooperative-performance` | combo |

Also reuse shared reports: `total-offered-quantity`, `supply-vs-demand-by-governorate`, `low-availability-products`.

### إدارة أسواق الهال

| Report | reportId | Type | Notes |
|--------|----------|------|-------|
| أسماء لجنة السوق | `market-committee-members` | table | Empty until committee module exists |
| حسابات المزارعين | `farmer-accounts` | table | |
| الحسابات في التطبيق | `accounts-in-app` | kpi | |
| الشكاوى والبلاغات | `complaints-and-reports` | combo | |
| القائمة السوداء | `blacklist` | table | |
| تقييمات المستخدمين | `user-ratings` | table | |
| نسبة فشل البيع | `sale-failure-rate` | donut | |
| الحسابات كثيرة الشكاوى | `high-complaint-accounts` | table | |
| المستخدمون النشطون | `active-users` | kpi | |
| نشاط المستخدمين حسب النوع | `user-activity-by-type` | column | |

### الشكاوى والتقييمات

| Report | reportId | Type |
|--------|----------|------|
| إجمالي الشكاوى | `total-complaints` | kpi |
| الشكاوى حسب النوع | `complaints-by-type` | donut |
| الشكاوى حسب المحافظة | `complaints-by-governorate` | column |
| متوسط تقييم المستخدمين | `average-user-rating` | kpi |
| الشكاوى غير المعالجة | `unresolved-complaints` | table |

---

## Widget Config (Custom Dashboard Layouts)

When saving layouts via `/api/gov/dashboard/layouts`, use this widget config:

```json
{
  "type": "analytics-report",
  "reportId": "total-offered-quantity",
  "endpoint": "/api/gov/analytics/reports/total-offered-quantity",
  "visualizationType": "kpi",
  "filters": {
    "days": 30,
    "governorateId": null
  },
  "titleAr": "إجمالي الكميات المعروضة"
}
```

On render:

1. Merge layout widget `filters` with global dashboard filter bar.
2. `GET {endpoint}?{queryString}`.
3. Bind `data.data` to the chart component matching `visualizationType`.

---

## Example Responses

### KPI

```json
{
  "value": 125000,
  "unitAr": "كغ",
  "unitEn": "kg",
  "previousValue": 98000,
  "changePercent": 27.6,
  "items": [
    { "keyAr": "مزادات", "keyEn": "Auctions", "value": 40 }
  ]
}
```

### Column chart

Same structure as `GET /api/gov/dashboard/charts/auctions-by-month`:

```json
{
  "chartType": "column",
  "titleAr": "العرض مقابل الطلب",
  "categories": ["دمشق", "حلب"],
  "series": [
    { "nameAr": "معروض", "nameEn": "Supply", "data": [5000, 3200] },
    { "nameAr": "طلب", "nameEn": "Demand", "data": [4100, 2800] }
  ],
  "meta": { "year": 2026, "total": 15100, "unitAr": "كغ", "unitEn": "kg" }
}
```

### Table

```json
{
  "columns": [
    { "key": "product", "titleAr": "المنتج", "titleEn": "Product", "type": "text" },
    { "key": "quantity", "titleAr": "الكمية", "titleEn": "Quantity", "type": "number" }
  ],
  "rows": [
    { "product": "طماطم", "quantity": 1200 }
  ],
  "totalRows": 1
}
```

---

## Data Sources & Limitations

| Topic | Source tables | Limitation |
|-------|---------------|------------|
| Offered quantity | `Crops` + `Farms` | `status = available` |
| Sales / revenue | `SalesTransactions` | Legacy rows may lack `GovernorateId` |
| Prices over time | `SalesTransactions.UnitPrice` | Requires completed sales in range |
| Gov reference price | `GovernmentPrices` | Needs `productId` filter |
| Farmers / traders | `Users` + `UserRoles` | Role names: `farmer`, `trader`, `transporter` |
| Complaints | `Tickets` + `Reports` | Governorate inferred from user profile |
| Ratings | `PartyRatings` | Roles in `givenToRole` |
| Transport | `TransportRequests` | Time/cost uses pickup/delivery dates when present |
| Farm areas (هكتار) | — | **Not stored yet** — table shows farm counts only |
| Market committee | — | **Placeholder** — returns empty table |
| Cooperatives count | `AgriServiceProfiles` | Doc mentions 1903; KPI uses registered profiles |

---

## Related Endpoints

| Purpose | Endpoint |
|---------|----------|
| Custom layout CRUD | `/api/gov/dashboard/layouts` |
| Legacy combined dashboard | `/api/gov/dashboard/auto-fill` |
| Real-time KPIs | `/api/gov/dashboard/real-time` |
| Generic breakdown | `/api/gov/dashboard/analytics/breakdown` |

Prefer **`/api/gov/analytics`** for entity-specific dashboards — stable `reportId` slugs match the Word spec.

---

## Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/gov/analytics/entities` | List gov entity groups |
| GET | `/api/gov/analytics/catalog` | Widget catalog (`?entityId=`, `?visualizationType=`) |
| GET | `/api/gov/analytics/reports/{reportId}` | Single report data |
| POST | `/api/gov/analytics/reports/batch` | Multiple reports, shared filters |

**Total unique reports: 73** (shared reports deduplicated in catalog; ~55 distinct `reportId` values).

---

## Deployment

After merge to `develop`, redeploy the API so Swagger shows `/api/gov/analytics/*`. Permission `gov.dashboard.view` is required (same as existing gov dashboard).

---

## Print branding configuration

Edit `src/config/printBranding.js` for logo, platform name, and default stamp text.

Override stamp at runtime (browser console or future settings UI):

```js
localStorage.setItem('printStampText', 'نص الختم المخصص')
```

Print template includes: platform logo, report title, today's date, optional chart, data table, user name, electronic stamp.

---

## Detail data on demand (`includeDetail`) — **implemented**

```http
GET /api/gov/analytics/reports/{reportId}?days=30&governorateId=1
GET /api/gov/analytics/reports/{reportId}?days=30&governorateId=1&includeDetail=true
```

| `includeDetail` | Response |
|-----------------|----------|
| omitted / `false` | `data` only — `detailTable` is `null` |
| `true` | `data` + `detailTable` |

**Backend behavior:** KPI breakdown rows; line/column/donut/map → chart points as rows; table → mirrors `data`; combo → embedded table or column rows; time-series → richer DB rows (`date`, `avgPrice`, `minPrice`, …).

**Response** (`detailTable` is sibling of visualization `data` inside the report envelope):

```json
{
  "reportId": "price-over-time",
  "visualizationType": "line",
  "data": { "categories": ["..."], "series": [...] },
  "detailTable": {
    "columns": [
      { "key": "date", "titleAr": "التاريخ", "titleEn": "Date" },
      { "key": "avgPrice", "titleAr": "متوسط السعر", "titleEn": "Avg price" }
    ],
    "rows": [{ "date": "2026-05-01", "avgPrice": 1250 }],
    "totalRows": 30
  }
}
```

**Frontend:** initial widget load omits `includeDetail`. «Show data» / «Print» fetch with `includeDetail=true` (cached separately from chart-only requests).

---

*Generated from `DOCS/تحليلات الجهات في لوحة التحكم (1).docx` — May 2026.*
