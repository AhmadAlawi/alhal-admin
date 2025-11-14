# API Integration Guide

## Overview

Your Al-Hal Admin Dashboard is now integrated with your backend API. This guide explains how the integration works and how to use it.

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000
```

**Important:** Replace `http://localhost:5000` with your actual API URL.

---

## 📁 API Services Structure

### Service Files

All API services are located in `src/services/`:

```
src/services/
├── api.js                      # Base API client
├── marketAnalysisService.js    # Market analysis endpoints
├── dashboardService.js         # Government dashboard endpoints
├── adminService.js             # Admin operations
├── auctionsService.js          # Auctions management
└── ordersService.js            # Orders/Direct sales
```

---

## 🎯 Available Services

### 1. Market Analysis Service

**Location:** `src/services/marketAnalysisService.js`

**Available Methods:**

```javascript
import marketAnalysisService from './services/marketAnalysisService';

// Dashboard Summary
const summary = await marketAnalysisService.getDashboardSummary(governorate);

// Price Trends
const priceTrends = await marketAnalysisService.getPriceTrends({
  productId=2: 1,
  governorate: 'Baghdad',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  groupBy: 'day' // or 'week', 'month'
});

// Volume by Governorate
const volumeData = await marketAnalysisService.getVolumeByGovernorate({
  productId=2: 1,
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Top Products by Revenue
const topProducts = await marketAnalysisService.getTopProductsByRevenue({
  governorate: 'Baghdad',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  topN: 10
});

// Price Comparison by Governorate
const priceComparison = await marketAnalysisService.getPriceComparisonByGovernorate({
  productId=2: 1,
  date: '2024-11-12'
});

// Supply-Demand Trends
const supplyDemand = await marketAnalysisService.getSupplyDemandTrends({
  productId=2: 1,
  governorate: 'Baghdad',
  days: 30
});

// Market Share by Product
const marketShare = await marketAnalysisService.getMarketShareByProduct({
  governorate: 'Baghdad',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Price Volatility
const volatility = await marketAnalysisService.getPriceVolatility({
  productId=2: 1,
  governorate: 'Baghdad',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  groupBy: 'day'
});
```

### 2. Dashboard Service

**Location:** `src/services/dashboardService.js`

```javascript
import dashboardService from './services/dashboardService';

// Get KPIs
const kpis = await dashboardService.getKPIs(date);

// Get Map Data
const mapData = await dashboardService.getMapData(date);

// Get User Summary
const userSummary = await dashboardService.getUserSummary({
  userId: 1,
  from: '2024-01-01',
  to: '2024-12-31'
});

// Get User Auctions
const userAuctions = await dashboardService.getUserAuctions({
  userId: 1,
  from: '2024-01-01',
  to: '2024-12-31'
});
```

### 3. Admin Service

**Location:** `src/services/adminService.js`

```javascript
import adminService from './services/adminService';

// Health Check
const health = await adminService.healthCheck();

// Get Users (with pagination)
const users = await adminService.getUsers({ page: 1, pageSize: 20 });

// Assign Role
await adminService.assignRole({
  userId: 1,
  roleName: 'Admin'
});

// Toggle User Active Status
await adminService.toggleUserActive({
  userId: 1,
  isActive: true
});

// Products Management
const products = await adminService.getProducts();
const product = await adminService.getProduct(1);

await adminService.addProduct({
  nameAr: 'قمح',
  nameEn: 'Wheat',
  category: 'Grains',
  imageUrl: 'https://...',
  description: 'High quality wheat'
});

// Government Prices
const prices = await adminService.getPrices();
const priceHistory = await adminService.getPriceHistory(productId=2, {
  from: '2024-01-01',
  to: '2024-12-31'
});
```

### 4. Auctions Service

**Location:** `src/services/auctionsService.js`

