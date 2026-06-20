import axios from 'axios';

// API基础配置 (使用空字符串，通过 CRA proxy 转发到后端)
const API_BASE_URL = '';

// 刷新 token 的锁，防止并发请求重复刷新
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * 检查 JWT token 是否即将过期（提前 30 秒刷新）
 * @param {string} token - JWT token
 * @returns {boolean} 是否即将过期
 */
const isTokenExpiringSoon = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // 转为毫秒
    const now = Date.now();
    const threshold = 30 * 1000; // 30 秒
    return expiryTime - now < threshold;
  } catch {
    return false; // 解析失败，认为已过期
  }
};

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证信息
api.interceptors.request.use(
  async (config) => {
    // 标记为 AJAX 请求，防止浏览器弹出原生 HTTP Basic 认证对话框
    config.headers['X-Requested-With'] = 'XMLHttpRequest';

    // 不自动添加认证头到 OAuth2 token 端点（由调用方手动处理）
    if (config.url && config.url.includes('/oauth2/token')) {
      return config;
    }

    // 优先使用 Bearer token（OAuth2 登录后）
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // 检查 token 是否即将过期，如果是则尝试刷新
      if (isTokenExpiringSoon(accessToken)) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && !isRefreshing) {
          isRefreshing = true;
          try {
            const refreshResult = await api.post('/oauth2/token',
              `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Authorization': 'Basic ' + btoa('web-client:secret'),
                },
              }
            );

            if (refreshResult.access_token) {
              localStorage.setItem('access_token', refreshResult.access_token);
              if (refreshResult.refresh_token) {
                localStorage.setItem('refresh_token', refreshResult.refresh_token);
              }
              config.headers['Authorization'] = `Bearer ${refreshResult.access_token}`;
              processQueue(null, refreshResult.access_token);
              return config;
            }
          } catch (err) {
            processQueue(err, null);
            // 刷新失败，清除 token，让用户重新登录
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
          } finally {
            isRefreshing = false;
          }
        } else if (isRefreshing) {
          // 正在刷新中，将请求加入队列
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            config.headers['Authorization'] = `Bearer ${token}`;
            return config;
          }).catch(err => {
            return Promise.reject(err);
          });
        }
      }

      config.headers['Authorization'] = `Bearer ${accessToken}`;
      return config;
    }

    // 回退到 HTTP Basic 认证（仅用于非 OAuth2 场景）
    const auth = localStorage.getItem('auth');
    if (auth) {
      const { username, password } = JSON.parse(auth);
      const token = btoa(`${username}:${password}`);
      config.headers['Authorization'] = `Basic ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    // 统一响应格式处理
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    return response;
  },
  (error) => {
    console.error('API请求错误:', error);

    // 处理认证错误（仅对非登录页面的请求做自动跳转）
    if (error.response && error.response.status === 401) {
      // 清除本地认证信息
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // 不在登录页面时，跳转到登录页（避免登录失败时的循环跳转）
      if (window.location.hash && !window.location.hash.includes('/auth/login')) {
        window.location.href = '/#/auth/login';
      }
    }

    // 统一错误格式
    const errorResponse = {
      success: false,
      message: error.response?.data?.message || error.message || '请求失败',
      status: error.response?.status,
      timestamp: Date.now(),
    };

    return Promise.reject(errorResponse);
  }
);

// 认证相关工具函数
export const auth = {
  // 登出
  logout: () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // 检查是否已认证（仅检查 Bearer token）
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // 获取当前用户信息（从localStorage）
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 设置当前用户信息
  setCurrentUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// ==================== 监控管理 API ====================

/**
 * 异步事件管理服务
 */
export const eventService = {
  // 获取事件指标统计
  getMetrics: () => api.get('/api/monitor/events/metrics'),

  // 查看死信队列（所有类型）
  getDLQ: () => api.get('/api/monitor/events/dlq'),

  // 按事件类型查看死信事件
  getDLQByType: (eventType) => api.get(`/api/monitor/events/dlq/${eventType}`),

  // 清除指定类型的死信事件
  clearDLQ: (eventType) => api.delete(`/api/monitor/events/dlq/${eventType}`),

  // 从 Redis Stream 回溯事件溯源
  getSourcing: (eventType, count = 20) =>
    api.get(`/api/monitor/events/sourcing/${eventType}`, { params: { count } }),
};

/**
 * WebSocket 管理服务
 */
export const websocketService = {
  // 查看在线人数和会话列表
  getOnlineUsers: () => api.get('/api/websocket/online'),

  // 手动推送告警消息
  pushAlert: (data) => api.post('/api/websocket/push/alert', data),

  // 手动推送通知消息
  pushNotice: (data) => api.post('/api/websocket/push/notice', data),
};

/**
 * 登录日志服务
 */
export const loginLogService = {
  // 分页查询登录日志
  getLoginLogs: (params) => api.get('/api/monitor/loginlog', { params }),

  // 清理旧登录日志
  cleanupLoginLogs: (beforeDays = 90) => api.delete('/api/monitor/loginlog', { params: { beforeDays } }),
};

/**
 * 通用配置中心服务
 */
export const configService = {
  // 获取单个配置值
  getConfig: (key) => api.get('/api/config/get', { params: { key } }),

  // 获取所有配置快照
  getAllConfig: () => api.get('/api/config/all'),

  // 按分组获取配置
  getConfigByGroup: (group) => api.get(`/api/config/group/${group}`),

  // 更新配置
  updateConfig: (data) => api.put('/api/config/update', data),

  // 删除配置
  deleteConfig: (key) => api.delete('/api/config/delete', { params: { key } }),

  // 全量刷新配置
  refreshConfig: () => api.post('/api/config/refresh'),
};

export default api;
