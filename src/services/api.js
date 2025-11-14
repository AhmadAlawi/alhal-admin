// API Configuration and Base Setup
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alhal.awnak.net';

// API Client with interceptors
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    // If body is FormData, don't set Content-Type header (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;
    
    const config = {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API request failed' }));
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint, params = {}) {
    // Filter out null, undefined, and empty string values
    const filteredParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        filteredParams[key] = params[key];
      }
    });
    
    const queryString = new URLSearchParams(filteredParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  patch(endpoint, data = {}) {
    const options = {
      method: 'PATCH',
    };
    if (data && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    }
    return this.request(endpoint, options);
  }

  uploadFile(endpoint, formData, params = {}) {
    // Build query string for params
    const filteredParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        filteredParams[key] = params[key];
      }
    });
    
    const queryString = new URLSearchParams(filteredParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'POST',
      body: formData,
    });
  }
}

const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

