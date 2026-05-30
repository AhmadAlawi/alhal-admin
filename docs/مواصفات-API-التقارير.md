# مواصفات API التقارير — للباك-إند

> **الجمهور:** مطور الباك-إند  
> **المرجع في الفرونت:** `src/services/reportsService.js` + `src/utils/reportChartNormalize.js`  
> **تاريخ:** 30 أيار 2026

---

## 1. قواعد عامة (إلزامية)

### 1.1 شكل الاستجابة الموحّد

```json
{
  "success": true,
  "data": { },
  "message": "وصف قصير",
  "traceId": "00-..."
}
```

الفرونت يقرأ **`response.data`** من الـ HTTP client (أي محتوى `data` في JSON أعلاه).

### 1.2 أين توضع البيانات؟

| نوع التقرير | مفتاح المصفوفة | مثال |
|-------------|---------------|------|
| سلسلة زمنية | `data` أو `series` أو `items` | `[{ "period": "2026-05-01", "revenue": 1000 }]` |
| توزيع (فئات) | `data` أو `distribution` أو `items` | `[{ "name": "farmer", "count": 50 }]` |
| طرق الدفع | خريطة flat | `{ "cash": 120, "card": 80 }` داخل `data` |
| ملخص KPI | `summary` أو `totals` أو `aggregates` | `{ "totalRevenue": 50000, "totalQuantity": 1200 }` |

> **ملاحظة:** `extractReportRows()` في الفرونت يبحث تلقائياً في:  
> `data`, `items`, `results`, `rows`, `records`, `list`, `distribution`, `series`, `points`

### 1.3 معاملات الاستعلام المشتركة

```
startDate      ISO 8601 (مثال: 2026-05-01T00:00:00Z)
endDate        ISO 8601
timeGroup      minute | hour | day | week | month | year
governorate    اسم المحافظة (نص)
governorateId  رقم
cityId         رقم
areaId         رقم
productId      رقم
categoryId     رقم
subCategoryId  رقم
userId         رقم
userType       farmer | trader | transporter | buyer
isVerified     true | false
status         open | completed | active | closed
transportProviderId
fromArea / toArea
tenderId / auctionId
page / pageSize / sortBy / sortOrder
year           للتقارير الموسمية
```

**تجميع الزمن (`timeGroup`):**  
```sql
-- bucket = تاريخ بداية الفترة حسب timeGroup
GROUP BY DATE_TRUNC(timeGroup, transaction.completedAt)
```

### 1.4 المصادقة

| المجموعة | الصلاحية |
|---------|---------|
| `/api/reports/*` (44 تقرير) | `[Authorize]` + `gov.reports.view` |
| `/api/reports/builder/*` | `[Authorize]` + `gov.reports.build` |
| `/api/reports/ministry/*` و `/api/reports/statistics/*` | **يجب** إضافة `[Authorize]` (حالياً مفتوحة!) |

### 1.5 مصادر البيانات الأساسية (Domain)

| الكيان | الجدول/المصدر المقترح | يُستخدم في |
|--------|----------------------|-----------|
| **بيع مكتمل** | `Orders` (status=completed) + `Auctions` (status=completed) + `TenderAwards` | المبيعات، الإيرادات |
| **الكمية** | `quantityKg` أو `weight` بالكيلogram | كل تقارير الحجم |
| **الإيراد** | `totalAmount` / `finalPrice` / `paidAmount` | المالية |
| **المستخدم** | `Users` + `UserRoles` | تقارير المستخدمين |
| **المنتج** | `Products` + `Categories` | تقارير المنتجات |
| **النقل** | `TransportRequests` + `TransportProviders` | تقارير النقل |
| **المناقصة** | `Tenders` + `TenderOffers` + `TenderAwards` | تقارير المناقصات |
| **المزاد** | `Auctions` + `Bids` | تقارير المزادات |
| **المخزون** | `Inventory` + `InventoryMovements` + `Warehouses` | تقارير المخزون |
| **الخسائر** | `ProductLosses` / `InventoryAdjustments` (reason=loss) | تقارير الخسائر |
| **الدفع** | `Payments` / `Transactions` | المالية |

**تعريف موحّد للمعاملة المكتملة (Completed Transaction):**
```sql
-- view: vw_CompletedSales
SELECT 'order' AS source, orderId AS id, completedAt, productId, quantityKg, totalAmount, governorateId, buyerId, sellerId
FROM Orders WHERE status = 'completed'
UNION ALL
SELECT 'auction', auctionId, closedAt, productId, quantityKg, winningBidAmount, governorateId, winnerId, sellerId
FROM Auctions WHERE status IN ('completed','closed','sold')
UNION ALL
SELECT 'tender', tenderId, awardedAt, productId, quantityKg, awardAmount, governorateId, buyerId, sellerId
FROM TenderAwards WHERE status = 'completed'
```

---

## 2. تقارير المبيعات (5)

### 2.1 `GET /api/reports/sales`

**الغرض:** نظرة شاملة على المبيعات في الفترة.  
**مخطط الفرونت:** Area (سلسلة زمنية) + بطاقات summary.

