import React, { useState, useEffect } from 'react';
import { roleService } from '../../services';
import './Roles.css';

const INITIAL_FORM = {
  code: '', name: '', description: ''
};

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAsync, setUseAsync] = useState(false);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Batch create
  const [batchCount, setBatchCount] = useState(5);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  // Assign roles to user
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [assignRoleUserId, setAssignRoleUserId] = useState('');
  const [assignRoleSelected, setAssignRoleSelected] = useState([]);
  const [assignRoleLoading, setAssignRoleLoading] = useState(false);
  const [assignRoleError, setAssignRoleError] = useState('');
  const [assignRoleSuccess, setAssignRoleSuccess] = useState('');

  // Assign permissions to role
  const [showAssignPermModal, setShowAssignPermModal] = useState(false);
  const [assignPermRoleId, setAssignPermRoleId] = useState('');
  const [assignPermInput, setAssignPermInput] = useState('');
  const [assignPermLoading, setAssignPermLoading] = useState(false);
  const [assignPermError, setAssignPermError] = useState('');
  const [assignPermSuccess, setAssignPermSuccess] = useState('');

  // View user roles
  const [showUserRolesModal, setShowUserRolesModal] = useState(false);
  const [userRolesUserId, setUserRolesUserId] = useState('');
  const [userRolesData, setUserRolesData] = useState(null);
  const [userRolesLoading, setUserRolesLoading] = useState(false);
  const [userRolesError, setUserRolesError] = useState('');

  // Check user role
  const [showCheckRoleModal, setShowCheckRoleModal] = useState(false);
  const [checkRoleUserId, setCheckRoleUserId] = useState('');
  const [checkRoleCode, setCheckRoleCode] = useState('');
  const [checkRoleResult, setCheckRoleResult] = useState(null);
  const [checkRoleLoading, setCheckRoleLoading] = useState(false);

  // View role permissions
  const [showRolePermModal, setShowRolePermModal] = useState(false);
  const [rolePermRoleId, setRolePermRoleId] = useState('');
  const [rolePermData, setRolePermData] = useState(null);
  const [rolePermLoading, setRolePermLoading] = useState(false);
  const [rolePermError, setRolePermError] = useState('');

  const loadRoles = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = useAsync
        ? await roleService.getRolesAsync(page, pagination.size)
        : await roleService.getRoles(page, pagination.size);
      if (result.success) {
        setRoles(result.data || []);
        setPagination(result.pagination || { page, size: pagination.size, total: 0, pages: 0 });
      } else {
        setError(result.message || '获取角色列表失败');
      }
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadRoles(); }, [useAsync]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) loadRoles(newPage);
  };

  const toggleAsyncMode = () => setUseAsync(!useAsync);

  // Create role
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

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const result = await roleService.createRole(formData);
      if (result.success) {
        setFormSuccess('角色创建成功！');
        setFormData(INITIAL_FORM);
        loadRoles(1);
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
        ? await roleService.batchCreateRolesAsync(batchCount)
        : await roleService.batchCreateRoles(batchCount);
      setBatchResult(result);
      if (result.success) loadRoles(1);
    } catch (err) {
      setBatchResult({ success: false, message: err.message });
    } finally {
      setBatchLoading(false);
    }
  };

  // Assign roles to user
  const openAssignRoleModal = () => {
    setAssignRoleUserId('');
    setAssignRoleSelected([]);
    setAssignRoleError('');
    setAssignRoleSuccess('');
    setShowAssignRoleModal(true);
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignRoleUserId.trim()) { setAssignRoleError('请输入用户ID'); return; }
    if (assignRoleSelected.length === 0) { setAssignRoleError('请选择至少一个角色'); return; }
    setAssignRoleLoading(true);
    setAssignRoleError('');
    setAssignRoleSuccess('');
    try {
      const result = await roleService.assignRolesToUser(parseInt(assignRoleUserId), assignRoleSelected);
      if (result.success) setAssignRoleSuccess('角色分配成功！');
      else setAssignRoleError(result.message || '分配失败');
    } catch (err) {
      setAssignRoleError(err.message || '请求失败');
    } finally {
      setAssignRoleLoading(false);
    }
  };

  const handleToggleRole = (roleId) => {
    setAssignRoleSelected(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  // Assign permissions to role
  const openAssignPermModal = () => {
    setAssignPermRoleId('');
    setAssignPermInput('');
    setAssignPermError('');
    setAssignPermSuccess('');
    setShowAssignPermModal(true);
  };

  const handleAssignPerm = async (e) => {
    e.preventDefault();
    if (!assignPermRoleId.trim()) { setAssignPermError('请输入角色ID'); return; }
    const ids = assignPermInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (ids.length === 0) { setAssignPermError('请输入有效的权限ID'); return; }
    setAssignPermLoading(true);
    setAssignPermError('');
    setAssignPermSuccess('');
    try {
      const result = await roleService.assignPermissionsToRole(parseInt(assignPermRoleId), ids);
      if (result.success) setAssignPermSuccess('权限分配成功！');
      else setAssignPermError(result.message || '分配失败');
    } catch (err) {
      setAssignPermError(err.message || '请求失败');
    } finally {
      setAssignPermLoading(false);
    }
  };

  // View user roles
  const openUserRolesModal = () => {
    setUserRolesUserId('');
    setUserRolesData(null);
    setUserRolesError('');
    setShowUserRolesModal(true);
  };

  const handleGetUserRoles = async () => {
    if (!userRolesUserId.trim()) { setUserRolesError('请输入用户ID'); return; }
    setUserRolesLoading(true);
    setUserRolesError('');
    setUserRolesData(null);
    try {
      const result = await roleService.getUserRoles(parseInt(userRolesUserId));
      if (result.success) setUserRolesData(result.data || []);
      else setUserRolesError(result.message || '查询失败');
    } catch (err) {
      setUserRolesError(err.message || '请求失败');
    } finally {
      setUserRolesLoading(false);
    }
  };

  // Check user role
  const openCheckRoleModal = () => {
    setCheckRoleUserId('');
    setCheckRoleCode('');
    setCheckRoleResult(null);
    setShowCheckRoleModal(true);
  };

  const handleCheckUserRole = async () => {
    if (!checkRoleUserId.trim() || !checkRoleCode.trim()) {
      setCheckRoleResult({ success: false, message: '请填写用户ID和角色编码' });
      return;
    }
    setCheckRoleLoading(true);
    setCheckRoleResult(null);
    try {
      const result = await roleService.checkUserRole(parseInt(checkRoleUserId), checkRoleCode);
      setCheckRoleResult(result);
    } catch (err) {
      setCheckRoleResult({ success: false, message: err.message });
    } finally {
      setCheckRoleLoading(false);
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
      const result = await roleService.getRolePermissions(parseInt(rolePermRoleId));
      if (result.success) setRolePermData(result.data || []);
      else setRolePermError(result.message || '查询失败');
    } catch (err) {
      setRolePermError(err.message || '请求失败');
    } finally {
      setRolePermLoading(false);
    }
  };

  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) setShowCreateModal(false);
  };

  // Stats
  const handleGetStats = async () => {
    try {
      const result = await roleService.getRoleStats();
      if (result.success) alert(`角色统计: ${result.stats?.roleCount || 'N/A'}`);
    } catch (err) { alert(`获取统计失败: ${err.message}`); }
  };

  // Health check
  const handleHealthCheck = async () => {
    try {
      const result = await roleService.healthCheck();
      if (result.success) alert(`角色健康: ${result.message}\n角色数: ${result.roleCount}`);
    } catch (err) { alert(`健康检查失败: ${err.message}`); }
  };

  // Search by code
  const handleSearchByCode = async () => {
    const code = prompt('请输入角色编码 (如 ROLE_ADMIN):');
    if (code) {
      try {
        const result = await roleService.getRoleByCode(code);
        if (result.success) {
          alert(`角色:\n编码: ${result.data?.code}\n名称: ${result.data?.name}\n描述: ${result.data?.description}`);
        } else alert(`查询失败: ${result.message}`);
      } catch (err) { alert(`查询失败: ${err.message}`); }
    }
  };

  return (
    <div className="roles-container">
      <div className="roles-header">
        <h2>角色管理</h2>
        <div className="roles-actions">
          <button className="btn btn-create" onClick={openCreateModal}>创建角色</button>
          <button className={'btn btn-toggle' + (useAsync ? ' active' : '')} onClick={toggleAsyncMode}>
            {useAsync ? '异步模式' : '同步模式'}
          </button>
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
            onChange={(e) => setBatchCount(parseInt(e.target.value) || 5)} min="1" max="1000" />
          <button className="btn btn-batch" onClick={handleBatchCreate} disabled={batchLoading}>
            {batchLoading ? '创建中...' : '批量创建角色'}
          </button>
          {batchResult && (
            <span className={'toolbar-result ' + (batchResult.success ? 'success' : 'error')}>
              {batchResult.success ? '成功创建' : '失败'}: {batchResult.message || ''}
            </span>
          )}
        </div>
        <div className="toolbar-group">
          <button className="btn btn-create" onClick={openAssignRoleModal}>分配角色</button>
          <button className="btn btn-batch" onClick={openAssignPermModal}>分配权限</button>
          <button className="btn btn-test" onClick={openUserRolesModal}>用户角色</button>
          <button className="btn btn-test" onClick={openCheckRoleModal}>检查角色</button>
          <button className="btn btn-test" onClick={openRolePermModal}>角色权限</button>
        </div>
      </div>

      <div className="roles-table-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <table className="roles-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>编码</th>
                  <th>名称</th>
                  <th>描述</th>
                  <th>创建时间</th>
                  <th>更新时间</th>
                </tr>
              </thead>
              <tbody>
                {roles.length > 0 ? (
                  roles.map(role => (
                    <tr key={role.id}>
                      <td>{role.id}</td>
                      <td><span className="role-code">{role.code}</span></td>
                      <td>{role.name}</td>
                      <td>{role.description || '-'}</td>
                      <td>{role.createTime ? new Date(role.createTime).toLocaleString() : '-'}</td>
                      <td>{role.updateTime ? new Date(role.updateTime).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="no-data">暂无角色数据</td></tr>
                )}
              </tbody>
            </table>
            {pagination.pages > 1 && (
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

      <div className="roles-info">
        <p>当前模式: <strong>{useAsync ? '异步(虚拟线程)' : '同步'}</strong></p>
        <p>默认角色: <code>ROLE_ADMIN</code>, <code>ROLE_USER</code></p>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>创建角色</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateRole}>
              {formError && <div className="alert alert-error">{formError}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>编码 *</label>
                  <input type="text" name="code" value={formData.code}
                    onChange={handleFormChange} required disabled={formLoading} placeholder="如: ROLE_MANAGER" />
                </div>
                <div className="form-group">
                  <label>名称 *</label>
                  <input type="text" name="name" value={formData.name}
                    onChange={handleFormChange} required disabled={formLoading} placeholder="如: 经理" />
                </div>
                <div className="form-group form-group-full">
                  <label>描述</label>
                  <textarea name="description" value={formData.description}
                    onChange={handleFormChange} rows="3" disabled={formLoading} placeholder="角色描述" />
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

      {/* Assign Roles to User Modal */}
      {showAssignRoleModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAssignRoleModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>为用户分配角色</h3>
              <button className="btn-close" onClick={() => setShowAssignRoleModal(false)}>&times;</button>
            </div>
            {assignRoleError && <div className="alert alert-error">{assignRoleError}</div>}
            {assignRoleSuccess && <div className="alert alert-success">{assignRoleSuccess}</div>}
            <div className="form-group">
              <label>用户ID *</label>
              <input type="number" value={assignRoleUserId}
                onChange={(e) => setAssignRoleUserId(e.target.value)}
                placeholder="输入用户ID" disabled={assignRoleLoading} min="1" />
            </div>
            <div className="form-group">
              <label>选择角色</label>
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                {roles.length === 0 && <div style={{ color: '#a0aec0', padding: '8px' }}>暂无可用角色</div>}
                {roles.map(role => (
                  <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer', borderRadius: '4px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <input type="checkbox" checked={assignRoleSelected.includes(role.id)}
                      onChange={() => handleToggleRole(role.id)} disabled={assignRoleLoading} />
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{role.name}</span>
                    <code style={{ fontSize: '12px', color: '#718096' }}>{role.code}</code>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-create" onClick={handleAssignRole} disabled={assignRoleLoading}>
                {assignRoleLoading ? '分配中...' : '确认分配'}
              </button>
              <button className="btn btn-cancel" onClick={() => setShowAssignRoleModal(false)} disabled={assignRoleLoading}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Permissions to Role Modal */}
      {showAssignPermModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAssignPermModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>为角色分配权限</h3>
              <button className="btn-close" onClick={() => setShowAssignPermModal(false)}>&times;</button>
            </div>
            {assignPermError && <div className="alert alert-error">{assignPermError}</div>}
            {assignPermSuccess && <div className="alert alert-success">{assignPermSuccess}</div>}
            <div className="form-group">
              <label>角色ID *</label>
              <input type="number" value={assignPermRoleId}
                onChange={(e) => setAssignPermRoleId(e.target.value)}
                placeholder="输入角色ID" disabled={assignPermLoading} min="1" />
            </div>
            <div className="form-group">
              <label>权限ID列表 *</label>
              <textarea value={assignPermInput}
                onChange={(e) => setAssignPermInput(e.target.value)}
                placeholder="输入权限ID，多个用逗号分隔，如: 1,2,3"
                rows="3" disabled={assignPermLoading} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-create" onClick={handleAssignPerm} disabled={assignPermLoading}>
                {assignPermLoading ? '分配中...' : '确认分配'}
              </button>
              <button className="btn btn-cancel" onClick={() => setShowAssignPermModal(false)} disabled={assignPermLoading}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* View User Roles Modal */}
      {showUserRolesModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowUserRolesModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>查看用户角色</h3>
              <button className="btn-close" onClick={() => setShowUserRolesModal(false)}>&times;</button>
            </div>
            {userRolesError && <div className="alert alert-error">{userRolesError}</div>}
            <div className="form-group">
              <label>用户ID</label>
              <input type="number" value={userRolesUserId}
                onChange={(e) => setUserRolesUserId(e.target.value)}
                placeholder="输入用户ID" disabled={userRolesLoading} min="1" />
            </div>
            <button className="btn btn-test" onClick={handleGetUserRoles} disabled={userRolesLoading}
              style={{ marginBottom: '16px', width: '100%' }}>
              {userRolesLoading ? '查询中...' : '查询'}
            </button>
            {userRolesData && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>角色列表</h4>
                {userRolesData.length === 0 ? (
                  <div style={{ color: '#a0aec0', padding: '16px', textAlign: 'center' }}>该用户暂无角色</div>
                ) : (
                  <table className="roles-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>编码</th>
                        <th>名称</th>
                        <th>描述</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRolesData.map(r => (
                        <tr key={r.id || r.roleId}>
                          <td>{r.id || r.roleId}</td>
                          <td><span className="role-code">{r.code || r.roleCode}</span></td>
                          <td>{r.name || r.roleName}</td>
                          <td>{r.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowUserRolesModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Check User Role Modal */}
      {showCheckRoleModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCheckRoleModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>检查用户角色</h3>
              <button className="btn-close" onClick={() => setShowCheckRoleModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label>用户ID</label>
              <input type="number" value={checkRoleUserId}
                onChange={(e) => setCheckRoleUserId(e.target.value)}
                placeholder="输入用户ID" disabled={checkRoleLoading} min="1" />
            </div>
            <div className="form-group">
              <label>角色编码</label>
              <input type="text" value={checkRoleCode}
                onChange={(e) => setCheckRoleCode(e.target.value)}
                placeholder="如: ROLE_ADMIN" disabled={checkRoleLoading} />
            </div>
            <button className="btn btn-test" onClick={handleCheckUserRole} disabled={checkRoleLoading}
              style={{ marginBottom: '16px', width: '100%' }}>
              {checkRoleLoading ? '检查中...' : '检查'}
            </button>
            {checkRoleResult && (
              <div className={'alert ' + (checkRoleResult.success ? 'alert-success' : 'alert-error')}>
                {checkRoleResult.success
                  ? (checkRoleResult.hasRole !== false
                    ? '用户拥有该角色'
                    : '用户没有该角色')
                  : (checkRoleResult.message || '检查失败')}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowCheckRoleModal(false)}>关闭</button>
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
                <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>权限ID列表</h4>
                {rolePermData.length === 0 ? (
                  <div style={{ color: '#a0aec0', padding: '16px', textAlign: 'center' }}>该角色暂无权限</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {rolePermData.map((pid, idx) => (
                      <span key={idx} style={{
                        padding: '4px 12px', background: '#ebf4ff', color: '#2b6cb0',
                        borderRadius: '16px', fontSize: '13px', fontWeight: 500
                      }}>{typeof pid === 'object' ? (pid.id || pid.permissionId) : pid}</span>
                    ))}
                  </div>
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

export default RoleList;
