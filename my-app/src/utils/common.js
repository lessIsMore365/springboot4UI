/**
 * 通用工具函数
 */

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @param {string} format - 格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 格式化JSON字符串（美化）
 * @param {any} data - 要格式化的数据
 * @param {number} indent - 缩进空格数，默认2
 * @returns {string} 格式化后的JSON字符串
 */
export const formatJSON = (data, indent = 2) => {
  if (data === null || data === undefined) return 'null';

  try {
    if (typeof data === 'string') {
      // 尝试解析字符串为JSON
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, indent);
    }

    if (typeof data === 'object') {
      return JSON.stringify(data, null, indent);
    }

    return String(data);
  } catch (error) {
    return String(data);
  }
};

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export const copyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(err => reject(err));
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        successful ? resolve(true) : reject(new Error('复制失败'));
      } catch (err) {
        document.body.removeChild(textArea);
        reject(err);
      }
    }
  });
};

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
export const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 判断对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否为空
 */
export const isEmptyObject = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  return Object.keys(obj).length === 0;
};

/**
 * 深度克隆对象（使用浏览器原生 structuredClone）
 * @param {any} obj - 要克隆的对象
 * @returns {any} 克隆后的对象
 */
export const deepClone = (obj) => {
  // 使用浏览器原生 structuredClone，支持 Date, Map, Set, RegExp, File, Blob 等
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  // 降级方案（仅在不支持 structuredClone 的旧浏览器中）
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 安全的获取对象属性值
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径，如 'user.profile.name'
 * @param {any} defaultValue - 默认值
 * @returns {any} 属性值或默认值
 */
export const getSafe = (obj, path, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object') return defaultValue;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = current[key];
  }

  return current === undefined ? defaultValue : current;
};

export default {
  formatDateTime,
  formatJSON,
  copyToClipboard,
  debounce,
  throttle,
  generateRandomString,
  isEmptyObject,
  deepClone,
  getSafe,
};