import api from './api';

export const authService = {
  /**
   * 用户注册
   */
  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: () => {
    return api.get('/api/auth/me');
  },

  /**
   * 健康检查
   */
  healthCheck: () => {
    return api.get('/api/auth/health');
  },

  /**
   * 获取图形验证码
   */
  getCaptcha: () => {
    return api.get('/api/auth/captcha');
  },

  /**
   * 验证验证码（前端校验，不会删除验证码）
   */
  verifyCaptcha: (captchaKey, captchaCode) => {
    return api.post('/api/auth/captcha/verify', { captchaKey, captchaCode });
  },

  /**
   * 登录（HTTP Basic 认证 + 验证码前端校验）
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} captchaKey - 验证码key
   * @param {string} captchaCode - 用户输入的验证码
   * @returns {Promise} 登录结果
   */
  login: async (username, password, captchaKey, captchaCode) => {
    // 1. 先校验验证码
    const captchaResult = await api.post('/api/auth/captcha/verify', {
      captchaKey,
      captchaCode,
    });

    if (!captchaResult.success) {
      throw new Error(captchaResult.message || '验证码错误');
    }

    // 2. 使用 HTTP Basic 认证登录
    localStorage.setItem('auth', JSON.stringify({ username, password }));

    try {
      const userResponse = await api.get('/api/auth/me');

      if (userResponse.success) {
        localStorage.setItem('user', JSON.stringify(userResponse.user));
      }

      return {
        success: true,
        user: userResponse.user || null,
        message: '登录成功',
      };
    } catch (err) {
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
      throw err;
    }
  },

  /**
   * 登出
   */
  logout: () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * 检查认证状态
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('auth') || !!localStorage.getItem('access_token');
  },
};

export default authService;