**الاستجابة المطلوبة:**
```json
{
  "success": true,
  "data": {
    "period": { "from": "...", "to": "...", "groupBy": "day" },
    "series": [
      {
        "period": "2026-05-01",
        "revenue": 150000.00,
        "quantity": 1250.5,
        "transactions": 42,
        "averagePrice": 119.92
      }
    ],
    "summary": {
      "totalRevenue": 4500000.00,
      "totalQuantity": 38000.0,
      "totalTransactions": 1250,
      "averagePrice": 118.42
    }
  }
}
```

**حساب كل حقل:**

| الحقل | الصيغة |
|-------|--------|
| `revenue` (لكل period) | `SUM(totalAmount)` من `vw_CompletedSales` في الفترة |
| `quantity` | `SUM(quantityKg)` |
| `transactions` | `COUNT(*)` |
| `averagePrice` | `revenue / quantity` (إذا quantity=0 → 0) |
| `totalRevenue` | `SUM(revenue)` على كل الفترات |
| `totalQuantity` | `SUM(quantity)` |
| `totalTransactions` | `SUM(transactions)` |
| `averagePrice` (summary) | `totalRevenue / totalQuantity` |

**فلاتر:** startDate, endDate, timeGroup, governorate, productId, categoryId, userType

---

### 2.2 `GET /api/reports/sales/by-product`

**مخطط الفرونت:** Bar (أعمدة — أعلى 25 صف).

