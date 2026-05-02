import api from './api';

/**
 * 权限管理服务
 */
export const permissionService = {
  /**
   * 创建权限
   * @param {Object} permissionData - 权限数据
   * @returns {Promise} 创建结果
   */
  createPermission: (permissionData) => {
    return api.post('/api/permissions', permissionData);
  },

  /**
   * 异步创建权限（使用虚拟线程）
   * @param {Object} permissionData - 权限数据
   * @returns {Promise} 创建结果
   */
  createPermissionAsync: (permissionData) => {
    return api.post('/api/permissions/async', permissionData);
  },

  /**
   * 批量创建测试权限
   * @param {number} count - 创建数量，默认10
   * @returns {Promise} 批量创建结果
   */
  batchCreatePermissions: (count = 10) => {
    return api.post('/api/permissions/batch', null, {
      params: { count }
    });
  },

  /**
   * 异步批量创建权限（使用虚拟线程）
   * @param {number} count - 创建数量
   * @returns {Promise} 批量创建结果
   */
  batchCreatePermissionsAsync: (count = 10) => {
    return api.post('/api/permissions/batch/async', null, {
      params: { count }
    });
  },

  /**
   * 分页查询权限列表
   * @param {number} page - 页码，默认1
   * @param {number} size - 每页大小，默认10
   * @returns {Promise} 分页权限列表
   */
  getPermissions: (page = 1, size = 10) => {
    return api.get('/api/permissions', {
      params: { page, size }
    });
  },

  /**
   * 异步分页查询权限（使用虚拟线程）
   * @param {number} page - 页码
   * @param {number} size - 每页大小
   * @returns {Promise} 分页权限列表
   */
  getPermissionsAsync: (page = 1, size = 10) => {
    return api.get('/api/permissions/async', {
      params: { page, size }
    });
  },

  /**
   * 获取权限统计信息
   * @returns {Promise} 统计信息
   */
  getPermissionStats: () => {
    return api.get('/api/permissions/stats');
  },

  /**
   * 根据编码查询权限
   * @param {string} code - 权限编码
   * @returns {Promise} 权限信息
   */
  getPermissionByCode: (code) => {
    return api.get(`/api/permissions/code/${code}`);
  },

  /**
   * 根据类型查询权限列表
   * @param {string} type - 权限类型（API、MENU、BUTTON、DATA）
   * @returns {Promise} 权限列表
   */
  getPermissionsByType: (type) => {
    return api.get(`/api/permissions/type/${type}`);
  },

  /**
   * 根据用户ID查询权限列表（包括角色关联的权限）
   * @param {number} userId - 用户ID
   * @returns {Promise} 权限列表
   */
  getPermissionsByUser: (userId) => {
    return api.get(`/api/permissions/user/${userId}`);
  },

  /**
   * 根据角色ID查询权限列表
   * @param {number} roleId - 角色ID
   * @returns {Promise} 权限列表
   */
  getPermissionsByRole: (roleId) => {
    return api.get(`/api/permissions/role/${roleId}`);
  },

  /**
   * 检查用户是否拥有某个权限
   * @param {number} userId - 用户ID
   * @param {string} permissionCode - 权限编码
   * @returns {Promise} 检查结果
   */
  checkUserPermission: (userId, permissionCode) => {
    return api.get('/api/permissions/check', {
      params: { userId, permissionCode }
    });
  },

  /**
   * 检查用户是否拥有某个URL和方法的权限
   * @param {number} userId - 用户ID
   * @param {string} url - URL
   * @param {string} method - HTTP方法
   * @returns {Promise} 检查结果
   */
  checkUserPermissionForUrl: (userId, url, method) => {
    return api.get('/api/permissions/check-url', {
      params: { userId, url, method }
    });
  },

  /**
   * 权限服务健康检查
   * @returns {Promise} 健康状态
   */
  healthCheck: () => {
    return api.get('/api/permissions/health');
  },
};

export default permissionService;