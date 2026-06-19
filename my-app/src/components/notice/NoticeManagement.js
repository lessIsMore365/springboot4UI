import React, { useState, useEffect, useCallback } from 'react';
import { noticeService } from '../../services';
import './NoticeManagement.css';

const TYPE_OPTIONS = ['INFO', 'WARNING', 'SUCCESS', 'ERROR'];
const PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const TARGET_TYPE_OPTIONS = ['ALL', 'ROLE', 'USER'];
const STATUS_OPTIONS = ['', 'DRAFT', 'PUBLISHED', 'WITHDRAWN'];

const typeLabel = (t) => ({ INFO: '信息', WARNING: '警告', SUCCESS: '成功', ERROR: '错误' }[t] || t);
const typeClass = (t) => 'notice-type-' + (t || 'INFO').toLowerCase();
const priorityLabel = (p) => ({ LOW: '低', NORMAL: '普通', HIGH: '高', URGENT: '紧急' }[p] || p);
const priorityClass = (p) => 'notice-priority-' + (p || 'NORMAL').toLowerCase();
const statusLabel = (s) => ({ DRAFT: '草稿', PUBLISHED: '已发布', WITHDRAWN: '已撤回' }[s] || s);
const statusClass = (s) => ({ DRAFT: 'status-draft', PUBLISHED: 'status-published', WITHDRAWN: 'status-withdrawn' }[s] || '');
const targetTypeLabel = (t) => ({ ALL: '全部用户', ROLE: '按角色', USER: '按用户' }[t] || t);

const INIT_FORM = { title: '', content: '', type: 'INFO', priority: 'NORMAL', targetType: 'ALL', targetValue: '' };

