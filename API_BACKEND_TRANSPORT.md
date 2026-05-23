# Transport API — backend changes for admin dashboard

The admin UI calls **admin-prefixed routes first**, then falls back to public transport routes.  
A **403** on `GET /api/transport/requests` means the logged-in user is not authorized on that controller action (even with `SuperAdmin` in the JWT).

## Required fix (choose one)

### Option A — Admin controller (recommended)

Add `AdminTransportController` (or extend existing admin area) under `/api/admin/transport`:

| Method | Route | Used by dashboard |
|--------|--------|-------------------|
| GET | `/api/admin/transport` | Transport providers list |
| GET | `/api/admin/transport/{id}` | Provider detail |
| POST | `/api/admin/transport` | Create provider |
| PUT | `/api/admin/transport/{id}/verify` | Verify provider |
| GET | `/api/admin/transport/{id}/vehicles` | Vehicles |
| POST | `/api/admin/transport/{id}/vehicles` | Add vehicle |
| DELETE | `/api/admin/transport/{providerId}/vehicle/{vehicleId}` | Delete vehicle |
| GET | `/api/admin/transport/with-price-lines` | Price lines overview |
| GET | `/api/admin/transport/{id}/price-lines/list` | Provider price lines |
| **GET** | **`/api/admin/transport/requests?page=&pageSize=`** | **Transport requests table** |
| GET | `/api/admin/transport/requests/{id}` | Request detail |
| POST | `/api/admin/transport/requests` | Create request (admin) |
| DELETE | `/api/admin/transport/requests/{id}` | Delete request |
| POST | `/api/admin/transport/requests/{id}/notify` | Notify transporters |
| GET | `/api/admin/transport/requests/{id}/offers` | Offers list |

Authorize with the same policy as other admin endpoints, e.g.:

```csharp
[Authorize(Policy = Policies.AdminOnly)]
// or
[Authorize(Roles = "SuperAdmin,Admin")]
```

### Option B — Open existing transport list to admins

On `TransportController` (or whatever serves `GET /api/transport/requests`), allow roles **SuperAdmin** and **Admin** in addition to current roles (buyer/transporter/etc.).

## CORS (localhost dev)

If the browser shows a CORS error (not 403), allow origin `http://localhost:3000` on the API.

## JWT note

The admin sends `Authorization: Bearer <token>`. Claim `role` = `superadmin` is present in your sample token; the 403 is **authorization on the endpoint**, not a missing token.

## Price lines / gov prices

These still use `/api/transport/price-lines` and `/api/transport-prices/*` (gov permission `gov.transport_prices.manage`). No change unless those also return 403.
