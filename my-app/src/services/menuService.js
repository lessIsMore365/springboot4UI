import api from './api';

export const menuService = {
  getTree: () => api.get('/api/menus/tree'),
  getUserMenus: () => api.get('/api/menus/user'),
  getRoleMenus: (roleId) => api.get(`/api/menus/role/${roleId}`),
  create: (data) => api.post('/api/menus', data),
  update: (data) => api.put('/api/menus', data),
  delete: (id) => api.delete(`/api/menus/${id}`),
  assignRoleMenus: (roleId, menuIds) => api.put(`/api/menus/role/${roleId}`, menuIds),
};

export default menuService;
