# Complete Market Analysis & Dashboard API Reference

Comprehensive guide with full descriptions, examples, and response formats for the Agricultural Marketplace System.

---

## Table of Contents

1. [Overview](#overview)
2. [Market Analysis APIs](#market-analysis-apis)
3. [Dashboard APIs](#dashboard-apis)
4. [Complete Response Examples](#complete-response-examples)
5. [Integration Patterns](#integration-patterns)
6. [Best Practices](#best-practices)

---

## Overview

The system provides two main API groups:

### 🔍 **Market Analysis APIs** (`/api/MarketAnalysis`)
Purpose: Historical data analysis, trends, forecasting, and market insights
- Chart-specific endpoints for visualization
- Comprehensive analytical queries
- Filter and validation endpoints

### 📊 **Dashboard APIs** (`/api/gov/dashboard`)
Purpose: Real-time monitoring, KPIs, and operational dashboards
- Government oversight dashboards
- User-specific metrics
- Auto-fill endpoints for fast loading

---

# Market Analysis APIs

Base URL: `https://localhost:7059/api/MarketAnalysis`

---

## 1. Data Backfill Endpoint

### POST `/backfill/sales-transactions`

**Purpose**: Populate the `SalesTransactions` table with historical data from Orders, Auctions, and Tenders.

**When to Use**:
- Initial system setup
- After database migration
- To refresh historical analytics data

**Request**:
```bash
curl -X POST https://localhost:7059/api/MarketAnalysis/backfill/sales-transactions
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ordersProcessed": 1245,
    "auctionsProcessed": 156,
    "tendersProcessed": 89,
    "totalTransactionsCreated": 1490,
    "errors": []
  },
  "message": "Sales transactions backfill completed",
  "traceId": "00-abc123-def456-00"
}
```

**Response Fields**:
- `ordersProcessed`: Number of direct sale orders processed
- `auctionsProcessed`: Number of auctions processed
- `tendersProcessed`: Number of tenders processed
- `totalTransactionsCreated`: Total new transactions created
- `errors`: Array of any error messages encountered

---

## 2. Comprehensive Market Analysis

### GET `/comprehensive-analysis`

**Purpose**: Get complete market overview including volume, price, trends, and supply/demand.

**Query Parameters**:
```typescript
interface MarketAnalysisRequest {
  governorate?: string;      // Optional: "Baghdad", "Basra", etc.
  productId?: number;        // Optional: Filter by product
  startDate?: string;        // ISO 8601 date
  endDate?: string;          // ISO 8601 date
  transactionType?: string;  // "direct", "auction", "tender"
}
```

**Request Example**:
```bash
curl -X GET 'https://localhost:7059/api/MarketAnalysis/comprehensive-analysis?governorate=Baghdad&startDate=2025-10-01&endDate=2025-11-01'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-10-01T00:00:00Z",
      "endDate": "2025-11-01T00:00:00Z",
      "days": 31
    },
    "volumeAnalysis": {
      "totalVolume": 125450.5,
      "averageDailyVolume": 4047.1,
      "volumeByProduct": [
        {
          "productId": 1,
          "productName": "طماطم",
          "volume": 45230.0,
          "percentage": 36.05
        },
        {
          "productId": 2,
          "productName": "خيار",
          "volume": 32150.5,
          "percentage": 25.63
        }
      ]
    },
    "priceAnalysis": {
      "averagePrice": 28.50,
      "minPrice": 15.00,
      "maxPrice": 45.00,
      "priceVolatility": 18.5,
      "pricesByProduct": [
        {
          "productId": 1,
          "productName": "طماطم",
          "avgPrice": 32.00,
          "minPrice": 25.00,
          "maxPrice": 40.00
        }
      ]
    },
    "trendAnalysis": {
      "priceDirection": "increasing",
      "priceChangePercent": 12.5,
      "volumeDirection": "stable",
      "volumeChangePercent": 2.3,
      "weeklyTrends": [
        {
          "week": 1,
          "avgPrice": 27.50,
          "totalVolume": 28450.0
        },
        {
          "week": 2,
          "avgPrice": 28.20,
          "totalVolume": 29120.5
        }
      ]
    },
    "supplyDemand": {
      "totalSupply": 150000.0,
      "totalDemand": 125450.5,
      "supplyDemandRatio": 1.196,
      "marketBalance": "oversupply",
      "recommendation": "Prices may decrease due to excess supply"
    }
  },
  "message": "Comprehensive analysis retrieved successfully",
  "traceId": "00-xyz789-abc123-00"
}
```

---

## 3. Chart-Specific Endpoints

### 📈 A. Price Trends Chart

**GET** `/charts/price-trends`

**Purpose**: Time-series data showing price evolution over time with min/max/average prices.

**Best For**: Line charts, Area charts, Multi-line charts

**Query Parameters**:
```
productId?: number
governorate?: string
startDate?: string (ISO 8601)
endDate?: string (ISO 8601)
groupBy?: "day" | "week" | "month" (default: "day")
```

**Request**:
```bash
curl -X GET 'https://localhost:7059/api/MarketAnalysis/charts/price-trends?productId=1&groupBy=week&startDate=2025-10-01&endDate=2025-11-01'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "avgPrices": [
      { "date": "2025-10-01", "value": 27.50 },
      { "date": "2025-10-08", "value": 28.20 },
      { "date": "2025-10-15", "value": 29.10 },
      { "date": "2025-10-22", "value": 30.50 },
      { "date": "2025-10-29", "value": 31.20 }
    ],
    "minPrices": [
      { "date": "2025-10-01", "value": 25.00 },
      { "date": "2025-10-08", "value": 26.00 },
      { "date": "2025-10-15", "value": 27.00 },
      { "date": "2025-10-22", "value": 28.50 },
      { "date": "2025-10-29", "value": 29.00 }
    ],
    "maxPrices": [
      { "date": "2025-10-01", "value": 30.00 },
      { "date": "2025-10-08", "value": 31.50 },
      { "date": "2025-10-15", "value": 32.00 },
      { "date": "2025-10-22", "value": 33.50 },
      { "date": "2025-10-29", "value": 34.00 }
    ],
    "productName": "طماطم",
    "governorate": null
  },
  "message": "Price trends chart data retrieved"
}
```

**Chart Implementation Example**:
```javascript
// Using Chart.js
const chartData = {
  labels: response.data.avgPrices.map(d => d.date),
  datasets: [
    {
      label: 'Average Price',
      data: response.data.avgPrices.map(d => d.value),
      borderColor: 'rgb(75, 192, 192)',
      fill: false
    },
    {
      label: 'Min Price',
      data: response.data.minPrices.map(d => d.value),
      borderColor: 'rgb(255, 99, 132)',
      borderDash: [5, 5],
      fill: false
    },
    {
      label: 'Max Price',
      data: response.data.maxPrices.map(d => d.value),
      borderColor: 'rgb(54, 162, 235)',
      borderDash: [5, 5],
      fill: false
    }
  ]
};
```

---

### 📊 B. Volume by Governorate Chart

**GET** `/charts/volume-by-governorate`

**Purpose**: Sales volume distribution across different governorates.

**Best For**: Bar charts, Horizontal bar charts, Pie charts, Map visualizations

**Request**:
```bash
curl -X GET 'https://localhost:7059/api/MarketAnalysis/charts/volume-by-governorate?productId=1&startDate=2025-10-01'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      { "category": "Baghdad", "value": 45230.5 },
      { "category": "Basra", "value": 32150.0 },
      { "category": "Nineveh", "value": 28900.5 },
      { "category": "Erbil", "value": 19170.0 }
    ],
    "total": 125451.0,
    "productName": "طماطم"
  },
  "message": "Volume by governorate chart data retrieved"
}
```

**Chart Implementation**:
```javascript
// Bar Chart
const chartData = {
  labels: response.data.data.map(d => d.category),
  datasets: [{
    label: 'Volume (kg)',
    data: response.data.data.map(d => d.value),
    backgroundColor: [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)'
    ]
  }]
};

// Pie Chart
const pieData = {
  labels: response.data.data.map(d => d.category),
  datasets: [{
    data: response.data.data.map(d => d.value),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
  }]
};
```

---

### 🥧 C. Transaction Type Distribution Chart

**GET** `/charts/transaction-type-distribution`

**Purpose**: Show distribution of sales across direct sales, auctions, and tenders.

**Best For**: Pie charts, Donut charts

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      { "category": "direct", "value": 2500000.00 },
      { "category": "auction", "value": 850000.00 },
      { "category": "tender", "value": 350000.00 }
    ],
    "total": 3700000.00,
    "governorate": null
  },
  "message": "Transaction type distribution chart data retrieved"
}
```

---

### 🔥 D. Sales Heatmap Chart

**GET** `/charts/sales-heatmap`

**Purpose**: Daily sales intensity visualization for an entire year.

**Best For**: Calendar heatmaps, Activity heatmaps

**Request**:
```bash
curl -X GET 'https://localhost:7059/api/MarketAnalysis/charts/sales-heatmap?productId=1&year=2025'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "date": "2025-01-01",
        "value": 1250.5,
        "intensity": 0.35
      },
      {
        "date": "2025-01-02",
        "value": 2150.0,
        "intensity": 0.60
      },
      {
        "date": "2025-01-03",
        "value": 3580.5,
        "intensity": 1.0
      }
      // ... 365 days
    ],
    "year": 2025,
    "minValue": 0,
    "maxValue": 3580.5,
    "productName": "طماطم",
    "governorate": null
  },
  "message": "Sales heatmap chart data retrieved"
}
```

**Visualization Example**:
```javascript
// Using D3.js for calendar heatmap
const color = d3.scaleSequential(d3.interpolateYlGnBu)
  .domain([data.minValue, data.maxValue]);

