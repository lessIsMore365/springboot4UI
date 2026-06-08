import React, { useState, useEffect, useCallback } from 'react';
import { deptService, roleService } from '../../services';
import './DeptManagement.css';

const INIT_FORM = { parentId: 0, name: '', sortOrder: 0, leader: '', phone: '', email: '', status: 0, defaultRoleId: '' };

const DeptManagement = () => {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [roles, setRoles] = useState([]);

  const loadDepts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await deptService.getTree();
      if (r.success !== false) setDepts(r.data || []);
      else setError(r.message || '获取部门失败');
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setLoading(false); }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const r = await roleService.getRoles(1, 100);
      if (r.success) setRoles(r.data || []);
    } catch (e) { /* ignore */ }
  }, []);

  const getRoleName = (roleId) => {
    if (!roleId || !roles.length) return '-';
    const r = roles.find(r => String(r.id) === String(roleId));
    return r ? r.name : '-';
  };

  useEffect(() => { loadDepts(); loadRoles(); }, [loadDepts, loadRoles]);

  const flatten = (nodes, level = 0) => {
    const result = [];
    nodes.forEach(n => {
      result.push({ ...n, _level: level });
      if (n.children?.length) result.push(...flatten(n.children, level + 1));
    });
    return result;
  };

  const openAdd = (parentId = 0) => {
    setForm({ ...INIT_FORM, parentId });
    setEditingId(null);
    setFormError('');
    setShowForm(true);
    if (roles.length === 0) loadRoles();
  };

  const openEdit = (dept) => {
    setForm({
      parentId: dept.parentId || 0,
      name: dept.name || '',
      sortOrder: dept.sortOrder || 0,
      leader: dept.leader || '',
      phone: dept.phone || '',
      email: dept.email || '',
      status: dept.status !== false ? 0 : 1,
      defaultRoleId: dept.defaultRoleId || '',
    });
    setEditingId(dept.id);
    setFormError('');
    setShowForm(true);
    if (roles.length === 0) loadRoles();
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('部门名称不能为空'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      const data = {
        ...form,
        defaultRoleId: form.defaultRoleId ? Number(form.defaultRoleId) : null,
      };
      let r;
      if (editingId) {
        r = await deptService.update({ ...data, id: editingId });
      } else {
        r = await deptService.create(data);
      }
      if (r.success !== false) {
        setShowForm(false);
        loadDepts();
      } else { setFormError(r.message || '保存失败'); }
    } catch (e) { setFormError(e.message || '请求失败'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (dept) => {
    const hasChildren = dept.children?.length > 0;
    const msg = hasChildren
      ? `确定删除「${dept.name}」及其所有子部门吗？`
      : `确定删除「${dept.name}」吗？`;
    if (!window.confirm(msg)) return;
    setLoading(true);
    try {
      // Delete children first (bottom-up)
      if (dept.children?.length) {
        const delChildren = async (nodes) => {
          for (const n of nodes) {
            if (n.children?.length) await delChildren(n.children);
            await deptService.delete(n.id);
          }
        };
        await delChildren(dept.children);
      }
      const r = await deptService.delete(dept.id);
      if (r.success !== false) loadDepts();
      else setError(r.message || '删除失败');
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setLoading(false); }
  };

  const parentOptions = () => {
    const opts = [{ value: 0, label: '根节点' }];
    flatten(depts).forEach(d => {
      opts.push({ value: d.id, label: '　'.repeat(d._level) + d.name });
    });
    return opts;
  };

  const flatDepts = flatten(depts);

  return (
    <div className="dept-container">
      <div className="dept-header">
        <h2>部门管理</h2>
        <div className="dept-header-actions">
          <button className="btn btn-primary" onClick={() => openAdd(0)}>新增部门</button>
          <button className="btn btn-test" onClick={loadDepts} disabled={loading}>{loading ? '刷新中...' : '刷新'}</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && flatDepts.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="dept-card">
          <table className="dept-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>部门名称</th>
                <th style={{ width: 100 }}>负责人</th>
                <th style={{ width: 130 }}>电话</th>
                <th style={{ width: 80 }}>默认角色</th>
                <th style={{ width: 80 }}>排序</th>
                <th style={{ width: 60 }}>状态</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {flatDepts.map(d => (
                <tr key={d.id} className={d._level === 0 ? 'dept-row-root' : ''}>
                  <td style={{ fontFamily: 'monospace' }}>{d.id}</td>
                  <td>
                    <span style={{ paddingLeft: d._level * 24 }}>{d._level > 0 && '└ '}{d.name}</span>
                  </td>
                  <td>{d.leader || '-'}</td>
                  <td style={{ fontSize: 12 }}>{d.phone || '-'}</td>
                  <td style={{ fontSize: 12 }}>{getRoleName(d.defaultRoleId)}</td>
                  <td>{d.sortOrder}</td>
                  <td><span className={`dept-status${d.status !== false ? ' enabled' : ' disabled'}`}>{d.status !== false ? '启用' : '停用'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-test" onClick={() => openEdit(d)}>编辑</button>
                    <button className="btn btn-sm btn-test" style={{ marginLeft: 4 }} onClick={() => openAdd(d.id)}>添加</button>
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }} onClick={() => handleDelete(d)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flatDepts.length === 0 && <div className="loading">暂无部门数据</div>}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editingId ? '编辑部门' : '新增部门'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-grid">
                <div className="form-group full">
                  <label>上级部门</label>
                  <select value={form.parentId} onChange={e => setForm({ ...form, parentId: Number(e.target.value) })}>
                    {parentOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>部门名称 *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如: 技术部" />
                </div>
                <div className="form-group">
                  <label>排序</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>负责人</label>
                  <input value={form.leader} onChange={e => setForm({ ...form, leader: e.target.value })} placeholder="如: 李经理" />
                </div>
                <div className="form-group">
                  <label>电话</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="如: 13800000001" />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="如: tech@example.com" />
                </div>
                <div className="form-group">
                  <label>默认角色</label>
                  <select value={form.defaultRoleId} onChange={e => setForm({ ...form, defaultRoleId: e.target.value })}>
                    <option value="">无默认角色</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: Number(e.target.value) })}>
                    <option value={0}>启用</option>
                    <option value={1}>停用</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={formLoading}>{formLoading ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptManagement;
