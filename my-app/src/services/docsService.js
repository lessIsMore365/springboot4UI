import api from './api';

export const docsService = {
  getFullDocs: () => api.get('/api/docs'),

  getVersion: () => api.get('/api/docs/version'),

  getChangelog: (since) => api.get('/api/docs/changelog', { params: { since } }),
};

export default docsService;
