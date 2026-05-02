/**
 * 认证工具函数
 */

/**
 * 检查用户是否已认证
 * @returns {boolean} 是否已认证
 */
export const isAuthenticated = () => {
  const auth = localStorage.getItem('auth');
  return !!auth;
};

/**
 * 获取当前用户信息
 * @returns {Object|null} 用户信息或null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * 设置当前用户信息
 * @param {Object} user - 用户信息
 */
export const setCurrentUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * 设置认证信息
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
export const setAuth = (username, password) => {
  localStorage.setItem('auth', JSON.stringify({ username, password }));
};

/**
 * 清除认证信息
 */
export const clearAuth = () => {
  localStorage.removeItem('auth');
  localStorage.removeItem('user');
};

/**
 * 检查用户是否拥有指定角色
 * @param {string} role - 角色编码
 * @returns {boolean} 是否拥有该角色
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;

  const userRoles = user.roles.split(',').map(r => r.trim());
  return userRoles.includes(role);
};

/**
 * 检查用户是否拥有管理员角色
 * @returns {boolean} 是否是管理员
 */
export const isAdmin = () => {
  return hasRole('ROLE_ADMIN');
};

/**
 * 检查用户是否拥有普通用户角色
 * @returns {boolean} 是否是普通用户
 */
export const isUser = () => {
  return hasRole('ROLE_USER');
};

/**
 * 获取认证头（用于HTTP Basic认证）
 * @returns {string|null} Basic认证头或null
 */
export const getAuthHeader = () => {
  const auth = localStorage.getItem('auth');
  if (!auth) return null;

  try {
    const { username, password } = JSON.parse(auth);
    const token = btoa(`${username}:${password}`);
    return `Basic ${token}`;
  } catch (error) {
    console.error('解析认证信息失败:', error);
    return null;
  }
};

export default {
  isAuthenticated,
  getCurrentUser,
  setCurrentUser,
  setAuth,
  clearAuth,
  hasRole,
  isAdmin,
  isUser,
  getAuthHeader,
};