svg.selectAll('rect')
  .data(data.data)
  .enter()
  .append('rect')
  .attr('fill', d => color(d.value))
  .attr('data-date', d => d.date)
  .attr('data-value', d => d.value);
```

---

### 📉📈 E. Supply vs Demand Trends

**GET** `/charts/supply-demand-trends`

**Purpose**: Compare supply (listings created) vs demand (sales) over time.

**Best For**: Multi-line charts, Area charts, Dual-axis charts

**Request**:
```bash
curl -X GET 'https://localhost:7059/api/MarketAnalysis/charts/supply-demand-trends?productId=1&days=30'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "supply": [
      { "date": "2025-10-01", "value": 5000.0 },
      { "date": "2025-10-02", "value": 5200.0 },
      { "date": "2025-10-03", "value": 4800.0 }
    ],
    "demand": [
      { "date": "2025-10-01", "value": 4500.0 },
      { "date": "2025-10-02", "value": 4800.0 },
      { "date": "2025-10-03", "value": 4650.0 }
    ],
    "productName": "طماطم",
    "governorate": null
  },
  "message": "Supply/demand trends chart data retrieved"
}
```

---

### 📊 F. Market Share by Product

**GET** `/charts/market-share-by-product`

**Purpose**: Show which products dominate the market by revenue.

**Best For**: Pie charts, Donut charts, Treemap charts

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "طماطم",
        "category": "خضروات",
        "revenue": 1250000.00,
        "percentage": 35.71,
        "color": "#FF6384"
      },
      {
        "productId": 2,
        "productName": "خيار",
        "category": "خضروات",
        "revenue": 850000.00,
        "percentage": 24.29,
        "color": "#36A2EB"
      },
      {
        "productId": 3,
        "productName": "بطاطا",
        "category": "خضروات",
        "revenue": 650000.00,
        "percentage": 18.57,
        "color": "#FFCE56"
      }
    ],
    "totalValue": 3500000.00,
    "governorate": null
  },
  "message": "Market share by product retrieved"
}
```

