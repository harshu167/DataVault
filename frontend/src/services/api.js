import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('datavault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized/expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and token was present, clear and redirect
      if (localStorage.getItem('datavault_token')) {
        localStorage.removeItem('datavault_token');
        localStorage.removeItem('datavault_user');
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/users/register', data),
  registerOrg: (data) => api.post('/api/auth/register-organization', data),
  getProfile: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

export const vaultAPI = {
  getRecords: () => api.get('/api/vault'),
  getRecord: (id) => api.get(`/api/vault/${id}`),
  createRecord: (data) => api.post('/api/vault', data),
  updateRecord: (id, data) => api.put(`/api/vault/${id}`, data),
  deleteRecord: (id) => api.delete(`/api/vault/${id}`),
};

export const documentAPI = {
  getDocuments: () => api.get('/api/documents'),
  getDocument: (id) => api.get(`/api/documents/${id}`),
  uploadDocument: (formData) =>
    api.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  downloadDocument: (id) =>
    api.get(`/api/documents/${id}/download`, { responseType: 'blob' }),
  deleteDocument: (id) => api.delete(`/api/documents/${id}`),
};

export const sharingAPI = {
  getRequests: () => api.get('/api/access-requests'),
  createRequest: (data) => api.post('/api/access-requests', data),
  approveRequest: (id) => api.put(`/api/access-requests/${id}/approve`),
  denyRequest: (id, reason) => api.put(`/api/access-requests/${id}/deny`, { reason }),
  getPermissions: () => api.get('/api/access-permissions'),
  revokePermission: (id) => api.put(`/api/access-permissions/${id}/revoke`),
};

export const organizationAPI = {
  getEligibleUsers: () => api.get('/api/organizations/users'),
  getAuthorizedData: (permissionId) => api.get(`/api/organizations/authorized-data/${permissionId}`),
  downloadAuthorizedDoc: (permissionId, documentId) =>
    api.get(`/api/organizations/authorized-documents/${permissionId}/${documentId}/download`, {
      responseType: 'blob',
    }),
  getProfile: () => api.get('/api/organizations/profile'),
  updateProfile: (data) => api.put('/api/organizations/profile', data),
};

export const privacyLockAPI = {
  getStatus: () => api.get('/api/privacy-lock/status'),
  toggle: (enabled) => api.post('/api/privacy-lock/toggle', { enabled }),
};

export const auditAPI = {
  getLogs: () => api.get('/api/audit-logs'),
};

export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
};

export default api;
