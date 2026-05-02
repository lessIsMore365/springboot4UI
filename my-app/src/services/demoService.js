import api from './api';

/**
 * 演示服务（公开端点）
 */
export const demoService = {
  /**
   * Hello端点
   * @returns {Promise} Hello消息
   */
  hello: () => {
    return api.get('/hello');
  },

  /**
   * 虚拟线程演示端点
   * @returns {Promise} 演示消息
   */
  demoHello: () => {
    return api.get('/demo/hello');
  },

  /**
   * 数据库连接测试
   * @returns {Promise} 数据库测试结果
   */
  testDatabase: () => {
    return api.get('/db/test');
  },

  /**
   * 数据库健康检查
   * @returns {Promise} 数据库健康状态
   */
  databaseHealth: () => {
    return api.get('/db/health');
  },
};

export default demoService;