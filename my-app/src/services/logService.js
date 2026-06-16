import api from './api';

export const logService = {
  getApps: () => {
    return api.get('/api/logs/apps');
  },

  addApp: (name, path) => {
    return api.post('/api/logs/apps', { name, path });
  },

  updateApp: (name, data) => {
    return api.put(`/api/logs/apps/${encodeURIComponent(name)}`, data);
  },

  deleteApp: (name) => {
    return api.delete(`/api/logs/apps/${encodeURIComponent(name)}`);
  },

  tail: (lines = 100, level, file, app) => {
    const params = { lines };
    if (level) params.level = level;
    if (file) params.file = file;
    if (app) params.app = app;
    return api.get('/api/logs/tail', { params });
  },

  search: (params = {}) => {
    return api.get('/api/logs/search', { params });
  },

  getFiles: (app) => {
    const params = {};
    if (app) params.app = app;
    return api.get('/api/logs/files', { params });
  },

  download: (file, app) => {
    let url = `/api/logs/download?file=${encodeURIComponent(file)}`;
    if (app) url += `&app=${encodeURIComponent(app)}`;
    return api.get(url, { responseType: 'blob' });
  },

  getLoggers: (app) => {
    const params = {};
    if (app) params.app = app;
    return api.get('/api/logs/loggers', { params });
  },

  setLevel: (loggerName, level, app) => {
    const params = {};
    if (app) params.app = app;
    return api.put(`/api/logs/loggers/${encodeURIComponent(loggerName)}`, { level }, { params });
  },

  healthCheck: () => {
    return api.get('/api/logs/health');
  },
};

export default logService;
