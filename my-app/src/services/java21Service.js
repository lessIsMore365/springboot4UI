import api from './api';

export const java21Service = {
  // ========== 12.1 Virtual Thread ==========
  virtualThread: {
    info: () => api.get('/java21/virtual-thread/info'),
    createVirtual: (count = 10000) => api.get('/java21/virtual-thread/create-virtual', { params: { count } }),
    createPlatform: (count = 200) => api.get('/java21/virtual-thread/create-platform', { params: { count } }),
    compare: (vCount = 10000, pCount = 200) => api.get('/java21/virtual-thread/compare', { params: { vCount, pCount } }),
    massive: (count = 100000) => api.get('/java21/virtual-thread/massive', { params: { count } }),
    pinning: () => api.get('/java21/virtual-thread/pinning'),
    async: () => api.get('/java21/virtual-thread/async'),
    builderApi: () => api.get('/java21/virtual-thread/builder-api'),
    compareTraditional: (taskCount = 100, sleepMs = 50) =>
      api.get('/java21/virtual-thread/compare-traditional', { params: { taskCount, sleepMs } }),
  },

  // ========== 12.2 Structured Concurrency ==========
  structuredConcurrency: {
    userOrders: (userId = 1) => api.get('/java21/structured-concurrency/user-orders', { params: { userId } }),
    weather: (city = '北京') => api.get('/java21/structured-concurrency/weather', { params: { city } }),
    payment: (orderId = 1001) => api.get('/java21/structured-concurrency/payment', { params: { orderId } }),
    errorHandling: () => api.get('/java21/structured-concurrency/error-handling'),
    timeout: () => api.get('/java21/structured-concurrency/timeout'),
    compareTraditional: (userId = 1) =>
      api.get('/java21/structured-concurrency/compare-traditional', { params: { userId } }),
    compareRace: (city = '北京') =>
      api.get('/java21/structured-concurrency/compare-race', { params: { city } }),
  },

  // ========== 12.3 Scoped Value ==========
  scopedValue: {
    basic: () => api.get('/java21/scoped-value/basic'),
    isolation: () => api.get('/java21/scoped-value/isolation'),
    requestContext: (userId = 1, username = 'admin', role = 'ROLE_ADMIN') =>
      api.get('/java21/scoped-value/request-context', { params: { userId, username, role } }),
    compareTl: () => api.get('/java21/scoped-value/compare-tl'),
    fallback: () => api.get('/java21/scoped-value/fallback'),
    multi: () => api.get('/java21/scoped-value/multi'),
    compareTraditional: () => api.get('/java21/scoped-value/compare-traditional'),
  },

  // ========== 12.4 Pattern Matching ==========
  patternMatching: {
    area: (shape = 'circle', dim1 = 5, dim2) => {
      const params = { shape, dim1 };
      if (dim2 !== undefined) params.dim2 = dim2;
      return api.get('/java21/pattern-matching/area', { params });
    },
    describe: (value = 'hello') => api.get('/java21/pattern-matching/describe', { params: { value } }),
    categorize: (shape = 'circle', dim1 = 150) =>
      api.get('/java21/pattern-matching/categorize', { params: { shape, dim1 } }),
    nested: () => api.get('/java21/pattern-matching/nested'),
    apiResponse: (type = 'success') => api.get('/java21/pattern-matching/api-response', { params: { type } }),
    unnamed: (shape = 'circle', dim1 = 10) =>
      api.get('/java21/pattern-matching/unnamed', { params: { shape, dim1 } }),
    compareArea: (shape = 'circle', dim1 = 5) =>
      api.get('/java21/pattern-matching/compare-area', { params: { shape, dim1 } }),
    compareDescribe: (value = 'hello') =>
      api.get('/java21/pattern-matching/compare-describe', { params: { value } }),
    compareApiResponse: (type = 'error') =>
      api.get('/java21/pattern-matching/compare-api-response', { params: { type } }),
  },

  // ========== 12.5 Record ==========
  record: {
    dto: () => api.get('/java21/record/dto'),
    generic: () => api.get('/java21/record/generic'),
    validation: () => api.get('/java21/record/validation'),
    nested: () => api.get('/java21/record/nested'),
    streams: () => api.get('/java21/record/streams'),
    serialization: () => api.get('/java21/record/serialization'),
    implements: () => api.get('/java21/record/implements'),
    methods: () => api.get('/java21/record/methods'),
    local: () => api.get('/java21/record/local'),
    comparePojo: () => api.get('/java21/record/compare-pojo'),
  },
};

export default java21Service;
