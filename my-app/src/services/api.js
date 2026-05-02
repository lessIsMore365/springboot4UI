import axios from 'axios';

// API基础配置 (使用空字符串，通过 CRA proxy 转发到后端)
const API_BASE_URL = '';

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
  (config) => {
    // 标记为 AJAX 请求，防止浏览器弹出原生 HTTP Basic 认证对话框
    config.headers['X-Requested-With'] = 'XMLHttpRequest';

    // 不自动添加认证头到 OAuth2 token 端点（由调用方手动处理）
    if (config.url && config.url.includes('/oauth2/token')) {
      return config;
    }

    // 优先使用 Bearer token（OAuth2 登录后）
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
      return config;
    }

    // 回退到 HTTP Basic 认证
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
  // 登录（设置认证信息）
  login: (username, password) => {
    localStorage.setItem('auth', JSON.stringify({ username, password }));
    return api.get('/api/auth/me');
  },

  // 登出
  logout: () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
  },

  // 检查是否已认证（兼容两种认证方式）
  isAuthenticated: () => {
    return !!localStorage.getItem('auth') || !!localStorage.getItem('access_token');
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

export default api;
