import api from './api';

export const authService = {
  /**
   * 用户注册
   */
  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },

  /**
   * 获取当前用户信息（从后端）
   */
  getCurrentUserFromServer: () => {
    return api.get('/api/auth/me');
  },

  /**
   * 获取当前用户信息（从 localStorage）
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
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
   * 验证验证码（文本方式，输入汉字序列）
   */
  verifyCaptcha: (captchaKey, captchaCode) => {
    return api.post('/api/auth/captcha/verify', { captchaKey, captchaCode });
  },

  /**
   * 验证验证码（坐标方式，用户点击图片坐标）
   * @param {string} captchaKey - 验证码key
   * @param {Array<{x: number, y: number}>} positions - 点击坐标数组
   */
  verifyCaptchaPosition: (captchaKey, positions) => {
    return api.post('/api/auth/captcha/verify-position', { captchaKey, positions });
  },

  /**
   * 从 promptText 中解析验证码字符序列
   * @param {string} promptText - 如 "请依次点击：春天"
   * @returns {string} 如 "春天"
   */
  parseCaptchaText: (promptText) => {
    const match = promptText.match(/[：:]\s*(.+)$/);
    return match ? match[1].trim() : '';
  },

  /**
   * 登录（OAuth2 password grant，验证码由 CaptchaValidationFilter 校验）
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} captchaKey - 验证码key
   * @param {string} captchaCode - 验证码文本（从 promptText 解析，如"春天"）
   * @returns {Promise} 登录结果
   */
  login: async (username, password, captchaKey, captchaCode) => {
    // 验证码由 OAuth2 token 端点的 CaptchaValidationFilter 统一校验，无需单独验证
    const body = 'grant_type=password' +
      `&username=${encodeURIComponent(username)}` +
      `&password=${encodeURIComponent(password)}` +
      `&captcha_key=${encodeURIComponent(captchaKey)}` +
      `&captcha_code=${encodeURIComponent(captchaCode)}`;

    try {
      const tokenResponse = await api.post('/oauth2/token', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa('web-client:secret'),
        },
      });

      const accessToken = tokenResponse.access_token;
      if (!accessToken) {
        throw new Error('获取访问令牌失败');
      }

      localStorage.setItem('access_token', accessToken);
      if (tokenResponse.refresh_token) {
        localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      }

      // 获取用户信息
      const userResponse = await api.get('/api/auth/me');
      if (userResponse.success) {
        localStorage.setItem('user', JSON.stringify(userResponse.user));
      }

      return { success: true, user: userResponse.user || null, message: '登录成功' };
    } catch (err) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
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
   * 检查认证状态（仅检查 Bearer token）
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

export default authService;
