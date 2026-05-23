# Admin dashboard testing

## Unit tests (Vitest + Testing Library)

```bash
npm run test          # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

Covers:

- `src/utils/chartNormalize.js` — price trends, supply/demand, direct listing total price, auction per-unit
- `src/components/Chart/Chart.jsx` — empty state, multi-series, pie
- `src/utils/dashboardNormalize.js` — API unwrap
- `src/config/routes.test.js` — nav routes

## E2E tests (Playwright)

Requires dev server on port 3000 (`npm run dev` or Playwright starts it automatically).

```bash
npm run test:e2e
npm run test:e2e:ui   # interactive UI
```

### Mock auth (default)

E2E uses a mock JWT (`superadmin`) and stubs `/api/**` so pages load without a live backend.

### Real API login

```bash
set E2E_USE_REAL_AUTH=true
set E2E_EMAIL=your@email.com
set E2E_PASSWORD=yourpassword
npm run test:e2e
```

### Run everything

```bash
npm run test:all
```

## Chart fixes (see `MOBILE_AUCTION_LIVE_CHART.md`, `DIRECT_LISTING_TOTAL_PRICE.md`)

- Analytics: price trends show avg/min/max; supply **and** demand lines; volatility chart; transaction pie
- Reports: pie/bar use normalized `name`/`value`; time series prefer `pricePerUnit` over lot totals
- Chart component: empty state, `nameKey` for pie labels
- `chartNormalize.js`: shared formatters for auction OHLC and direct listing `totalPrice`
