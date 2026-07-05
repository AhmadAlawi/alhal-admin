import adminService from './adminService'
import imageService from './imageService'
import {
  buildProductPayload,
  extractImageUrl,
  getProductId,
  normalizeCategory,
  normalizeProduct,
  unwrapApiData,
  unwrapApiList,
} from '../utils/apiNormalize'

export const productsService = {
  list: async () => {
    const res = await adminService.getProducts()
    return unwrapApiList(res, ['products', 'items', 'data']).map(normalizeProduct)
  },

  listCategories: async () => {
    const res = await adminService.getCategories({ isActive: true })
    return unwrapApiList(res, ['categories', 'items', 'data']).map(normalizeCategory)
  },

  listSubCategories: async (categoryId) => {
    const res = await adminService.getSubCategories({
      categoryId: Number(categoryId),
      isActive: true,
    })
    return unwrapApiList(res, ['subCategories', 'items', 'data']).map(normalizeCategory)
  },

  uploadProductImage: async (file) => {
    const res = await imageService.uploadImage(file, 'products')
    const url = extractImageUrl(res)
    if (!url) throw new Error('فشل رفع الصورة — لم يُرجع الخادم رابطاً')
    return url
  },

  create: async (form) => {
    const payload = buildProductPayload(form, { isEdit: false })
    return adminService.addProduct(payload)
  },

  update: async (productId, form, isActive) => {
    const payload = buildProductPayload(form, { isEdit: true, isActive })
    return adminService.updateProduct(productId, payload)
  },

  remove: async (productId) => {
    const res = await adminService.deleteProduct(productId)
    if (res && res.success === false) {
      throw new Error(res.message || res.error?.detail || 'فشل حذف المنتج')
    }
    return res
  },

  /** Map productId → current maxPricePerKg from government prices list */
  listGovPriceMap: async () => {
    try {
      const res = await adminService.getPrices()
      const list = unwrapApiList(res, ['prices', 'items', 'data'])
      const map = new Map()
      for (const row of list) {
        const pid = row.productId ?? row.ProductId
        const price = row.maxPricePerKg ?? row.price ?? row.currentPrice
        if (pid != null && price != null) map.set(Number(pid), Number(price))
      }
      return map
    } catch {
      return new Map()
    }
  },

  setGovPrice: async (productId, maxPricePerKg) => {
    const price = Number(maxPricePerKg)
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error('يرجى إدخال سعر صحيح أكبر من صفر')
    }
    return adminService.addPrice({ productId: Number(productId), maxPricePerKg: price })
  },

  getGovPrice: async (productId) => {
    const pickPrice = (data) => {
      if (data == null) return null
      if (typeof data === 'number') return data
      const direct = data.maxPricePerKg ?? data.price ?? data.value
      if (direct != null) return direct
      const list = data.prices ?? data.governmentPrices ?? data.priceHistory
      if (Array.isArray(list) && list.length > 0) {
        const latest = list[0]
        return latest?.maxPricePerKg ?? latest?.price ?? null
      }
      return null
    }

    try {
      const res = await adminService.getProductPrice(productId)
      return pickPrice(unwrapApiData(res))
    } catch {
      try {
        const res = await adminService.getProductWithPrices(productId)
        return pickPrice(unwrapApiData(res))
      } catch {
        return null
      }
    }
  },
}

export { getProductId }
export default productsService
