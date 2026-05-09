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
};

export default paymentService;
