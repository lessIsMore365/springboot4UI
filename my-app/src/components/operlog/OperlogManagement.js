import React, { useState, useEffect } from 'react';
import { monitorService } from '../../services';
import './OperlogManagement.css';

const BUSINESS_TYPES = ['', 'INSERT', 'UPDATE', 'DELETE', 'GRANT', 'EXPORT', 'IMPORT', 'OTHER'];

const OperlogManagement = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [operName, setOperName] = useState('');
  const [title, setTitle] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [status, setStatus] = useState('');

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupResult, setCleanupResult] = useState(null);

  const loadLogs = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size: pagination.size };
      if (operName) params.operName = operName;
      if (title) params.title = title;
      if (businessType) params.businessType = businessType;
      if (status) params.status = status;
      const result = await monitorService.getOperlogs(params);
      if (result.success) {
        setLogs(result.data || []);
        setPagination(result.pagination || { page, size: pagination.size, total: 0, pages: 0 });
      } else {
        setError(result.message || '获取操作日志失败');
      }
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) loadLogs(newPage);
  };

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const result = await monitorService.getOperlogDetail(id);
      setDetail(result);
    } catch (err) {
      setDetail({ success: false, message: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      const result = await monitorService.deleteOperlogs(cleanupDays);
      setCleanupResult(result);
      if (result.success) loadLogs(1);
    } catch (err) {
      setCleanupResult({ success: false, message: err.message });
    }
  };

  const businessTypeLabel = (t) => {
    const map = { INSERT: '新增', UPDATE: '修改', DELETE: '删除', GRANT: '授权', EXPORT: '导出', IMPORT: '导入', OTHER: '其他' };
    return map[t] || t;
  };

  return (
    <div className="operlog-container">
      <h2>操作日志</h2>

      <div className="operlog-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">操作人:</span>
          <input type="text" className="toolbar-input" value={operName} onChange={(e) => setOperName(e.target.value)} />
        </div>
        <div className="toolbar-group">
          <span className="toolbar-label">标题:</span>
          <input type="text" className="toolbar-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="toolbar-group">
          <span className="toolbar-label">业务类型:</span>
          <select className="toolbar-select" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t || '全部'}</option>)}
          </select>
        </div>
        <div className="toolbar-group">
          <span className="toolbar-label">状态:</span>
          <select className="toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部</option>
            <option value="0">成功</option>
            <option value="1">失败</option>
          </select>
        </div>
        <button className="btn btn-test" onClick={() => loadLogs(1)} disabled={loading}>查询</button>
        <div className="toolbar-spacer"></div>
        <div className="toolbar-group">
          <span className="toolbar-label">清理 (天):</span>
          <input type="number" className="toolbar-input toolbar-input-sm" value={cleanupDays}
            onChange={(e) => setCleanupDays(Number(e.target.value))} min="1" />
          <button className="btn btn-batch" onClick={handleCleanup}>清理</button>
        </div>
      </div>

      {cleanupResult && (
        <div className={`operlog-cleanup-result ${cleanupResult.success ? 'success' : 'error'}`}>
          {cleanupResult.message || JSON.stringify(cleanupResult)}
          <button className="btn-close-sm" onClick={() => setCleanupResult(null)}>×</button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="operlog-table-wrap">
        {loading ? <div className="loading">加载中...</div> : (
          <>
            <table className="operlog-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>业务类型</th>
                  <th>操作人</th>
                  <th>请求方式</th>
                  <th>URL</th>
                  <th>IP</th>
                  <th>状态</th>
                  <th>耗时</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.title || '-'}</td>
                    <td><span className={`operlog-btype ${(log.businessType || '').toLowerCase()}`}>{businessTypeLabel(log.businessType)}</span></td>
                    <td>{log.operName || '-'}</td>
                    <td><span className="operlog-method">{log.requestMethod || '-'}</span></td>
                    <td className="cell-ellipsis" title={log.operUrl}>{log.operUrl || '-'}</td>
                    <td>{log.operIp || '-'}</td>
                    <td><span className={`status ${log.status === 0 ? 'success' : 'error'}`}>{log.status === 0 ? '成功' : '失败'}</span></td>
                    <td>{log.costTime != null ? `${log.costTime}ms` : '-'}</td>
                    <td>{log.createTime ? new Date(log.createTime).toLocaleString() : '-'}</td>
                    <td><button className="btn btn-test btn-sm" onClick={() => handleViewDetail(log.id)} disabled={detailLoading}>详情</button></td>
                  </tr>
                )) : <tr><td colSpan="11" className="no-data">暂无操作日志</td></tr>}
              </tbody>
            </table>
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>上一页</button>
                <span className="page-info">第 {pagination.page} 页，共 {pagination.pages} 页 ({pagination.total} 条)</span>
                <button className="page-btn" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>下一页</button>
              </div>
            )}
          </>
        )}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal-content modal-wide">
            <div className="modal-header">
              <h3>操作日志详情</h3>
              <button className="btn-close" onClick={() => setDetail(null)}>×</button>
            </div>
            {detail.success ? (
              <div className="operlog-detail">
                <table className="detail-table">
                  <tbody>
                    {[
                      ['标题', detail.data?.title], ['业务类型', businessTypeLabel(detail.data?.businessType)],
                      ['方法', detail.data?.method], ['请求方式', detail.data?.requestMethod],
                      ['操作人', detail.data?.operName], ['URL', detail.data?.operUrl],
                      ['IP', detail.data?.operIp], ['状态', detail.data?.status === 0 ? '成功' : '失败'],
                      ['耗时', detail.data?.costTime != null ? `${detail.data.costTime}ms` : '-'],
                      ['时间', detail.data?.createTime ? new Date(detail.data.createTime).toLocaleString() : '-'],
                    ].map(([label, value], i) => (
                      <tr key={i}><td className="detail-label">{label}</td><td>{value ?? '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="operlog-json-section">
                  <h4>请求参数</h4>
                  <pre className="operlog-json-pre">{(() => { try { return JSON.stringify(JSON.parse(detail.data?.operParam), null, 2); } catch { return detail.data?.operParam || '-'; } })()}</pre>
                </div>
                <div className="operlog-json-section">
                  <h4>响应结果</h4>
                  <pre className="operlog-json-pre">{(() => { try { return JSON.stringify(JSON.parse(detail.data?.jsonResult), null, 2); } catch { return detail.data?.jsonResult || '-'; } })()}</pre>
                </div>
              </div>
            ) : <div className="alert alert-error">{detail.message || '获取详情失败'}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperlogManagement;
