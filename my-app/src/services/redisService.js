import api from './api';

/**
 * Redis服务
 */
export const redisService = {
  /**
   * 测试Redis连接
   * @returns {Promise} 连接测试结果
   */
  testConnection: () => {
    return api.get('/api/redis/test');
  },

  /**
   * 异步测试Redis连接（使用虚拟线程）
   * @returns {Promise} 连接测试结果
   */
  testConnectionAsync: () => {
    return api.get('/api/redis/test/async');
  },

  /**
   * Redis服务健康检查
   * @returns {Promise} 健康状态
   */
  healthCheck: () => {
    return api.get('/api/redis/health');
  },

  /**
   * 设置Redis键值对
   * @param {string} key - 键
   * @param {any} value - 值
   * @param {number} [timeout] - 过期时间（秒）
   * @param {string} [timeUnit] - 时间单位（默认SECONDS）
   * @returns {Promise} 设置结果
   */
  set: (key, value, timeout, timeUnit = 'SECONDS') => {
    const data = { key, value };
    if (timeout !== undefined) {
      data.timeout = timeout;
      data.timeUnit = timeUnit;
    }
    return api.post('/api/redis/set', data);
  },

  /**
   * 获取Redis键值对
   * @param {string} key - 键
   * @returns {Promise} 键值对
   */
  get: (key) => {
    return api.get(`/api/redis/get/${key}`);
  },

  /**
   * 删除Redis键
   * @param {string} key - 键
   * @returns {Promise} 删除结果
   */
  delete: (key) => {
    return api.delete(`/api/redis/delete/${key}`);
  },

  /**
   * 检查Redis键是否存在
   * @param {string} key - 键
   * @returns {Promise} 存在性检查结果
   */
  exists: (key) => {
    return api.get(`/api/redis/exists/${key}`);
  },

  /**
   * 设置Redis键过期时间
   * @param {string} key - 键
   * @param {number} timeout - 过期时间
   * @param {string} [timeUnit] - 时间单位（默认SECONDS）
   * @returns {Promise} 设置结果
   */
  expire: (key, timeout, timeUnit = 'SECONDS') => {
    return api.post(`/api/redis/expire/${key}`, null, {
      params: { timeout, timeUnit }
    });
  },

  /**
   * 获取Redis服务器信息
   * @returns {Promise} Redis服务器信息
   */
  getInfo: () => {
    return api.get('/api/redis/info');
  },

  /**
   * 获取Redis统计信息
   * @returns {Promise} 统计信息
   */
  getStats: () => {
    return api.get('/api/redis/stats');
  },

  /**
   * 按模式查询Redis键
   * @param {string} pattern - 匹配模式，默认*
   * @returns {Promise} 键列表
   */
  getKeys: (pattern = '*') => {
    return api.get('/api/redis/keys', {
      params: { pattern }
    });
  },

  /**
   * 设置Redis哈希字段值
   * @param {string} key - 哈希键
   * @param {string} field - 字段名
   * @param {any} value - 字段值
   * @returns {Promise} 设置结果
   */
  hashSet: (key, field, value) => {
    return api.post(`/api/redis/hash/${key}/${field}`, value);
  },

  /**
   * 获取Redis哈希字段值
   * @param {string} key - 哈希键
   * @param {string} field - 字段名
   * @returns {Promise} 字段值
   */
  hashGet: (key, field) => {
    return api.get(`/api/redis/hash/${key}/${field}`);
  },

  /**
   * 向左推入Redis列表
   * @param {string} key - 列表键
   * @param {any} value - 值
   * @returns {Promise} 推入结果
   */
  listPushLeft: (key, value) => {
    return api.post(`/api/redis/list/${key}/lpush`, value);
  },

  /**
   * 获取Redis列表范围
   * @param {string} key - 列表键
   * @param {number} [start=0] - 起始索引
   * @param {number} [end=-1] - 结束索引
   * @returns {Promise} 列表范围
   */
  getListRange: (key, start = 0, end = -1) => {
    return api.get(`/api/redis/list/${key}`, {
      params: { start, end }
    });
  },

  /**
   * 添加Redis集合元素
   * @param {string} key - 集合键
   * @param {Array<any>} values - 值数组
   * @returns {Promise} 添加结果
   */
  setAdd: (key, values) => {
    return api.post(`/api/redis/set/${key}`, values);
  },

  /**
   * Redis性能测试 - 批量设置键值对
   * @param {number} count - 批量数量，默认100
   * @returns {Promise} 性能测试结果
   */
  performanceBatchSet: (count = 100) => {
    return api.post('/api/redis/performance/batch-set', null, {
      params: { count }
    });
  },

  /**
   * Redis并发测试
   * @param {number} concurrentCount - 并发数，默认10
   * @returns {Promise} 并发测试结果
   */
  concurrentTest: (concurrentCount = 10) => {
    return api.get('/api/redis/concurrent-test', {
      params: { concurrentCount }
    });
  },

  /**
   * 清空Redis当前数据库（需要管理员权限）
   * @returns {Promise} 清空结果
   */
  flushDb: () => {
    return api.delete('/api/redis/flush');
  },
};

export default redisService;