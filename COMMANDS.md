# Command Reference

## Quick Commands

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Opens at: http://localhost:3000

### Production Build
```bash
npm run build
```
Output: `dist/` folder

### Preview Production Build
```bash
npm run preview
```

---

## Git Commands (Optional)

### Initialize Git
```bash
git init
git add .
git commit -m "Initial commit - Al-Hal Admin Dashboard"
```

### Push to GitHub
```bash
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

---

## Troubleshooting Commands

### Clear Node Modules
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear Vite Cache
```bash
rm -rf node_modules/.vite
npm run dev
```

### Check Node Version
```bash
node --version
```
Required: Node 16+

### Check npm Version
```bash
npm --version
```

---

## File Management Commands

### View Project Structure
```bash
# Windows
tree /F

# Mac/Linux
tree
```

### Count Lines of Code
```bash
# Windows PowerShell
(Get-ChildItem -Include *.jsx,*.js,*.css -Recurse | Get-Content | Measure-Object -Line).Lines

# Mac/Linux
find . -name '*.jsx' -o -name '*.js' -o -name '*.css' | xargs wc -l
```

---

## Package Management

### Update Dependencies
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

### Install Specific Package
```bash
npm install PACKAGE_NAME
```

### Uninstall Package
```bash
npm uninstall PACKAGE_NAME
```

---

## Development Tips

### Run on Different Port
Edit `vite.config.js`:
```javascript
server: {
  port: 3001, // Change port here
}
```

### Open in Specific Browser
Edit `vite.config.js`:
```javascript
server: {
  open: '/dashboard', // Open specific route
}
```

---

## Deployment Commands

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Build and Serve Locally
```bash
npm run build
npx serve dist
```

---

## Code Quality Commands

### Format Code (if you add Prettier)
```bash
npm install --save-dev prettier
npx prettier --write src/
```

### Lint Code (if you add ESLint)
```bash
npm install --save-dev eslint
npx eslint src/
```

---

## Testing Commands (for future)

### Install Testing Libraries
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Run Tests
```bash
npm test
```

---

## Environment Variables

### Create .env file
```bash
# Windows
echo VITE_API_URL=http://localhost:3000 > .env.local

# Mac/Linux
echo "VITE_API_URL=http://localhost:3000" > .env.local
```

### Access in Code
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## Useful npm Scripts (can add to package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist node_modules",
    "reinstall": "npm run clean && npm install",
    "format": "prettier --write src/",
    "lint": "eslint src/"
  }
}
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm update` | Update packages |
| `npm outdated` | Check outdated packages |

---

That's it! Keep this file handy for quick command reference.