---

### 📈 G. Price Volatility Chart

**GET** `/charts/price-volatility`

**Purpose**: Show price fluctuations with open/high/low/close data and standard deviation.

**Best For**: Candlestick charts, Box plots, Range charts

**Request**:
```bash
curl -X GET 'https://localhost:7059/api/MarketAnalysis/charts/price-volatility?productId=1&groupBy=week'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "date": "2025-10-01",
        "open": 27.50,
        "high": 32.00,
        "low": 25.00,
        "close": 30.50,
        "standardDeviation": 2.35,
        "transactionCount": 145
      },
      {
        "date": "2025-10-08",
        "open": 30.50,
        "high": 35.00,
        "low": 28.00,
        "close": 33.20,
        "standardDeviation": 2.80,
        "transactionCount": 156
      }
    ],
    "productName": "طماطم",
    "governorate": null,
    "overallVolatility": 2.58
  },
  "message": "Price volatility chart data retrieved"
}
```

**Candlestick Chart Example**:
```javascript
// Using TradingView Lightweight Charts
const candlestickSeries = chart.addCandlestickSeries();
candlestickSeries.setData(
  response.data.data.map(d => ({
    time: d.date,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close
  }))
);
```

---

### ⚡ H. Daily Sales Sparkline

**GET** `/charts/daily-sales-sparkline`

**Purpose**: Compact visualization of recent sales trend.

**Best For**: Sparklines, Mini charts, KPI indicators

**Request**:
```bash
curl -X GET 'https://localhost:7059/api/MarketAnalysis/charts/daily-sales-sparkline?productId=1&days=7'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "values": [4250.0, 4580.5, 4120.0, 4650.0, 4890.5, 5120.0, 4980.5],
    "dates": [
      "2025-11-06",
      "2025-11-07",
      "2025-11-08",
      "2025-11-09",
      "2025-11-10",
      "2025-11-11",
      "2025-11-12"
    ],
    "trend": "increasing",
    "changePercent": 17.18,
    "min": 4120.0,
    "max": 5120.0,
    "avg": 4656.0
  },
  "message": "Daily sales sparkline data retrieved"
}
```

---

### 📊 I. Dashboard Summary (KPI Cards)

**GET** `/charts/dashboard-summary`

**Purpose**: Complete dashboard overview with key metrics and trends.

**Best For**: Dashboard KPI cards, Summary widgets, Executive dashboards

