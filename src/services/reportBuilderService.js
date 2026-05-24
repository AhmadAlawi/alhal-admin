import apiClient from './api';

const reportBuilderService = {
  getSchema: () => apiClient.get('/api/reports/builder/schema'),

  getTableSchema: (tableId) => apiClient.get(`/api/reports/builder/schema/${tableId}`),

  getLookup: (lookupKey, params = {}) =>
    apiClient.get(`/api/reports/builder/lookups/${lookupKey}`, params),

  validate: (query) => apiClient.post('/api/reports/builder/validate', query),

  preview: (query) => apiClient.post('/api/reports/builder/preview', query),

  execute: (query) => apiClient.post('/api/reports/builder/execute', query),

  exportCsv: async (query) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alhal.awnak.net';
    let token = localStorage.getItem('authToken');
    if (token) {
      try {
        const parsed = JSON.parse(token);
        token = typeof parsed === 'string' ? parsed : (parsed.token || parsed.accessToken || token);
      } catch {
        // use as-is
      }
    }
    const response = await fetch(`${API_BASE_URL}/api/reports/builder/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ query, format: 'csv' }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error?.detail || 'Export failed');
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const fileName = match?.[1] || `report-${Date.now()}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

  listSaved: () => apiClient.get('/api/reports/builder/saved'),

  getSaved: (id) => apiClient.get(`/api/reports/builder/saved/${id}`),

  save: (name, definition) =>
    apiClient.post('/api/reports/builder/saved', { name, definition }),

  updateSaved: (id, name, definition) =>
    apiClient.put(`/api/reports/builder/saved/${id}`, { name, definition }),

  deleteSaved: (id) => apiClient.delete(`/api/reports/builder/saved/${id}`),
};

export default reportBuilderService;
