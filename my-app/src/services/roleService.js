import api from './api';

/**
 * 角色管理服务
 */
export const roleService = {
  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @returns {Promise} 创建结果
   */
  createRole: (roleData) => {
    return api.post('/api/roles', roleData);
  },

  /**
   * 异步创建角色（使用虚拟线程）
   * @param {Object} roleData - 角色数据
   * @returns {Promise} 创建结果
   */
  createRoleAsync: (roleData) => {
    return api.post('/api/roles/async', roleData);
  },

  /**
   * 批量创建测试角色
   * @param {number} count - 创建数量，默认5
   * @returns {Promise} 批量创建结果
   */
  batchCreateRoles: (count = 5) => {
    return api.post('/api/roles/batch', null, {
      params: { count }
    });
  },

  /**
   * 异步批量创建角色（使用虚拟线程）
   * @param {number} count - 创建数量
   * @returns {Promise} 批量创建结果
   */
  batchCreateRolesAsync: (count = 5) => {
    return api.post('/api/roles/batch/async', null, {
      params: { count }
    });
  },

  /**
   * 分页查询角色列表
   * @param {number} page - 页码，默认1
   * @param {number} size - 每页大小，默认10
   * @returns {Promise} 分页角色列表
   */
  getRoles: (page = 1, size = 10) => {
    return api.get('/api/roles', {
      params: { page, size }
    });
  },

  /**
   * 异步分页查询角色（使用虚拟线程）
   * @param {number} page - 页码
   * @param {number} size - 每页大小
   * @returns {Promise} 分页角色列表
   */
  getRolesAsync: (page = 1, size = 10) => {
    return api.get('/api/roles/async', {
      params: { page, size }
    });
  },

  /**
   * 获取角色统计信息
   * @returns {Promise} 统计信息
   */
  getRoleStats: () => {
    return api.get('/api/roles/stats');
  },

  /**
   * 异步获取角色统计信息（使用虚拟线程）
   * @returns {Promise} 统计信息
   */
  getRoleStatsAsync: () => {
    return api.get('/api/roles/stats/async');
  },

  /**
   * 根据编码查询角色
   * @param {string} code - 角色编码
   * @returns {Promise} 角色信息
   */
  getRoleByCode: (code) => {
    return api.get(`/api/roles/code/${code}`);
  },

  /**
   * 为用户分配角色
   * @param {number} userId - 用户ID
   * @param {Array<number>} roleIds - 角色ID数组
   * @returns {Promise} 分配结果
   */
  assignRolesToUser: (userId, roleIds) => {
    return api.post('/api/roles/assign', { userId, roleIds });
  },

  /**
   * 异步为用户分配角色（使用虚拟线程）
   * @param {number} userId - 用户ID
   * @param {Array<number>} roleIds - 角色ID数组
   * @returns {Promise} 分配结果
   */
  assignRolesToUserAsync: (userId, roleIds) => {
    return api.post('/api/roles/assign/async', { userId, roleIds });
  },

  /**
   * 获取用户的角色列表
   * @param {number} userId - 用户ID
   * @returns {Promise} 角色列表
   */
  getUserRoles: (userId) => {
    return api.get(`/api/roles/user/${userId}`);
  },

  /**
   * 检查用户是否拥有某个角色
   * @param {number} userId - 用户ID
   * @param {string} roleCode - 角色编码
   * @returns {Promise} 检查结果
   */
  checkUserRole: (userId, roleCode) => {
    return api.get('/api/roles/check', {
      params: { userId, roleCode }
    });
  },

  /**
   * 为角色分配权限
   * @param {number} roleId - 角色ID
   * @param {Array<number>} permissionIds - 权限ID数组
   * @returns {Promise} 分配结果
   */
  assignPermissionsToRole: (roleId, permissionIds) => {
    return api.post('/api/roles/permissions/assign', { roleId, permissionIds });
  },

  /**
   * 获取角色的权限ID列表
   * @param {number} roleId - 角色ID
   * @returns {Promise} 权限ID列表
   */
  getRolePermissions: (roleId) => {
    return api.get(`/api/roles/${roleId}/permissions`);
  },

  /**
   * 角色服务健康检查
   * @returns {Promise} 健康状态
   */
  healthCheck: () => {
    return api.get('/api/roles/health');
  },
};

export default roleService;