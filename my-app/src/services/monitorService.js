import api from './api';

export const monitorService = {
  getOverview: () => api.get('/api/monitor/jvm/overview'),
  getMemory: () => api.get('/api/monitor/jvm/memory'),
  getThreads: () => api.get('/api/monitor/jvm/threads'),
  getThreadDump: () => api.get('/api/monitor/jvm/thread-dump'),
  getGc: () => api.get('/api/monitor/jvm/gc'),
};

export default monitorService;
