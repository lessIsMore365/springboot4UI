import React, { useState, useEffect } from 'react';
import { permissionService } from '../../services';
import './Permissions.css';

const INITIAL_FORM = {
  code: '', name: '', type: 'API', description: '', url: '', method: 'GET'
};

const PERMISSION_TYPES = [
  { value: 'ALL', label: '全部' },
  { value: 'API', label: 'API' },
  { value: 'MENU', label: '菜单' },
  { value: 'BUTTON', label: '按钮' },
  { value: 'DATA', label: '数据' },
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', ''];

const typeBadgeClass = (type) => 'type-badge type-' + (type || '').toLowerCase();

const Modal = ({ title, children, onClose, maxWidth }) => (
  <div className="pm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="pm-modal" style={maxWidth ? { maxWidth } : {}}>
      <div className="pm-modal-header">
        <h3>{title}</h3>
        <button className="pm-modal-close" onClick={onClose}>&times;</button>
      </div>
      {children}
    </div>
  </div>
);

const PermissionList = () => {
  const [permissions, setPermissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAsync, setUseAsync] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Batch create
  const [batchCount, setBatchCount] = useState(10);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  // Check tools
  const [checkUrlForm, setCheckUrlForm] = useState({ userId: '', url: '', method: 'GET' });
  const [checkUrlResult, setCheckUrlResult] = useState(null);
  const [checkUrlLoading, setCheckUrlLoading] = useState(false);

  const [userPermId, setUserPermId] = useState('');
  const [userPermData, setUserPermData] = useState(null);
  const [userPermLoading, setUserPermLoading] = useState(false);

  const [rolePermId, setRolePermId] = useState('');
  const [rolePermData, setRolePermData] = useState(null);
  const [rolePermLoading, setRolePermLoading] = useState(false);

  const [codeSearch, setCodeSearch] = useState('');
  const [codeSearchResult, setCodeSearchResult] = useState(null);

  const loadPermissions = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      let result;
      if (filterType !== 'ALL') {
        result = await permissionService.getPermissionsByType(filterType);
        if (result.success) {
          setPermissions(result.data || []);
          setPagination({ page: 1, size: pagination.size, total: result.data?.length || 0, pages: 1 });
        }
      } else {
        result = useAsync
          ? await permissionService.getPermissionsAsync(page, pagination.size)
          : await permissionService.getPermissions(page, pagination.size);
        if (result.success) {
          setPermissions(result.data || []);
          setPagination(result.pagination || { page, size: pagination.size, total: 0, pages: 0 });
        }
      }
      if (!result.success) setError(result.message || '获取权限列表失败');
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await permissionService.getPermissionStats();
      if (result.success) setStats(result);
    } catch { /* silent */ }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPermissions(); loadStats(); }, [useAsync, filterType]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.pages) loadPermissions(page);
  };

  // Create
  const openCreate = () => {
    setFormData(INITIAL_FORM);
    setFormError('');
    setFormSuccess('');
    setShowCreate(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const result = await permissionService.createPermission(formData);
      if (result.success) {
        setFormSuccess('权限创建成功');
        setFormData(INITIAL_FORM);
        loadPermissions(1);
        loadStats();
        setTimeout(() => setShowCreate(false), 800);
      } else {
        setFormError(result.message || '创建失败');
      }
    } catch (err) {
      setFormError(err.message || '请求失败');
    } finally {
      setFormLoading(false);
    }
  };

  // Batch
  const handleBatch = async () => {
    setBatchLoading(true);
    setBatchResult(null);
    try {
      const result = useAsync
        ? await permissionService.batchCreatePermissionsAsync(batchCount)
        : await permissionService.batchCreatePermissions(batchCount);
      setBatchResult(result);
      if (result.success) { loadPermissions(1); loadStats(); }
    } catch (err) {
      setBatchResult({ success: false, message: err.message });
    } finally {
      setBatchLoading(false);
    }
  };

  // Check URL
  const handleCheckUrl = async () => {
    if (!checkUrlForm.userId.trim() || !checkUrlForm.url.trim()) {
      setCheckUrlResult({ success: false, message: '请填写用户ID和URL' });
      return;
    }
    setCheckUrlLoading(true);
    setCheckUrlResult(null);
    try {
      const result = await permissionService.checkUserPermissionForUrl(
        parseInt(checkUrlForm.userId), checkUrlForm.url, checkUrlForm.method
      );
      setCheckUrlResult(result);
    } catch (err) {
      setCheckUrlResult({ success: false, message: err.message });
    } finally {
      setCheckUrlLoading(false);
    }
  };

  // User permissions
  const handleUserPerms = async () => {
    if (!userPermId.trim()) return;
    setUserPermLoading(true);
    setUserPermData(null);
    try {
      const result = await permissionService.getPermissionsByUser(parseInt(userPermId));
      if (result.success) setUserPermData(result.data || []);
    } catch (err) {
      setUserPermData([]);
    } finally {
      setUserPermLoading(false);
    }
  };

  // Role permissions
  const handleRolePerms = async () => {
    if (!rolePermId.trim()) return;
    setRolePermLoading(true);
    setRolePermData(null);
    try {
      const result = await permissionService.getPermissionsByRole(parseInt(rolePermId));
      if (result.success) setRolePermData(result.data || []);
    } catch (err) {
      setRolePermData([]);
    } finally {
      setRolePermLoading(false);
    }
  };

  // Search by code
  const handleCodeSearch = async () => {
    if (!codeSearch.trim()) return;
    try {
      const result = await permissionService.getPermissionByCode(codeSearch.trim());
      setCodeSearchResult(result);
    } catch (err) {
      setCodeSearchResult({ success: false, message: err.message });
    }
  };

  const statCount = stats?.stats?.permissionCount ?? stats?.permissionCount ?? permissions.length;

  return (
    <div className="pm-page">
      {/* Page header */}
      <div className="pm-page-header">
        <div className="pm-page-title">
          <h2>权限管理</h2>
          <span className="pm-page-sub">管理 API、菜单、按钮及数据权限</span>
        </div>
        <div className="pm-page-actions">
          <span className={`pm-mode-badge ${useAsync ? 'async' : ''}`}
            onClick={() => setUseAsync(!useAsync)}>
            {useAsync ? '⚡ 异步模式' : '同步模式'}
          </span>
          <button className="pm-btn pm-btn-primary" onClick={openCreate}>+ 创建权限</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="pm-stats-row">
        <div className="pm-stat-card">
          <span className="pm-stat-num">{statCount}</span>
          <span className="pm-stat-label">权限总数</span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-num">{permissions.filter(p => p.type === 'API').length || '-'}</span>
          <span className="pm-stat-label">API 权限</span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-num">{permissions.filter(p => p.type === 'MENU').length || '-'}</span>
          <span className="pm-stat-label">菜单权限</span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-num">{permissions.filter(p => p.type === 'BUTTON').length || '-'}</span>
          <span className="pm-stat-label">按钮权限</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="pm-tabs">
        <button className={`pm-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}>权限列表</button>
        <button className={`pm-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}>权限检查工具</button>
      </div>

      {error && <div className="pm-alert pm-alert-error">{error}</div>}

      {/* Tab: Permission List */}
      {activeTab === 'list' && (
        <div className="pm-card">
          {/* Toolbar */}
          <div className="pm-toolbar">
            <div className="pm-toolbar-left">
              <div className="pm-type-filters">
                {PERMISSION_TYPES.map(t => (
                  <button key={t.value}
                    className={`pm-filter-chip ${filterType === t.value ? 'active' : ''}`}
                    onClick={() => setFilterType(t.value)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="pm-code-search">
                <input
                  type="text"
                  placeholder="按编码搜索..."
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCodeSearch()}
                />
                <button className="pm-btn pm-btn-sm" onClick={handleCodeSearch}>搜索</button>
              </div>
            </div>
            <div className="pm-toolbar-right">
              <div className="pm-batch-group">
                <input type="number" className="pm-batch-input" value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value) || 10)}
                  min="1" max="1000" />
                <button className="pm-btn pm-btn-outline" onClick={handleBatch} disabled={batchLoading}>
                  {batchLoading ? '创建中...' : '批量创建'}
                </button>
              </div>
            </div>
          </div>

          {codeSearchResult && (
            <div className={`pm-search-result ${codeSearchResult.success ? 'success' : 'error'}`}>
              {codeSearchResult.success && codeSearchResult.data ? (
                <span>
                  找到权限: <code>{codeSearchResult.data.code}</code> — {codeSearchResult.data.name}
                  <span className={typeBadgeClass(codeSearchResult.data.type)}>{codeSearchResult.data.type}</span>
                </span>
              ) : (
                <span>{codeSearchResult.message || '未找到'}</span>
              )}
              <button className="pm-search-close" onClick={() => { setCodeSearchResult(null); setCodeSearch(''); }}>&times;</button>
            </div>
          )}

          {batchResult && (
            <div className={`pm-search-result ${batchResult.success ? 'success' : 'error'}`}>
              <span>{batchResult.success ? '批量创建成功' : '批量创建失败'}: {batchResult.message || ''}</span>
              <button className="pm-search-close" onClick={() => setBatchResult(null)}>&times;</button>
            </div>
          )}

          {/* Table */}
          <div className="pm-table-wrap">
            {loading ? (
              <div className="pm-loading">加载中...</div>
            ) : permissions.length === 0 ? (
              <div className="pm-empty">暂无权限数据</div>
            ) : (
              <table className="pm-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>ID</th>
                    <th style={{ width: 170 }}>编码</th>
                    <th style={{ width: 140 }}>名称</th>
                    <th style={{ width: 90 }}>类型</th>
                    <th>描述</th>
                    <th style={{ width: 180 }}>URL</th>
                    <th style={{ width: 80 }}>方法</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map(p => (
                    <tr key={p.id}>
                      <td className="pm-td-id">{p.id}</td>
                      <td><code className="pm-code">{p.code}</code></td>
                      <td className="pm-td-name">{p.name}</td>
                      <td><span className={typeBadgeClass(p.type)}>{p.type}</span></td>
                      <td className="pm-td-desc">{p.description || '-'}</td>
                      <td className="pm-td-url">{p.url || '-'}</td>
                      <td>{p.method ? <span className="pm-method">{p.method}</span> : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filterType === 'ALL' && pagination.pages > 1 && (
            <div className="pm-pagination">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
                上一页
              </button>
              <span className="pm-page-info">
                {pagination.page} / {pagination.pages} 页 (共 {pagination.total} 条)
              </span>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Check Tools */}
      {activeTab === 'tools' && (
        <div className="pm-tools-grid">
          {/* Check URL Permission */}
          <div className="pm-card pm-tool-card">
            <h4>检查 URL 权限</h4>
            <p className="pm-tool-desc">验证用户是否拥有访问指定 URL 的权限</p>
            <div className="pm-tool-form">
              <input type="number" placeholder="用户 ID"
                value={checkUrlForm.userId}
                onChange={(e) => setCheckUrlForm(prev => ({ ...prev, userId: e.target.value }))} />
              <input type="text" placeholder="URL 路径，如 /api/users"
                value={checkUrlForm.url}
                onChange={(e) => setCheckUrlForm(prev => ({ ...prev, url: e.target.value }))} />
              <select value={checkUrlForm.method}
                onChange={(e) => setCheckUrlForm(prev => ({ ...prev, method: e.target.value }))}>
                {HTTP_METHODS.filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="pm-btn pm-btn-primary" onClick={handleCheckUrl} disabled={checkUrlLoading}>
                {checkUrlLoading ? '检查中...' : '检查'}
              </button>
            </div>
            {checkUrlResult && (
              <div className={`pm-tool-result ${checkUrlResult.success && checkUrlResult.hasPermission !== false ? 'success' : 'denied'}`}>
                {checkUrlResult.success && checkUrlResult.hasPermission !== false
                  ? '该用户拥有此 URL 权限'
                  : checkUrlResult.message || '该用户没有此 URL 权限'}
              </div>
            )}
          </div>

          {/* View User Permissions */}
          <div className="pm-card pm-tool-card">
            <h4>查看用户权限</h4>
            <p className="pm-tool-desc">获取指定用户的所有权限列表</p>
            <div className="pm-tool-form">
              <input type="number" placeholder="用户 ID"
                value={userPermId}
                onChange={(e) => setUserPermId(e.target.value)} />
              <button className="pm-btn pm-btn-primary" onClick={handleUserPerms} disabled={userPermLoading}>
                {userPermLoading ? '查询中...' : '查询'}
              </button>
            </div>
            {userPermData && (
              <div className="pm-tool-result-list">
                {userPermData.length === 0 ? (
                  <span className="pm-text-muted">该用户暂无权限</span>
                ) : (
                  <div className="pm-mini-list">
                    {userPermData.map(p => (
                      <span key={p.id || p.permissionId} className="pm-mini-item">
                        <code>{p.code || p.permissionCode}</code>
                        <span className="pm-text-muted">{p.name || p.permissionName}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Role Permissions */}
          <div className="pm-card pm-tool-card">
            <h4>查看角色权限</h4>
            <p className="pm-tool-desc">获取指定角色的所有权限列表</p>
            <div className="pm-tool-form">
              <input type="number" placeholder="角色 ID"
                value={rolePermId}
                onChange={(e) => setRolePermId(e.target.value)} />
              <button className="pm-btn pm-btn-primary" onClick={handleRolePerms} disabled={rolePermLoading}>
                {rolePermLoading ? '查询中...' : '查询'}
              </button>
            </div>
            {rolePermData && (
              <div className="pm-tool-result-list">
                {rolePermData.length === 0 ? (
                  <span className="pm-text-muted">该角色暂无权限</span>
                ) : (
                  <div className="pm-mini-list">
                    {rolePermData.map(p => (
                      <span key={p.id || p.permissionId} className="pm-mini-item">
                        <code>{p.code || p.permissionCode}</code>
                        <span className="pm-text-muted">{p.name || p.permissionName}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="创建权限" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            {formError && <div className="pm-alert pm-alert-error">{formError}</div>}
            {formSuccess && <div className="pm-alert pm-alert-success">{formSuccess}</div>}
            <div className="pm-form-grid">
              <div className="pm-form-group">
                <label>编码 *</label>
                <input type="text" name="code" value={formData.code}
                  onChange={handleFormChange} required disabled={formLoading}
                  placeholder="如: user:create" />
              </div>
              <div className="pm-form-group">
                <label>名称 *</label>
                <input type="text" name="name" value={formData.name}
                  onChange={handleFormChange} required disabled={formLoading}
                  placeholder="如: 创建用户" />
              </div>
              <div className="pm-form-group">
                <label>类型 *</label>
                <select name="type" value={formData.type}
                  onChange={handleFormChange} required disabled={formLoading}>
                  <option value="API">API 权限</option>
                  <option value="MENU">菜单权限</option>
                  <option value="BUTTON">按钮权限</option>
                  <option value="DATA">数据权限</option>
                </select>
              </div>
              <div className="pm-form-group">
                <label>HTTP 方法</label>
                <select name="method" value={formData.method}
                  onChange={handleFormChange} disabled={formLoading}>
                  {HTTP_METHODS.map(m => <option key={m} value={m}>{m || '不限'}</option>)}
                </select>
              </div>
              <div className="pm-form-group pm-form-full">
                <label>URL 路径</label>
                <input type="text" name="url" value={formData.url}
                  onChange={handleFormChange} disabled={formLoading}
                  placeholder="如: /api/users/**" />
              </div>
              <div className="pm-form-group pm-form-full">
                <label>描述</label>
                <textarea name="description" value={formData.description}
                  onChange={handleFormChange} rows="2" disabled={formLoading}
                  placeholder="权限用途说明" />
              </div>
            </div>
            <div className="pm-modal-actions">
              <button type="submit" className="pm-btn pm-btn-primary" disabled={formLoading}>
                {formLoading ? '创建中...' : '确认创建'}
              </button>
              <button type="button" className="pm-btn pm-btn-ghost" onClick={() => setShowCreate(false)}
                disabled={formLoading}>取消</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PermissionList;
