import React, { useState, useEffect } from 'react'
import { FiFolder, FiFolderPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSearch, FiCheck, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import adminService from '../services/adminService'
import './Categories.css'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    nameAr: '',
    nameEn: '',
    description: ''
  })
  
  const [subCategoryForm, setSubCategoryForm] = useState({
    categoryId: null,
    nameAr: '',
    nameEn: '',
    description: '',
    imageUrl: ''
  })
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState(null) // null = all, true = active, false = inactive

  useEffect(() => {
    fetchCategories()
    fetchSubCategories()
  }, [filterActive])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = filterActive !== null ? { isActive: filterActive } : {}
      const response = await adminService.getCategories(params)
      const categoriesData = response.data || response || []
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError(err.message || 'Failed to load categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSubCategories = async () => {
    try {
      const params = {}
      if (filterActive !== null) params.isActive = filterActive
      if (searchTerm) params.search = searchTerm
      const response = await adminService.getSubCategories(params)
      const subCategoriesData = response.data || response || []
      setSubCategories(Array.isArray(subCategoriesData) ? subCategoriesData : [])
    } catch (err) {
      console.error('Failed to fetch subcategories:', err)
      setSubCategories([])
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    
    if (!categoryForm.nameAr || !categoryForm.nameEn) {
      alert('Please fill in both Arabic and English names')
      return
    }
    
    try {
      await adminService.createCategory(categoryForm)
      alert('Category created successfully!')
      setShowCategoryModal(false)
      resetCategoryForm()
      fetchCategories()
    } catch (err) {
      console.error('Failed to create category:', err)
      alert('Failed to create category: ' + (err.message || 'Unknown error'))
    }
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    
    if (!selectedCategory) return
    
    try {
      await adminService.updateCategory(selectedCategory.categoryId, categoryForm)
      alert('Category updated successfully!')
      setShowCategoryModal(false)
      resetCategoryForm()
      setSelectedCategory(null)
      fetchCategories()
    } catch (err) {
      console.error('Failed to update category:', err)
      alert('Failed to update category: ' + (err.message || 'Unknown error'))
    }
  }

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all subcategories.`)) {
      return
    }
    
    try {
      await adminService.deleteCategory(categoryId)
      alert('Category deleted successfully!')
      fetchCategories()
      fetchSubCategories()
    } catch (err) {
      console.error('Failed to delete category:', err)
      alert('Failed to delete category: ' + (err.message || 'Unknown error'))
    }
  }

  const handleToggleCategoryActive = async (categoryId) => {
    try {
      await adminService.toggleCategoryActive(categoryId)
      fetchCategories()
    } catch (err) {
      console.error('Failed to toggle category:', err)
      alert('Failed to toggle category status: ' + (err.message || 'Unknown error'))
    }
  }

  const handleCreateSubCategory = async (e) => {
    e.preventDefault()
    
    if (!subCategoryForm.categoryId || !subCategoryForm.nameAr || !subCategoryForm.nameEn) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      await adminService.createSubCategory(subCategoryForm)
      alert('SubCategory created successfully!')
      setShowSubCategoryModal(false)
      resetSubCategoryForm()
      fetchSubCategories()
    } catch (err) {
      console.error('Failed to create subcategory:', err)
      alert('Failed to create subcategory: ' + (err.message || 'Unknown error'))
    }
  }

  const handleUpdateSubCategory = async (e) => {
    e.preventDefault()
    
    if (!selectedSubCategory) return
    
    try {
      await adminService.updateSubCategory(selectedSubCategory.subCategoryId, subCategoryForm)
      alert('SubCategory updated successfully!')
      setShowSubCategoryModal(false)
      resetSubCategoryForm()
      setSelectedSubCategory(null)
      fetchSubCategories()
    } catch (err) {
      console.error('Failed to update subcategory:', err)
      alert('Failed to update subcategory: ' + (err.message || 'Unknown error'))
    }
  }

  const handleDeleteSubCategory = async (subCategoryId, subCategoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${subCategoryName}"?`)) {
      return
    }
    
    try {
      await adminService.deleteSubCategory(subCategoryId)
      alert('SubCategory deleted successfully!')
      fetchSubCategories()
    } catch (err) {
      console.error('Failed to delete subcategory:', err)
      alert('Failed to delete subcategory: ' + (err.message || 'Unknown error'))
    }
  }

  const handleToggleSubCategoryActive = async (subCategoryId) => {
    try {
      await adminService.toggleSubCategoryActive(subCategoryId)
      fetchSubCategories()
    } catch (err) {
      console.error('Failed to toggle subcategory:', err)
      alert('Failed to toggle subcategory status: ' + (err.message || 'Unknown error'))
    }
  }

  const openEditCategory = (category) => {
    setSelectedCategory(category)
    setCategoryForm({
      nameAr: category.nameAr || '',
      nameEn: category.nameEn || '',
      description: category.description || ''
    })
    setShowCategoryModal(true)
  }

  const openEditSubCategory = (subCategory) => {
    setSelectedSubCategory(subCategory)
    setSubCategoryForm({
      categoryId: subCategory.categoryId,
      nameAr: subCategory.nameAr || '',
      nameEn: subCategory.nameEn || '',
      description: subCategory.description || '',
      imageUrl: subCategory.imageUrl || ''
    })
    setShowSubCategoryModal(true)
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      nameAr: '',
      nameEn: '',
      description: ''
    })
  }

  const resetSubCategoryForm = () => {
    setSubCategoryForm({
      categoryId: null,
      nameAr: '',
      nameEn: '',
      description: '',
      imageUrl: ''
    })
  }

  const closeModals = () => {
    setShowCategoryModal(false)
    setShowSubCategoryModal(false)
    setSelectedCategory(null)
    setSelectedSubCategory(null)
    resetCategoryForm()
    resetSubCategoryForm()
  }

  const toggleCategoryExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const getSubCategoriesForCategory = (categoryId) => {
    return subCategories.filter(sc => sc.categoryId === categoryId)
  }

  const filteredCategories = categories.filter(category => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (category.nameEn && category.nameEn.toLowerCase().includes(search)) ||
      (category.nameAr && category.nameAr.toLowerCase().includes(search)) ||
      (category.description && category.description.toLowerCase().includes(search))
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
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiFolder /> Categories & SubCategories
          </h1>
          <p className="page-subtitle">Manage product categories and subcategories</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => { fetchCategories(); fetchSubCategories(); }}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }}>
            <FiFolderPlus /> Add Category
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section card">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActive === null ? 'active' : ''}`}
            onClick={() => setFilterActive(null)}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterActive === true ? 'active' : ''}`}
            onClick={() => setFilterActive(true)}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filterActive === false ? 'active' : ''}`}
            onClick={() => setFilterActive(false)}
          >
            Inactive
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message card">
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-message card">
          <p>Loading categories...</p>
        </div>
      ) : (
        <div className="categories-container">
          {/* Categories List */}
          <div className="categories-list card">
            <h2 className="section-title">Categories</h2>
            {filteredCategories.length === 0 ? (
              <div className="empty-state">
                <p>No categories found</p>
              </div>
            ) : (
              <div className="categories-tree">
                {filteredCategories.map(category => {
                  const isExpanded = expandedCategories.has(category.categoryId)
                  const categorySubCategories = getSubCategoriesForCategory(category.categoryId)
                  
                  return (
                    <div key={category.categoryId} className="category-item">
                      <div className="category-header">
                        <button
                          className="expand-btn"
                          onClick={() => toggleCategoryExpand(category.categoryId)}
                          disabled={categorySubCategories.length === 0}
                        >
                          {categorySubCategories.length > 0 ? (
                            isExpanded ? <FiChevronDown /> : <FiChevronRight />
                          ) : null}
                        </button>
                        <div className="category-info">
                          <div className="category-names">
                            <span className="category-name-en">{category.nameEn}</span>
                            <span className="category-name-ar" dir="rtl">{category.nameAr}</span>
                          </div>
                          {category.description && (
                            <p className="category-description">{category.description}</p>
                          )}
                        </div>
                        <div className="category-meta">
                          <span className={`status-badge ${category.isActive ? 'status-active' : 'status-inactive'}`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="subcategory-count">{categorySubCategories.length} subcategories</span>
                        </div>
                        <div className="category-actions">
                          <button
                            className="btn-icon btn-success"
                            onClick={() => {
                              resetSubCategoryForm()
                              setSubCategoryForm(prev => ({ ...prev, categoryId: category.categoryId }))
                              setShowSubCategoryModal(true)
                            }}
                            title="Add SubCategory"
                          >
                            <FiFolderPlus />
                          </button>
                          <button
                            className="btn-icon btn-primary"
                            onClick={() => openEditCategory(category)}
                            title="Edit Category"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleToggleCategoryActive(category.categoryId)}
                            title={category.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {category.isActive ? <FiX /> : <FiCheck />}
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteCategory(category.categoryId, category.nameEn || category.nameAr)}
                            title="Delete Category"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      
                      {/* SubCategories */}
                      {isExpanded && categorySubCategories.length > 0 && (
                        <div className="subcategories-list">
                          {categorySubCategories.map(subCategory => (
                            <div key={subCategory.subCategoryId} className="subcategory-item">
                              <div className="subcategory-info">
                                {subCategory.imageUrl && (
                                  <img src={subCategory.imageUrl} alt={subCategory.nameEn} className="subcategory-image" />
                                )}
                                <div className="subcategory-names">
                                  <span className="subcategory-name-en">{subCategory.nameEn}</span>
                                  <span className="subcategory-name-ar" dir="rtl">{subCategory.nameAr}</span>
                                </div>
                                {subCategory.description && (
                                  <p className="subcategory-description">{subCategory.description}</p>
                                )}
                              </div>
                              <div className="subcategory-meta">
                                <span className={`status-badge ${subCategory.isActive ? 'status-active' : 'status-inactive'}`}>
                                  {subCategory.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="subcategory-actions">
                                <button
                                  className="btn-icon btn-primary"
                                  onClick={() => openEditSubCategory(subCategory)}
                                  title="Edit SubCategory"
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  className="btn-icon"
                                  onClick={() => handleToggleSubCategoryActive(subCategory.subCategoryId)}
                                  title={subCategory.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {subCategory.isActive ? <FiX /> : <FiCheck />}
                                </button>
                                <button
                                  className="btn-icon btn-danger"
                                  onClick={() => handleDeleteSubCategory(subCategory.subCategoryId, subCategory.nameEn || subCategory.nameAr)}
                                  title="Delete SubCategory"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedCategory ? <FiEdit2 /> : <FiFolderPlus />}
                {selectedCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>English Name *</label>
                  <input
                    type="text"
                    value={categoryForm.nameEn}
                    onChange={(e) => setCategoryForm({...categoryForm, nameEn: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Arabic Name *</label>
                  <input
                    type="text"
                    value={categoryForm.nameAr}
                    onChange={(e) => setCategoryForm({...categoryForm, nameAr: e.target.value})}
                    required
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedCategory ? <FiEdit2 /> : <FiFolderPlus />}
                  {selectedCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SubCategory Modal */}
      {showSubCategoryModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedSubCategory ? <FiEdit2 /> : <FiFolderPlus />}
                {selectedSubCategory ? 'Edit SubCategory' : 'Add SubCategory'}
              </h2>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={selectedSubCategory ? handleUpdateSubCategory : handleCreateSubCategory} className="modal-body">
              <div className="form-group">
                <label>Parent Category *</label>
                <select
                  value={subCategoryForm.categoryId || ''}
                  onChange={(e) => setSubCategoryForm({...subCategoryForm, categoryId: Number(e.target.value)})}
                  required
                  disabled={!!selectedSubCategory}
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c.isActive).map(cat => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.nameEn} ({cat.nameAr})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>English Name *</label>
                  <input
                    type="text"
                    value={subCategoryForm.nameEn}
                    onChange={(e) => setSubCategoryForm({...subCategoryForm, nameEn: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Arabic Name *</label>
                  <input
                    type="text"
                    value={subCategoryForm.nameAr}
                    onChange={(e) => setSubCategoryForm({...subCategoryForm, nameAr: e.target.value})}
                    required
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={subCategoryForm.imageUrl}
                  onChange={(e) => setSubCategoryForm({...subCategoryForm, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={subCategoryForm.description}
                  onChange={(e) => setSubCategoryForm({...subCategoryForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              {subCategoryForm.imageUrl && (
                <div className="image-preview">
                  <img src={subCategoryForm.imageUrl} alt="Preview" />
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedSubCategory ? <FiEdit2 /> : <FiFolderPlus />}
                  {selectedSubCategory ? 'Update' : 'Create'} SubCategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories

