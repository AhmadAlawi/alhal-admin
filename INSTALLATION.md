# Installation Guide

Follow these steps to get your Al-Hal Admin Dashboard up and running.

## Prerequisites

Before you begin, make sure you have the following installed:
- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**

## Quick Start

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

This will install all required dependencies:
- react
- react-dom
- react-router-dom
- react-icons
- recharts
- vite
- @vitejs/plugin-react

### Step 2: Start Development Server

Once installation is complete, start the development server:

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

### Step 3: Open in Browser

The application will automatically open in your default browser at:
```
http://localhost:3000
```

If it doesn't open automatically, simply navigate to this URL in your browser.

## Building for Production

When you're ready to deploy your admin dashboard:

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Troubleshooting

### Port 3000 Already in Use

If port 3000 is already in use, you can change it in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Change to any available port
    open: true
  }
})
```

### Module Not Found Errors

If you encounter module not found errors, try:

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Clear Cache

If you experience build issues:

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## Next Steps

Once your dashboard is running:

1. Explore the different pages (Dashboard, Users, Analytics, Products, Orders, Settings)
2. Customize the color theme in `src/index.css`
3. Add your own data and API integrations
4. Modify components to match your needs

## Need Help?

Check the main [README.md](README.md) file for more detailed information about the project structure and customization options.

Happy coding! 🚀