**Response**:
```json
{
  "success": true,
  "data": {
    "kpis": [
      {
        "title": "Total Revenue",
        "value": 3500000.00,
        "unit": "JOD",
        "change": 12.5,
        "trend": "up",
        "icon": "money"
      },
      {
        "title": "Total Volume",
        "value": 125450.5,
        "unit": "kg",
        "change": 5.8,
        "trend": "up",
        "icon": "weight"
      },
      {
        "title": "Avg Price",
        "value": 27.89,
        "unit": "JOD/kg",
        "change": -3.2,
        "trend": "down",
        "icon": "price-tag"
      },
      {
        "title": "Transactions",
        "value": 1245,
        "unit": "count",
        "change": 8.9,
        "trend": "up",
        "icon": "transaction"
      },
      {
        "title": "Active Users",
        "value": 845,
        "unit": "count",
        "change": 15.3,
        "trend": "up",
        "icon": "users"
      },
      {
        "title": "Unique Products",
        "value": 45,
        "unit": "count",
        "change": 2.1,
        "trend": "up",
        "icon": "box"
      }
    ],
    "period": {
      "current": { "start": "2025-10-13", "end": "2025-11-12" },
      "previous": { "start": "2025-09-13", "end": "2025-10-12" }
    },
    "topPerformers": {
      "products": [
        { "id": 1, "name": "طماطم", "revenue": 1250000.00 },
        { "id": 2, "name": "خيار", "revenue": 850000.00 }
      ],
      "governorates": [
        { "name": "Baghdad", "revenue": 1500000.00 },
        { "name": "Basra", "revenue": 950000.00 }
      ]
    },
    "alerts": [
      {
        "type": "warning",
        "message": "High price volatility detected for طماطم",
        "severity": "medium"
      },
      {
        "type": "info",
        "message": "Supply exceeds demand by 20%",
        "severity": "low"
      }
    ]
  },
  "message": "Dashboard summary retrieved"
}
```

---

## 4. Filter Endpoints

### A. Get Available Filters

**GET** `/filters/available`

**Purpose**: Get all available filter options for the user to choose from.

**Response**:
```json
{
  "success": true,
  "data": {
    "governorates": [
      "Baghdad",
      "Basra",
      "Nineveh",
      "Erbil",
      "Diyala",
      "Anbar",
      "Najaf"
    ],
    "products": [
      {
        "productId": 1,
        "nameAr": "طماطم",
        "nameEn": "Tomato",
        "category": "خضروات",
        "hasData": true
      },
      {
        "productId": 2,
        "nameAr": "خيار",
        "nameEn": "Cucumber",
        "category": "خضروات",
        "hasData": true
      }
    ],
    "categories": [
      "خضروات",
      "فواكه",
      "حبوب",
      "بقوليات"
    ],
    "transactionTypes": [
      "direct",
      "auction",
      "tender"
    ],
    "dateRange": {
      "earliest": "2025-01-01T00:00:00Z",
      "latest": "2025-11-12T00:00:00Z",
      "suggested": {
        "last7Days": { "start": "2025-11-05", "end": "2025-11-12" },
        "last30Days": { "start": "2025-10-13", "end": "2025-11-12" },
        "last90Days": { "start": "2025-08-14", "end": "2025-11-12" },
        "thisMonth": { "start": "2025-11-01", "end": "2025-11-30" },
        "lastMonth": { "start": "2025-10-01", "end": "2025-10-31" }
      }
    },
    "priceRange": {
      "min": 5.00,
      "max": 150.00,
      "suggested": [
        { "label": "Low", "min": 5.00, "max": 30.00 },
        { "label": "Medium", "min": 30.00, "max": 80.00 },
        { "label": "High", "min": 80.00, "max": 150.00 }
      ]
    },
    "volumeRange": {
      "min": 10.0,
      "max": 50000.0
    }
  },
  "message": "Available filters retrieved"
}
```

### B. Validate Filter Parameters

**POST** `/filters/validate`

**Purpose**: Validate filter parameters before making the actual query.

**Request Body**:
```json
{
  "productIds": [1, 2, 3],
  "governorates": ["Baghdad", "Basra"],
  "startDate": "2025-10-01",
  "endDate": "2025-11-01",
  "minPrice": 10.00,
  "maxPrice": 50.00,
  "transactionType": "direct"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "Date range exceeds 90 days - query may be slow"
    ],
    "estimatedResults": 1250,
    "estimatedExecutionTime": "2.5 seconds"
  },
  "message": "Filter validation completed"
}
```

---

# Dashboard APIs

Base URL: `https://localhost:7059/api/gov/dashboard`

---

## 1. Auto-Fill Dashboard (⭐ RECOMMENDED)

### GET `/auto-fill`

**Purpose**: Load ALL essential dashboard data in one request. Perfect for initial page load.

**Query Parameters**:
```
governorate?: string
days?: number (default: 30)
```

