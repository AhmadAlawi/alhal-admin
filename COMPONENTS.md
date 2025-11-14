# Component Documentation

## Component Hierarchy

```
App
├── Router
    └── Layout
        ├── Sidebar
        │   └── Navigation Links
        ├── Header
        │   ├── Menu Toggle
        │   ├── Search Bar
        │   └── User Menu
        └── Pages
            ├── Dashboard
            │   ├── StatCard (×4)
            │   ├── Chart (×2)
            │   └── Table
            ├── Users
            │   └── Table
            ├── Analytics
            │   ├── StatCard (×4)
            │   └── Chart (×3)
            ├── Products
            │   ├── StatCard (×4)
            │   └── Table
            ├── Orders
            │   ├── StatCard (×4)
            │   └── Table
            └── Settings
                └── Settings Form
```

---

## Core Components

### Layout (`src/components/Layout/Layout.jsx`)

The main layout wrapper that provides the structure for all pages.

**Props:**
- `children` - Page content to render

**Features:**
- Manages sidebar open/close state
- Responsive layout
- Smooth transitions

**Usage:**
```jsx
<Layout>
  <YourPage />
</Layout>
```

---

### Sidebar (`src/components/Sidebar/Sidebar.jsx`)

Side navigation menu with routing.

**Props:**
- `isOpen` (boolean) - Controls sidebar visibility
- `toggleSidebar` (function) - Function to toggle sidebar

**Features:**
- Active route highlighting
- Icon-based navigation
- User info display
- Mobile responsive

**Navigation Items:**
- Dashboard
- Users
- Analytics
- Products
- Orders
- Settings

---

### Header (`src/components/Header/Header.jsx`)

Top navigation bar.

**Props:**
- `toggleSidebar` (function) - Function to toggle sidebar

**Features:**
- Search functionality
- Notification badges
- User avatar
- Responsive design

---

## Reusable UI Components

### StatCard (`src/components/StatCard/StatCard.jsx`)

Displays key statistics with optional change percentage.

**Props:**
- `title` (string) - Card title
- `value` (string/number) - Main value to display
- `change` (number, optional) - Percentage change
- `icon` (ReactNode) - Icon to display
- `color` (string) - Color theme: 'primary', 'success', 'warning', 'danger'

**Example:**
```jsx
<StatCard
  title="Total Users"
  value="8,282"
  change={12.5}
  icon={<FiUsers />}
  color="primary"
/>
```

---

### Chart (`src/components/Chart/Chart.jsx`)

Versatile chart component using Recharts.

**Props:**
- `type` (string) - Chart type: 'line', 'area', 'bar'
- `data` (array) - Chart data
- `dataKey` (string) - Key for Y-axis data
- `xAxisKey` (string) - Key for X-axis data
- `title` (string, optional) - Chart title
- `color` (string) - Chart color (hex)

**Example:**
```jsx
<Chart
  type="area"
  data={revenueData}
  dataKey="revenue"
  xAxisKey="month"
  title="Revenue Overview"
  color="#6366f1"
/>
```

**Data Format:**
```javascript
const data = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  // ...
]
```

---

### Table (`src/components/Table/Table.jsx`)

Flexible data table component.

**Props:**
- `columns` (array) - Column definitions
- `data` (array) - Table data

**Column Definition:**
```javascript
const columns = [
  { 
    header: 'Name',      // Column header text
    accessor: 'name',    // Data key
    render: (value, row) => {  // Optional custom renderer
      return <CustomCell value={value} />
    }
  }
]
```

**Example:**
```jsx
<Table columns={columns} data={users} />
```

**Features:**
- Sortable columns (can be extended)
- Custom cell rendering
- Hover effects
- Responsive scrolling

---

## Page Components

### Dashboard (`src/pages/Dashboard.jsx`)

Main overview page with statistics and charts.

**Sections:**
- Header with title
- 4 Stat cards (Users, Revenue, Orders, Growth)
- 2 Charts (Revenue, Orders)
- Recent orders table

---

### Users (`src/pages/Users.jsx`)

User management page.

**Features:**
- User list table
- Search functionality
- Role and status badges
- Action buttons (Email, Edit, Delete)
- Filter by role and status

---

### Analytics (`src/pages/Analytics.jsx`)

Analytics dashboard with metrics.

**Sections:**
- 4 Stat cards (Visitors, Page Views, Conversion, Bounce)
- Website traffic chart
- Conversion rate chart
- Device usage chart
- Top pages list
- Top referrers list

---

### Products (`src/pages/Products.jsx`)

Product inventory management.

**Features:**
- Product list table
- Stock status badges
- Product categories
- Add/Edit/Delete actions

---

### Orders (`src/pages/Orders.jsx`)

Order tracking and management.

**Features:**
- Order list table
- Status tracking
- Customer information
- Date filtering
- Status filtering

---

### Settings (`src/pages/Settings.jsx`)

Application settings page.

**Tabs:**
1. **Profile** - Personal information
2. **Notifications** - Email and notification preferences
3. **Security** - Password and 2FA settings
4. **Preferences** - Language, timezone, date format

**Features:**
- Tab navigation
- Form inputs
- Toggle switches
- Save buttons

---

## Styling Conventions

### CSS Variables

All components use CSS variables for theming:

```css
--primary-color: #6366f1;
--secondary-color: #10b981;
--danger-color: #ef4444;
--warning-color: #f59e0b;
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #f1f5f9;
```

### Utility Classes

Available globally in `src/index.css`:

- `.btn` - Base button
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card` - Card container
- `.badge` - Badge/label
- `.badge-success` - Success badge
- `.badge-warning` - Warning badge
- `.badge-danger` - Danger badge

---

## Component Best Practices

1. **Prop Validation** - Consider adding PropTypes for better type checking
2. **Memoization** - Use `React.memo()` for expensive components
3. **State Management** - For complex apps, consider Redux or Context API
4. **API Integration** - Replace sample data with API calls
5. **Loading States** - Add loading indicators for async operations
6. **Error Handling** - Add error boundaries and user feedback

---

## Extending Components

### Adding New Features

1. **New Chart Type:**
   - Edit `src/components/Chart/Chart.jsx`
   - Add new case in `renderChart()` switch statement

2. **New Table Column:**
   - Add column definition with custom render function
   - Style in respective page CSS file

3. **New Stat Card Variant:**
   - Add new color in `src/index.css`
   - Use in StatCard color prop

---

## Component Testing Tips

When testing components:

1. Test with different prop combinations
2. Verify responsive behavior
3. Check accessibility (keyboard navigation, screen readers)
4. Test error states
5. Validate with real data

---

For implementation examples, refer to the actual component files in the `src/` directory.

