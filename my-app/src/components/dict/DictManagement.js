import React, { useState, useEffect } from 'react';
import { dictService } from '../../services';
import './DictManagement.css';

const INIT_TYPE = { dictName: '', dictType: '', status: '0', remark: '' };
const INIT_DATA = { dictType: '', dictLabel: '', dictValue: '', dictSort: 1, cssClass: '', listClass: '', isDefault: '0', status: '0' };

const DictManagement = () => {
  const [activeTab, setActiveTab] = useState('type');

  // ---- Dict Type state ----
  const [types, setTypes] = useState([]);
  const [typePagination, setTypePagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeError, setTypeError] = useState('');

  const [typeForm, setTypeForm] = useState(INIT_TYPE);
  const [typeFormLoading, setTypeFormLoading] = useState(false);
  const [typeFormError, setTypeFormError] = useState('');
  const [typeEditingId, setTypeEditingId] = useState(null);

  // ---- Dict Data state ----
  const [datas, setDatas] = useState([]);
  const [dataPagination, setDataPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [dataFilterType, setDataFilterType] = useState('');

  const [dataForm, setDataForm] = useState(INIT_DATA);
  const [dataFormLoading, setDataFormLoading] = useState(false);
  const [dataFormError, setDataFormError] = useState('');
  const [dataEditingId, setDataEditingId] = useState(null);

  const [allTypes, setAllTypes] = useState([]);
  const [cacheMsg, setCacheMsg] = useState(null);

  // ---- Dict Type functions ----
  const loadTypes = async (page = 1) => {
    setTypeLoading(true);
    setTypeError('');
    try {
      const result = await dictService.getDictTypes(page, typePagination.size);
      if (result.success) {
        setTypes(result.data || []);
        setTypePagination(result.pagination || { page, size: typePagination.size, total: 0, pages: 0 });
      } else { setTypeError(result.message || '获取失败'); }
    } catch (err) { setTypeError(err.message || '请求失败'); }
    finally { setTypeLoading(false); }
  };

  useEffect(() => { loadTypes(); loadAllTypes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllTypes = async () => {
    try {
      const result = await dictService.getAllDictTypes();
      if (result.success) setAllTypes(result.data || []);
    } catch { /* ignore */ }
  };

  const openTypeForm = (type) => {
    if (type) {
      setTypeForm({ dictName: type.dictName || '', dictType: type.dictType || '', status: type.status || '0', remark: type.remark || '' });
      setTypeEditingId(type.id);
    } else {
      setTypeForm(INIT_TYPE);
      setTypeEditingId(null);
    }
    setTypeFormError('');
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    setTypeFormLoading(true);
    setTypeFormError('');
    try {
      const fn = typeEditingId ? dictService.updateDictType({ ...typeForm, id: typeEditingId }) : dictService.createDictType(typeForm);
      const result = await fn;
      if (result.success) {
        setTypeForm(INIT_TYPE); setTypeEditingId(null); loadTypes(1);
      } else { setTypeFormError(result.message || '操作失败'); }
    } catch (err) { setTypeFormError(err.message || '请求失败'); }
    finally { setTypeFormLoading(false); }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('删除字典类型将同时删除其下所有字典数据，确认？')) return;
    try {
      const result = await dictService.deleteDictType(id);
      if (result.success) { loadTypes(1); loadAllTypes(); }
      else alert(result.message || '删除失败');
    } catch (err) { alert(err.message || '请求失败'); }
  };

  // ---- Dict Data functions ----
  const loadDatas = async (page = 1) => {
    setDataLoading(true);
    setDataError('');
    try {
      const result = await dictService.getDictDatas(page, dataPagination.size, dataFilterType || undefined);
      if (result.success) {
        setDatas(result.data || []);
        setDataPagination(result.pagination || { page, size: dataPagination.size, total: 0, pages: 0 });
      } else { setDataError(result.message || '获取失败'); }
    } catch (err) { setDataError(err.message || '请求失败'); }
    finally { setDataLoading(false); }
  };

  useEffect(() => { if (activeTab === 'data') { loadDatas(); loadAllTypes(); } }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDataForm = (data) => {
    if (data) {
      setDataForm({ dictType: data.dictType || '', dictLabel: data.dictLabel || '', dictValue: data.dictValue || '', dictSort: data.dictSort ?? 1, cssClass: data.cssClass || '', listClass: data.listClass || '', isDefault: data.isDefault || '0', status: data.status || '0' });
      setDataEditingId(data.id);
    } else {
      setDataForm(INIT_DATA);
      setDataEditingId(null);
    }
    setDataFormError('');
  };

  const handleDataSubmit = async (e) => {
    e.preventDefault();
    setDataFormLoading(true);
    setDataFormError('');
    try {
      const fn = dataEditingId ? dictService.updateDictData({ ...dataForm, id: dataEditingId }) : dictService.createDictData(dataForm);
      const result = await fn;
      if (result.success) {
        setDataForm(INIT_DATA); setDataEditingId(null); loadDatas(1);
      } else { setDataFormError(result.message || '操作失败'); }
    } catch (err) { setDataFormError(err.message || '请求失败'); }
    finally { setDataFormLoading(false); }
  };

  const handleDeleteData = async (id) => {
    if (!window.confirm('确认删除此字典数据？')) return;
    try {
      const result = await dictService.deleteDictData(id);
      if (result.success) loadDatas(1);
      else alert(result.message || '删除失败');
    } catch (err) { alert(err.message || '请求失败'); }
  };

  const handleRefreshCache = async () => {
    try {
      const result = await dictService.refreshCache();
      setCacheMsg(result);
      setTimeout(() => setCacheMsg(null), 3000);
    } catch (err) { setCacheMsg({ success: false, message: err.message }); }
  };

  const statusLabel = (s) => s === '0' ? '正常' : '停用';

  const formModal = (title, form, setFormFn, initForm, fields, loading, error, onSubmit) => (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setFormFn(initForm); setTypeEditingId(null); setDataEditingId(null); } }}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={() => { setFormFn(initForm); setTypeEditingId(null); setDataEditingId(null); }}>×</button>
        </div>
        <form onSubmit={onSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-form-grid">
            {fields.map(f => (
              <div key={f.name} className={`form-group ${f.full ? 'form-group-full' : ''}`}>
                <label>{f.label} {f.required ? '*' : ''}</label>
                {f.type === 'select' ? (
                  <select value={form[f.name]} onChange={(e) => setFormFn(p => ({ ...p, [f.name]: e.target.value }))} disabled={loading}>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={form[f.name]} onChange={(e) => setFormFn(p => ({ ...p, [f.name]: e.target.value }))} rows="2" disabled={loading} />
                ) : (
                  <input type={f.inputType || 'text'} value={form[f.name]}
                    onChange={(e) => setFormFn(p => ({ ...p, [f.name]: f.inputType === 'number' ? Number(e.target.value) : e.target.value }))}
                    required={f.required} disabled={loading} />
                )}
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-create" disabled={loading}>{loading ? '提交中...' : '保存'}</button>
            <button type="button" className="btn btn-cancel" onClick={() => { setFormFn(initForm); setTypeEditingId(null); setDataEditingId(null); }}
              disabled={loading}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );

  const typeFields = [
    { name: 'dictName', label: '字典名称', required: true },
    { name: 'dictType', label: '字典类型编码', required: true },
    { name: 'status', label: '状态', type: 'select', options: [{ value: '0', label: '正常' }, { value: '1', label: '停用' }] },
    { name: 'remark', label: '备注', type: 'textarea', full: true },
  ];

  const dataFields = [
    { name: 'dictType', label: '字典类型', type: 'select', required: true, options: allTypes.map(t => ({ value: t.dictType, label: `${t.dictName} (${t.dictType})` })) },
    { name: 'dictLabel', label: '字典标签', required: true },
    { name: 'dictValue', label: '字典键值', required: true },
    { name: 'dictSort', label: '排序', inputType: 'number' },
    { name: 'cssClass', label: 'CSS类名' },
    { name: 'listClass', label: '列表样式' },
    { name: 'isDefault', label: '默认', type: 'select', options: [{ value: '0', label: '否' }, { value: '1', label: '是' }] },
    { name: 'status', label: '状态', type: 'select', options: [{ value: '0', label: '正常' }, { value: '1', label: '停用' }] },
  ];

  return (
    <div className="dict-container">
      <div className="dict-header">
        <h2>字典管理</h2>
        <div className="dict-header-actions">
          <button className="btn btn-health" onClick={handleRefreshCache}>刷新缓存</button>
        </div>
      </div>

      {cacheMsg && (
        <div className={`dict-cache-msg ${cacheMsg.success ? 'success' : 'error'}`}>
          {cacheMsg.message || JSON.stringify(cacheMsg)}
        </div>
      )}

      <div className="dict-tabs">
        {[{ key: 'type', label: '字典类型' }, { key: 'data', label: '字典数据' }].map(t => (
          <button key={t.key} className={`dict-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ======== Dict Type Tab ======== */}
      {activeTab === 'type' && (
        <>
          {typeError && <div className="alert alert-error">{typeError}</div>}
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-create" onClick={() => openTypeForm(null)}>新增字典类型</button>
          </div>
          <div className="dict-table-wrap">
            {typeLoading ? <div className="loading">加载中...</div> : (
              <>
                <table className="dict-table">
                  <thead>
                    <tr><th>ID</th><th>字典名称</th><th>类型编码</th><th>状态</th><th>备注</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    {types.length > 0 ? types.map(t => (
                      <tr key={t.id}>
                        <td>{t.id}</td><td>{t.dictName}</td><td className="dict-code">{t.dictType}</td>
                        <td><span className={`status ${t.status === '0' ? 'success' : 'muted'}`}>{statusLabel(t.status)}</span></td>
                        <td>{t.remark || '-'}</td>
                        <td>
                          <button className="btn btn-test btn-sm" onClick={() => openTypeForm(t)}>编辑</button>
                          <button className="btn btn-batch btn-sm" style={{ marginLeft: 4 }} onClick={() => handleDeleteType(t.id)}>删除</button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="6" className="no-data">暂无字典类型</td></tr>}
                  </tbody>
                </table>
                {typePagination.pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => loadTypes(typePagination.page - 1)} disabled={typePagination.page <= 1}>上一页</button>
                    <span className="page-info">第 {typePagination.page} 页，共 {typePagination.pages} 页 ({typePagination.total} 条)</span>
                    <button className="page-btn" onClick={() => loadTypes(typePagination.page + 1)} disabled={typePagination.page >= typePagination.pages}>下一页</button>
                  </div>
                )}
              </>
            )}
          </div>

          {(typeEditingId !== null || (typeForm.dictName || typeForm.dictType)) && formModal(
            typeEditingId ? '编辑字典类型' : '新增字典类型',
            typeForm, setTypeForm, INIT_TYPE, typeFields, typeFormLoading, typeFormError, handleTypeSubmit
          )}
        </>
      )}

      {/* ======== Dict Data Tab ======== */}
      {activeTab === 'data' && (
        <>
          {dataError && <div className="alert alert-error">{dataError}</div>}
          <div className="dict-data-toolbar">
            <div className="toolbar-group">
              <span className="toolbar-label">字典类型:</span>
              <select className="toolbar-select" value={dataFilterType} onChange={(e) => { setDataFilterType(e.target.value); }}>
                <option value="">全部</option>
                {allTypes.map(t => <option key={t.dictType} value={t.dictType}>{t.dictName} ({t.dictType})</option>)}
              </select>
            </div>
            <button className="btn btn-test" onClick={() => loadDatas(1)}>查询</button>
            <div className="toolbar-spacer"></div>
            <button className="btn btn-create" onClick={() => openDataForm(null)}>新增字典数据</button>
          </div>
          <div className="dict-table-wrap">
            {dataLoading ? <div className="loading">加载中...</div> : (
              <>
                <table className="dict-table">
                  <thead>
                    <tr><th>ID</th><th>类型</th><th>标签</th><th>键值</th><th>排序</th><th>样式</th><th>默认</th><th>状态</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    {datas.length > 0 ? datas.map(d => (
                      <tr key={d.id}>
                        <td>{d.id}</td><td className="dict-code">{d.dictType}</td><td>{d.dictLabel}</td>
                        <td className="dict-code">{d.dictValue}</td><td>{d.dictSort}</td>
                        <td>{d.listClass || d.cssClass || '-'}</td>
                        <td><span className={`status ${d.isDefault === '1' ? 'success' : 'muted'}`}>{d.isDefault === '1' ? '是' : '否'}</span></td>
                        <td><span className={`status ${d.status === '0' ? 'success' : 'muted'}`}>{statusLabel(d.status)}</span></td>
                        <td>
                          <button className="btn btn-test btn-sm" onClick={() => openDataForm(d)}>编辑</button>
                          <button className="btn btn-batch btn-sm" style={{ marginLeft: 4 }} onClick={() => handleDeleteData(d.id)}>删除</button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="9" className="no-data">暂无字典数据</td></tr>}
                  </tbody>
                </table>
                {dataPagination.pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => loadDatas(dataPagination.page - 1)} disabled={dataPagination.page <= 1}>上一页</button>
                    <span className="page-info">第 {dataPagination.page} 页，共 {dataPagination.pages} 页 ({dataPagination.total} 条)</span>
                    <button className="page-btn" onClick={() => loadDatas(dataPagination.page + 1)} disabled={dataPagination.page >= dataPagination.pages}>下一页</button>
                  </div>
                )}
              </>
            )}
          </div>

          {(dataEditingId !== null || dataForm.dictLabel) && formModal(
            dataEditingId ? '编辑字典数据' : '新增字典数据',
            dataForm, setDataForm, INIT_DATA, dataFields, dataFormLoading, dataFormError, handleDataSubmit
          )}
        </>
      )}
    </div>
  );
};

export default DictManagement;
