import React, { useState, useEffect, useCallback } from 'react';
import { dictService } from '../../services';
import './DictManagement.css';

const INIT_TYPE = { dictName: '', dictType: '', status: '0', remark: '' };
const INIT_DATA = { dictType: '', dictLabel: '', dictValue: '', dictSort: 1, cssClass: '', listClass: '', isDefault: '0', status: '0' };

const statusLabel = (s) => s === '0' ? '正常' : '停用';
const statusClass = (s) => s === '0' ? 'status-success' : 'status-muted';

const DictManagement = () => {
  const [types, setTypes] = useState([]);
  const [typeDataMap, setTypeDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cacheMsg, setCacheMsg] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('type');
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [typeRes, dataRes] = await Promise.all([
        dictService.getAllDictTypes(),
        dictService.getDictDatas(1, 10000),
      ]);
      if (typeRes.success !== false) {
        setTypes(typeRes.data || []);
      } else { setError(typeRes.message || '获取字典类型失败'); }
      if (dataRes.success !== false) {
        const map = {};
        (dataRes.data || []).forEach(d => {
          if (!map[d.dictType]) map[d.dictType] = [];
          map[d.dictType].push(d);
        });
        setTypeDataMap(map);
      }
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openAddType = () => {
    setForm(INIT_TYPE); setFormMode('type'); setEditingId(null); setFormError(''); setShowForm(true);
  };

  const openEditType = (type) => {
    setForm({ dictName: type.dictName || '', dictType: type.dictType || '', status: type.status || '0', remark: type.remark || '' });
    setFormMode('type'); setEditingId(type.id); setFormError(''); setShowForm(true);
  };

  const openAddData = (dictType) => {
    setForm({ ...INIT_DATA, dictType }); setFormMode('data'); setEditingId(null); setFormError(''); setShowForm(true);
  };

  const openEditData = (data) => {
    setForm({ dictType: data.dictType || '', dictLabel: data.dictLabel || '', dictValue: data.dictValue || '', dictSort: data.dictSort ?? 1, cssClass: data.cssClass || '', listClass: data.listClass || '', isDefault: data.isDefault || '0', status: data.status || '0' });
    setFormMode('data'); setEditingId(data.id); setFormError(''); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const isType = formMode === 'type';
      let fn;
      if (isType) {
        fn = editingId ? dictService.updateDictType({ ...form, id: editingId }) : dictService.createDictType(form);
      } else {
        fn = editingId ? dictService.updateDictData({ ...form, id: editingId }) : dictService.createDictData(form);
      }
      const result = await fn;
      if (result.success) {
        setShowForm(false);
        loadAll();
      } else { setFormError(result.message || '操作失败'); }
    } catch (err) { setFormError(err.message || '请求失败'); }
    finally { setFormLoading(false); }
  };

  const handleDeleteType = async (type) => {
    const childCount = (typeDataMap[type.dictType] || []).length;
    const msg = childCount > 0
      ? `确定删除「${type.dictName}」及其 ${childCount} 条字典数据吗？`
      : `确定删除「${type.dictName}」吗？`;
    if (!window.confirm(msg)) return;
    try {
      const r = await dictService.deleteDictType(type.id);
      if (r.success !== false) loadAll();
      else alert(r.message || '删除失败');
    } catch (e) { alert(e.message || '请求失败'); }
  };

  const handleDeleteData = async (data) => {
    if (!window.confirm(`确定删除「${data.dictLabel}」吗？`)) return;
    try {
      const r = await dictService.deleteDictData(data.id);
      if (r.success !== false) loadAll();
      else alert(r.message || '删除失败');
    } catch (e) { alert(e.message || '请求失败'); }
  };

  const handleRefreshCache = async () => {
    try {
      const r = await dictService.refreshCache();
      setCacheMsg(r);
      setTimeout(() => setCacheMsg(null), 3000);
    } catch (e) { setCacheMsg({ success: false, message: e.message }); }
  };

  const typeFields = [
    { name: 'dictName', label: '字典名称', required: true },
    { name: 'dictType', label: '类型编码', required: true, disabled: !!editingId },
    { name: 'status', label: '状态', type: 'select', options: [{ v: '0', l: '正常' }, { v: '1', l: '停用' }] },
    { name: 'remark', label: '备注', type: 'textarea' },
  ];

  const dataFields = (dictType) => {
    const types = types || [];
    return [
      { name: 'dictType', label: '字典类型', type: 'select', required: true, options: types.map(t => ({ v: t.dictType, l: `${t.dictName} (${t.dictType})` })) },
      { name: 'dictLabel', label: '字典标签', required: true },
      { name: 'dictValue', label: '键值', required: true },
      { name: 'dictSort', label: '排序', inputType: 'number' },
      { name: 'cssClass', label: 'CSS类名' },
      { name: 'listClass', label: '列表样式' },
      { name: 'isDefault', label: '默认', type: 'select', options: [{ v: '0', l: '否' }, { v: '1', l: '是' }] },
      { name: 'status', label: '状态', type: 'select', options: [{ v: '0', l: '正常' }, { v: '1', l: '停用' }] },
    ];
  };

  const flatRows = () => {
    const rows = [];
    types.forEach(type => {
      rows.push({ key: `t-${type.id}`, _type: 'type', data: type });
      const children = (typeDataMap[type.dictType] || []).slice().sort((a, b) => (a.dictSort || 0) - (b.dictSort || 0));
      children.forEach(d => {
        rows.push({ key: `d-${d.id}`, _type: 'data', data: d, _parent: type });
      });
    });
    return rows;
  };

  return (
    <div className="dict-container">
      <div className="dict-header">
        <h2>字典管理</h2>
        <div className="dict-header-actions">
          <button className="btn btn-create" onClick={openAddType}>新增字典类型</button>
          <button className="btn btn-health" onClick={handleRefreshCache}>刷新缓存</button>
          <button className="btn btn-test" onClick={loadAll} disabled={loading}>{loading ? '刷新中...' : '刷新'}</button>
        </div>
      </div>

      {cacheMsg && (
        <div className={`dict-cache-msg ${cacheMsg.success ? 'success' : 'error'}`}>
          {cacheMsg.message || JSON.stringify(cacheMsg)}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dict-tree-card">
        {loading && types.length === 0 ? (
          <div className="loading">加载中...</div>
        ) : (
          <table className="dict-tree-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>名称 / 标签</th>
                <th style={{ width: 140 }}>编码 / 键值</th>
                <th style={{ width: 60 }}>排序</th>
                <th style={{ width: 60 }}>默认</th>
                <th style={{ width: 60 }}>状态</th>
                <th style={{ width: 160 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {flatRows().map(row => (
                <tr key={row.key} className={row._type === 'type' ? 'dict-type-row' : 'dict-data-row'}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {row._type === 'type' ? row.data.id : <span style={{ color: '#a0aec0' }}>{row.data.id}</span>}
                  </td>
                  <td>
                    {row._type === 'type' ? (
                      <span className="dict-type-name">
                        <span className="dict-tree-icon">📁</span>
                        {row.data.dictName}
                      </span>
                    ) : (
                      <span className="dict-data-label">
                        <span className="dict-tree-indent">└</span>
                        {row.data.dictLabel}
                      </span>
                    )}
                  </td>
                  <td>
                    {row._type === 'type' ? (
                      <span className="dict-code">{row.data.dictType}</span>
                    ) : (
                      <span className="dict-code" style={{ color: '#718096' }}>{row.data.dictValue}</span>
                    )}
                  </td>
                  <td>{row._type === 'data' ? row.data.dictSort : '-'}</td>
                  <td>
                    {row._type === 'data' && (
                      <span className={`status ${row.data.isDefault === '1' ? 'success' : 'muted'}`}>
                        {row.data.isDefault === '1' ? '是' : '否'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${statusClass(row.data.status)}`}>
                      {statusLabel(row.data.status)}
                    </span>
                  </td>
                  <td className="action-cell">
                    {row._type === 'type' ? (
                      <>
                        <button className="btn btn-sm btn-create" onClick={() => openAddData(row.data.dictType)}>添加数据</button>
                        <button className="btn btn-sm btn-test" onClick={() => openEditType(row.data)}>编辑</button>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDeleteType(row.data)}>删除</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-sm btn-test" onClick={() => openEditData(row.data)}>编辑</button>
                        <button className="btn btn-sm btn-delete" onClick={() => handleDeleteData(row.data)}>删除</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr><td colSpan="7" className="no-data">暂无字典数据</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{formMode === 'type'
                ? (editingId ? '编辑字典类型' : '新增字典类型')
                : (editingId ? '编辑字典数据' : '新增字典数据')}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="modal-form-grid">
                {(formMode === 'type' ? typeFields : dataFields(form.dictType)).map(f => (
                  <div key={f.name} className={`form-group ${f.type === 'textarea' ? 'form-group-full' : ''}`}>
                    <label>{f.label} {f.required ? '*' : ''}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))} disabled={formLoading || f.disabled}>
                        {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))} rows="2" disabled={formLoading} />
                    ) : (
                      <input type={f.inputType || 'text'} value={form[f.name]}
                        onChange={e => setForm(p => ({ ...p, [f.name]: f.inputType === 'number' ? Number(e.target.value) : e.target.value }))}
                        required={f.required} disabled={formLoading || f.disabled} />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-create" disabled={formLoading}>{formLoading ? '提交中...' : '保存'}</button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowForm(false)} disabled={formLoading}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DictManagement;