```json
{
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "بندورة",
        "revenue": 850000.00,
        "quantity": 12000.0,
        "transactions": 340,
        "averagePrice": 70.83
      }
    ],
    "summary": { "totalRevenue": 4500000, "totalProducts": 15 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `revenue` | `SUM(totalAmount) GROUP BY productId` |
| `quantity` | `SUM(quantityKg) GROUP BY productId` |
| `transactions` | `COUNT(*) GROUP BY productId` |
| `averagePrice` | `revenue / quantity` |
| ترتيب افتراضي | `ORDER BY revenue DESC` — Top 25 |

---

### 2.3 `GET /api/reports/sales/by-category`

**مخطط الفرونت:** Distribution (Pie + Bar).

```json
{
  "data": {
    "distribution": [
      { "categoryId": 1, "category": "خضار", "revenue": 1200000, "quantity": 15000, "percentage": 26.7 }
    ],
    "summary": { "totalRevenue": 4500000, "totalCategories": 8 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `percentage` | `(category.revenue / totalRevenue) * 100` |
| JOIN | `Products.categoryId → Categories` |

---

### 2.4 `GET /api/reports/sales/by-location`

**مخطط الفرونت:** Bar.

```json
{
  "data": {
    "items": [
      { "governorateId": 1, "governorate": "دمشق", "revenue": 980000, "quantity": 8500, "transactions": 210 }
    ],
    "summary": { "totalRevenue": 4500000 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `governorate` | اسم المحافظة من `Governorates` |
| تجميع | `GROUP BY governorateId` |

---

### 2.5 `GET /api/reports/sales/trends`

**مخطط الفرونت:** Area (timeseries — reportId يحتوي `trend`).

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "revenue": 150000, "quantity": 1250, "transactions": 42 },
      { "period": "2026-05-02", "revenue": 162000, "quantity": 1300, "transactions": 45 }
    ],
    "summary": {
      "totalRevenue": 4500000,
      "growthRate": 8.5,
      "peakPeriod": "2026-05-15"
    }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `growthRate` | `((lastPeriod.revenue - firstPeriod.revenue) / firstPeriod.revenue) * 100` |
| `peakPeriod` | الفترة ذات أعلى `revenue` |

---

## 3. تقارير المستخدمين (5)

### 3.1 `GET /api/reports/users/activity`

**مخطط الفرونت:** Composed (أعمدة متعددة — newUsers + activeUsers).

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "newUsers": 12,
        "activeUsers": 85,
        "returningUsers": 73
      }
    ],
    "summary": {
      "totalNewUsers": 360,
      "totalActiveUsers": 2550,
      "avgActiveUsers": 85
    }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `newUsers` | `COUNT(Users)` WHERE `createdAt` في الفترة |
| `activeUsers` | مستخدمون لديهم `Login` أو `Activity` أو `Transaction` في الفترة (DISTINCT userId) |
| `returningUsers` | `activeUsers - newUsers` (في نفس الفترة) |
| `avgActiveUsers` | `AVG(activeUsers)` على السلسلة |

---

### 3.2 `GET /api/reports/users/registrations`

**مخطط الفرونت:** Area/Composed.

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "registrations": 15,
        "verified": 10,
        "verificationRate": 66.7
      }
    ],
    "summary": { "totalRegistrations": 450, "totalVerified": 320, "overallVerificationRate": 71.1 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `registrations` | `COUNT(Users.createdAt)` |
| `verified` | `COUNT WHERE isVerified = true` |
| `verificationRate` | `(verified / registrations) * 100` |

---

### 3.3 `GET /api/reports/users/by-type`

**مخطط الفرونت:** Distribution.

```json
{
  "data": {
    "distribution": [
      { "userType": "farmer", "count": 120, "percentage": 45.5 },
      { "userType": "trader", "count": 80, "percentage": 30.3 }
    ],
    "summary": { "totalUsers": 264, "userTypes": 4 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `count` | `COUNT(Users) GROUP BY role/userType` |
| `percentage` | `(count / totalUsers) * 100` |

> **✅ شكل موجود فعلياً في API** (`/api/reports/statistics/users/by-type`) — انسخ نفس البنية.

---

### 3.4 `GET /api/reports/users/by-location`

**مخطط الفرونت:** Distribution أو Bar.

```json
{
  "data": {
    "distribution": [
      { "governorate": "دمشق", "count": 95, "percentage": 36.0 }
    ],
    "summary": { "totalUsers": 264 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `count` | `COUNT(Users) GROUP BY governorateId` |

---

### 3.5 `GET /api/reports/users/performance`

**مخطط الفرونت:** Bar (صف لكل مستخدم — Top N).

```json
{
  "data": {
    "items": [
      {
        "userId": 42,
        "userName": "أحمد",
        "userType": "farmer",
        "totalSales": 250000,
        "totalOrders": 45,
        "totalQuantity": 5000,
        "rating": 4.5
      }
    ],
    "summary": { "totalUsers": 50 },
    "page": 1,
    "pageSize": 50,
    "totalCount": 200
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `totalSales` | `SUM(revenue)` كبائع/مشتري حسب userType |
| `totalOrders` | `COUNT(transactions)` |
| `rating` | `AVG(Feedback.rating)` |
| pagination | `page`, `pageSize`, `totalCount` إلزامي |

---

## 4. تقارير المنتجات (5)

### 4.1 `GET /api/reports/products/performance`

```json
{
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "بندورة",
        "revenue": 850000,
        "quantity": 12000,
        "transactions": 340,
        "avgPrice": 70.83,
        "growthRate": 5.2
      }
    ],
    "summary": { "totalRevenue": 4500000, "totalProducts": 15 }
  }
}
```

| `growthRate` | `(revenue_current_period - revenue_previous_period) / revenue_previous_period * 100` |

---

### 4.2 `GET /api/reports/products/inventory`

```json
{
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "بندورة",
        "quantity": 5500.0,
        "unit": "kg",
        "warehouseCount": 3,
        "lowStock": false,
        "reorderLevel": 1000
      }
    ],
    "summary": { "totalQuantity": 85000, "lowStockProducts": 4 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `quantity` | `SUM(Inventory.quantityKg) GROUP BY productId` (snapshot — بدون timeGroup) |
| `lowStock` | `quantity < reorderLevel` |
| `lowStockProducts` | `COUNT WHERE lowStock = true` |

---

### 4.3 `GET /api/reports/products/price-trends`

**مخطط:** Area (timeseries).

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "avgPrice": 3200,
        "minPrice": 2800,
        "maxPrice": 3600,
        "transactionCount": 25
      }
    ],
    "summary": { "avgPrice": 3150, "minPrice": 2500, "maxPrice": 4000 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `avgPrice` | `AVG(pricePerKg)` من المعاملات المكتملة |
| `minPrice` | `MIN(pricePerKg)` |
| `maxPrice` | `MAX(pricePerKg)` |
| `pricePerKg` | `totalAmount / quantityKg` لكل معاملة |

---

### 4.4 `GET /api/reports/products/top`

```json
{
  "data": {
    "items": [
      { "productId": 1, "productName": "بندورة", "totalSales": 850000, "quantity": 12000, "rank": 1 }
    ],
    "summary": { "totalRevenue": 4500000 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `totalSales` | `SUM(revenue) GROUP BY productId ORDER BY totalSales DESC LIMIT pageSize` |
| `rank` | `ROW_NUMBER()` |

---

### 4.5 `GET /api/reports/products/by-category`

**مخطط:** Distribution.

```json
{
  "data": {
    "distribution": [
      { "categoryId": 1, "category": "خضار", "productCount": 45, "percentage": 28.8 }
    ],
    "summary": { "totalProducts": 156 }
  }
}
```

| `productCount` | `COUNT(Products) GROUP BY categoryId` |
| `percentage` | `(productCount / totalProducts) * 100` |

---

## 5. تقارير النقل (5)

### 5.1 `GET /api/reports/transport/activity`

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "requests": 25,
        "completed": 20,
        "cancelled": 3,
        "pending": 2
      }
    ],
    "summary": { "totalRequests": 750, "completionRate": 80.0 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `requests` | `COUNT(TransportRequests)` WHERE createdAt في الفترة |
| `completed` | `COUNT WHERE status = 'completed'` |
| `completionRate` | `(completed / requests) * 100` |

---

### 5.2 `GET /api/reports/transport/providers`

```json
{
  "data": {
    "items": [
      {
        "providerId": 1,
        "providerName": "شركة النقل",
        "totalTrips": 150,
        "completedTrips": 140,
        "revenue": 450000,
        "avgRating": 4.2,
        "vehicleCount": 5
      }
    ],
    "summary": { "totalProviders": 12 }
  }
}
```

---

### 5.3 `GET /api/reports/transport/routes`

```json
{
  "data": {
    "items": [
      {
        "fromArea": "دمشق",
        "toArea": "حلب",
        "tripCount": 85,
        "avgPrice": 150000,
        "avgDistance": 350
      }
    ],
    "summary": { "totalRoutes": 24 }
  }
}
```

| `tripCount` | `COUNT GROUP BY (fromAreaId, toAreaId)` |

---

### 5.4 `GET /api/reports/transport/revenue`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "revenue": 450000, "trips": 85 }
    ],
    "summary": { "totalRevenue": 13500000, "totalTrips": 2550 }
  }
}
```

| `revenue` | `SUM(TransportRequests.finalPrice) WHERE status='completed'` |

---

### 5.5 `GET /api/reports/transport/ratings`

```json
{
  "data": {
    "items": [
      {
        "providerId": 1,
        "providerName": "شركة النقل",
        "avgRating": 4.5,
        "reviewCount": 120,
        "rating5": 80,
        "rating4": 25,
        "rating3": 10,
        "rating2": 3,
        "rating1": 2
      }
    ],
    "summary": { "avgRating": 4.3, "totalReviews": 450 }
  }
}
```

| `avgRating` | `AVG(Feedback.rating) WHERE entityType='transport'` |

---

## 6. تقارير المناقصات (4)

### 6.1 `GET /api/reports/tenders/activity`

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "created": 8,
        "open": 5,
        "completed": 3,
        "cancelled": 0
      }
    ],
    "summary": { "totalCreated": 240, "totalCompleted": 180 }
  }
}
```

| `created` | `COUNT(Tenders)` WHERE createdAt في الفترة |
| `open` | snapshot أو `COUNT WHERE status='open'` في نهاية الفترة |

---

### 6.2 `GET /api/reports/tenders/performance`

```json
{
  "data": {
    "items": [
      {
        "tenderId": 10,
        "title": "توريد بندورة",
        "offerCount": 5,
        "avgOfferPrice": 3200,
        "awardPrice": 3000,
        "savings": 200,
        "durationDays": 7,
        "status": "completed"
      }
    ],
    "summary": {
      "avgOffersPerTender": 4.2,
      "avgDurationDays": 8.5,
      "completionRate": 75.0
    }
  }
}
```

| `savings` | `avgOfferPrice - awardPrice` (أو `budget - awardPrice`) |
| `durationDays` | `DATEDIFF(awardedAt, createdAt)` |

---

### 6.3 `GET /api/reports/tenders/offers`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "offers": 25, "avgOfferPrice": 3100, "uniqueBidders": 12 }
    ],
    "summary": { "totalOffers": 750, "avgOffersPerDay": 25 }
  }
}
```

---

### 6.4 `GET /api/reports/tenders/awards`

```json
{
  "data": {
    "items": [
      {
        "tenderId": 10,
        "productName": "بندورة",
        "quantity": 5000,
        "budgetAmount": 16000000,
        "awardAmount": 15000000,
        "savings": 1000000,
        "savingsPercent": 6.25,
        "awardedAt": "2026-05-15T10:00:00Z"
      }
    ],
    "summary": { "totalAwards": 180, "totalSavings": 45000000, "avgSavingsPercent": 5.8 }
  }
}
```

| `savingsPercent` | `(savings / budgetAmount) * 100` |

---

## 7. تقارير المزادات (3)

### 7.1 `GET /api/reports/auctions/activity`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "created": 10, "completed": 7, "active": 3 }
    ],
    "summary": { "totalCreated": 300, "totalCompleted": 210, "completionRate": 70.0 }
  }
}
```

---

### 7.2 `GET /api/reports/auctions/bids`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "bids": 85, "uniqueBidders": 32, "avgBidAmount": 45000 }
    ],
    "summary": { "totalBids": 2550, "avgBidsPerAuction": 8.5 }
  }
}
```

| `bids` | `COUNT(Bids)` WHERE createdAt في الفترة |
| `avgBidAmount` | `AVG(Bids.amount)` |

---

### 7.3 `GET /api/reports/auctions/revenue`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "revenue": 850000, "auctionsCompleted": 7 }
    ],
    "summary": { "totalRevenue": 25500000, "avgRevenuePerAuction": 121428 }
  }
}
```

| `revenue` | `SUM(winningBidAmount)` للمزادات المكتملة |

---

## 8. التقارير المالية (4)

### 8.1 `GET /api/reports/financial/revenue`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "revenue": 1500000, "orders": 42, "auctions": 7, "tenders": 3 }
    ],
    "summary": { "totalRevenue": 45000000 }
  }
}
```

| `revenue` | `SUM(totalAmount)` من كل مصادر `vw_CompletedSales` |

---

### 8.2 `GET /api/reports/financial/payment-methods`

**مخطط:** Distribution — **يمكن** إرجاع flat map:

```json
{
  "data": {
    "cash": 1200000,
    "bank_transfer": 850000,
    "wallet": 320000,
    "credit": 150000
  }
}
```

أو:

```json
{
  "data": {
    "distribution": [
      { "paymentMethod": "cash", "amount": 1200000, "count": 450, "percentage": 48.0 }
    ],
    "summary": { "totalAmount": 2500000, "totalTransactions": 850 }
  }
}
```

| `amount` | `SUM(Payments.amount) GROUP BY method` |
| `percentage` | `(amount / totalAmount) * 100` |

---

### 8.3 `GET /api/reports/financial/transactions`

```json
{
  "data": {
    "items": [
      {
        "transactionId": 1001,
        "date": "2026-05-15T14:30:00Z",
        "type": "order",
        "amount": 85000,
        "paymentMethod": "cash",
        "status": "completed",
        "buyerName": "محمد",
        "sellerName": "أحمد",
        "productName": "بندورة"
      }
    ],
    "summary": { "totalAmount": 45000000, "totalCount": 1250 },
    "page": 1,
    "pageSize": 50,
    "totalCount": 1250,
    "totalPages": 25
  }
}
```

> **Pagination إلزامي** — الفرونت يرسل `page` و `pageSize`.

---

### 8.4 `GET /api/reports/financial/profit-loss`

**مخطط:** Composed (revenue + expenses + profit).

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "revenue": 1500000,
        "expenses": 450000,
        "profit": 1050000
      }
    ],
    "summary": {
      "totalRevenue": 45000000,
      "totalExpenses": 13500000,
      "totalProfit": 31500000,
      "profitMargin": 70.0
    }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `revenue` | إجمالي المبيعات |
| `expenses` | `SUM(platformFees + transportCosts + refunds + operationalCosts)` — **حدّد جداول المصروفات في الباك** |
| `profit` | `revenue - expenses` |
| `profitMargin` | `(totalProfit / totalRevenue) * 100` |

---

## 9. تقارير المخزون (4)

### 9.1 `GET /api/reports/inventory/levels`

```json
{
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "بندورة",
        "warehouseId": 2,
        "warehouse": "مستودع دمشق",
        "quantity": 2500.0,
        "unit": "kg",
        "lastUpdated": "2026-05-30T12:00:00Z"
      }
    ],
    "summary": { "totalQuantity": 85000, "warehouseCount": 8 }
  }
}
```

| `quantity` | `Inventory.quantityKg` — snapshot حالي (لا timeGroup) |

---

### 9.2 `GET /api/reports/inventory/movements`

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "incoming": 5000,
        "outgoing": 3200,
        "adjustments": -50,
        "netChange": 1750
      }
    ],
    "summary": { "totalIncoming": 150000, "totalOutgoing": 96000, "netChange": 54000 }
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `incoming` | `SUM(quantity) WHERE movementType IN ('purchase','production','transfer_in')` |
| `outgoing` | `SUM(quantity) WHERE movementType IN ('sale','transfer_out','loss')` |
| `netChange` | `incoming - outgoing + adjustments` |

---

### 9.3 `GET /api/reports/inventory/stock-balance`

```json
{
  "data": {
    "items": [
      {
        "warehouseId": 1,
        "warehouse": "مستودع دمشق",
        "productCount": 25,
        "totalQuantity": 35000,
        "capacity": 50000,
        "utilizationRate": 70.0
      }
    ],
    "summary": { "totalQuantity": 85000, "totalCapacity": 120000 }
  }
}
```

| `utilizationRate` | `(totalQuantity / capacity) * 100` |

---

### 9.4 `GET /api/reports/inventory/warehouses`

```json
{
  "data": {
    "items": [
      {
        "warehouseId": 1,
        "name": "مستودع دمشق",
        "governorate": "دمشق",
        "capacity": 50000,
        "currentStock": 35000,
        "productCount": 25,
        "managerName": "علي"
      }
    ],
    "summary": { "totalWarehouses": 8, "totalCapacity": 120000 }
  }
}
```

---

## 10. تقارير الأداء (3)

### 10.1 `GET /api/reports/performance/system`

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "totalUsers": 222,
        "activeListings": 21,
        "openAuctions": 11,
        "openTenders": 5,
        "completedTransactions": 42
      }
    ],
    "summary": {
      "totalUsers": 222,
      "totalProducts": 156,
      "totalRevenue": 45000000,
      "totalInventory": 3302562.75
    }
  }
}
```

> يمكن إعادة استخدام منطق `/api/gov/dashboard/auto-fill`.

---

### 10.2 `GET /api/reports/performance/conversion`

```json
{
  "data": {
    "items": [
      { "type": "auction", "created": 300, "completed": 210, "conversionRate": 70.0 },
      { "type": "tender", "created": 240, "completed": 180, "conversionRate": 75.0 },
      { "type": "listing", "created": 500, "completed": 350, "conversionRate": 70.0 }
    ],
    "summary": { "overallConversionRate": 71.7 }
  }
}
```

| `conversionRate` | `(completed / created) * 100` |

---

### 10.3 `GET /api/reports/performance/retention`

```json
{
  "data": {
    "series": [
      {
        "period": "2026-05-01",
        "cohortSize": 100,
        "retainedDay7": 45,
        "retainedDay30": 28,
        "retentionRate7": 45.0,
        "retentionRate30": 28.0
      }
    ],
    "summary": { "avgRetentionRate30": 32.5 }
  }
}
```

| `retainedDay7` | مستخدمون سجّلوا في cohort وعادوا خلال 7 أيام |
| `retentionRate7` | `(retainedDay7 / cohortSize) * 100` |

---

## 11. تقارير تحليل السوق (3) — `/api/reports/market/*`

> **ملاحظة:** صفحة `/analytics` تستخدم `/api/MarketAnalysis/charts/*` (موثّقة في `COMPLETE_API_REFERENCE.md`).  
> تقارير `/api/reports/market/*` يجب أن تُرجع **نفس المنطق** بصيغة موحّدة أعلاه.

