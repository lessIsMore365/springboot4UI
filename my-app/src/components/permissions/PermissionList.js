import React, { useState, useEffect } from 'react';
import { permissionService } from '../../services';
import './Permissions.css';

const INITIAL_FORM = {
  code: '', name: '', type: 'API', description: '', url: '', method: 'GET'
};

const PermissionList = () => {
  const [permissions, setPermissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAsync, setUseAsync] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const permissionTypes = [
    { value: 'ALL', label: '所有类型' },
    { value: 'API', label: 'API权限' },
    { value: 'MENU', label: '菜单权限' },
    { value: 'BUTTON', label: '按钮权限' },
    { value: 'DATA', label: '数据权限' }
  ];

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Batch create
  const [batchCount, setBatchCount] = useState(10);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  // Check URL permission
  const [showCheckUrlModal, setShowCheckUrlModal] = useState(false);
  const [checkUrlUserId, setCheckUrlUserId] = useState('');
  const [checkUrlUrl, setCheckUrlUrl] = useState('');
  const [checkUrlMethod, setCheckUrlMethod] = useState('GET');
  const [checkUrlResult, setCheckUrlResult] = useState(null);
  const [checkUrlLoading, setCheckUrlLoading] = useState(false);

  // View user permissions
  const [showUserPermModal, setShowUserPermModal] = useState(false);
  const [userPermUserId, setUserPermUserId] = useState('');
  const [userPermData, setUserPermData] = useState(null);
  const [userPermLoading, setUserPermLoading] = useState(false);
  const [userPermError, setUserPermError] = useState('');

  // View role permissions
  const [showRolePermModal, setShowRolePermModal] = useState(false);
  const [rolePermRoleId, setRolePermRoleId] = useState('');
  const [rolePermData, setRolePermData] = useState(null);
  const [rolePermLoading, setRolePermLoading] = useState(false);
  const [rolePermError, setRolePermError] = useState('');

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPermissions(); }, [useAsync, filterType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) loadPermissions(newPage);
  };

  const toggleAsyncMode = () => setUseAsync(!useAsync);

  const handleTypeFilter = (type) => { setFilterType(type); };

  // Create permission
  const openCreateModal = () => {
    setFormData(INITIAL_FORM);
    setFormError('');
    setFormSuccess('');
    setShowCreateModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const result = await permissionService.createPermission(formData);
      if (result.success) {
        setFormSuccess('权限创建成功！');
        setFormData(INITIAL_FORM);
        loadPermissions(1);
        setTimeout(() => setShowCreateModal(false), 1000);
      } else {
        setFormError(result.message || '创建失败');
      }
    } catch (err) {
      setFormError(err.message || '请求失败');
    } finally {
      setFormLoading(false);
    }
  };

  // Batch create
  const handleBatchCreate = async () => {
    setBatchLoading(true);
    setBatchResult(null);
    try {
      const result = useAsync
        ? await permissionService.batchCreatePermissionsAsync(batchCount)
        : await permissionService.batchCreatePermissions(batchCount);
      setBatchResult(result);
      if (result.success) loadPermissions(1);
    } catch (err) {
      setBatchResult({ success: false, message: err.message });
    } finally {
      setBatchLoading(false);
    }
  };
  // Check URL permission
  const openCheckUrlModal = () => {
    setCheckUrlUserId('');
    setCheckUrlUrl('');
    setCheckUrlMethod('GET');
    setCheckUrlResult(null);
    setShowCheckUrlModal(true);
  };

  const handleCheckUrl = async () => {
    if (!checkUrlUserId.trim() || !checkUrlUrl.trim()) {
      setCheckUrlResult({ success: false, message: '请填写用户ID和URL' });
      return;
    }
    setCheckUrlLoading(true);
    setCheckUrlResult(null);
    try {
      const result = await permissionService.checkUserPermissionForUrl(
        parseInt(checkUrlUserId), checkUrlUrl, checkUrlMethod
      );
      setCheckUrlResult(result);
    } catch (err) {
      setCheckUrlResult({ success: false, message: err.message });
    } finally {
      setCheckUrlLoading(false);
    }
  };

  // View user permissions
  const openUserPermModal = () => {
    setUserPermUserId('');
    setUserPermData(null);
    setUserPermError('');
    setShowUserPermModal(true);
  };

  const handleGetUserPerms = async () => {
    if (!userPermUserId.trim()) { setUserPermError('请输入用户ID'); return; }
    setUserPermLoading(true);
    setUserPermError('');
    setUserPermData(null);
    try {
      const result = await permissionService.getPermissionsByUser(parseInt(userPermUserId));
      if (result.success) setUserPermData(result.data || []);
      else setUserPermError(result.message || '查询失败');
    } catch (err) {
      setUserPermError(err.message || '请求失败');
    } finally {
      setUserPermLoading(false);
    }
  };

  // View role permissions
  const openRolePermModal = () => {
    setRolePermRoleId('');
    setRolePermData(null);
    setRolePermError('');
    setShowRolePermModal(true);
  };

  const handleGetRolePerms = async () => {
    if (!rolePermRoleId.trim()) { setRolePermError('请输入角色ID'); return; }
    setRolePermLoading(true);
    setRolePermError('');
    setRolePermData(null);
    try {
      const result = await permissionService.getPermissionsByRole(parseInt(rolePermRoleId));
      if (result.success) setRolePermData(result.data || []);
      else setRolePermError(result.message || '查询失败');
    } catch (err) {
      setRolePermError(err.message || '请求失败');
    } finally {
      setRolePermLoading(false);
    }
  };
  // Stats
  const handleGetStats = async () => {
    try {
      const result = await permissionService.getPermissionStats();
      if (result.success) alert(`权限统计: ${result.stats?.permissionCount || 'N/A'}`);
    } catch (err) { alert(`获取统计失败: ${err.message}`); }
  };

  // Health check
  const handleHealthCheck = async () => {
    try {
      const result = await permissionService.healthCheck();
      if (result.success) alert(`权限服务健康: ${result.message}\n权限数: ${result.permissionCount}`);
    } catch (err) { alert(`健康检查失败: ${err.message}`); }
  };

  // Search by code
  const handleSearchByCode = async () => {
    const code = prompt('请输入权限编码:');
    if (code) {
      try {
        const result = await permissionService.getPermissionByCode(code);
        if (result.success) {
          const p = result.data;
          alert(`权限:\n编码: ${p?.code}\n名称: ${p?.name}\n类型: ${p?.type}\n描述: ${p?.description || '无'}`);
        } else alert(`查询失败: ${result.message}`);
      } catch (err) { alert(`查询失败: ${err.message}`); }
    }
  };

  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) setShowCreateModal(false);
  };

  return (
    <div className="permissions-container">
      <div className="permissions-header">
        <h2>权限管理</h2>
        <div className="permissions-actions">
          <button className="btn btn-create" onClick={openCreateModal}>创建权限</button>
          <button className={'btn btn-toggle' + (useAsync ? ' active' : '')} onClick={toggleAsyncMode}>
            {useAsync ? '异步模式' : '同步模式'}
          </button>
          <div className="type-filter">
            {permissionTypes.map(type => (
              <button key={type.value}
                className={'btn-type' + (filterType === type.value ? ' active' : '')}
                onClick={() => handleTypeFilter(type.value)}>
                {type.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={handleSearchByCode}>按编码查询</button>
          <button className="btn btn-secondary" onClick={handleGetStats}>获取统计</button>
          <button className="btn btn-health" onClick={handleHealthCheck}>健康检查</button>
        </div>
      </div>

      {error && <div className="alert alert-error"><strong>错误:</strong> {error}</div>}

      <div className="admin-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">批量创建:</span>
          <input type="number" className="toolbar-input" value={batchCount}
            onChange={(e) => setBatchCount(parseInt(e.target.value) || 10)} min="1" max="1000" />
          <button className="btn btn-batch" onClick={handleBatchCreate} disabled={batchLoading}>
            {batchLoading ? '创建中...' : '批量创建权限'}
          </button>
          {batchResult && (
            <span className={'toolbar-result ' + (batchResult.success ? 'success' : 'error')}>
              {batchResult.success ? '成功创建' : '失败'}: {batchResult.message || ''}
            </span>
          )}
        </div>
        <div className="toolbar-group">
          <button className="btn btn-test" onClick={openCheckUrlModal}>检查URL权限</button>
          <button className="btn btn-test" onClick={openUserPermModal}>用户权限</button>
          <button className="btn btn-test" onClick={openRolePermModal}>角色权限</button>
        </div>
      </div>
      <div className="permissions-table-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>编码</th>
                  <th>名称</th>
                  <th>类型</th>
                  <th>描述</th>
                  <th>URL</th>
                  <th>方法</th>
                </tr>
              </thead>
              <tbody>
                {permissions.length > 0 ? (
                  permissions.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td><span className="permission-code">{p.code}</span></td>
                      <td>{p.name}</td>
                      <td><span className={'permission-type type-' + (p.type || '').toLowerCase()}>{p.type}</span></td>
                      <td>{p.description || '-'}</td>
                      <td>{p.url || '-'}</td>
                      <td>{p.method || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="no-data">暂无权限数据</td></tr>
                )}
              </tbody>
            </table>
            {filterType === 'ALL' && pagination.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}>上一页</button>
                <span className="page-info">第 {pagination.page} / {pagination.pages} 页 ({pagination.total} 条)</span>
                <button className="page-btn" onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}>下一页</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="permissions-info">
        <p>当前模式: <strong>{useAsync ? '异步(虚拟线程)' : '同步'}</strong></p>
        <p>过滤类型: <strong>{permissionTypes.find(t => t.value === filterType)?.label}</strong></p>
      </div>
      {/* Create Permission Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>创建权限</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreatePermission}>
              {formError && <div className="alert alert-error">{formError}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>编码 *</label>
                  <input type="text" name="code" value={formData.code}
                    onChange={handleFormChange} required disabled={formLoading}
                    placeholder="如: user:create" />
                </div>
                <div className="form-group">
                  <label>名称 *</label>
                  <input type="text" name="name" value={formData.name}
                    onChange={handleFormChange} required disabled={formLoading}
                    placeholder="如: 创建用户" />
                </div>
                <div className="form-group">
                  <label>类型 *</label>
                  <select name="type" value={formData.type}
                    onChange={handleFormChange} required disabled={formLoading}>
                    <option value="API">API权限</option>
                    <option value="MENU">菜单权限</option>
                    <option value="BUTTON">按钮权限</option>
                    <option value="DATA">数据权限</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>HTTP方法</label>
                  <select name="method" value={formData.method}
                    onChange={handleFormChange} disabled={formLoading}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="">不限</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label>URL路径</label>
                  <input type="text" name="url" value={formData.url}
                    onChange={handleFormChange} disabled={formLoading}
                    placeholder="如: /api/users/**" />
                </div>
                <div className="form-group form-group-full">
                  <label>描述</label>
                  <textarea name="description" value={formData.description}
                    onChange={handleFormChange} rows="2" disabled={formLoading}
                    placeholder="权限描述" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-create" disabled={formLoading}>
                  {formLoading ? '创建中...' : '创建'}
                </button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Check URL Permission Modal */}
      {showCheckUrlModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCheckUrlModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>检查URL权限</h3>
              <button className="btn-close" onClick={() => setShowCheckUrlModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label>用户ID *</label>
              <input type="number" value={checkUrlUserId}
                onChange={(e) => setCheckUrlUserId(e.target.value)}
                placeholder="输入用户ID" disabled={checkUrlLoading} min="1" />
            </div>
            <div className="form-group">
              <label>URL *</label>
              <input type="text" value={checkUrlUrl}
                onChange={(e) => setCheckUrlUrl(e.target.value)}
                placeholder="如: /api/users" disabled={checkUrlLoading} />
            </div>
            <div className="form-group">
              <label>HTTP方法</label>
              <select value={checkUrlMethod}
                onChange={(e) => setCheckUrlMethod(e.target.value)} disabled={checkUrlLoading}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <button className="btn btn-test" onClick={handleCheckUrl} disabled={checkUrlLoading}
              style={{ marginBottom: '16px', width: '100%' }}>
              {checkUrlLoading ? '检查中...' : '检查权限'}
            </button>
            {checkUrlResult && (
              <div className={'alert ' + (checkUrlResult.success ? 'alert-success' : 'alert-error')}>
                {checkUrlResult.hasPermission !== false
                  ? '用户拥有该URL权限'
                  : '用户没有该URL权限'}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowCheckUrlModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
      {/* View User Permissions Modal */}
      {showUserPermModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowUserPermModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>查看用户权限</h3>
              <button className="btn-close" onClick={() => setShowUserPermModal(false)}>&times;</button>
            </div>
            {userPermError && <div className="alert alert-error">{userPermError}</div>}
            <div className="form-group">
              <label>用户ID</label>
              <input type="number" value={userPermUserId}
                onChange={(e) => setUserPermUserId(e.target.value)}
                placeholder="输入用户ID" disabled={userPermLoading} min="1" />
            </div>
            <button className="btn btn-test" onClick={handleGetUserPerms} disabled={userPermLoading}
              style={{ marginBottom: '16px', width: '100%' }}>
              {userPermLoading ? '查询中...' : '查询'}
            </button>
            {userPermData && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>权限列表</h4>
                {userPermData.length === 0 ? (
                  <div style={{ color: '#a0aec0', padding: '16px', textAlign: 'center' }}>该用户暂无权限</div>
                ) : (
                  <table className="permissions-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>编码</th>
                        <th>名称</th>
                        <th>类型</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPermData.map(p => (
                        <tr key={p.id || p.permissionId}>
                          <td>{p.id || p.permissionId}</td>
                          <td><span className="permission-code">{p.code || p.permissionCode}</span></td>
                          <td>{p.name || p.permissionName}</td>
                          <td><span className={'permission-type type-' + ((p.type || '').toLowerCase())}>{p.type || ''}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowUserPermModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* View Role Permissions Modal */}
      {showRolePermModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRolePermModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>查看角色权限</h3>
              <button className="btn-close" onClick={() => setShowRolePermModal(false)}>&times;</button>
            </div>
            {rolePermError && <div className="alert alert-error">{rolePermError}</div>}
            <div className="form-group">
              <label>角色ID</label>
              <input type="number" value={rolePermRoleId}
                onChange={(e) => setRolePermRoleId(e.target.value)}
                placeholder="输入角色ID" disabled={rolePermLoading} min="1" />
            </div>
            <button className="btn btn-test" onClick={handleGetRolePerms} disabled={rolePermLoading}
              style={{ marginBottom: '16px', width: '100%' }}>
              {rolePermLoading ? '查询中...' : '查询'}
            </button>
            {rolePermData && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>权限列表</h4>
                {rolePermData.length === 0 ? (
                  <div style={{ color: '#a0aec0', padding: '16px', textAlign: 'center' }}>该角色暂无权限</div>
                ) : (
                  <table className="permissions-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>编码</th>
                        <th>名称</th>
                        <th>类型</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolePermData.map(p => (
                        <tr key={p.id || p.permissionId}>
                          <td>{p.id || p.permissionId}</td>
                          <td><span className="permission-code">{p.code || p.permissionCode}</span></td>
                          <td>{p.name || p.permissionName}</td>
                          <td><span className={'permission-type type-' + ((p.type || '').toLowerCase())}>{p.type || ''}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowRolePermModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionList;
