/**
 * Admin-prefixed routes (preferred for dashboard).
 * Public routes are tried when admin returns 403 — requires backend to allow one of them.
 */
export const TRANSPORT_API = {
  providers: { admin: '/api/admin/transport', public: '/api/transport' },
  providerById: (id) => ({
    admin: `/api/admin/transport/${id}`,
    public: `/api/transport/${id}`,
  }),
  providerVerify: (id) => ({
    admin: `/api/admin/transport/${id}/verify`,
    public: `/api/transport/${id}/verify`,
  }),
  providerVehicles: (id) => ({
    admin: `/api/admin/transport/${id}/vehicles`,
    public: `/api/transport/${id}/vehicles`,
  }),
  deleteVehicle: (providerId, vehicleId) => ({
    admin: `/api/admin/transport/${providerId}/vehicle/${vehicleId}`,
    public: `/api/transport/${providerId}/vehicle/${vehicleId}`,
  }),
  priceLinesList: (id) => ({
    admin: `/api/admin/transport/${id}/price-lines/list`,
    public: `/api/transport/${id}/price-lines/list`,
  }),
  priceLines: '/api/transport/price-lines',
  priceLineById: (id) => `/api/transport/price-lines/${id}`,
  withPriceLines: {
    admin: '/api/admin/transport/with-price-lines',
    public: '/api/transport/with-price-lines',
  },
  providerPriceLines: (id) => ({
    admin: `/api/admin/transport/${id}/price-lines`,
    public: `/api/transport/${id}/price-lines`,
  }),
  requests: { admin: '/api/admin/transport/requests', public: '/api/transport/requests' },
  requestById: (id) => ({
    admin: `/api/admin/transport/requests/${id}`,
    public: `/api/transport/requests/${id}`,
  }),
  requestOffers: (id) => ({
    admin: `/api/admin/transport/requests/${id}/offers`,
    public: `/api/transport/requests/${id}/offers`,
  }),
  requestNotify: (id) => ({
    admin: `/api/admin/transport/requests/${id}/notify`,
    public: `/api/transport/requests/${id}/notify`,
  }),
  offers: '/api/transport/offers',
  offerAccept: (id) => `/api/transport/offers/${id}/accept`,
  officialPrice: '/api/transport-prices/official',
  cheapestPrice: '/api/transport-prices/cheapest',
  regions: '/api/transport-prices/regions',
}

export function isAccessDeniedError(err) {
  const msg = String(err?.message || '').toLowerCase()
  return (
    msg.includes('403') ||
    msg.includes('forbidden') ||
    msg.includes('صلاحية') ||
    msg.includes('permission') ||
    msg.includes('denied')
  )
}
