import React, { useState, useEffect } from 'react'
import { FiPlus, FiPackage, FiEdit2, FiTrash2, FiDollarSign, FiSearch, FiRefreshCw, FiAlertCircle, FiCheck, FiX, FiImage, FiPower } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import productsService, { getProductId } from '../services/productsService'
import { useTranslation } from '../hooks/useTranslation'
import { useCurrency } from '../contexts/CurrencyContext'
import './Products.css'

const Products = () => {
  const { t, language } = useTranslation()
  const { formatMoneyPerUnit } = useCurrency()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  // Form states
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    categoryId: null,
    subCategoryId: null,
    imageUrl: '',
    description: '',
    cardColor: '#6366f1' // Default color (primary blue)
  })
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0) // Key to reset file input
  
  // Price form state
  const [priceData, setPriceData] = useState({
    productId: null,
    maxPricePerKg: ''
  })
  
  // Search
  const [searchTerm, setSearchTerm] = useState('')
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  const [govPriceByProduct, setGovPriceByProduct] = useState(new Map())
  const [detailGovPrice, setDetailGovPrice] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubCategoriesForCategory(formData.categoryId)
    } else {
      setSubCategories([])
    }
  }, [formData.categoryId])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const [productsData, priceMap] = await Promise.all([
        productsService.list(),
        productsService.listGovPriceMap(),
      ])
      setProducts(productsData)
      setGovPriceByProduct(priceMap)

      const active = productsData.filter((p) => p.isActive !== false).length
      setStats({
        total: productsData.length,
        active,
        inactive: productsData.length - active,
      })
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError(err.message || t('products.loadError'))
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesData = await productsService.listCategories()
      setCategories(categoriesData)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setCategories([])
    }
  }

  const fetchSubCategoriesForCategory = async (categoryId) => {
    try {
      const subCategoriesData = await productsService.listSubCategories(categoryId)
      setSubCategories(subCategoriesData)
    } catch (err) {
      console.error('Failed to fetch subcategories:', err)
      setSubCategories([])
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('products.imageFileRequired'))
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('products.fileTooLarge'))
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }


  const handleFileRemove = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setFormData({...formData, imageUrl: ''})
  }

  const resolveImageUrl = async () => {
    let imageUrl = (formData.imageUrl || '').trim()
    if (selectedFile) {
      imageUrl = await productsService.uploadProductImage(selectedFile)
    }
    return imageUrl
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()

    if (!formData.nameAr?.trim() || !formData.nameEn?.trim() || !formData.categoryId) {
      showToast(t('products.validationRequired'), 'error')
      return
    }

    try {
      setUploading(true)
      const imageUrl = await resolveImageUrl()
      await productsService.create({ ...formData, imageUrl })
      showToast(t('products.addSuccess'))
      setShowAddModal(false)
      resetForm()
      fetchProducts()
    } catch (err) {
      console.error('Error in handleAddProduct:', err)
      showToast(err.message || t('products.addError'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return

    const productId = getProductId(selectedProduct)
    if (!productId) return

    if (!formData.nameAr?.trim() || !formData.nameEn?.trim() || !formData.categoryId) {
      showToast(t('products.validationRequired'), 'error')
      return
    }

    try {
      setUploading(true)
      const imageUrl = await resolveImageUrl()
      await productsService.update(
        productId,
        { ...formData, imageUrl },
        selectedProduct.isActive !== false
      )
      showToast(t('products.updateSuccess'))
      setShowEditModal(false)
      resetForm()
      setSelectedProduct(null)
      fetchProducts()
    } catch (err) {
      console.error('Error in handleEditProduct:', err)
      showToast(err.message || t('products.updateError'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteProduct = async (product) => {
    const productId = getProductId(product)
    const productName = product.nameAr || product.nameEn || productId
    if (!productId) return

    if (!window.confirm(t('products.confirmDelete', { name: productName }))) {
      return
    }

    try {
      await productsService.remove(productId)
      setProducts((prev) => prev.filter((p) => getProductId(p) !== productId))
      setGovPriceByProduct((prev) => {
        const next = new Map(prev)
        next.delete(Number(productId))
        return next
      })
      showToast(t('products.deleteSuccess'))
    } catch (err) {
      console.error('Failed to delete product:', err)
      showToast(err.message || t('products.deleteError'), 'error')
      fetchProducts()
    }
  }

  const handleToggleActive = async (product) => {
    const productId = getProductId(product)
    if (!productId) return

    try {
      await productsService.update(
        productId,
        {
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          categoryId: product.categoryId || product.productCategory?.categoryId,
          imageUrl: product.imageUrl,
          description: product.description || '',
          cardColor: product.cardColor || '#6366f1',
          subCategoryId: product.subCategoryId || product.productSubCategory?.subCategoryId,
        },
        product.isActive === false
      )
      showToast(t('products.toggleSuccess'))
      fetchProducts()
    } catch (err) {
      showToast(err.message || t('products.updateError'), 'error')
    }
  }

  const handleAddPrice = async (e) => {
    e.preventDefault()

    try {
      await productsService.setGovPrice(priceData.productId, priceData.maxPricePerKg)
      showToast(t('products.priceSuccess'))
      setGovPriceByProduct((prev) => {
        const next = new Map(prev)
        next.set(Number(priceData.productId), Number(priceData.maxPricePerKg))
        return next
      })
      setShowPriceModal(false)
      setPriceData({ productId: null, maxPricePerKg: '' })
    } catch (err) {
      console.error('Failed to set price:', err)
      showToast(err.message || t('products.priceError'), 'error')
    }
  }

  const formatGovPrice = (productId) => {
    const price = govPriceByProduct.get(Number(productId))
    if (price == null || !Number.isFinite(price)) return t('products.noGovPrice')
    return formatMoneyPerUnit(price, 'kg')
  }

  const openEditModal = async (product) => {
    setSelectedProduct(product)
    const productId = getProductId(product)
    setDetailGovPrice(null)
    if (productId) {
      const fromMap = govPriceByProduct.get(Number(productId))
      if (fromMap != null) {
        setDetailGovPrice(fromMap)
      } else {
        productsService.getGovPrice(productId).then((p) => setDetailGovPrice(p))
      }
    }
    const imageUrl = product.imageUrl || ''
    setFormData({
      nameAr: product.nameAr || '',
      nameEn: product.nameEn || '',
      categoryId: product.categoryId || product.productCategory?.categoryId || null,
      subCategoryId: product.subCategoryId || product.productSubCategory?.subCategoryId || null,
      imageUrl: imageUrl,
      description: product.description || '',
      cardColor: product.cardColor || '#6366f1'
    })
    
    // Reset file states
    setSelectedFile(null)
    setImagePreview(imageUrl || null)
    
    // Fetch subcategories if category is selected
    if (product.categoryId || product.productCategory?.categoryId) {
      const catId = product.categoryId || product.productCategory?.categoryId
      await fetchSubCategoriesForCategory(catId)
    }
    
    setShowEditModal(true)
  }

  const openPriceModal = async (product) => {
    const productId = getProductId(product)
    setSelectedProduct(product)
    setShowPriceModal(true)
    const current = await productsService.getGovPrice(productId)
    setPriceData({
      productId,
      maxPricePerKg: current != null ? String(current) : '',
    })
  }

  const resetForm = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      categoryId: null,
      subCategoryId: null,
      imageUrl: '',
      description: '',
      cardColor: '#6366f1'
    })
    setSelectedFile(null)
    setImagePreview(null)
    setSubCategories([])
    setFileInputKey(prev => prev + 1) // Reset file input
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setShowPriceModal(false)
    setSelectedProduct(null)
    resetForm()
  }

  const getCategoryName = (product) => {
    if (product.productCategory) {
      return product.productCategory.nameEn || product.productCategory.nameAr || 'N/A'
    }
    if (product.category) {
      return product.category
    }
    const cat = categories.find(c => c.categoryId === product.categoryId)
    return cat ? (cat.nameEn || cat.nameAr) : 'N/A'
  }

  const getSubCategoryName = (product) => {
    if (product.productSubCategory) {
      return product.productSubCategory.nameEn || product.productSubCategory.nameAr || null
    }
    if (product.subCategoryId) {
      const subCat = subCategories.find(sc => sc.subCategoryId === product.subCategoryId)
      return subCat ? (subCat.nameEn || subCat.nameAr) : null
    }
    return null
  }

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const categoryName = getCategoryName(product).toLowerCase()
    const subCategoryName = getSubCategoryName(product)?.toLowerCase() || ''
    return (
      (product.nameEn && product.nameEn.toLowerCase().includes(search)) ||
      (product.nameAr && product.nameAr.toLowerCase().includes(search)) ||
      categoryName.includes(search) ||
      subCategoryName.includes(search) ||
      (getProductId(product) && String(getProductId(product)).includes(search))
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return t('common.na')
    const locale = language === 'ar' ? 'ar' : 'en-US'
    return new Date(dateString).toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiPackage /> {t('products.titleManagement')}
          </h1>
          <p className="page-subtitle">{t('products.subtitleExtended')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={fetchProducts}>
            <FiRefreshCw /> {t('common.refresh')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> {t('products.addProduct')}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <StatCard
          title={t('products.totalProducts')}
          value={stats.total.toString()}
          icon={<FiPackage />}
          color="primary"
        />
        <StatCard
          title={t('products.activeProducts')}
          value={stats.active.toString()}
          icon={<FiCheck />}
          color="success"
        />
        <StatCard
          title={t('products.inactiveProducts')}
          value={stats.inactive.toString()}
          icon={<FiX />}
          color="danger"
        />
      </div>

      {/* Search */}
      <div className="search-section card">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder={t('products.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {toast && (
        <div className={`toast-banner ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'error' ? <FiAlertCircle /> : <FiCheck />}
          {toast.message}
        </div>
      )}

      {error && (
        <div className="error-message card">
          <FiAlertCircle /> {error}
          <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={fetchProducts}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-message card">
          <p>{t('products.loading')}</p>
        </div>
      ) : (
        <div className="products-table-container card">
          <table className="products-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('products.image')}</th>
                <th>{t('products.nameEn')}</th>
                <th>{t('products.nameAr')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.countryPrice')}</th>
                <th>{t('products.priceCeiling')}</th>
                <th>{t('common.status')}</th>
                <th>{t('products.created')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-state">
                    {searchTerm ? t('products.noResults') : t('products.noProducts')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={getProductId(product)}>
                    <td className="product-id">#{getProductId(product)}</td>
                    <td className="product-image-cell">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.nameEn} className="product-img" />
                      ) : (
                        <div className="product-img-placeholder">
                          <FiPackage />
                        </div>
                      )}
                    </td>
                    <td className="product-name">{product.nameEn || t('common.na')}</td>
                    <td className="product-name-ar">{product.nameAr || t('common.na')}</td>
                    <td className="product-category">
                      <div className="category-info">
                        <span className="category-badge">{getCategoryName(product)}</span>
                        {getSubCategoryName(product) && (
                          <span className="subcategory-badge">{getSubCategoryName(product)}</span>
                        )}
                      </div>
                    </td>
                    <td className="product-gov-price">{formatGovPrice(getProductId(product))}</td>
                    <td className="product-gov-price">{formatGovPrice(getProductId(product))}</td>
                    <td className="product-status">
                      <span className={`status-badge ${product.isActive ? 'status-active' : 'status-inactive'}`}>
                        {product.isActive ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="product-created">{formatDate(product.createdAt)}</td>
                    <td className="product-actions">
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-success"
                          onClick={() => openPriceModal(product)}
                          title={t('products.setGovPrice')}
                        >
                          <FiDollarSign />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-warning"
                          onClick={() => handleToggleActive(product)}
                          title={product.isActive === false ? t('products.activate') : t('products.deactivate')}
                        >
                          <FiPower />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-primary"
                          onClick={() => openEditModal(product)}
                          title={t('products.editProduct')}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteProduct(product)}
                          title={t('products.deleteProduct')}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiPlus /> Add New Product</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleAddProduct} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>English Name *</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                    placeholder="Enter English name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Arabic Name *</label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                    placeholder="أدخل الاسم بالعربية"
                    required
                    dir="rtl"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => {
                      const catId = e.target.value ? Number(e.target.value) : null
                      setFormData({...formData, categoryId: catId, subCategoryId: null})
                    }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.nameEn} ({cat.nameAr})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>SubCategory</label>
                  <select
                    value={formData.subCategoryId || ''}
                    onChange={(e) => setFormData({...formData, subCategoryId: e.target.value ? Number(e.target.value) : null})}
                    disabled={!formData.categoryId || subCategories.length === 0}
                  >
                    <option value="">Select SubCategory (Optional)</option>
                    {subCategories.map(subCat => (
                      <option key={subCat.subCategoryId} value={subCat.subCategoryId}>
                        {subCat.nameEn} ({subCat.nameAr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="form-group">
                <label>Product Image *</label>
                <div className="image-upload-section">
                  <div className="image-upload-controls">
                    <div className="file-input-wrapper">
                      <input
                        key={fileInputKey}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                        id="image-upload-add"
                      />
                      <label htmlFor="image-upload-add" className="file-input-label">
                        <FiImage /> {selectedFile ? 'Change Image' : 'Choose Image'}
                      </label>
                    </div>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        className="btn btn-outline btn-remove"
                        onClick={handleFileRemove}
                      >
                        <FiX /> Remove
                      </button>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {(imagePreview || formData.imageUrl) && (
                    <div className="image-preview-container">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Preview"
                        className="image-preview-img"
                      />
                      {selectedFile && (
                        <div className="image-preview-info">
                          <span className="file-name">{selectedFile.name}</span>
                          <span className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                          <span className="upload-status">Will upload on submit</span>
                        </div>
                      )}
                      {formData.imageUrl && !selectedFile && (
                        <div className="image-preview-info">
                          <span className="upload-status success">✓ Image ready</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Manual URL Input (Alternative) */}
                  <div className="image-url-alternative">
                    <details>
                      <summary>Or enter image URL manually</summary>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => {
                          setFormData({...formData, imageUrl: e.target.value})
                          setImagePreview(e.target.value)
                          setSelectedFile(null) // Clear file selection when URL is entered
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="image-url-input"
                      />
                    </details>
                  </div>
                </div>
                {selectedFile && (
                  <small className="form-help success">
                    ✓ Image selected. It will be uploaded automatically when you click "Add Product".
                  </small>
                )}
                {!formData.imageUrl && !selectedFile && (
                  <small className="form-help">Please select an image or enter an image URL. Image will upload automatically on submit.</small>
                )}
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter product description (optional)"
                  rows="3"
                />
              </div>
              
              {/* Card Color Picker */}
              <div className="form-group">
                <label>Card Color (Hex)</label>
                <div className="color-picker-container">
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={formData.cardColor}
                      onChange={(e) => setFormData({...formData, cardColor: e.target.value})}
                      className="color-picker-input"
                      id="card-color-add"
                    />
                    <label htmlFor="card-color-add" className="color-picker-label">
                      <div 
                        className="color-preview" 
                        style={{ backgroundColor: formData.cardColor }}
                      ></div>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.cardColor}
                    onChange={(e) => {
                      let value = e.target.value.trim()
                      // Ensure it starts with #
                      if (value && !value.startsWith('#')) {
                        value = '#' + value
                      }
                      // Validate hex color format (allow partial input)
                      if (value === '' || value === '#' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setFormData({...formData, cardColor: value || '#6366f1'})
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure valid 6-digit hex on blur
                      let value = e.target.value.trim()
                      if (!value.startsWith('#')) {
                        value = '#' + value
                      }
                      // Pad or truncate to 6 hex digits
                      if (value.length > 1 && value.length < 7) {
                        // Pad with zeros or truncate
                        const hexPart = value.slice(1)
                        const padded = hexPart.padEnd(6, '0').substring(0, 6)
                        value = '#' + padded
                      }
                      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        setFormData({...formData, cardColor: value})
                      } else if (value === '#' || value === '') {
                        setFormData({...formData, cardColor: '#6366f1'})
                      }
                    }}
                    placeholder="#6366f1"
                    className="color-hex-input"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxLength={7}
                  />
                </div>
                <small className="form-help">Select a color or enter hex value (e.g., #6366f1)</small>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? (
                    <>
                      <span className="spinner-small"></span>
                      {selectedFile ? 'Uploading image...' : 'Adding product...'}
                    </>
                  ) : (
                    <>
                      <FiPlus /> {t('products.addProduct')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiEdit2 /> {t('products.editProduct')}</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditProduct} className="modal-body">
              <div className="product-detail-gov-price card">
                <strong>{t('products.countryPrice')}:</strong>{' '}
                {detailGovPrice != null
                  ? formatMoneyPerUnit(Number(detailGovPrice), 'kg')
                  : t('products.noGovPrice')}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('products.nameEn')} *</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Arabic Name *</label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                    required
                    dir="rtl"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => {
                      const catId = e.target.value ? Number(e.target.value) : null
                      setFormData({...formData, categoryId: catId, subCategoryId: null})
                    }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.nameEn} ({cat.nameAr})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>SubCategory</label>
                  <select
                    value={formData.subCategoryId || ''}
                    onChange={(e) => setFormData({...formData, subCategoryId: e.target.value ? Number(e.target.value) : null})}
                    disabled={!formData.categoryId || subCategories.length === 0}
                  >
                    <option value="">Select SubCategory (Optional)</option>
                    {subCategories.map(subCat => (
                      <option key={subCat.subCategoryId} value={subCat.subCategoryId}>
                        {subCat.nameEn} ({subCat.nameAr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="form-group">
                <label>Product Image *</label>
                <div className="image-upload-section">
                  <div className="image-upload-controls">
                    <div className="file-input-wrapper">
                      <input
                        key={`edit-${fileInputKey}`}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                        id="image-upload-edit"
                      />
                      <label htmlFor="image-upload-edit" className="file-input-label">
                        <FiImage /> {selectedFile ? 'Change Image' : 'Choose New Image'}
                      </label>
                    </div>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        className="btn btn-outline btn-remove"
                        onClick={handleFileRemove}
                      >
                        <FiX /> Remove
                      </button>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {(imagePreview || formData.imageUrl) && (
                    <div className="image-preview-container">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Preview"
                        className="image-preview-img"
                      />
                      {selectedFile && (
                        <div className="image-preview-info">
                          <span className="file-name">{selectedFile.name}</span>
                          <span className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                          <span className="upload-status">Will upload on submit</span>
                        </div>
                      )}
                      {formData.imageUrl && !selectedFile && (
                        <div className="image-preview-info">
                          <span className="upload-status success">✓ Image ready</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Manual URL Input (Alternative) */}
                  <div className="image-url-alternative">
                    <details>
                      <summary>Or enter image URL manually</summary>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => {
                          setFormData({...formData, imageUrl: e.target.value})
                          setImagePreview(e.target.value)
                          setSelectedFile(null) // Clear file selection when URL is entered
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="image-url-input"
                      />
                    </details>
                  </div>
                </div>
                {selectedFile && (
                  <small className="form-help success">
                    ✓ New image selected. It will be uploaded automatically when you click "Update Product".
                  </small>
                )}
                {!formData.imageUrl && !selectedFile && (
                  <small className="form-help">Please select an image or enter an image URL. Image will upload automatically on submit.</small>
                )}
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>
              
              {/* Card Color Picker */}
              <div className="form-group">
                <label>Card Color (Hex)</label>
                <div className="color-picker-container">
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={formData.cardColor}
                      onChange={(e) => setFormData({...formData, cardColor: e.target.value})}
                      className="color-picker-input"
                      id="card-color-edit"
                    />
                    <label htmlFor="card-color-edit" className="color-picker-label">
                      <div 
                        className="color-preview" 
                        style={{ backgroundColor: formData.cardColor }}
                      ></div>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.cardColor}
                    onChange={(e) => {
                      let value = e.target.value.trim()
                      // Ensure it starts with #
                      if (value && !value.startsWith('#')) {
                        value = '#' + value
                      }
                      // Validate hex color format (allow partial input)
                      if (value === '' || value === '#' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setFormData({...formData, cardColor: value || '#6366f1'})
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure valid 6-digit hex on blur
                      let value = e.target.value.trim()
                      if (!value.startsWith('#')) {
                        value = '#' + value
                      }
                      // Pad or truncate to 6 hex digits
                      if (value.length > 1 && value.length < 7) {
                        // Pad with zeros or truncate
                        const hexPart = value.slice(1)
                        const padded = hexPart.padEnd(6, '0').substring(0, 6)
                        value = '#' + padded
                      }
                      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        setFormData({...formData, cardColor: value})
                      } else if (value === '#' || value === '') {
                        setFormData({...formData, cardColor: '#6366f1'})
                      }
                    }}
                    placeholder="#6366f1"
                    className="color-hex-input"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxLength={7}
                  />
                </div>
                <small className="form-help">Select a color or enter hex value (e.g., #6366f1)</small>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? (
                    <>
                      <span className="spinner-small"></span>
                      {selectedFile ? 'Uploading image...' : 'Updating product...'}
                    </>
                  ) : (
                    <><FiCheck /> Update Product</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Government Price Modal */}
      {showPriceModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiDollarSign /> {t('products.setGovPrice')}</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleAddPrice} className="modal-body">
              <div className="product-info">
                <p><strong>Product:</strong> {selectedProduct.nameEn} ({selectedProduct.nameAr})</p>
                <p><strong>{t('products.productCategory')}:</strong> {getCategoryName(selectedProduct)}</p>
              </div>
              <div className="form-group">
                <label>Maximum Price per Kg *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceData.maxPricePerKg}
                  onChange={(e) => setPriceData({...priceData, maxPricePerKg: e.target.value})}
                  placeholder="Enter maximum price"
                  required
                />
                <small className="form-help">{t('products.govPriceHelp')}</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-success">
                  <FiCheck /> Set Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
