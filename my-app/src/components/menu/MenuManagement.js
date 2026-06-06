import React, { useState, useEffect, useCallback } from 'react';
import { menuService, roleService } from '../../services';
import './MenuManagement.css';

const MENU_TYPE = { M: '目录', C: '菜单', F: '按钮' };
const INIT_FORM = { parentId: 0, name: '', path: '', component: '', icon: '', sortOrder: 0, menuType: 'C', permission: '', visible: true, status: true };

const ICON_LIST = [
  '⚙️', '👥', '👑', '🔑', '📖', '📋', '📝', '📄', '📁', '📂',
  '💰', '💳', '💵', '📈', '📊', '📉', '🔔', '📢', '✉️', '📧',
  '🗄️', '🗃️', '🗂️', '💾', '🗑️', '🔍', '🔎', '📌', '📍', '🏷️',
  '🔧', '🔨', '🛠️', '⚡', '🔌', '🔋', '🪛', '🖥️', '🌐', '🔗',
  '🏠', '🏢', '🛡️', '🔐', '🔒', '🔓', '✅', '❌', '⚠️', 'ℹ️',
  '👤', '👨‍💻', '👩‍💻', '🤖', '🧠', '🎯', '🚀', '🌟', '🔥', '💡',
  '☕', '🟢', '🔴', '🟡', '🟣', '🔵', '📜', '⭐', '❤️', '🎨',
  '🛒', '📦', '📭', '📬', '📫', '📪', '📨', '💬', '🗨️', '💭',
];

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roleMenuIds, setRoleMenuIds] = useState([]);
  const [roleMenuLoading, setRoleMenuLoading] = useState(false);

  const loadMenus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await menuService.getTree();
      if (r.success !== false) setMenus(r.data || []);
      else setError(r.message || '获取菜单失败');
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMenus(); }, [loadMenus]);

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
  };

  const openEdit = (menu) => {
    setForm({
      parentId: menu.parentId || 0,
      name: menu.name || '',
      path: menu.path || '',
      component: menu.component || '',
      icon: menu.icon || '',
      sortOrder: menu.sortOrder || 0,
      menuType: menu.menuType || 'C',
      permission: menu.permission || '',
      visible: menu.visible !== false,
      status: menu.status !== false,
    });
    setEditingId(menu.id);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('菜单名称不能为空'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      const data = { ...form, visible: form.visible ? 1 : 0, status: form.status ? 1 : 0 };
      let r;
      if (editingId) {
        r = await menuService.update({ ...data, id: editingId });
      } else {
        r = await menuService.create(data);
      }
      if (r.success !== false) {
        setShowForm(false);
        loadMenus();
      } else { setFormError(r.message || '保存失败'); }
    } catch (e) { setFormError(e.message || '请求失败'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (menu) => {
    const hasChildren = menu.children?.length > 0;
    const msg = hasChildren
      ? `确定删除「${menu.name}」及其所有子菜单吗？此操作将级联删除并清除角色关联。`
      : `确定删除「${menu.name}」吗？`;
    if (!window.confirm(msg)) return;
    setLoading(true);
    try {
      const r = await menuService.delete(menu.id);
      if (r.success !== false) loadMenus();
      else setError(r.message || '删除失败');
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setLoading(false); }
  };

  const openRoleDialog = async () => {
    setShowRoleDialog(true);
    setSelectedRoleId(null);
    setRoleMenuIds([]);
    try {
      const r = await roleService.getRoles();
      if (r.success !== false) setRoles(r.data?.records || r.data || []);
    } catch (e) { /* ignore */ }
  };

  const onRoleSelect = async (roleId) => {
    setSelectedRoleId(Number(roleId));
    setRoleMenuLoading(true);
    try {
      const r = await menuService.getRoleMenus(roleId);
      if (r.success !== false) setRoleMenuIds(r.data || []);
    } catch (e) { /* ignore */ }
    finally { setRoleMenuLoading(false); }
  };

  const toggleRoleMenu = (menuId) => {
    setRoleMenuIds(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]);
  };

  const saveRoleMenus = async () => {
    if (!selectedRoleId) return;
    setRoleMenuLoading(true);
    try {
      const r = await menuService.assignRoleMenus(selectedRoleId, roleMenuIds);
      if (r.success !== false) {
        setShowRoleDialog(false);
      } else { setError(r.message || '分配失败'); }
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setRoleMenuLoading(false); }
  };

  const parentOptions = () => {
    const opts = [{ value: 0, label: '根节点' }];
    flatten(menus).forEach(m => {
      if (m.menuType !== 'F') opts.push({ value: m.id, label: '　'.repeat(m._level) + m.name });
    });
    return opts;
  };

  const flatMenus = flatten(menus);

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h2>菜单管理</h2>
        <div className="menu-header-actions">
          <button className="btn btn-primary" onClick={() => openAdd(0)}>新增菜单</button>
          <button className="btn btn-health" onClick={openRoleDialog}>角色菜单分配</button>
          <button className="btn btn-test" onClick={loadMenus} disabled={loading}>{loading ? '刷新中...' : '刷新'}</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && flatMenus.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="menu-card">
          <table className="menu-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>菜单名称</th>
                <th style={{ width: 80 }}>类型</th>
                <th>路由路径</th>
                <th style={{ width: 80 }}>排序</th>
                <th style={{ width: 140 }}>权限标识</th>
                <th style={{ width: 60 }}>可见</th>
                <th style={{ width: 60 }}>状态</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {flatMenus.map(m => (
                <tr key={m.id} className={m._level === 0 ? 'menu-row-root' : ''}>
                  <td style={{ fontFamily: 'monospace' }}>{m.id}</td>
                  <td>
                    <span style={{ paddingLeft: m._level * 24 }}>{m._level > 0 && '└ '}{m.icon && <span style={{ marginRight: 4 }}>{m.icon}</span>}{m.name}</span>
                  </td>
                  <td><span className={`menu-type-tag type-${m.menuType?.toLowerCase()}`}>{MENU_TYPE[m.menuType] || m.menuType}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.path}</td>
                  <td>{m.sortOrder}</td>
                  <td style={{ fontSize: 12, color: m.permission ? '#2b6cb0' : '#a0aec0' }}>{m.permission || '-'}</td>
                  <td>{m.visible !== false ? '是' : '否'}</td>
                  <td><span style={{ color: m.status !== false ? '#38a169' : '#e53e3e' }}>{m.status !== false ? '启用' : '停用'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-test" onClick={() => openEdit(m)}>编辑</button>
                    {m.menuType !== 'F' && <button className="btn btn-sm btn-test" style={{ marginLeft: 4 }} onClick={() => openAdd(m.id)}>添加</button>}
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }} onClick={() => handleDelete(m)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flatMenus.length === 0 && <div className="loading">暂无菜单数据</div>}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editingId ? '编辑菜单' : '新增菜单'}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="form-grid">
                <div className="form-group full">
                  <label>上级菜单</label>
                  <select value={form.parentId} onChange={e => setForm({ ...form, parentId: Number(e.target.value) })}>
                    {parentOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>菜单类型</label>
                  <select value={form.menuType} onChange={e => setForm({ ...form, menuType: e.target.value })}>
                    <option value="M">目录 (M)</option>
                    <option value="C">菜单 (C)</option>
                    <option value="F">按钮 (F)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>菜单名称 *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如: 用户管理" />
                </div>
                <div className="form-group">
                  <label>路由路径</label>
                  <input value={form.path} onChange={e => setForm({ ...form, path: e.target.value })} placeholder="如: /system/user" />
                </div>
                <div className="form-group">
                  <label>组件路径</label>
                  <input value={form.component} onChange={e => setForm({ ...form, component: e.target.value })} placeholder="如: system/user/index" />
                </div>
                <div className="form-group">
                  <label>图标</label>
                  <div className="icon-picker-trigger" onClick={() => setShowIconPicker(!showIconPicker)}>
                    <span className="icon-picker-current">{form.icon || '📄'}</span>
                    <span style={{ fontSize: 11, color: '#a0aec0' }}>{showIconPicker ? '▲' : '▼'} 选择</span>
                  </div>
                  {showIconPicker && (
                    <div className="icon-picker-grid">
                      <div className="icon-picker-clear" onClick={() => { setForm({ ...form, icon: '' }); setShowIconPicker(false); }}>清除</div>
                      {ICON_LIST.map(icon => (
                        <span key={icon} className={`icon-picker-item${form.icon === icon ? ' selected' : ''}`}
                          onClick={() => { setForm({ ...form, icon }); setShowIconPicker(false); }}>{icon}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>排序</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>权限标识</label>
                  <input value={form.permission} onChange={e => setForm({ ...form, permission: e.target.value })} placeholder="如: user:read" />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={form.visible} onChange={e => setForm({ ...form, visible: e.target.checked })} />
                    可见
                  </label>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={form.status} onChange={e => setForm({ ...form, status: e.target.checked })} />
                    启用
                  </label>
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

      {/* Role Menu Dialog */}
      {showRoleDialog && (
        <div className="modal-overlay" onClick={() => setShowRoleDialog(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>角色菜单分配</h3>
              <button className="btn-close" onClick={() => setShowRoleDialog(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>选择角色</label>
                <select value={selectedRoleId || ''} onChange={e => onRoleSelect(e.target.value)}>
                  <option value="">请选择角色</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.roleName} ({r.roleCode})</option>)}
                </select>
              </div>
              {roleMenuLoading ? (
                <div className="loading">加载菜单...</div>
              ) : selectedRoleId ? (
                <div className="menu-checkbox-tree">
                  {flatMenus.map(m => (
                    <label key={m.id} className="menu-checkbox-item" style={{ paddingLeft: m._level * 24 + 8 }}>
                      <input
                        type="checkbox"
                        checked={roleMenuIds.includes(m.id)}
                        onChange={() => toggleRoleMenu(m.id)}
                      />
                      <span className="menu-checkbox-label">
                        {m.icon && <span style={{ marginRight: 4 }}>{m.icon}</span>}
                        {m.name}
                        <span style={{ color: '#a0aec0', fontSize: 11, marginLeft: 6 }}>{MENU_TYPE[m.menuType]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="loading">请选择一个角色查看其菜单权限</div>
              )}
            </div>
            {selectedRoleId && (
              <div className="modal-footer">
                <button className="btn" onClick={() => setShowRoleDialog(false)}>取消</button>
                <button className="btn btn-primary" onClick={saveRoleMenus} disabled={roleMenuLoading}>保存分配</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
