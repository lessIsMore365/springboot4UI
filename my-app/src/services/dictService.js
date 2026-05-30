import api from './api';

export const dictService = {
  // 字典类型
  getDictTypes: (page = 1, size = 10) => api.get('/api/system/dict/type', { params: { page, size } }),
  getAllDictTypes: () => api.get('/api/system/dict/type/all'),
  getDictType: (id) => api.get(`/api/system/dict/type/${id}`),
  createDictType: (data) => api.post('/api/system/dict/type', data),
  updateDictType: (data) => api.put('/api/system/dict/type', data),
  deleteDictType: (id) => api.delete(`/api/system/dict/type/${id}`),

  // 字典数据
  getDictDatas: (page = 1, size = 10, dictType) => {
    const params = { page, size };
    if (dictType) params.dictType = dictType;
    return api.get('/api/system/dict/data', { params });
  },
  getDictDataByType: (dictType) => api.get(`/api/system/dict/data/type/${dictType}`),
  getDictData: (id) => api.get(`/api/system/dict/data/${id}`),
  createDictData: (data) => api.post('/api/system/dict/data', data),
  updateDictData: (data) => api.put('/api/system/dict/data', data),
  deleteDictData: (id) => api.delete(`/api/system/dict/data/${id}`),
  refreshCache: () => api.post('/api/system/dict/refresh-cache'),
};

export default dictService;