const NoticeManagement = () => {
  const [tab, setTab] = useState('admin');
  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin filters
  const [filterStatus, setFilterStatus] = useState('');
  const [keyword, setKeyword] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Detail modal
  const [detailNotice, setDetailNotice] = useState(null);

  // Unread count
  const [unreadCount, setUnreadCount] = useState(0);

  const loadAdminNotices = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const r = await noticeService.adminPage(page, pagination.size, filterStatus || undefined, keyword || undefined);
      if (r.success !== false) {
        setNotices(r.data?.records || []);
        setPagination(r.data?.pagination || { page: 1, size: 10, total: 0, pages: 0 });
      } else { setError(r.message || '加载失败'); }
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setLoading(false); }
  }, [filterStatus, keyword, pagination.size]);

  const loadUserNotices = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const r = await noticeService.userPage(page, pagination.size);
      if (r.success !== false) {
        setNotices(r.data?.records || []);
        setPagination(r.data?.pagination || { page: 1, size: 10, total: 0, pages: 0 });
      } else { setError(r.message || '加载失败'); }
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setLoading(false); }
  }, [pagination.size]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const r = await noticeService.unreadCount();
      if (r.success !== false) setUnreadCount(r.data?.count ?? 0);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (tab === 'admin') loadAdminNotices(1);
    else { loadUserNotices(1); loadUnreadCount(); }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'admin') loadAdminNotices(1);
  }, [filterStatus, keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (t) => {
    setTab(t);
    setError('');
    setNotices([]);
    setPagination({ page: 1, size: 10, total: 0, pages: 0 });
  };

  const openCreate = () => {
    setForm(INIT_FORM); setEditingId(null); setFormError(''); setShowForm(true);
  };

  const openEdit = (notice) => {
    setForm({
      title: notice.title || '',
      content: notice.content || '',
      type: notice.type || 'INFO',
      priority: notice.priority || 'NORMAL',
      targetType: notice.targetType || 'ALL',
      targetValue: notice.targetValue || '',
    });
    setEditingId(notice.id); setFormError(''); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('标题不能为空'); return; }
    if (!form.content.trim()) { setFormError('内容不能为空'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      const fn = editingId ? noticeService.update(editingId, form) : noticeService.create(form);
      const r = await fn;
      if (r.success !== false) {
        setShowForm(false);
        loadAdminNotices(pagination.page);
      } else { setFormError(r.message || '操作失败'); }
    } catch (e) { setFormError(e.message || '请求失败'); }
    finally { setFormLoading(false); }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('确定发布此公告吗？')) return;
    try {
      const r = await noticeService.publish(id);
      if (r.success !== false) { loadAdminNotices(pagination.page); loadUnreadCount(); }
      else alert(r.message || '发布失败');
    } catch (e) { alert(e.message || '请求失败'); }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('确定撤回此公告吗？')) return;
    try {
      const r = await noticeService.withdraw(id);
      if (r.success !== false) { loadAdminNotices(pagination.page); loadUnreadCount(); }
      else alert(r.message || '撤回失败');
    } catch (e) { alert(e.message || '请求失败'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除此公告吗？此操作不可恢复。')) return;
    try {
      const r = await noticeService.delete(id);
      if (r.success !== false) loadAdminNotices(pagination.page);
      else alert(r.message || '删除失败');
    } catch (e) { alert(e.message || '请求失败'); }
  };

  const handleViewDetail = async (notice) => {
    try {
      const r = await noticeService.detail(notice.id);
      if (r.success !== false) {
        setDetailNotice(r.data);
        if (!r.data.read && tab === 'center') {
          await noticeService.markRead(notice.id);
          loadUnreadCount();
          loadUserNotices(pagination.page);
        }
      }
    } catch (e) { alert(e.message || '加载详情失败'); }
  };

  const handleMarkAllRead = async () => {
    try {
      const r = await noticeService.markAllRead();
      if (r.success !== false) {
        alert(`已标记 ${r.data?.markedCount ?? 0} 条为已读`);
        loadUnreadCount();
        loadUserNotices(pagination.page);
      }
    } catch (e) { alert(e.message || '操作失败'); }
  };

  const handlePageChange = (page) => {
    if (tab === 'admin') loadAdminNotices(page);
    else loadUserNotices(page);
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= pagination.pages; i++) pages.push(i);
    return (
      <div className="notice-pagination">
        <button disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>上一页</button>
        {pages.map(p => (
          <button key={p} className={p === pagination.page ? 'active' : ''} onClick={() => handlePageChange(p)}>{p}</button>
        ))}
        <button disabled={pagination.page >= pagination.pages} onClick={() => handlePageChange(pagination.page + 1)}>下一页</button>
        <span className="pagination-info">共 {pagination.total} 条</span>
      </div>
    );
  };

  // ======================== Admin Panel ========================
  const renderAdminPanel = () => (
    <div className="notice-admin">
      <div className="notice-toolbar">
        <button className="btn btn-primary" onClick={openCreate}>+ 新建公告</button>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === '' ? '全部状态' : statusLabel(s)}</option>)}
        </select>
        <input
          type="text" placeholder="搜索标题..." value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="notice-search-input"
        />
        <button className="btn" onClick={() => loadAdminNotices(1)}>刷新</button>
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div className="notice-table-wrap">
        <table className="notice-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>类型</th>
              <th>优先级</th>
              <th>状态</th>
              <th>目标</th>
              <th>发布人</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="notice-empty">加载中...</td></tr>
            ) : notices.length === 0 ? (
              <tr><td colSpan={9} className="notice-empty">暂无数据</td></tr>
            ) : notices.map(n => (
              <tr key={n.id}>
                <td className="notice-id">{n.id}</td>
                <td className="notice-title-cell" title={n.title}>
                  <span className="notice-title-link" onClick={() => handleViewDetail(n)}>{n.title}</span>
                </td>
                <td><span className={`notice-badge ${typeClass(n.type)}`}>{typeLabel(n.type)}</span></td>
                <td><span className={`notice-badge ${priorityClass(n.priority)}`}>{priorityLabel(n.priority)}</span></td>
                <td><span className={`notice-badge ${statusClass(n.status)}`}>{statusLabel(n.status)}</span></td>
                <td>{targetTypeLabel(n.targetType)}{n.targetValue ? `: ${n.targetValue}` : ''}</td>
                <td>{n.publisher || '-'}</td>
                <td className="notice-time">{n.publishTime ? new Date(n.publishTime).toLocaleString() : '-'}</td>
                <td className="notice-actions">
                  {n.status === 'DRAFT' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(n)}>编辑</button>
                      <button className="btn btn-sm btn-success" onClick={() => handlePublish(n.id)}>发布</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n.id)}>删除</button>
                    </>
                  )}
                  {n.status === 'PUBLISHED' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(n)}>编辑</button>
                      <button className="btn btn-sm btn-warning" onClick={() => handleWithdraw(n.id)}>撤回</button>
                    </>
                  )}
                  {n.status === 'WITHDRAWN' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(n)}>编辑</button>
                      <button className="btn btn-sm btn-success" onClick={() => handlePublish(n.id)}>重新发布</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n.id)}>删除</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );

  // ======================== User Notice Center ========================
  const renderUserCenter = () => (
    <div className="notice-center">
      <div className="notice-toolbar">
        <span className="notice-unread-badge">
          📬 未读: <strong>{unreadCount}</strong>
        </span>
        <button className="btn" onClick={handleMarkAllRead} disabled={unreadCount === 0}>全部已读</button>
        <button className="btn" onClick={() => loadUserNotices(1)}>刷新</button>
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div className="notice-list">
        {loading ? (
          <div className="notice-empty">加载中...</div>
        ) : notices.length === 0 ? (
          <div className="notice-empty">暂无通知公告</div>
        ) : notices.map(n => (
          <div key={n.id} className={`notice-card${!n.read ? ' unread' : ''}`} onClick={() => handleViewDetail(n)}>
            <div className="notice-card-header">
              <span className="notice-card-title">
                {!n.read && <span className="unread-dot" />}
                {n.title}
              </span>
              <span className="notice-card-meta">
                <span className={`notice-badge ${typeClass(n.type)}`}>{typeLabel(n.type)}</span>
                <span className={`notice-badge ${priorityClass(n.priority)}`}>{priorityLabel(n.priority)}</span>
              </span>
            </div>
            <div className="notice-card-footer">
              <span>{n.publisher || '系统'}</span>
              <span>{n.publishTime ? new Date(n.publishTime).toLocaleString() : '-'}</span>
              {n.read && <span className="notice-read-tag">已读</span>}
            </div>
          </div>
        ))}
      </div>
      {renderPagination()}
    </div>
  );

  // ======================== Form Modal ========================
  const renderForm = () => (
    <div className="modal-overlay" onClick={() => setShowForm(false)}>
      <div className="modal-content notice-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingId ? '编辑公告' : '新建公告'}</h3>
          <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {formError && <div className="notice-error">{formError}</div>}
          <div className="form-group">
            <label>标题 <span className="required">*</span></label>
            <input
              type="text" value={form.title} maxLength={120}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="公告标题（最多120字）"
            />
          </div>
          <div className="form-group">
            <label>内容 <span className="required">*</span></label>
            <textarea
              value={form.content} rows={6}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="公告内容"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>类型</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>优先级</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>目标类型</label>
              <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value, targetValue: '' })}>
                {TARGET_TYPE_OPTIONS.map(t => <option key={t} value={t}>{targetTypeLabel(t)}</option>)}
              </select>
            </div>
            {form.targetType !== 'ALL' && (
              <div className="form-group">
                <label>目标值</label>
                <input
                  type="text" value={form.targetValue}
                  onChange={e => setForm({ ...form, targetValue: e.target.value })}
                  placeholder={form.targetType === 'ROLE' ? '角色编码，逗号分隔' : '用户ID，逗号分隔'}
                />
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setShowForm(false)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? '提交中...' : (editingId ? '更新' : '创建草稿')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ======================== Detail Modal ========================
  const renderDetail = () => {
    if (!detailNotice) return null;
    const n = detailNotice;
    return (
      <div className="modal-overlay" onClick={() => setDetailNotice(null)}>
        <div className="modal-content notice-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{n.title}</h3>
            <button className="modal-close" onClick={() => setDetailNotice(null)}>×</button>
          </div>
          <div className="notice-detail-meta">
            <span className={`notice-badge ${typeClass(n.type)}`}>{typeLabel(n.type)}</span>
            <span className={`notice-badge ${priorityClass(n.priority)}`}>{priorityLabel(n.priority)}</span>
            <span>{n.publisher || '系统'}</span>
            <span>{n.publishTime ? new Date(n.publishTime).toLocaleString() : '-'}</span>
          </div>
          <div className="notice-detail-content">{n.content}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="notice-management">
      <div className="notice-tabs">
        <button className={`notice-tab${tab === 'admin' ? ' active' : ''}`} onClick={() => handleTabChange('admin')}>
          ⚙️ 公告管理
        </button>
        <button className={`notice-tab${tab === 'center' ? ' active' : ''}`} onClick={() => handleTabChange('center')}>
          📢 通知中心
          {tab !== 'center' && unreadCount > 0 && <span className="tab-unread-badge">{unreadCount}</span>}
        </button>
      </div>

      {tab === 'admin' ? renderAdminPanel() : renderUserCenter()}
      {showForm && renderForm()}
      {detailNotice && renderDetail()}
    </div>
  );
};

export default NoticeManagement;
