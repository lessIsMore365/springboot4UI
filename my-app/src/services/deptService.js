import api from './api';

const deptService = {
  getTree: () => api.get('/api/dept/tree'),
  getTreeExclude: (deptId) => api.get(`/api/dept/tree/exclude/${deptId}`),
  getList: () => api.get('/api/dept/list'),
  create: (data) => api.post('/api/dept', data),
  update: (data) => api.put('/api/dept', data),
  delete: (id) => api.delete(`/api/dept/${id}`),
};

export default deptService;
