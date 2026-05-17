import api from './api';

export const monitorService = {
  // JVM 监控
  getOverview: () => api.get('/api/monitor/jvm/overview'),
  getMemory: () => api.get('/api/monitor/jvm/memory'),
  getThreads: () => api.get('/api/monitor/jvm/threads'),
  getThreadDump: () => api.get('/api/monitor/jvm/thread-dump'),
  getGc: () => api.get('/api/monitor/jvm/gc'),
  getGcHistory: () => api.get('/api/monitor/jvm/gc/history'),

  // 数据库监控
  getDbOverview: () => api.get('/api/monitor/db/overview'),
  getDbPool: () => api.get('/api/monitor/db/pool'),
  getDbTables: () => api.get('/api/monitor/db/tables'),
  getDbLatency: () => api.get('/api/monitor/db/latency'),
  getDbHealth: () => api.get('/api/monitor/db/health'),
  getSlowSql: () => api.get('/api/monitor/db/slow-sql'),
  resetSlowSql: () => api.delete('/api/monitor/db/slow-sql'),

  // 服务器监控
  getServerHealth: () => api.get('/api/monitor/server/health'),
  getServerOverview: () => api.get('/api/monitor/server/overview'),
  getServerCpu: () => api.get('/api/monitor/server/cpu'),
  getServerMemory: () => api.get('/api/monitor/server/memory'),
  getServerDisk: () => api.get('/api/monitor/server/disk'),
  getServerNetwork: () => api.get('/api/monitor/server/network'),
};

export default monitorService;
