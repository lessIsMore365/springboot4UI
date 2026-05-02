import api from './api';

/**
 * 用户管理服务
 */
export const userService = {
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise} 创建结果
   */
  createUser: (userData) => {
    return api.post('/api/users', userData);
  },

  /**
   * 异步创建用户（使用虚拟线程）
   * @param {Object} userData - 用户数据
   * @returns {Promise} 创建结果
   */
  createUserAsync: (userData) => {
    return api.post('/api/users/async', userData);
  },

  /**
   * 批量创建测试用户
   * @param {number} count - 创建数量，默认10
   * @returns {Promise} 批量创建结果
   */
  batchCreateUsers: (count = 10) => {
    return api.post('/api/users/batch', null, {
      params: { count }
    });
  },

  /**
   * 异步批量创建用户（使用虚拟线程）
   * @param {number} count - 创建数量
   * @returns {Promise} 批量创建结果
   */
  batchCreateUsersAsync: (count = 10) => {
    return api.post('/api/users/batch/async', null, {
      params: { count }
    });
  },

  /**
   * 分页查询用户列表
   * @param {number} page - 页码，默认1
   * @param {number} size - 每页大小，默认10
   * @returns {Promise} 分页用户列表
   */
  getUsers: (page = 1, size = 10) => {
    return api.get('/api/users', {
      params: { page, size }
    });
  },

  /**
   * 异步分页查询用户（使用虚拟线程）
   * @param {number} page - 页码
   * @param {number} size - 每页大小
   * @returns {Promise} 分页用户列表
   */
  getUsersAsync: (page = 1, size = 10) => {
    return api.get('/api/users/async', {
      params: { page, size }
    });
  },

  /**
   * 获取用户统计信息
   * @returns {Promise} 统计信息
   */
  getUserStats: () => {
    return api.get('/api/users/stats');
  },

  /**
   * 异步获取用户统计信息（使用虚拟线程）
   * @returns {Promise} 统计信息
   */
  getUserStatsAsync: () => {
    return api.get('/api/users/stats/async');
  },

  /**
   * 数据库性能测试
   * @returns {Promise} 性能测试结果
   */
  performanceTest: () => {
    return api.get('/api/users/performance');
  },

  /**
   * 并发测试
   * @param {number} concurrentCount - 并发数，默认5
   * @returns {Promise} 并发测试结果
   */
  concurrentTest: (concurrentCount = 5) => {
    return api.get('/api/users/concurrent-test', {
      params: { concurrentCount }
    });
  },

  /**
   * 用户服务健康检查
   * @returns {Promise} 健康状态
   */
  healthCheck: () => {
    return api.get('/api/users/health');
  },
};

export default userService;