import apiClient from './api';

/**
 * Image Service
 * Handles image upload operations
 */

export const imageService = {
  /**
   * Upload a single image file
   * @param {File} file - The image file to upload
   * @param {string} folder - Optional folder name
   * @returns {Promise} Response with image URL and metadata
   */
  uploadImage: async (file, folder = null) => {
    if (!file) {
      throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    const params = {};
    if (folder) {
      params.folder = folder;
    }

    const response = await apiClient.uploadFile('/api/Images/upload', formData, params);
    return response;
  },

  /**
   * Upload multiple image files
   * @param {File[]} files - Array of image files to upload
   * @param {string} folder - Optional folder name
   * @returns {Promise} Response with image URLs and metadata
   */
  uploadMultipleImages: async (files, folder = null) => {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const params = {};
    if (folder) {
      params.folder = folder;
    }

    const response = await apiClient.uploadFile('/api/Images/upload-multiple', formData, params);
    return response;
  },

  /**
   * Upload image with metadata
   * @param {File} file - The image file to upload
   * @param {Object} metadata - Metadata (title, description, category)
   * @param {string} folder - Optional folder name
   * @returns {Promise} Response with image URL and metadata
   */
  uploadImageWithMetadata: async (file, metadata = {}, folder = null) => {
    if (!file) {
      throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    const params = { ...metadata };
    if (folder) {
      params.folder = folder;
    }

    const response = await apiClient.uploadFile('/api/Images/upload-with-metadata', formData, params);
    return response;
  },

  /**
   * Delete an image
   * @param {string} fileName - Name of the file to delete
   * @param {string} folder - Optional folder name
   * @returns {Promise} Response
   */
  deleteImage: async (fileName, folder = null) => {
    if (!fileName) {
      throw new Error('No file name provided');
    }

    const params = { fileName };
    if (folder) {
      params.folder = folder;
    }

    // Delete uses query parameters
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/Images/delete?${queryString}`;
    return apiClient.delete(endpoint);
  },

  /**
   * Get image upload configuration
   * @returns {Promise} Configuration response
   */
  getConfig: async () => {
    return apiClient.get('/api/Images/config');
  },
};

export default imageService;