### 11.1 `GET /api/reports/market/trends`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "avgPrice": 3200, "minPrice": 2800, "maxPrice": 3600, "volume": 5000 }
    ],
    "summary": { "avgPrice": 3150, "priceChangePercent": 5.2 }
  }
}
```

| `avgPrice` | `AVG(pricePerKg)` من كل المعاملات |
| `priceChangePercent` | `(last.avgPrice - first.avgPrice) / first.avgPrice * 100` |

---

### 11.2 `GET /api/reports/market/price-comparison`

```json
{
  "data": {
    "items": [
      {
        "governorate": "دمشق",
        "avgPrice": 3200,
        "minPrice": 2800,
        "maxPrice": 3600,
        "volume": 8500,
        "deviationFromAvg": 2.5
      }
    ],
    "summary": { "nationalAvgPrice": 3120, "highestGovernorate": "حلب", "lowestGovernorate": "حمص" }
  }
}
```

| `deviationFromAvg` | `((avgPrice - nationalAvgPrice) / nationalAvgPrice) * 100` |

---

### 11.3 `GET /api/reports/market/supply-demand`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "supply": 8000, "demand": 6500, "ratio": 1.23 }
    ],
    "summary": { "avgSupply": 7500, "avgDemand": 6200, "marketBalance": "oversupply" }
  }
}
```