**Request**:
```bash
curl -X GET 'https://localhost:7059/api/gov/dashboard/auto-fill?governorate=Baghdad&days=30'
```

**Complete Response** (Full Example):
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalFarms": 450,
      "activeListings": 320,
      "openAuctions": 45,
      "openTenders": 12,
      "totalInventory": 125000.5,
      "newUsersToday": 8,
      "activeUsers30Days": 845
    },
    "salesMetrics": {
      "today": {
        "revenue": 45200.50,
        "transactions": 125
      },
      "yesterday": {
        "revenue": 42100.00,
        "transactions": 118
      },
      "revenueChange": 7.36,
      "transactionsChange": 5.93
    },
    "marketAnalysis": {
      "kpis": [
        {
          "title": "Total Revenue",
          "value": 3500000.00,
          "unit": "JOD",
          "change": 12.5,
          "trend": "up"
        },
        {
          "title": "Total Volume",
          "value": 125450.5,
          "unit": "kg",
          "change": 5.8,
          "trend": "up"
        }
      ],
      "trends": [...]
    },
    "topProducts": [
      {
        "productId": 1,
        "nameAr": "طماطم",
        "nameEn": "Tomato",
        "totalVolume": 45230.0,
        "totalRevenue": 1250000.00,
        "avgPrice": 27.65,
        "transactions": 856
      },
      {
        "productId": 2,
        "nameAr": "خيار",
        "nameEn": "Cucumber",
        "totalVolume": 32150.5,
        "totalRevenue": 850000.00,
        "avgPrice": 26.43,
        "transactions": 645
      },
      {
        "productId": 3,
        "nameAr": "بطاطا",
        "nameEn": "Potato",
        "totalVolume": 28900.0,
        "totalRevenue": 650000.00,
        "avgPrice": 22.49,
        "transactions": 512
      }
    ],
    "transactionsByType": [
      {
        "type": "direct",
        "count": 856,
        "value": 2500000.00
      },
      {
        "type": "auction",
        "count": 234,
        "value": 850000.00
      },
      {
        "type": "tender",
        "count": 155,
        "value": 150000.00
      }
    ],
    "topGovernorates": [
      {
        "governorate": "Baghdad",
        "totalVolume": 52300.5,
        "totalValue": 1500000.00,
        "transactions": 478
      },
      {
        "governorate": "Basra",
        "totalVolume": 38900.0,
        "totalValue": 950000.00,
        "transactions": 356
      },
      {
        "governorate": "Nineveh",
        "totalVolume": 34250.0,
        "totalValue": 750000.00,
        "transactions": 411
      }
    ],
    "recentActivity": {
      "auctions": [
        {
          "type": "auction",
          "id": 234,
          "title": "مزاد خيار طازج - 500 كغ",
          "status": "open",
          "createdAt": "2025-11-12T14:30:00Z"
        },
        {
          "type": "auction",
          "id": 233,
          "title": "مزاد طماطم - 1000 كغ",
          "status": "open",
          "createdAt": "2025-11-12T13:45:00Z"
        }
      ],
      "tenders": [
        {
          "type": "tender",
          "id": 89,
          "title": "مناقصة توريد بطاطا - 5 طن",
          "status": "open",
          "createdAt": "2025-11-12T12:20:00Z"
        }
      ],
      "listings": [
        {
          "type": "listing",
          "id": 456,
          "title": "خيار طازج من المزرعة",
          "status": "active",
          "createdAt": "2025-11-12T15:10:00Z"
        },
        {
          "type": "listing",
          "id": 455,
          "title": "طماطم عضوية - جودة ممتازة",
          "status": "active",
          "createdAt": "2025-11-12T14:55:00Z"
        }
      ]
    },
    "inventory": {
      "total": 125000.5,
      "lowStockProducts": [
        {
          "productId": 5,
          "productName": "بصل",
          "quantityOnHand": 85.5,
          "cropsCount": 3
        },
        {
          "productId": 8,
          "productName": "ثوم",
          "quantityOnHand": 92.0,
          "cropsCount": 2
        }
      ]
    },
    "priceTrends": [
      { "date": "2025-11-05", "avgPrice": 26.50 },
      { "date": "2025-11-06", "avgPrice": 27.10 },
      { "date": "2025-11-07", "avgPrice": 27.35 },
      { "date": "2025-11-08", "avgPrice": 28.20 },
      { "date": "2025-11-09", "avgPrice": 28.50 },
      { "date": "2025-11-10", "avgPrice": 29.10 },
      { "date": "2025-11-11", "avgPrice": 28.90 },
      { "date": "2025-11-12", "avgPrice": 29.45 }
    ],
    "period": {
      "startDate": "2025-10-13T00:00:00Z",
      "endDate": "2025-11-12T23:59:59Z",
      "days": 30
    }
  },
  "message": "Dashboard data retrieved successfully",
  "traceId": "00-abc123def456-789xyz-00"
}
```

---

## 2. Market Overview

### GET `/overview`

**Purpose**: Period-over-period comparison with trend analysis.

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "days": 30,
      "startDate": "2025-10-13",
      "endDate": "2025-11-12"
    },
    "metrics": {
      "revenue": {
        "current": 3500000.00,
        "previous": 3200000.00,
        "change": 9.38,
        "trend": "up"
      },
      "volume": {
        "current": 125000.5,
        "previous": 118000.0,
        "change": 5.93,
        "trend": "up"
      },
      "transactions": {
        "current": 1250,
        "previous": 1180,
        "change": 5.93,
        "trend": "up"
      },
      "averagePrice": {
        "current": 28.00,
        "previous": 27.12,
        "change": 3.24,
        "trend": "up"
      }
    },
    "marketShare": [
      {
        "type": "direct",
        "count": 856,
        "volume": 85000.0,
        "revenue": 2500000.00,
        "percentage": 71.43
      },
      {
        "type": "auction",
        "count": 234,
        "volume": 28000.0,
        "revenue": 850000.00,
        "percentage": 24.29
      },
      {
        "type": "tender",
        "count": 160,
        "volume": 12000.5,
        "revenue": 150000.00,
        "percentage": 4.29
      }
    ],
    "activeEntities": {
      "farms": 420,
      "users": 845,
      "products": 156
    },
    "governorate": "Baghdad"
  },
  "message": "Market overview retrieved successfully"
}
```

