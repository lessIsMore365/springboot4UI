import api from './api';

export const noticeService = {
  // Admin endpoints
  adminPage: (page = 1, size = 10, status, keyword) => {
    const params = { page, size };
    if (status) params.status = status;
    if (keyword) params.keyword = keyword;
    return api.get('/api/notices/admin', { params });
  },

  create: (data) => api.post('/api/notices', data),

  update: (id, data) => api.put(`/api/notices/${id}`, data),

  publish: (id) => api.post(`/api/notices/${id}/publish`),

  withdraw: (id) => api.post(`/api/notices/${id}/withdraw`),

  delete: (id) => api.delete(`/api/notices/${id}`),

  // User endpoints
  userPage: (page = 1, size = 10) =>
    api.get('/api/notices', { params: { page, size } }),

  detail: (id) => api.get(`/api/notices/${id}`),

  markRead: (id) => api.post(`/api/notices/${id}/read`),

  markAllRead: () => api.post('/api/notices/read-all'),

  unreadCount: () => api.get('/api/notices/unread-count'),
};

export default noticeService;
