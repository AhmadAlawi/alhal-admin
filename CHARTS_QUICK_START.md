# 🚀 Charts Quick Start Guide

## Get Your Charts Running in 3 Minutes!

---

## Step 1: Configure API URL (30 seconds)

Create `.env.local` file in the project root:

```bash
echo "VITE_API_BASE_URL=http://localhost:5000" > .env.local
```

**Replace `http://localhost:5000` with your actual API URL!**

---

## Step 2: Install & Run (2 minutes)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Step 3: Test the Charts (30 seconds)

1. Open your browser to `http://localhost:3000`
2. Click on **Analytics** in the sidebar
3. Try selecting different governorates
4. Click the **Refresh** button
5. Watch your charts update with real data! ✨

---

## 🎯 What You Get

### Real-Time Interactive Charts

1. **Price Trends** - Area chart showing price movements
2. **Top Products by Revenue** - Bar chart of best sellers
3. **Market Growth Rate** - Line chart of growth trends

### Features

- ✅ **Governorate Filtering** - Filter by Baghdad, Basra, Mosul, Erbil, Najaf
- ✅ **Auto-Refresh** - Data updates automatically
- ✅ **Loading States** - Professional loading indicators
- ✅ **Error Handling** - Falls back to demo data if API fails
- ✅ **Responsive Design** - Works on all devices

---

## 📊 Available Endpoints

Your charts connect to these endpoints:

```
/api/MarketAnalysis/charts/dashboard-summary
/api/MarketAnalysis/charts/price-trends
/api/MarketAnalysis/charts/top-products-by-revenue
```

---

## 🔧 Troubleshooting

### Charts showing demo data?

**Check:**
1. Is your backend API running?
2. Is the API URL in `.env.local` correct?
3. Open browser console - any CORS errors?

**Solution:**
- Make sure backend has CORS enabled
- Verify API URL is accessible
- Check if endpoints return data

### CORS Error?

**Backend needs to allow your frontend URL:**

```csharp
// In your .NET backend
app.UseCors(policy => policy
    .WithOrigins("http://localhost:3000")
    .AllowAnyMethod()
    .AllowAnyHeader());
```

---

## 🎨 Customize Charts

### Change Chart Colors

Edit `src/pages/Analytics.jsx`:

```javascript
<Chart
  type="area"
  data={data}
  dataKey="price"
  xAxisKey="date"
  title="Price Trends"
  color="#your-color" // Change this!
/>
```

### Add More Charts

```javascript
import { useMarketData } from '../hooks/useMarketData';
import marketAnalysisService from '../services/marketAnalysisService';

// Fetch new data
const { data } = useMarketData(
  marketAnalysisService.getSupplyDemandTrends,
  { productId=2: 1, governorate: 'Baghdad', days: 30 },
  [productId=2, governorate]
);

// Add chart
<Chart
  type="line"
  data={formatData(data)}
  dataKey="supply"
  xAxisKey="date"
  title="Supply Trends"
  color="#10b981"
/>
```

---

## 📝 Quick API Reference

### Get Price Trends

```javascript
import marketAnalysisService from './services/marketAnalysisService';

const data = await marketAnalysisService.getPriceTrends({
  productId=2: 1,
  governorate: 'Baghdad',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  groupBy: 'day'
});
```

### Get Top Products

```javascript
const data = await marketAnalysisService.getTopProductsByRevenue({
  governorate: 'Baghdad',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  topN: 10
});
```

### Get Dashboard Summary

```javascript
const data = await marketAnalysisService.getDashboardSummary('Baghdad');
```

---

## 🎯 Next Steps

1. **Add More Charts** - Copy the Analytics pattern to other pages
2. **Customize Filters** - Add product selection, custom date ranges
3. **Add Export** - Export chart data to CSV/Excel
4. **Real-time Updates** - Add WebSocket for live data
5. **More Visualizations** - Pie charts, heatmaps, gauges

---

## 📚 Full Documentation

- **API_INTEGRATION.md** - Complete API guide
- **CHARTS_INTEGRATION_SUMMARY.md** - Detailed summary
- **COMPONENTS.md** - Component documentation

---

## ✨ That's It!

Your charts are now connected to real backend data!

**Need help?** Check the documentation files or inspect the `Analytics.jsx` file for examples.

Happy charting! 📊🎉