---

## 3. Real-Time Data

### GET `/real-time`

**Purpose**: Live monitoring data for real-time dashboards. Poll every 10-30 seconds.

**Response**:
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-12T14:30:25.123Z",
    "recentTransactions": [
      {
        "transactionId": 12345,
        "productName": "طماطم",
        "quantity": 250.0,
        "unitPrice": 28.50,
        "totalAmount": 7125.00,
        "transactionType": "direct",
        "governorate": "Baghdad",
        "sellerName": "أحمد علي",
        "buyerName": "سارة محمد",
        "createdAt": "2025-11-12T14:28:15Z"
      },
      {
        "transactionId": 12344,
        "productName": "خيار",
        "quantity": 180.5,
        "unitPrice": 22.00,
        "totalAmount": 3971.00,
        "transactionType": "auction",
        "governorate": "Basra",
        "sellerName": "علي حسن",
        "buyerName": "فاطمة أحمد",
        "createdAt": "2025-11-12T14:26:42Z"
      }
    ],
    "activeBids": [
      {
        "bidId": 5678,
        "auctionId": 234,
        "cropName": "خيار طازج",
        "bidderName": "عمر الخطيب",
        "bidAmount": 5500.00,
        "createdAt": "2025-11-12T14:25:00Z"
      },
      {
        "bidId": 5677,
        "auctionId": 233,
        "cropName": "طماطم",
        "bidderName": "ليلى السيد",
        "bidAmount": 12000.00,
        "createdAt": "2025-11-12T14:23:30Z"
      }
    ],
    "todayStats": {
      "newUsers": 8,
      "newListings": 45,
      "newAuctions": 12,
      "newTenders": 3,
      "newOrders": 125,
      "totalBids": 456,
      "totalOffers": 89
    },
    "openNow": {
      "auctions": 45,
      "tenders": 12,
      "listings": 320
    },
    "systemHealth": {
      "totalUsers": 1250,
      "activeUsersToday": 342,
      "totalProducts": 156,
      "totalFarms": 450,
      "activeFarms": 420,
      "pendingPayments": 23
    }
  },
  "message": "Real-time data retrieved successfully"
}
```

---

## 4. Analytics Breakdown

### GET `/analytics/breakdown`

**Purpose**: Flexible drill-down analytics by various dimensions.

**Query Parameters**:
```
groupBy: "product" | "governorate" | "category" | "type"
governorate?: string
days?: number (default: 30)
topN?: number (default: 10)
```

**Example 1: By Product**
```bash
curl -X GET 'https://localhost:7059/api/gov/dashboard/analytics/breakdown?groupBy=product&topN=5'
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "productId": 1,
      "name": "طماطم",
      "category": "خضروات",
      "totalVolume": 45230.0,
      "totalRevenue": 1250000.00,
      "avgPrice": 27.65,
      "transactions": 856,
      "minPrice": 22.00,
      "maxPrice": 35.00
    },
    {
      "productId": 2,
      "name": "خيار",
      "category": "خضروات",
      "totalVolume": 32150.5,
      "totalRevenue": 850000.00,
      "avgPrice": 26.43,
      "transactions": 645,
      "minPrice": 20.00,
      "maxPrice": 32.00
    }
  ],
  "message": "Analytics breakdown by product retrieved successfully"
}
```

**Example 2: By Governorate**
```bash
curl -X GET 'https://localhost:7059/api/gov/dashboard/analytics/breakdown?groupBy=governorate'
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "governorate": "Baghdad",
      "totalVolume": 52300.5,
      "totalRevenue": 1500000.00,
      "avgPrice": 28.68,
      "transactions": 478,
      "uniqueProducts": 45
    },
    {
      "governorate": "Basra",
      "totalVolume": 38900.0,
      "totalRevenue": 950000.00,
      "avgPrice": 24.42,
      "transactions": 356,
      "uniqueProducts": 38
    }
  ],
  "message": "Analytics breakdown by governorate retrieved successfully"
}
```

---

## 5. Supply Chain Analytics

### GET `/analytics/supply-chain`

**Purpose**: End-to-end supply chain monitoring.

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "days": 30,
      "startDate": "2025-10-13",
      "endDate": "2025-11-12"
    },
    "production": {
      "total": 150000.0,
      "byGovernorate": [
        {
          "governorate": "Diyala",
          "quantity": 50000.0,
          "farms": 120
        },
        {
          "governorate": "Nineveh",
          "quantity": 45000.0,
          "farms": 95
        },
        {
          "governorate": "Anbar",
          "quantity": 35000.0,
          "farms": 78
        }
      ]
    },
    "sales": {
      "total": 125000.0,
      "efficiency": 83.33
    },
    "inventory": {
      "current": 125000.5,
      "turnoverRate": 100.00
    },
    "logistics": {
      "activeTransports": 45,
      "completedTransports": 234
    },
    "waste": {
      "estimatedUnsold": 15000.0,
      "wastePercentage": 10.00
    }
  },
  "message": "Supply chain analytics retrieved successfully"
}
```

