# Al-Hal Admin Dashboard

A modern, responsive admin dashboard built with React.js featuring a beautiful dark theme UI and comprehensive management tools.

## Features

- 🎨 **Modern Dark Theme UI** - Beautiful gradient-based design with smooth animations
- 📊 **Interactive Charts** - Visualize data with Recharts library
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🧩 **Reusable Components** - Modular component architecture for easy customization
- 🚀 **Fast Performance** - Built with Vite for lightning-fast development and builds
- 🎯 **Multiple Pages** - Dashboard, Users, Analytics, Products, Orders, and Settings

## Pages Overview

- **Dashboard** - Overview with statistics, revenue charts, and recent orders
- **Users** - User management with roles and status tracking
- **Analytics** - Website analytics with traffic and conversion metrics
- **Products** - Product inventory management
- **Orders** - Order tracking and management
- **Settings** - Account settings with profile, notifications, security, and preferences

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_BASE_URL=https://localhost:7059
VITE_PORT=3000
VITE_ALLOWED_HOSTS=adminalhal.awnak.net,localhost,127.0.0.1
```

3. Start the development server:
```bash
npm start
```
or
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000` (or the port you configured)

## Port Configuration

You can control the port the development server runs on in several ways:

### Option 1: Environment Variable (Recommended)
Create a `.env` file in the root directory:
```env
VITE_PORT=3000
```
or
```env
PORT=3000
```

### Option 2: Command Line Flag
```bash
npm start -- --port 3000
```
or
```bash
npm run dev -- --port 5173
```

### Option 3: Predefined Scripts
```bash
npm run start:3000  # Run on port 3000
npm run start:5173  # Run on port 5173
npm run start:8080  # Run on port 8080
```

### Default Port
- If no port is specified, the server will run on port **3000** (as configured in `vite.config.js`)
- If port 3000 is in use, Vite will automatically try the next available port

## Allowed Hosts Configuration

Vite blocks requests from unknown hosts for security. To allow specific hosts:

### Default Allowed Hosts
The following hosts are allowed by default:
- `adminalhal.awnak.net`
- `localhost`
- `.localhost` (all subdomains)
- `127.0.0.1`

### Custom Allowed Hosts
Add to your `.env` file:
```env
VITE_ALLOWED_HOSTS=adminalhal.awnak.net,yourdomain.com,anotherdomain.com
```

Multiple hosts should be comma-separated.

## Build for Production

```bash
npm run build
```

The build files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Technologies Used

- **React 18** - Modern React with hooks
- **React Router v6** - Client-side routing
- **Recharts** - Chart and data visualization library
- **React Icons** - Beautiful icon library
- **Vite** - Next generation frontend tooling
- **CSS3** - Modern CSS with CSS Variables

## Project Structure

```
alhal-admin/
├── src/
│   ├── components/
│   │   ├── Chart/           # Reusable chart component
│   │   ├── Header/          # Top navigation header
│   │   ├── Layout/          # Main layout wrapper
│   │   ├── Sidebar/         # Side navigation menu
│   │   ├── StatCard/        # Statistics card component
│   │   └── Table/           # Reusable table component
│   ├── pages/
│   │   ├── Analytics.jsx    # Analytics page
│   │   ├── Dashboard.jsx    # Main dashboard page
│   │   ├── Orders.jsx       # Orders management
│   │   ├── Products.jsx     # Products management
│   │   ├── Settings.jsx     # Settings page
│   │   └── Users.jsx        # Users management
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── package.json             # Project dependencies
└── vite.config.js           # Vite configuration

```

## Customization

### Color Theme

The color scheme is defined using CSS variables in `src/index.css`:

```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  /* ... more variables */
}
```

### Adding New Pages

1. Create a new page component in `src/pages/`
2. Add the route in `src/App.jsx`
3. Add navigation link in `src/components/Sidebar/Sidebar.jsx`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

Built with ❤️ for Al-Hal Admin Dashboard