| `supply` | `SUM(listings.availableQty)` + `SUM(inventory)` للمنتج |
| `demand` | `SUM(orders.quantity)` + `SUM(tender.demandQty)` + مزادات نشطة |
| `ratio` | `supply / demand` (إذا demand=0 → null) |
| `marketBalance` | `oversupply` if ratio>1.1, `shortage` if ratio<0.9, else `balanced` |

---

## 12. تقارير الخسائر (3)

### 12.1 `GET /api/reports/losses`

```json
{
  "data": {
    "series": [
      { "period": "2026-05-01", "quantity": 120.5, "value": 385000, "incidents": 8 }
    ],
    "summary": { "totalQuantity": 3615, "totalValue": 11550000, "totalIncidents": 240 }
  }
}
```

| `quantity` | `SUM(lossQtyKg) FROM ProductLosses` |
| `value` | `SUM(lossQtyKg * unitPrice)` |
| `incidents` | `COUNT(loss records)` |

---

### 12.2 `GET /api/reports/losses/by-product`

```json
{
  "data": {
    "items": [
      { "productId": 1, "productName": "بندورة", "quantity": 850, "value": 2720000, "percentage": 23.5 }
    ],
    "summary": { "totalQuantity": 3615 }
  }
}
```

---

### 12.3 `GET /api/reports/losses/by-location`

```json
{
  "data": {
    "items": [
      { "governorate": "دمشق", "quantity": 1200, "value": 3840000, "percentage": 33.2 }
    ],
    "summary": { "totalQuantity": 3615 }
  }
}
```

---

## 13. تقارير الوزارة (6) — **موجودة جزئياً — تحتاج إصلاح**

### 13.1 `GET /api/reports/ministry/market-flow/monthly`

**✅ شكل API الحالي (صحيح):**
```json
{
  "data": {
    "period": { "from": "...", "to": "...", "groupBy": "day" },
    "incoming": [{ "period": "2026-05-07", "quantity": 0.012, "count": 1 }],
    "outgoing": [{ "period": "2026-05-25", "quantity": 450, "count": 1 }],
    "summary": { "totalIncoming": 141.302, "totalOutgoing": 464.44, "netFlow": -323.138 }
  }
}
```

**حساب مقترح (بالطن):**

| الحقل | الصيغة |
|-------|--------|
| `incoming.quantity` | `SUM(quantityKg) / 1000` للوارد (مشتريات + إنتاج + تحويلات داخلة) |
| `outgoing.quantity` | `SUM(quantityKg) / 1000` للصادر (مبيعات + تحويلات خارجة) |
| `count` | عدد حركات |
| `netFlow` | `totalIncoming - totalOutgoing` |

**⚠️ مشكلة الفرونت:** هذا التقرير **غير معروض** في `/reports` حالياً — البنية `incoming[]` + `outgoing[]` لا يقرأها `extractReportRows` مباشرة.  
**الحل للباك:** أبقِ البنية كما هي + أضف endpoint أو حقل `series` موحّد:
```json
"series": [
  { "period": "2026-05-07", "incoming": 0.012, "outgoing": 0, "netFlow": 0.012 }
]
```

---

### 13.2 `GET /api/reports/ministry/storage-capacity/by-governorate`