---

## 6. Basic KPIs

### GET `/kpis`

**Purpose**: Simple KPIs for a specific date.

**Query Parameters**:
```
date?: string (ISO 8601, default: today)
```

**Response**:
```json
{
  "totalSalesToday": 45200.50,
  "topCrops": [
    { "crop": "طماطم", "qty": 5230.0 },
    { "crop": "خيار", "qty": 3580.5 },
    { "crop": "بطاطا", "qty": 2890.0 },
    { "crop": "بصل", "qty": 2150.5 },
    { "crop": "جزر", "qty": 1890.0 }
  ],
  "availableCropsQty": 125000.5,
  "sold30DaysQty": 98450.0,
  "stockTurnover": 0.785
}
```

---

# Integration Patterns

## Pattern 1: Complete Dashboard Load

```typescript
// Load everything on page mount
async function loadDashboard() {
  try {
    // Single request gets everything
    const response = await fetch(
      '/api/gov/dashboard/auto-fill?days=30'
    );
    const result = await response.json();
    
    if (result.success) {
      const { 
        overview, 
        salesMetrics, 
        topProducts, 
        recentActivity,
        priceTrends 
      } = result.data;
      
      // Update all dashboard sections
      updateKPIs(overview);
      updateSalesCards(salesMetrics);
      updateProductsTable(topProducts);
      updateActivityFeed(recentActivity);
      updatePriceChart(priceTrends);
    }
  } catch (error) {
    console.error('Dashboard load failed:', error);
    showErrorMessage('Failed to load dashboard data');
  }
}
```

## Pattern 2: Real-Time Monitoring

```typescript
// Real-time updates every 10 seconds
function setupRealTimeMonitoring() {
  const updateInterval = 10000; // 10 seconds
  
  async function updateRealTime() {
    const response = await fetch('/api/gov/dashboard/real-time');
    const result = await response.json();
    
    if (result.success) {
      // Update live sections only
      updateTransactionsFeed(result.data.recentTransactions);
      updateActiveBids(result.data.activeBids);
      updateTodayStats(result.data.todayStats);
      updateSystemHealth(result.data.systemHealth);
    }
  }
  
  // Initial load
  updateRealTime();
  
  // Poll every 10 seconds
  return setInterval(updateRealTime, updateInterval);
}

// Cleanup on component unmount
const intervalId = setupRealTimeMonitoring();
// Later: clearInterval(intervalId);
```

## Pattern 3: Chart Visualization

```typescript
// Load specific chart data
async function loadPriceTrendsChart(productId: number) {
  const response = await fetch(
    `/api/MarketAnalysis/charts/price-trends?` +
    `productId=${productId}&` +
    `groupBy=week&` +
    `days=90`
  );
  
  const result = await response.json();
  
  if (result.success) {
    const chartData = {
      labels: result.data.avgPrices.map(d => d.date),
      datasets: [
        {
          label: 'Average Price',
          data: result.data.avgPrices.map(d => d.value),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true
        },
        {
          label: 'Min Price',
          data: result.data.minPrices.map(d => d.value),
          borderColor: 'rgb(255, 99, 132)',
          borderDash: [5, 5]
        },
        {
          label: 'Max Price',
          data: result.data.maxPrices.map(d => d.value),
          borderColor: 'rgb(54, 162, 235)',
          borderDash: [5, 5]
        }
      ]
    };
    
    renderChart('price-trends-canvas', chartData);
  }
}
```

