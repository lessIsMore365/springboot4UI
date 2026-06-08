import React, { useState, useEffect } from 'react';
import { userService, deptService } from '../../services';
import './Users.css';

const INITIAL_FORM = {
  username: '', password: '', email: '', age: '', deptId: '', roles: 'ROLE_USER', remark: ''
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAsync, setUseAsync] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(INITIAL_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Batch create state
  const [batchCount, setBatchCount] = useState(10);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  // Performance/Concurrent test state
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [concurrentCount, setConcurrentCount] = useState(5);
  const [concurrentResult, setConcurrentResult] = useState(null);
  const [concurrentLoading, setConcurrentLoading] = useState(false);

  const loadUsers = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = useAsync
        ? await userService.getUsersAsync(page, pagination.size)
        : await userService.getUsers(page, pagination.size);
      if (result.success) {
        setUsers(result.data || []);
        setPagination(result.pagination || { page, size: pagination.size, total: 0, pages: 0 });
      } else {
        setError(result.message || '获取用户列表失败');
      }
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUsers(); }, [useAsync]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) loadUsers(newPage);
  };

  const toggleAsyncMode = () => setUseAsync(!useAsync);

  // Department tree for dropdown
  const [depts, setDepts] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(false);

  const flattenDepts = (nodes, level = 0) => {
    const result = [];
    nodes.forEach(n => {
      result.push({ ...n, _level: level });
      if (n.children?.length) result.push(...flattenDepts(n.children, level + 1));
    });
    return result;
  };

  const loadDepts = async () => {
    setDeptsLoading(true);
    try {
      const r = await deptService.getTree();
      if (r.success !== false) setDepts(r.data || []);
    } catch (e) { /* ignore */ }
    finally { setDeptsLoading(false); }
  };

  // Create user handlers
  const openCreateModal = () => {
    setFormData(INITIAL_FORM);
    setFormError('');
    setFormSuccess('');
    setShowCreateModal(true);
    if (depts.length === 0) loadDepts();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Department name resolver
  const getDeptName = (deptId) => {
    if (!deptId || !depts.length) return '-';
    const flat = flattenDepts(depts);
    const found = flat.find(d => String(d.id) === String(deptId));
    return found ? found.name : '-';
  };

  // Open edit modal
  const openEditModal = (user) => {
    setEditId(user.id);
    setEditData({
      username: user.username || '',
      password: '',
      email: user.email || '',
      age: user.age || '',
      deptId: user.deptId || '',
      roles: user.roles || 'ROLE_USER',
      remark: user.remark || '',
    });
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
    if (depts.length === 0) loadDepts();
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const payload = {
        id: editId,
        ...editData,
        age: editData.age ? parseInt(editData.age) : undefined,
        deptId: editData.deptId ? parseInt(editData.deptId) : undefined,
      };
      if (!payload.password) delete payload.password;
      const result = await userService.updateUser(payload);
      if (result.success) {
        setEditSuccess('用户更新成功！');
        loadUsers(pagination.page);
        setTimeout(() => setShowEditModal(false), 1000);
      } else {
        setEditError(result.message || '更新失败');
      }
    } catch (err) {
      setEditError(err.message || '请求失败');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const result = await userService.deleteUser(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
        loadUsers(pagination.page);
      } else {
        setDeleteError(result.message || '删除失败');
      }
    } catch (err) {
      setDeleteError(err.message || '请求失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const result = await userService.createUser({
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        deptId: formData.deptId ? parseInt(formData.deptId) : undefined,
      });
      if (result.success) {
        setFormSuccess(`用户创建成功！`);
        setFormData(INITIAL_FORM);
        loadUsers(1);
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
        ? await userService.batchCreateUsersAsync(batchCount)
        : await userService.batchCreateUsers(batchCount);
      setBatchResult(result);
      if (result.success) loadUsers(1);
    } catch (err) {
      setBatchResult({ success: false, message: err.message });
    } finally {
      setBatchLoading(false);
    }
  };

  // Performance test
  const handlePerformanceTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await userService.performanceTest();
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  // Concurrent test
  const handleConcurrentTest = async () => {
    setConcurrentLoading(true);
    setConcurrentResult(null);
    try {
      const result = await userService.concurrentTest(concurrentCount);
      setConcurrentResult(result);
    } catch (err) {
      setConcurrentResult({ success: false, message: err.message });
    } finally {
      setConcurrentLoading(false);
    }
  };

  // Stats
  const handleGetStats = async () => {
    try {
      const result = useAsync
        ? await userService.getUserStatsAsync()
        : await userService.getUserStats();
      if (result.success) {
        alert(`用户统计信息: 总用户数: ${result.stats?.totalUsers || 'N/A'}`);
      }
    } catch (err) {
      alert(`获取统计失败: ${err.message}`);
    }
  };

  // Health check
  const handleHealthCheck = async () => {
    try {
      const result = await userService.healthCheck();
      if (result.success) {
        alert(`用户服务健康: ${result.message}\n用户数: ${result.userCount}`);
      }
    } catch (err) {
      alert(`健康检查失败: ${err.message}`);
    }
  };

  // Modal backdrop click
  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) setShowCreateModal(false);
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>用户管理</h2>
        <div className="users-actions">
          <button className="btn btn-create" onClick={openCreateModal}>创建用户</button>
          <button className={`btn btn-toggle ${useAsync ? 'active' : ''}`} onClick={toggleAsyncMode}>
            {useAsync ? '异步模式' : '同步模式'}
          </button>
          <button className="btn btn-secondary" onClick={handleGetStats}>获取统计</button>
          <button className="btn btn-health" onClick={handleHealthCheck}>健康检查</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error"><strong>错误:</strong> {error}</div>
      )}

      {/* Admin Toolbar */}
      <div className="admin-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">批量创建:</span>
          <input type="number" className="toolbar-input" value={batchCount}
            onChange={(e) => setBatchCount(parseInt(e.target.value) || 10)} min="1" max="1000" />
          <button className="btn btn-batch" onClick={handleBatchCreate} disabled={batchLoading}>
            {batchLoading ? '创建中...' : '批量创建用户'}
          </button>
          {batchResult && (
            <span className={`toolbar-result ${batchResult.success ? 'success' : 'error'}`}>
              {batchResult.success ? `成功创建` : '失败'}: {batchResult.message || ''}
            </span>
          )}
        </div>
        <div className="toolbar-group">
          <button className="btn btn-test" onClick={handlePerformanceTest} disabled={testLoading}>
            {testLoading ? '测试中...' : '性能测试'}
          </button>
          <button className="btn btn-test" onClick={handleConcurrentTest} disabled={concurrentLoading}>
            {concurrentLoading ? '测试中...' : '并发测试'}
          </button>
          <input type="number" className="toolbar-input-small" value={concurrentCount}
            onChange={(e) => setConcurrentCount(parseInt(e.target.value) || 5)} min="1" max="100"
            title="并发数" />
          <span className="toolbar-hint">并发数</span>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="test-result">
          <div className="test-result-header">
            <span>性能测试结果</span>
            <button className="btn-close" onClick={() => setTestResult(null)}>×</button>
          </div>
          <pre>{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}
      {concurrentResult && (
        <div className="test-result">
          <div className="test-result-header">
            <span>并发测试结果</span>
            <button className="btn-close" onClick={() => setConcurrentResult(null)}>×</button>
          </div>
          <pre>{JSON.stringify(concurrentResult, null, 2)}</pre>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>年龄</th>
                  <th>部门</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email || '-'}</td>
                      <td>{user.age || '-'}</td>
                      <td>{user.deptName || getDeptName(user.deptId)}</td>
                      <td>{user.roles || '-'}</td>
                      <td>
                        <span className={`status ${user.enabled ? 'active' : 'inactive'}`}>
                          {user.enabled ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td>{user.createTime ? new Date(user.createTime).toLocaleString() : '-'}</td>
                      <td className="action-cell">
                        <button className="btn-action btn-edit" onClick={() => openEditModal(user)}>编辑</button>
                        <button className="btn-action btn-delete" onClick={() => setDeleteTarget(user)}>删除</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" className="no-data">暂无用户数据</td></tr>
                )}
              </tbody>
            </table>
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}>上一页</button>
                <span className="page-info">第 {pagination.page} 页，共 {pagination.pages} 页
                  {pagination.total > 0 && ` (总计 ${pagination.total} 条)`}</span>
                <button className="page-btn" onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}>下一页</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="users-info">
        <p>当前模式: <strong>{useAsync ? '异步（虚拟线程）' : '同步'}</strong>
          {useAsync && ' - 使用Java 21虚拟线程优化'}</p>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>创建用户</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              {formError && <div className="alert alert-error">{formError}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>用户名 *</label>
                  <input type="text" name="username" value={formData.username}
                    onChange={handleFormChange} required disabled={formLoading} />
                </div>
                <div className="form-group">
                  <label>密码 *</label>
                  <input type="password" name="password" value={formData.password}
                    onChange={handleFormChange} required disabled={formLoading} />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input type="email" name="email" value={formData.email}
                    onChange={handleFormChange} disabled={formLoading} />
                </div>
                <div className="form-group">
                  <label>年龄</label>
                  <input type="number" name="age" value={formData.age}
                    onChange={handleFormChange} min="1" max="150" disabled={formLoading} />
                </div>
                <div className="form-group">
                  <label>部门</label>
                  <select name="deptId" value={formData.deptId} onChange={handleFormChange} disabled={formLoading || deptsLoading}>
                    <option value="">请选择部门</option>
                    {flattenDepts(depts).map(d => (
                      <option key={d.id} value={d.id}>{'　'.repeat(d._level)}{d._level > 0 ? '└ ' : ''}{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>角色</label>
                  <select name="roles" value={formData.roles}
                    onChange={handleFormChange} disabled={formLoading}>
                    <option value="ROLE_USER">普通用户</option>
                    <option value="ROLE_ADMIN">管理员</option>
                    <option value="ROLE_USER,ROLE_ADMIN">普通用户+管理员</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label>备注</label>
                  <textarea name="remark" value={formData.remark}
                    onChange={handleFormChange} rows="2" disabled={formLoading} />
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

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>编辑用户</h3>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditUser}>
              {editError && <div className="alert alert-error">{editError}</div>}
              {editSuccess && <div className="alert alert-success">{editSuccess}</div>}
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>用户名 *</label>
                  <input type="text" name="username" value={editData.username}
                    onChange={handleEditChange} required disabled={editLoading} />
                </div>
                <div className="form-group">
                  <label>密码（留空不修改）</label>
                  <input type="password" name="password" value={editData.password}
                    onChange={handleEditChange} disabled={editLoading} />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input type="email" name="email" value={editData.email}
                    onChange={handleEditChange} disabled={editLoading} />
                </div>
                <div className="form-group">
                  <label>年龄</label>
                  <input type="number" name="age" value={editData.age}
                    onChange={handleEditChange} min="1" max="150" disabled={editLoading} />
                </div>
                <div className="form-group">
                  <label>部门</label>
                  <select name="deptId" value={editData.deptId} onChange={handleEditChange} disabled={editLoading || deptsLoading}>
                    <option value="">请选择部门</option>
                    {flattenDepts(depts).map(d => (
                      <option key={d.id} value={d.id}>{'　'.repeat(d._level)}{d._level > 0 ? '└ ' : ''}{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>角色</label>
                  <select name="roles" value={editData.roles}
                    onChange={handleEditChange} disabled={editLoading}>
                    <option value="ROLE_USER">普通用户</option>
                    <option value="ROLE_ADMIN">管理员</option>
                    <option value="ROLE_USER,ROLE_ADMIN">普通用户+管理员</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label>备注</label>
                  <textarea name="remark" value={editData.remark}
                    onChange={handleEditChange} rows="2" disabled={editLoading} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-create" disabled={editLoading}>
                  {editLoading ? '更新中...' : '更新'}
                </button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowEditModal(false)}
                  disabled={editLoading}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => { if (!deleteLoading) setDeleteTarget(null); }}>
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="btn-close" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>×</button>
            </div>
            {deleteError && <div className="alert alert-error">{deleteError}</div>}
            <p style={{ color: '#4a5568', marginBottom: 8 }}>确定要删除用户 <strong>{deleteTarget.username}</strong> 吗？</p>
            <p style={{ color: '#e53e3e', fontSize: 13 }}>此操作不可恢复。</p>
            <div className="modal-actions">
              <button className="btn btn-delete-danger" onClick={handleDeleteUser} disabled={deleteLoading}>
                {deleteLoading ? '删除中...' : '确认删除'}
              </button>
              <button className="btn btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
