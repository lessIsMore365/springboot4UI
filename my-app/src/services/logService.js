import api from './api';

export const logService = {
  tail: (lines = 100, level, file) => {
    const params = { lines };
    if (level) params.level = level;
    if (file) params.file = file;
    return api.get('/api/logs/tail', { params });
  },

  search: (params = {}) => {
    return api.get('/api/logs/search', { params });
  },

  getFiles: () => {
    return api.get('/api/logs/files');
  },

  download: (file) => {
    return api.get(`/api/logs/download?file=${encodeURIComponent(file)}`, { responseType: 'blob' });
  },

  getLoggers: () => {
    return api.get('/api/logs/loggers');
  },

  setLevel: (loggerName, level) => {
    return api.put(`/api/logs/loggers/${encodeURIComponent(loggerName)}`, { level });
  },

  healthCheck: () => {
    return api.get('/api/logs/health');
  },
};

export default logService;