## Pattern 4: Filter-Based Analytics

```typescript
// Dynamic filtering
async function applyFilters(filters: FilterOptions) {
  // Step 1: Validate filters
  const validation = await fetch(
    '/api/MarketAnalysis/filters/validate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    }
  );
  
  const validationResult = await validation.json();
  
  if (!validationResult.data.isValid) {
    showValidationErrors(validationResult.data.errors);
    return;
  }
  
  // Show warnings if any
  if (validationResult.data.warnings.length > 0) {
    showWarnings(validationResult.data.warnings);
  }
  
  // Step 2: Load filtered data
  const queryString = new URLSearchParams({
    productId: filters.productId?.toString() || '',
    governorate: filters.governorate || '',
    startDate: filters.startDate,
    endDate: filters.endDate
  }).toString();
  
  const response = await fetch(
    `/api/MarketAnalysis/comprehensive-analysis?${queryString}`
  );
  
  const result = await response.json();
  
  if (result.success) {
    updateAnalyticsDashboard(result.data);
  }
}
```

---

# Best Practices

## 1. Performance Optimization

### Caching Strategy
```typescript
// Cache dashboard data for 2 minutes
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 120000; // 2 minutes

async function getCachedData(key: string, fetchFn: () => Promise<any>) {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
}

// Usage
const dashboardData = await getCachedData(
  'dashboard-auto-fill',
  () => fetch('/api/gov/dashboard/auto-fill').then(r => r.json())
);
```

### Parallel Loading
```typescript
// Load multiple endpoints in parallel
async function loadDashboardParallel() {
  const [overview, realTime, topProducts] = await Promise.all([
    fetch('/api/gov/dashboard/overview').then(r => r.json()),
    fetch('/api/gov/dashboard/real-time').then(r => r.json()),
    fetch('/api/MarketAnalysis/charts/top-products').then(r => r.json())
  ]);
  
  return { overview, realTime, topProducts };
}
```

## 2. Error Handling

```typescript
async function fetchWithRetry(
  url: string, 
  maxRetries: number = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.detail || 'API Error');
      }
      
      return result.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

## 3. Real-Time Updates

```typescript
// Smart polling with exponential backoff on errors
class SmartPoller {
  private intervalId: number | null = null;
  private currentInterval: number;
  private errorCount: number = 0;
  
  constructor(
    private url: string,
    private callback: (data: any) => void,
    private baseInterval: number = 10000
  ) {
    this.currentInterval = baseInterval;
  }
  
  async poll() {
    try {
      const response = await fetch(this.url);
      const result = await response.json();
      
      if (result.success) {
        this.callback(result.data);
        this.errorCount = 0;
        this.currentInterval = this.baseInterval;
      }
    } catch (error) {
      this.errorCount++;
      // Exponential backoff on errors
      this.currentInterval = Math.min(
        this.baseInterval * Math.pow(2, this.errorCount),
        60000 // Max 1 minute
      );
    }
  }
  
  start() {
    this.poll(); // Initial poll
    this.intervalId = window.setInterval(
      () => this.poll(),
      this.currentInterval
    );
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Usage
const poller = new SmartPoller(
  '/api/gov/dashboard/real-time',
  (data) => updateDashboard(data),
  10000
);

poller.start();
// Later: poller.stop();
```

---

## Summary

### Market Analysis APIs - Use When:
- ✅ Building analytical dashboards
- ✅ Creating data visualizations
- ✅ Generating reports
- ✅ Forecasting trends
- ✅ Historical analysis

### Dashboard APIs - Use When:
- ✅ Building operational dashboards
- ✅ Real-time monitoring
- ✅ Executive summaries
- ✅ Quick KPI views
- ✅ Initial page loads (auto-fill)

### Key Recommendations:
1. **Use `/auto-fill` for initial dashboard load** - Gets everything in one request
2. **Use `/real-time` for live monitoring** - Poll every 10-30 seconds
3. **Use chart endpoints for visualizations** - Pre-formatted for charts
4. **Use filter endpoints for validation** - Before making expensive queries
5. **Implement caching** - Reduce server load and improve UX
6. **Handle errors gracefully** - With retry logic and exponential backoff

---

**For complete API documentation, see:**
- `DASHBOARD_API_GUIDE.md` - Dashboard APIs reference
- `DASHBOARD_QUICK_START.md` - Quick start guide
- `DASHBOARD_IMPLEMENTATION_SUMMARY.md` - Technical details

**Last Updated**: November 12, 2025

