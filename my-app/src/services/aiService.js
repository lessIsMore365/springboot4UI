import api from './api';

export const aiService = {
  // ========== 模型 & 工具 ==========
  getProviders: () => api.get('/api/ai/providers'),
  getFunctions: () => api.get('/api/ai/functions'),

  // ========== AI 对话 (SSE 流式) ==========
  chat: (messages, { enableFunctions = true, provider = 'deepseek', sessionId } = {}) => {
    const body = { messages, enableFunctions, provider };
    if (sessionId) body.sessionId = sessionId;
    return api.post('/api/ai/chat', body, {
      headers: { 'Accept': 'text/event-stream' },
      responseType: 'stream',
      timeout: 120000,
    });
  },

  // ========== 智能巡检 ==========
  inspect: (target = 'all', provider = 'deepseek') =>
    api.get('/api/ai/inspect', { params: { target, provider } }),

  // ========== Chat2SQL ==========
  chat2sql: (question, provider = 'deepseek') =>
    api.post('/api/ai/chat2sql', { question, provider }),

  // ========== 代码评审 ==========
  codeReview: (code, language = 'Java', provider = 'deepseek') =>
    api.post('/api/ai/code-review', { code, language, provider }),

  // ========== 对话历史 ==========
  getSessions: (page = 1, size = 10, username) => {
    const params = { page, size };
    if (username) params.username = username;
    return api.get('/api/ai/history/sessions', { params });
  },
  getSession: (sessionId) => api.get(`/api/ai/history/sessions/${sessionId}`),
  deleteSession: (sessionId) => api.delete(`/api/ai/history/sessions/${sessionId}`),
  getHistoryStats: () => api.get('/api/ai/history/stats'),

  // ========== AI 用量 ==========
  getUsage: (page = 1, size = 10, model, username) => {
    const params = { page, size };
    if (model) params.model = model;
    if (username) params.username = username;
    return api.get('/api/monitor/ai-usage', { params });
  },
  getUsageSummary: () => api.get('/api/monitor/ai-usage/summary'),
  deleteUsage: (beforeDays = 90) =>
    api.delete('/api/monitor/ai-usage', { params: { beforeDays } }),

  // ========== AI 配置管理 ==========
  getConfigs: () => api.get('/api/ai/config'),
  getConfig: (name) => api.get(`/api/ai/config/${name}`),
  updateConfig: (name, data) => api.put(`/api/ai/config/${name}`, data),
  refreshConfig: (name) => api.post(`/api/ai/config/${name}/refresh`),
  refreshAllConfigs: () => api.post('/api/ai/config/refresh-all'),

  // ========== MCP 服务 ==========
  getMcpInfo: () => api.get('/.well-known/mcp'),
  mcpCall: (method, params) => api.post('/api/mcp', {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params: params || {},
  }),

  // ========== RAG 知识库 ==========
  // 知识库 CRUD
  createKb: (name, description) => api.post('/api/ai/rag/kb', { name, description }),
  listKbs: () => api.get('/api/ai/rag/kb'),
  deleteKb: (kbId) => api.delete(`/api/ai/rag/kb/${kbId}`),

  // 文档管理
  uploadDoc: (kbId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/ai/rag/kb/${kbId}/docs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
  listDocs: (kbId) => api.get(`/api/ai/rag/kb/${kbId}/docs`),
  deleteDoc: (docId) => api.delete(`/api/ai/rag/docs/${docId}`),

  // 知识库问答
  askKb: (kbId, question, provider = 'deepseek') =>
    api.post(`/api/ai/rag/kb/${kbId}/ask`, { question, provider }),
};

export default aiService;