```javascript
import auctionsService from './services/auctionsService';

// Get Open Auctions
const openAuctions = await auctionsService.getOpenAuctions();

// Get Auction Details
const auction = await auctionsService.getAuction(auctionId);

// Get Auctions by User
const userAuctions = await auctionsService.getAuctionsByUser(userId);

// Get Bids
const bids = await auctionsService.getBids(auctionId);

// Create Auction
await auctionsService.createAuction({
  auctionTitle: 'Wheat Auction',
  auctionDescription: 'High quality wheat',
  startingPrice: 1000,
  minIncrement: 50,
  startTime: '2024-11-12T10:00:00',
  endTime: '2024-11-12T18:00:00',
  cropId: 1
}, createdByUserId);

// Place Bid
await auctionsService.placeBid(auctionId, {
  bidderUserId: 1,
  bidAmount: 1500
});
```

### 5. Orders Service

**Location:** `src/services/ordersService.js`

```javascript
import ordersService from './services/ordersService';

// Get All Listings
const listings = await ordersService.getListings();

// Create Listing
await ordersService.createListing({
  sellerUserId: 1,
  cropId: 1,
  title: 'Fresh Wheat',
  unitPrice: 50,
  location: 'Baghdad'
});

// Get Orders by Buyer
const buyerOrders = await ordersService.getOrdersByBuyer(buyerUserId);

// Get Orders by Seller
const sellerOrders = await ordersService.getOrdersBySeller(sellerUserId);

// Create Order
await ordersService.createOrder({
  listingId: 1,
  buyerUserId: 1,
  qty: 100,
  deliveryAddress: 'Baghdad, Iraq',
  paymentMethod: 'Cash'
});

// Update Order Status
await ordersService.updateOrderStatus(orderId, {
  newStatus: 'Shipped'
});
```

---

## 🪝 Custom React Hooks

### useMarketData Hook

**Location:** `src/hooks/useMarketData.js`

Generic hook for fetching market data with loading and error states.

```javascript
import { useMarketData } from './hooks/useMarketData';
import marketAnalysisService from './services/marketAnalysisService';

function MyComponent() {
  const { data, loading, error, refetch } = useMarketData(
    marketAnalysisService.getPriceTrends,
    { productId=2: 1, governorate: 'Baghdad' },
    [productId=2, governorate] // dependencies
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Use data */}</div>;
}
```

### Specialized Hooks

```javascript
import { 
  useDashboardSummary,
  usePriceTrends,
  useTopProducts 
} from './hooks/useMarketData';

// Dashboard Summary
const { data, loading, error, refetch } = useDashboardSummary('Baghdad');

// Price Trends
const { data: trends } = usePriceTrends({
  productId=2: 1,
  governorate: 'Baghdad',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Top Products
const { data: topProducts } = useTopProducts({
  governorate: 'Baghdad',
  topN: 10
});
```

### useDashboardData Hook

**Location:** `src/hooks/useDashboardData.js`

```javascript
import { useDashboardKPIs, useMapData } from './hooks/useDashboardData';

// Get KPIs
const { data: kpis, loading, error } = useDashboardKPIs(date);

// Get Map Data
const { data: mapData } = useMapData(date);
```

---

## 🎨 Example: Analytics Page Integration

The Analytics page (`src/pages/Analytics.jsx`) is now fully integrated with real API data:

**Features:**
- ✅ Real-time data fetching from backend
- ✅ Governorate filtering
- ✅ Date range selection
- ✅ Loading states
- ✅ Error handling with fallback to demo data
- ✅ Refresh functionality
- ✅ Multiple chart types (Price Trends, Top Products, Growth Rate)

**Key Implementation:**

```javascript
import { useDashboardSummary, usePriceTrends, useTopProducts } from '../hooks/useMarketData';

const Analytics = () => {
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  
  // Fetch real data
  const { data: summaryData, loading, error, refetch } = useDashboardSummary(selectedGovernorate);
  const { data: priceTrendsData } = usePriceTrends({ governorate: selectedGovernorate });
  
  // ... component logic
};
```

---

## 🔐 Authentication

### Setting Auth Token

The API client automatically includes the Bearer token from localStorage:

```javascript
// After login
localStorage.setItem('authToken', 'your-jwt-token');

// All subsequent API calls will include:
// Authorization: Bearer your-jwt-token
```

### Removing Auth Token

