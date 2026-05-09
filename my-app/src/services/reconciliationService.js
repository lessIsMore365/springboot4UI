import api from './api';

export const reconciliationService = {
  runReconciliation: (data) => {
    return api.post('/api/reconciliation/run', data);
  },

  runReconciliationAsync: (data) => {
    return api.post('/api/reconciliation/run/async', data);
  },

  getRecords: (page = 1, size = 10) => {
    return api.get('/api/reconciliation/records', { params: { page, size } });
  },

  getRecord: (id) => {
    return api.get(`/api/reconciliation/records/${id}`);
  },

  getDetails: (reconRecordId) => {
    return api.get(`/api/reconciliation/details/${reconRecordId}`);
  },

  getStats: (startDate, endDate) => {
    return api.get('/api/reconciliation/stats', { params: { startDate, endDate } });
  },

  healthCheck: () => {
    return api.get('/api/reconciliation/health');
  },
};

export default reconciliationService;
