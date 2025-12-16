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
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        // Use replace to prevent adding to history and potential loops
        if (!window.location.pathname.includes('/login')) {
          // Use replace instead of href to prevent refresh loops
          window.location.replace('/login');
        }
        
        const error = await response.json().catch(() => ({ message: 'Unauthorized. Please login again.' }));
        throw new Error(error.message || error.error?.detail || 'Unauthorized. Please login again.');
      }
      
      // Handle 400 Bad Request - validation errors
      if (response.status === 400) {
        const error = await response.json().catch(() => ({ message: 'Bad request' }));
        
        // Extract error message from error object
        let errorMessage = error.message || 'Bad request';
        if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.errors) {
          // Handle validation errors
          const validationErrors = Object.values(error.error.errors).flat();
          errorMessage = validationErrors.join(', ');
        }
        
        throw new Error(errorMessage);
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API request failed' }));
        const errorMessage = error.message || error.error?.detail || error.error?.message || 'API request failed';
        throw new Error(errorMessage);
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

