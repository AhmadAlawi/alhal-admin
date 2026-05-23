# دليل الموبايل — رسم بياني مباشر للمزاد (Binance-style)

## نظرة عامة

| السيناريو | REST (تحميل أولي + تاريخ) | SignalR (مباشر) |
|-----------|---------------------------|-----------------|
| مزاد واحد مفتوح | `GET /api/auctions/{id}/chart` | `PriceTick`, `BidPlaced`, **`CandleUpdated`** |
| سعر منتج (بندورة…) | `GET /api/auctions/charts/product/{productId}` | نفس Hub عند المزايدة (شمعة المنتج تتحدث مع `CandleUpdated` إن ربطت المنتج) |

**Base URL:** `{API_URL}` — مثال: `https://api.souqalhal.com`

**Hub:** `{API_URL}/hubs/auctions` (SignalR — WebSocket تلقائي)

---

## 1) تثبيت SignalR (Flutter / React Native)

```bash
npm install @microsoft/signalr
# أو Flutter: signalr_netcore
```

---

## 2) صفحة مزاد واحد — تسلسل التحميل

### أ) REST — الشموع + سلم المزايدات

```http
GET /api/auctions/{auctionId}/chart?intervalMinutes=1
Authorization: Bearer {token}   # اختياري حالياً
```

**`intervalMinutes`:** `1` (مباشر)، `5`, `15`, `60`, `1440`

**Response (`data`):**

```json
{
  "auctionId": 42,
  "productId": 3,
  "governorateId": 1,
  "productName": "بندورة",
  "intervalMinutes": 1,
  "quantity": 500,
  "unit": "kg",
  "currentPricePerUnit": 3350,
  "candles": [
    {
      "time": "2026-05-22T10:00:00.0000000Z",
      "open": 3200,
      "high": 3350,
      "low": 3200,
      "close": 3350,
      "bidCount": 3,
      "volumeQty": 1500
    }
  ],
  "bidLadder": [
    {
      "rank": 1,
      "pricePerUnit": 3350,
      "bidAmountTotal": 1675000,
      "bidderUserId": 99,
      "createdAt": "2026-05-22T10:05:00"
    }
  ]
}
```

- **الشموع:** استخدم `open/high/low/close` — السعر **للكيلو** (per unit).
- **`bidLadder`:** بديل order book — أعلى 10 مزايدات (طلب)، وليس عرض ثابت.

### ب) SignalR — الاتصال

```typescript
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${API_URL}/hubs/auctions?userId=${userId}`, {
    accessTokenFactory: () => jwt,
  })
  .withAutomaticReconnect()
  .build();

await connection.start();
await connection.invoke('JoinAuction', auctionId, userId, null);
```

### ج) الأحداث التي يجب الاستماع لها

| الحدث | متى | ماذا تفعل في UI |
|-------|-----|-----------------|
| `PriceTick` | بعد كل مزايدة | حدّث السعر الحالي في الهيدر (`pricing.currentPricePerUnit`) |
| `BidPlaced` | مزايدة ناجحة | حدّث سلم المزايدات + toast |
| **`CandleUpdated`** | شمعة دقيقة جديدة/محدّثة | `candlestickSeries.update(data.candle)` |
| `AuctionUpdated` | إغلاق / انضمام | إيقاف المزايدة إن `status === closed` |
| `Error` | فشل | عرض `message` |

**مثال `CandleUpdated`:**

```json
{
  "auctionId": 42,
  "intervalMinutes": 1,
  "candle": {
    "time": "2026-05-22T10:05:00.0000000Z",
    "open": 3300,
    "high": 3400,
    "low": 3300,
    "close": 3400,
    "bidCount": 2,
    "volumeQty": 1000
  }
}
```

**Lightweight Charts (مثال):**

```typescript
// تحويل time لـ unix أو YYYY-MM-DD حسب المكتبة
candleSeries.update({
  time: Math.floor(new Date(candle.time).getTime() / 1000),
  open: candle.open,
  high: candle.high,
  low: candle.low,
  close: candle.close,
});

volumeSeries.update({
  time: same,
  value: candle.bidCount,
  color: candle.close >= candle.open ? '#26a69a' : '#ef5350',
});
```

### د) المزايدة من الموبايل

```typescript
await connection.invoke('PlaceBid', {
  auctionId: 42,
  bidderUserId: userId,
  bidAmount: 1680000,  // إجمالي اللوت — ليس سعر الكغ
});
```

بعد النجاح يصل `CandleUpdated` تلقائياً — لا حاجة لـ polling.

---

## 3) صفحة منتج (سعر البندورة في السوق)

```http
GET /api/auctions/charts/product/{productId}?governorateId=1&intervalMinutes=1440
```

- **`intervalMinutes=1440`:** شموع يومية (تاريخ + مزادات منتهية + `SalesTransactions` + `MarketPrices` القديمة).
- **`intervalMinutes=60` أو `5`:** تجميع أدق (بعد backfill).

**Response:** `candles`, `volumeBars`, `summary` (سعر حالي، تغير %، عدد مزادات مفتوحة).

---

## 4) تعبئة البيانات القديمة (مرة واحدة بعد النشر)

**الترتيب الموصى به:**

```http
POST /api/MarketAnalysis/backfill/sales-transactions
POST /api/MarketAnalysis/backfill/market-prices
POST /api/MarketAnalysis/backfill/auction-charts
```

أو دفعة واحدة:

```http
POST /api/MarketAnalysis/backfill/all
```

هذا يبني:

1. `SalesTransactions` من طلبات / مزادات مغلقة / عطاءات
2. `MarketPrices` اليومية
3. **`AuctionMarketCandles`** من كل `Bids` + مبيعات + أسعار قديمة

بديل SQL يدوي للجدول فقط: `DOCS/add_auction_market_candles.sql` — التعبئة الفعلية عبر API أعلاه.

---

## 5) مكتبة الرسم (موبايل)

| المنصة | المكتبة المقترحة |
|--------|------------------|
| Flutter | `candlesticks` أو `syncfusion_flutter_charts` |
| React Native | `react-native-lightweight-charts` أو WebView + TradingView Lightweight |
| Native iOS/Android | أي OHLC chart يقبل `{time, o, h, l, c}` |

**ألوان (Binance-like):** صعود `#26a69a`, هبوط `#ef5350`, خلفية `#1e222d`.

---

## 6) Checklist للمطور

- [ ] عند فتح المزاد: `GET .../chart` ثم `JoinAuction`
- [ ] الاشتراك في `CandleUpdated`, `PriceTick`, `BidPlaced`
- [ ] عرض السعر من `pricing.currentPricePerUnit` وليس `currentPrice` (إجمالي اللوت) إن أردت سعر الكغ
- [ ] سلم المزايدات من `bidLadder` — لا تتوقع order book كامل
- [ ] عند الإغلاق: إيقاف `PlaceBid` + إظهار السعر النهائي
- [ ] صفحة المنتج: `intervalMinutes=1440` + فلتر محافظة
- [ ] بعد نشر السيرفر: تشغيل backfill مرة واحدة

---

## 7) أخطاء شائعة

| المشكلة | الحل |
|---------|------|
| شموع فاضية | شغّل `POST .../backfill/auction-charts` |
| السعر “غلط” | استخدم `close` / `currentPricePerUnit` — المزايدة `bidAmount` = إجمالي الكمية |
| لا يصل live | تأكد `JoinAuction` نجح ولا يوجد `join_denied` |
| `CandleUpdated` لا يصل | تحقق من مجموعة `auction:{id}` — يجب `JoinAuction` قبل المزايدة |
