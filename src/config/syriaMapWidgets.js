import { PERMISSIONS } from '../utils/accessControl'

export const SYRIA_MAP_WIDGETS = [
  {
    id: 'syria-map-farms',
    type: 'syria-map',
    category: 'map',
    labelKey: 'syriaMaps.widgets.farms',
    permission: PERMISSIONS.GOV_DASHBOARD,
    config: {
      mapKind: 'farms',
      filters: { governorateId: null, includeMarkers: true },
    },
    defaultLayout: { colSpan: 12, rowSpan: 3 },
  },
  {
    id: 'syria-map-products',
    type: 'syria-map',
    category: 'map',
    labelKey: 'syriaMaps.widgets.products',
    permission: PERMISSIONS.GOV_DASHBOARD,
    config: {
      mapKind: 'products',
      filters: { productId: null, topProductsPerGovernorate: 10 },
    },
    defaultLayout: { colSpan: 12, rowSpan: 3 },
  },
]