```json
{
  "data": {
    "period": { "from": "...", "to": "...", "groupBy": "day" },
    "storage": [
      {
        "governorate": "دمشق",
        "totalCapacity": 50000,
        "actualUsage": 35000,
        "availableCapacity": 15000,
        "usageRate": 70.0,
        "facilityCount": 5
      }
    ],
    "summary": { "totalCapacity": 120000, "totalUsage": 85000 }
  }
}
```

| `usageRate` | `(actualUsage / totalCapacity) * 100` |

---

### 13.3 `GET /api/reports/ministry/market-flow/current-month`

```json
{
  "data": {
    "timeGroup": "day",
    "currentPeriod": { "start": "...", "end": "...", "quantity": 141.302, "count": 95 },
    "previousPeriod": { "start": "...", "end": "...", "quantity": 120.5, "count": 88 },
    "change": { "quantity": 20.802, "quantityPercent": 17.26, "count": 7, "countPercent": 7.95 }
  }
}
```

| `change.quantityPercent` | `((current - previous) / previous) * 100` |

---

### 13.4 `GET /api/reports/ministry/storage/usage-rate`

**❌ API الحالي (خطأ):**
```json
{ "totalCapacity": 0, "actualUsage": 141.802, "availableCapacity": -141.802, "usageRate": 0 }
```

**المطلوب:**
```json
{
  "data": {
    "totalCapacity": 120000,
    "actualUsage": 85000,
    "availableCapacity": 35000,
    "usageRate": 0.708,
    "usageRatePercentage": 70.8
  }
}
```

| الحقل | الصيغة |
|-------|--------|
| `totalCapacity` | `SUM(Warehouses.capacity)` — **لا يمكن أن يكون 0 إذا actualUsage > 0** |
| `actualUsage` | `SUM(Inventory.quantityKg) / 1000` (بالطن) |
| `availableCapacity` | `MAX(0, totalCapacity - actualUsage)` |
| `usageRatePercentage` | `(actualUsage / totalCapacity) * 100` |

---

### 13.5 `GET /api/reports/ministry/storage/total-capacity`

```json
{
  "data": {
    "totalCapacity": 120000,
    "facilityCount": 15,
    "averageCapacityPerFacility": 8000
  }
}
```

| `averageCapacityPerFacility` | `totalCapacity / facilityCount` |

---

### 13.6 `GET /api/reports/ministry/storage/types-distribution`

```json
{
  "data": {
    "distribution": [
      { "storageType": "cold", "facilities": 5, "totalCapacity": 40000, "percentage": 33.3 },
      { "storageType": "dry", "facilities": 10, "totalCapacity": 80000, "percentage": 66.7 }
    ],
    "total": { "facilities": 15, "totalCapacity": 120000 }
  }
}
```

**❌ حالياً `distribution: []` — يجب ملؤها من جدول `StorageFacilities.storageType`**

---

## 14. تقارير الإحصاء (6) — **موجودة — انسخ البنية**

### 14.1 `GET /api/reports/statistics/users/by-age-group`

```json
{
  "data": {
    "period": { "from": "...", "to": "...", "groupBy": "day" },
    "distribution": [
      { "ageGroup": "18-25", "count": 45, "percentage": 17.0 },
      { "ageGroup": "26-35", "count": 80, "percentage": 30.3 }
    ],
    "summary": { "totalUsers": 264 }
  }
}
```

| `ageGroup` | bucket من `YEAR(NOW()) - YEAR(birthDate)` |

---

### 14.2–14.3 `by-type` / `by-governorate`

**✅ `by-type` يعمل** — انظر القسم 3.3.

`by-governorate`:
```json
"distribution": [
  { "governorate": "دمشق", "count": 95, "percentage": 36.0 }
]
```

---

### 14.4 `GET /api/reports/statistics/production/by-product`

```json
{
  "data": {
    "period": { "from": "...", "to": "...", "groupBy": "day" },
    "products": [
      { "productId": 1, "productName": "بندورة", "quantity": 45000, "percentage": 28.8 }
    ],
    "summary": { "totalProduction": 156000 }
  }
}
```

| `quantity` | `SUM(productionQtyKg)` من `Farms`/`HarvestRecords` — Top 10 |

---

### 14.5 `GET /api/reports/statistics/products/by-category`

```json
{
  "data": {
    "distribution": [
      { "categoryId": 1, "category": "خضار", "productCount": 45, "percentage": 28.8 }
    ],
    "summary": { "totalProducts": 156 }
  }
}
```

---

### 14.6 `GET /api/reports/statistics/production/seasonal`

```json
{
  "data": {
    "period": { "from": "...", "to": "...", "groupBy": "month" },
    "year": 2026,
    "series": [
      { "period": "2026-01", "quantity": 12000, "productCount": 8 },
      { "period": "2026-02", "quantity": 8500, "productCount": 6 }
    ],
    "summary": { "totalProduction": 156000, "peakMonth": "2026-05" }
  }
}
```

| `peakMonth` | الشهر بأعلى `quantity` |

---

## 15. صفحة تحليل السوق `/analytics` (مرجع منفصل)

هذه **ليست** `/api/reports/*` لكنها تقارير في الواجهة:

