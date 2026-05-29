import api from './api';

export const paymentService = {
  createPayment: (data) => {
    return api.post('/api/payment/create', data);
  },

  createPaymentAsync: (data) => {
    return api.post('/api/payment/create/async', data);
  },

  getOrder: (orderNo) => {
    return api.get(`/api/payment/order/${orderNo}`);
  },

  closeOrder: (orderNo) => {
    return api.post(`/api/payment/order/${orderNo}/close`);
  },

  refund: (data) => {
    return api.post('/api/payment/refund', data);
  },

  getOrders: (page = 1, size = 10) => {
    return api.get('/api/payment/orders', { params: { page, size } });
  },

  healthCheck: () => {
    return api.get('/api/payment/health');
  },

  getNotifyLogs: (page = 1, size = 10, paymentMethod, orderNo) => {
    const params = { page, size };
    if (paymentMethod) params.paymentMethod = paymentMethod;
    if (orderNo) params.orderNo = orderNo;
    return api.get('/api/payment/notify-logs', { params });
  },

  getNotifyLog: (id) => {
    return api.get(`/api/payment/notify-log/${id}`);
  },

  deleteNotifyLogs: (beforeDays = 90) => {
    return api.delete('/api/payment/notify-logs', { params: { beforeDays } });
  },
};

export default paymentService;