```javascript
// On logout
localStorage.removeItem('authToken');
```

---

## ⚠️ Error Handling

All services include built-in error handling:

```javascript
try {
  const data = await marketAnalysisService.getPriceTrends(params);
  // Handle success
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error - component will show fallback data
}
```

The Analytics page demonstrates graceful degradation - if API calls fail, it falls back to demo data so the UI remains functional.

---

## 📊 Data Formatting

### Example: Format Price Trends Data

```javascript
const formatPriceTrendsData = (apiData) => {
  if (!apiData || !apiData.data) return [];
  
  return apiData.data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    price: item.averagePrice || item.price || 0
  }));
};
```

### Example: Format Top Products Data

```javascript
const formatTopProductsData = (apiData) => {
  if (!apiData || !apiData.data) return [];
  
  return apiData.data.map(item => ({
    name: item.productName || item.name,
    revenue: item.totalRevenue || item.revenue || 0
  }));
};
```

---

## 🚀 Testing the Integration

### 1. Start Your Backend API

```bash
# Make sure your backend is running on the configured port
# Default: http://localhost:5000
```

### 2. Configure Frontend

```bash
# Create .env.local file
echo "VITE_API_BASE_URL=http://localhost:5000" > .env.local
```

### 3. Start Frontend

```bash
npm run dev
```

### 4. Test the Integration

1. Open the Analytics page
2. Check browser console for API calls
3. Select different governorates to see data refresh
4. Click the Refresh button to manually refetch data

---

## 🔍 Debugging

### Enable Console Logging

All API errors are logged to the console:

```javascript
console.error('API Error:', error);
```

### Check Network Tab

- Open browser DevTools
- Go to Network tab
- Filter by "XHR" or "Fetch"
- Inspect API requests and responses

### Common Issues

**CORS Errors:**
- Ensure your backend has CORS enabled
- Add your frontend URL to allowed origins

**401 Unauthorized:**
- Check if auth token is set in localStorage
- Verify token hasn't expired

**404 Not Found:**
- Verify API base URL in .env.local
- Check endpoint paths match your OpenAPI spec

---

## 📝 Adding New API Endpoints

### Step 1: Add to Service File

```javascript
// src/services/yourService.js
export const yourService = {
  newEndpoint: async (params) => {
    return apiClient.get('/api/your/endpoint', params);
  },
};
```

### Step 2: Create Custom Hook (Optional)

```javascript
// src/hooks/useYourData.js
export const useYourData = (params) => {
  return useMarketData(
    yourService.newEndpoint,
    params,
    [params.dependency1, params.dependency2]
  );
};
```

### Step 3: Use in Component

```javascript
import { useYourData } from './hooks/useYourData';

function YourComponent() {
  const { data, loading, error } = useYourData({ id: 1 });
  
  return <div>{/* Render data */}</div>;
}
```

---

## 🎯 Next Steps

1. **Update Dashboard Page** - Integrate with `/api/gov/dashboard/kpis`
2. **Update Users Page** - Integrate with `/api/admin/users`
3. **Update Products Page** - Integrate with `/api/admin/products`
4. **Update Orders Page** - Integrate with `/api/direct/orders`
5. **Add Authentication** - Implement login/logout with JWT tokens

---

## 📚 API Documentation Reference

Your full API specification is available in the OpenAPI 3.0 format. Key endpoints:

- **Market Analysis:** `/api/MarketAnalysis/*`
- **Government Dashboard:** `/api/gov/dashboard/*`
- **Admin Operations:** `/api/admin/*`
- **Auctions:** `/api/auctions/*`
- **Direct Sales:** `/api/direct/*`
- **Authentication:** `/api/auth/*`

---

## 💡 Tips

1. **Caching:** Consider adding React Query for automatic caching and refetching
2. **Optimistic Updates:** Update UI before API response for better UX
3. **Loading Skeletons:** Add skeleton screens instead of spinners
4. **Error Boundaries:** Implement React Error Boundaries for better error handling
5. **Real-time Updates:** Consider WebSocket integration for live data

---

Your admin dashboard is now ready to consume real data from your backend API! 🎉

