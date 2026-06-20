import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 通用配置中心页面 - 配置 CRUD、刷新
 */
const ConfigManagement = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState('');
  const [searchKey, setSearchKey] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [formData, setFormData] = useState({ key: '', value: '', group: 'DEFAULT', description: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  // Fetch all configs
  const fetchConfigs = async (group) => {
    setLoading(true);
    try {
      let res;
      if (group) {
        res = await axios.get(`/api/config/group/${encodeURIComponent(group)}`);
      } else {
        res = await axios.get('/api/config/all');
      }
      if (res.data?.success) {
        // Convert object format to array if needed
        const data = res.data.data;
        if (Array.isArray(data)) {
          setConfigs(data);
        } else if (typeof data === 'object') {
          setConfigs(
            Object.entries(data).map(([key, value]) => ({ configKey: key, configValue: value }))
          );
        }
      }
    } catch (err) {
      console.error('获取配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConfigs();
  }, []);

  // Open create modal
  const openCreateModal = () => {
    setEditMode(false);
    setCurrentConfig(null);
    setFormData({ key: '', value: '', group: 'DEFAULT', description: '' });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (config) => {
    setEditMode(true);
    setCurrentConfig(config);
    setFormData({
      key: config.configKey || '',
      value: config.configValue || '',
      group: config.configGroup || 'DEFAULT',
      description: config.description || ''
    });
    setShowModal(true);
  };

  // Save config
  const saveConfig = async () => {
    if (!formData.key || !formData.value) {
      alert('请填写完整的配置项');
      return;
    }
    setFormLoading(true);
    try {
      const res = await axios.put('/api/config/update', formData);
      if (res.data?.success) {
        setShowModal(false);
        fetchConfigs(groupFilter || undefined);
      }
    } catch (err) {
      console.error('保存配置失败:', err);
      alert('保存配置失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // Delete config
  const deleteConfig = async (key) => {
    if (!window.confirm(`确定要删除配置项 "${key}" 吗？`)) return;
    try {
      const res = await axios.delete('/api/config/delete', { params: { key } });
      if (res.data?.success) {
        fetchConfigs(groupFilter || undefined);
      }
    } catch (err) {
      console.error('删除配置失败:', err);
      alert('删除配置失败: ' + (err.response?.data?.message || err.message));
    }
  };

  // Refresh all configs
  const refreshAll = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post('/api/config/refresh');
      if (res.data?.success) {
        setRefreshMessage(res.data.message);
        fetchConfigs(groupFilter || undefined);
      }
    } catch (err) {
      console.error('刷新配置失败:', err);
      setRefreshMessage('刷新失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setTimeout(() => setRefreshMessage(''), 3000);
      setRefreshing(false);
    }
  };

  // Filtered configs
  const filteredConfigs = configs.filter(config => {
    if (groupFilter && config.configGroup !== groupFilter) return false;
    if (searchKey && !config.configKey.toLowerCase().includes(searchKey.toLowerCase())) return false;
    return true;
  });

  // Get unique groups
  const groups = [...new Set(configs.map(c => c.configGroup || 'DEFAULT'))];

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '24px', color: '#111827' }}>⚙️ 通用配置中心</h2>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="搜索配置键..."
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          style={{ padding: '8px 12px', width: '200px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        />
        <select
          value={groupFilter}
          onChange={(e) => { setGroupFilter(e.target.value); fetchConfigs(e.target.value || undefined); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        >
          <option value="">全部分组</option>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button onClick={() => fetchConfigs(groupFilter || undefined)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
          加载
        </button>
        <button onClick={openCreateModal} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer' }}>
          + 新增配置
        </button>
        <button onClick={refreshAll} disabled={refreshing} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: refreshing ? '#9ca3af' : '#f59e0b', color: 'white', cursor: refreshing ? 'not-allowed' : 'pointer' }}>
          {refreshing ? '刷新中...' : '🔄 全量刷新'}
        </button>
      </div>

      {/* Refresh message */}
      {refreshMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          background: refreshMessage.includes('失败') ? '#fef2f2' : '#d1fae5',
          color: refreshMessage.includes('失败') ? '#991b1b' : '#065f46',
          border: `1px solid ${refreshMessage.includes('失败') ? '#fecaca' : '#a7f3d0'}`
        }}>
          {refreshMessage}
        </div>
      )}

      {/* Config list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>加载中...</div>
      ) : filteredConfigs.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>配置键</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>配置值</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>分组</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>描述</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredConfigs.map((config, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '500' }}>{config.configKey}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {config.configValue}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontSize: '12px' }}>
                      {config.configGroup || 'DEFAULT'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{config.description}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => openEditModal(config)} style={{ padding: '4px 12px', marginRight: '8px', borderRadius: '4px', border: '1px solid #3b82f6', background: 'white', color: '#3b82f6', cursor: 'pointer' }}>
                      编辑
                    </button>
                    <button onClick={() => deleteConfig(config.configKey)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer' }}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无配置数据</div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '500px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', color: '#111827' }}>
              {editMode ? '✏️ 编辑配置' : '➕ 新增配置'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>配置键 *</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="如 system.theme"
                  disabled={editMode}
                  style={{ padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>配置值 *</label>
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="配置值内容"
                  rows={3}
                  style={{ padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>分组</label>
                <input
                  type="text"
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  placeholder="如 DEFAULT"
                  style={{ padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>描述</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="配置说明"
                  style={{ padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={saveConfig} disabled={formLoading} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: formLoading ? '#9ca3af' : '#3b82f6', color: 'white', cursor: formLoading ? 'not-allowed' : 'pointer' }}>
                {formLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigManagement;