| Endpoint | الاستجابة المتوقعة | الحساب |
|----------|-------------------|--------|
| `GET /api/MarketAnalysis/charts/price-trends` | `avgPrices[]`, `minPrices[]`, `maxPrices[]` | `AVG/MIN/MAX(pricePerKg) GROUP BY date` |
| `GET /api/MarketAnalysis/charts/volume-by-governorate` | `data: [{ category, value }]` | `SUM(qtyKg) GROUP BY governorate` |
| `GET /api/MarketAnalysis/charts/market-share-by-product` | `[{ name, revenue, percentage }]` | حصة كل منتج من إجمالي الإيراد |
| `GET /api/MarketAnalysis/charts/transaction-type-distribution` | `[{ type, count, revenue }]` | GROUP BY order/auction/tender |
| `GET /api/MarketAnalysis/charts/supply-demand-trends` | `supply[]`, `demand[]` | انظر 11.3 |
| `GET /api/MarketAnalysis/charts/price-volatility` | `[{ date, volatility, avgPrice }]` | `STDDEV(pricePerKg)` |
| `GET /api/MarketAnalysis/charts/top-products-by-revenue` | `[{ productName, revenue, volume }]` | Top N |

**مرجع كامل:** `COMPLETE_API_REFERENCE.md`

---

## 16. تحليلات الموبايل `/mobile-analytics`

| Endpoint | الاستجابة | الحساب |
|----------|----------|--------|
| `GET /api/analytics/line-chart` | `{ series: { auctions: [{date,value}], tenders: [], orders: [] } }` | COUNT يومي لكل نوع |
| `GET /api/analytics/bar-chart` | `{ bars: [{ label, value }] }` | تجميع حسب label |
| `GET /api/analytics/events` | `{ items: [...], page, pageSize, totalCount }` | سجل أحداث |
| `GET /api/analytics/events/stats` | `{ totalEvents, uniqueUsers, topEventTypes[], topScreens[] }` | إحصائيات |

---

## 17. تقارير الدردشة `/chat-reports`

`GET /api/reporting/reports`

```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "reportId": 1,
        "reportType": "spam",
        "status": "pending",
        "reporterUserId": 10,
        "reportedUserId": 20,
        "conversationId": 55,
        "description": "...",
        "createdAt": "2026-05-30T10:00:00Z",
        "assignedToUserId": null,
        "adminNotes": null
      }
    ],
    "totalCount": 45,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 18. منشئ التقارير `/api/reports/builder/*`

### `POST /api/reports/builder/execute`

**Request:** `{ "query": { "table", "joins", "select", "filters", "groupBy", "orderBy", "limit" } }`

**Response:**
```json
{
  "success": true,
  "data": {
    "columns": [
      { "id": "orders.totalAmount", "label": "Total Amount", "type": "number" }
    ],
    "rows": [
      { "orders.totalAmount": 85000, "products.nameAr": "بندورة" }
    ],
    "rowCount": 150,
    "executionTimeMs": 45
  }
}
```

### `GET /api/reports/builder/schema`

```json
{
  "data": {
    "tables": [
      {
        "id": "orders",
        "label": "Orders",
        "columns": [
          { "id": "orders.id", "label": "ID", "type": "number" },
          { "id": "orders.totalAmount", "label": "Total Amount", "type": "number" }
        ]
      }
    ],
    "joins": [
      { "from": "orders.productId", "to": "products.id", "type": "left" }
    ]
  }
}
```

---

## 19. checklist للباك-إند

- [ ] كل `/api/reports/*` (44) تُرجع `{ success, data: { series|items|distribution, summary } }`
- [ ] `[Authorize]` + policy `gov.reports.view` على كل endpoints
- [ ] إصلاح `storage/usage-rate` — totalCapacity لا يكون 0
- [ ] ملء `storage/types-distribution` — distribution فارغة
- [ ] إضافة `[Authorize]` على ministry + statistics (12 endpoint)
- [ ] `transactions` و `user-performance` — pagination
- [ ] `payment-methods` — flat map أو distribution (كلاهما يعمل)
- [ ] توحيد `period` vs `date` — الفرونت يقبل الاثنين
- [ ] الكميات: kg في التقارير العادية، **طن** في تقارير الوزارة (`/ 1000`)
- [ ] اختبار: `node scripts/test-report-apis.mjs YOUR_TOKEN` → 58/58 OK

---

## 20. مرجع سريع — نوع المخطط لكل reportId

| reportId | نوع المخطط في الفرونت |
|----------|----------------------|
| `sales`, `sales-trends`, `revenue`, `*-activity`, `*-movements`, `*-registrations`, `market-trends`, `supply-demand`, `profit-loss`, `*-revenue` | timeseries (area/composed) |
| `*-by-category`, `user-type`, `user-location`, `product-category`, `payment-methods` | distribution (pie+bar) |
| `*-by-product`, `top-products`, `*-by-location`, `*-performance`, `transport-*`, `losses-by-*` | bar |
| `transactions` | bar أو timeseries (حسب وجود `date`/`period`) |

---

**ملفات مرتبطة:**
- `docs/دليل-التقارير-الشامل.md` — دليل المستخدم
- `scripts/test-report-apis.mjs` — اختبار آللي
- `src/utils/reportChartNormalize.test.js` — أمثلة unit test للفرونت
