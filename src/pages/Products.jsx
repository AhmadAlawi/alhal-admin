import React, { useState, useEffect } from 'react'
import { FiPlus, FiPackage, FiEdit2, FiTrash2, FiDollarSign, FiSearch, FiRefreshCw, FiAlertCircle, FiCheck, FiX, FiUpload, FiImage } from 'react-icons/fi'
import StatCard from '../components/StatCard/StatCard'
import adminService from '../services/adminService'
import imageService from '../services/imageService'
import './Products.css'

const Products = () => {
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
    description: ''
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
      const response = await adminService.getProducts()
      const productsData = response.data || response || []
      setProducts(Array.isArray(productsData) ? productsData : [])
      
      // Calculate stats
      const active = productsData.filter(p => p.isActive).length
      setStats({
        total: productsData.length,
        active: active,
        inactive: productsData.length - active
      })
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError(err.message || 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories({ isActive: true })
      const categoriesData = response.data || response || []
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setCategories([])
    }
  }

  const fetchSubCategoriesForCategory = async (categoryId) => {
    try {
      const response = await adminService.getSubCategories({ categoryId, isActive: true })
      const subCategoriesData = response.data || response || []
      setSubCategories(Array.isArray(subCategoriesData) ? subCategoriesData : [])
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
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB')
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

  const handleAddProduct = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.nameAr || !formData.nameEn || !formData.categoryId) {
      alert('Please fill in all required fields (Name and Category are required)')
      return
    }
    
    // If file is selected, upload it first (auto-upload on submit)
    if (selectedFile) {
      try {
        setUploading(true)
        const response = await imageService.uploadImage(selectedFile)
        if (response.success && response.data && response.data.url) {
          setFormData(prev => ({...prev, imageUrl: response.data.url}))
          setImagePreview(response.data.url)
          setSelectedFile(null)
        } else {
          throw new Error('Upload failed: No URL returned')
        }
      } catch (err) {
        console.error('Failed to upload image:', err)
        alert('Failed to upload image: ' + (err.message || 'Unknown error'))
        setUploading(false)
        return
      } finally {
        setUploading(false)
      }
    }
    
    if (!formData.imageUrl) {
      alert('Please upload an image or enter an image URL')
      return
    }
    
    try {
      // Build request data - only send categoryId and subCategoryId if provided
      const requestData = {
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        categoryId: formData.categoryId,
        imageUrl: formData.imageUrl,
        description: formData.description || null
      }
      if (formData.subCategoryId) {
        requestData.subCategoryId = formData.subCategoryId
      }
      
      await adminService.addProduct(requestData)
      alert('Product added successfully!')
      setShowAddModal(false)
      resetForm()
      fetchProducts()
    } catch (err) {
      console.error('Failed to add product:', err)
      alert('Failed to add product: ' + (err.message || 'Unknown error'))
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    
    if (!selectedProduct) return
    
    // Validation
    if (!formData.nameAr || !formData.nameEn || !formData.categoryId) {
      alert('Please fill in all required fields (Name and Category are required)')
      return
    }
    
    // If file is selected, upload it first (auto-upload on submit)
    if (selectedFile) {
      try {
        setUploading(true)
        const response = await imageService.uploadImage(selectedFile)
        if (response.success && response.data && response.data.url) {
          setFormData(prev => ({...prev, imageUrl: response.data.url}))
          setImagePreview(response.data.url)
          setSelectedFile(null)
        } else {
          throw new Error('Upload failed: No URL returned')
        }
      } catch (err) {
        console.error('Failed to upload image:', err)
        alert('Failed to upload image: ' + (err.message || 'Unknown error'))
        setUploading(false)
        return
      } finally {
        setUploading(false)
      }
    }
    
    if (!formData.imageUrl) {
      alert('Please upload an image or enter an image URL')
      return
    }
    
    try {
      // Build request data - include all fields that should be updated
      const requestData = {
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        categoryId: formData.categoryId,
        imageUrl: formData.imageUrl,
        isActive: selectedProduct.isActive
      }
      
      // Optional fields - include description if provided
      if (formData.description) {
        requestData.description = formData.description
      }
      
      // SubCategoryId - include it explicitly (can be null to clear it)
      // If categoryId is set, we should include subCategoryId (even if null)
      if (formData.categoryId) {
        requestData.subCategoryId = formData.subCategoryId !== undefined ? formData.subCategoryId : null
      }
      
      console.log('Updating product with data:', requestData)
      await adminService.updateProduct(selectedProduct.productId, requestData)
      alert('Product updated successfully!')
      setShowEditModal(false)
      resetForm()
      setSelectedProduct(null)
      fetchProducts()
    } catch (err) {
      console.error('Failed to update product:', err)
      const errorMessage = err.message || 'Unknown error'
      alert('Failed to update product: ' + errorMessage)
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await adminService.deleteProduct(productId)
      alert('Product deleted successfully!')
      fetchProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert('Failed to delete product: ' + (err.message || 'Unknown error'))
    }
  }

  const handleAddPrice = async (e) => {
    e.preventDefault()
    
    if (!priceData.maxPricePerKg || priceData.maxPricePerKg <= 0) {
      alert('Please enter a valid price')
      return
    }
    
    try {
      await adminService.addPrice({
        productId: priceData.productId,
        maxPricePerKg: parseFloat(priceData.maxPricePerKg)
      })
      alert('Government price set successfully!')
      setShowPriceModal(false)
      setPriceData({ productId: null, maxPricePerKg: '' })
    } catch (err) {
      console.error('Failed to set price:', err)
      alert('Failed to set price: ' + (err.message || 'Unknown error'))
    }
  }

  const openEditModal = async (product) => {
    setSelectedProduct(product)
    const imageUrl = product.imageUrl || ''
    setFormData({
      nameAr: product.nameAr || '',
      nameEn: product.nameEn || '',
      categoryId: product.categoryId || product.productCategory?.categoryId || null,
      subCategoryId: product.subCategoryId || product.productSubCategory?.subCategoryId || null,
      imageUrl: imageUrl,
      description: product.description || ''
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

  const openPriceModal = (product) => {
    setPriceData({
      productId: product.productId,
      maxPricePerKg: ''
    })
    setSelectedProduct(product)
    setShowPriceModal(true)
  }

  const resetForm = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      categoryId: null,
      subCategoryId: null,
      imageUrl: '',
      description: ''
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
      (product.productId && product.productId.toString().includes(search))
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
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
            <FiPackage /> Products Management
          </h1>
          <p className="page-subtitle">Manage agricultural products and government prices</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchProducts}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Product
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={stats.total.toString()}
          icon={<FiPackage />}
          color="primary"
        />
        <StatCard
          title="Active Products"
          value={stats.active.toString()}
          icon={<FiCheck />}
          color="success"
        />
        <StatCard
          title="Inactive Products"
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
            placeholder="Search by name (English/Arabic), category, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <FiAlertCircle /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message card">
          <p>Loading products...</p>
        </div>
      ) : (
        <div className="products-table-container card">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name (English)</th>
                <th>Name (Arabic)</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    {searchTerm ? 'No products found matching your search' : 'No products available'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.productId}>
                    <td className="product-id">#{product.productId}</td>
                    <td className="product-image-cell">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.nameEn} className="product-img" />
                      ) : (
                        <div className="product-img-placeholder">
                          <FiPackage />
                        </div>
                      )}
                    </td>
                    <td className="product-name">{product.nameEn || 'N/A'}</td>
                    <td className="product-name-ar">{product.nameAr || 'N/A'}</td>
                    <td className="product-category">
                      <div className="category-info">
                        <span className="category-badge">{getCategoryName(product)}</span>
                        {getSubCategoryName(product) && (
                          <span className="subcategory-badge">{getSubCategoryName(product)}</span>
                        )}
                      </div>
                    </td>
                    <td className="product-status">
                      <span className={`status-badge ${product.isActive ? 'status-active' : 'status-inactive'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="product-created">{formatDate(product.createdAt)}</td>
                    <td className="product-actions">
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-success"
                          onClick={() => openPriceModal(product)}
                          title="Set Government Price"
                        >
                          <FiDollarSign />
                        </button>
                        <button
                          className="btn-icon btn-primary"
                          onClick={() => openEditModal(product)}
                          title="Edit Product"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteProduct(product.productId, product.nameEn || product.nameAr)}
                          title="Delete Product"
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
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : <><FiPlus /> Add Product</>}
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
              <h2><FiEdit2 /> Edit Product</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditProduct} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>English Name *</label>
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
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : <><FiCheck /> Update Product</>}
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
              <h2><FiDollarSign /> Set Government Price</h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleAddPrice} className="modal-body">
              <div className="product-info">
                <p><strong>Product:</strong> {selectedProduct.nameEn} ({selectedProduct.nameAr})</p>
                <p><strong>Category:</strong> {selectedProduct.category}</p>
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
                <small className="form-help">This price will be used for government regulation</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  Cancel
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
