import React, { useState, useEffect } from 'react';
import { reconciliationService } from '../../services';
import './Reconciliation.css';

const ReconciliationManagement = () => {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAsync, setUseAsync] = useState(false);

  const [runForm, setRunForm] = useState({ date: '', paymentMethod: 'ALIPAY' });
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const [detailRecordId, setDetailRecordId] = useState('');
  const [details, setDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statsForm, setStatsForm] = useState({ startDate: '', endDate: '' });
  const [statsResult, setStatsResult] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadRecords = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await reconciliationService.getRecords(page, pagination.size);
      if (result.success) {
        setRecords(result.data || []);
        setPagination(result.pagination || { page, size: pagination.size, total: 0, pages: 0 });
      } else {
        setError(result.message || '获取对帐记录失败');
      }
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) loadRecords(newPage);
  };

  const today = () => new Date().toISOString().split('T')[0];

  const handleRunReconciliation = async (e) => {
    e.preventDefault();
    setRunLoading(true);
    setRunResult(null);
    try {
      const payload = {
        paymentMethod: runForm.paymentMethod,
      };
      if (runForm.date) payload.date = runForm.date;
      const result = useAsync
        ? await reconciliationService.runReconciliationAsync(payload)
        : await reconciliationService.runReconciliation(payload);
      setRunResult(result);
      if (result.success) loadRecords(1);
    } catch (err) {
      setRunResult({ success: false, message: err.message });
    } finally {
      setRunLoading(false);
    }
  };

  const handleQueryDetails = async () => {
    if (!detailRecordId.trim()) return;
    setDetailLoading(true);
    setDetails(null);
    try {
      const result = await reconciliationService.getDetails(parseInt(detailRecordId));
      setDetails(result);
    } catch (err) {
      setDetails({ success: false, message: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGetStats = async () => {
    if (!statsForm.startDate || !statsForm.endDate) return;
    setStatsLoading(true);
    setStatsResult(null);
    try {
      const result = await reconciliationService.getStats(statsForm.startDate, statsForm.endDate);
      setStatsResult(result);
    } catch (err) {
      setStatsResult({ success: false, message: err.message });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const result = await reconciliationService.healthCheck();
      alert(`对帐服务: ${result.status || 'UP'}\n定时任务: ${result.schedule || '-'}\n支持方式: ${(result.supportedMethods || []).join(', ')}`);
    } catch (err) {
      alert(`健康检查失败: ${err.message}`);
    }
  };

  const reconStatusLabel = (s) => {
    const map = { SUCCESS: '一致', DIFF: '存在差异', ERROR: '异常' };
    return map[s] || s;
  };

  const reconStatusClass = (s) => {
    const map = { SUCCESS: 'success', DIFF: 'warning', ERROR: 'error' };
    return map[s] || '';
  };

  const diffTypeLabel = (t) => {
    const map = { MATCH: '一致', MISMATCH: '不符', LOCAL_ONLY: '仅本地', REMOTE_ONLY: '仅平台' };
    return map[t] || t;
  };

  return (
    <div className="recon-container">
      <div className="recon-header">
        <h2>对帐管理</h2>
        <div className="recon-actions">
          <button className={`btn btn-toggle ${useAsync ? 'active' : ''}`} onClick={() => setUseAsync(!useAsync)}>
            {useAsync ? '异步模式' : '同步模式'}
          </button>
          <button className="btn btn-health" onClick={handleHealthCheck}>健康检查</button>
        </div>
      </div>

      {error && <div className="alert alert-error"><strong>错误:</strong> {error}</div>}

      {/* Run Reconciliation */}
      <div className="recon-run-section">
        <h3>手动触发对帐</h3>
        <form onSubmit={handleRunReconciliation} className="recon-run-form">
          <div className="form-row">
            <div className="form-group">
              <label>对帐日期</label>
              <input type="date" value={runForm.date}
                onChange={(e) => setRunForm(p => ({ ...p, date: e.target.value }))}
                placeholder={today()} disabled={runLoading} />
              <span className="form-hint">默认昨天</span>
            </div>
            <div className="form-group">
              <label>支付方式</label>
              <select value={runForm.paymentMethod}
                onChange={(e) => setRunForm(p => ({ ...p, paymentMethod: e.target.value }))}
                disabled={runLoading}>
                <option value="ALIPAY">支付宝</option>
                <option value="WECHAT">微信支付</option>
              </select>
            </div>
            <div className="form-group form-group-btn">
              <button type="submit" className="btn btn-create" disabled={runLoading}>
                {runLoading ? '对帐中...' : '开始对帐'}
              </button>
            </div>
          </div>
        </form>
        {runResult && (
          <div className={`recon-run-result ${runResult.success ? 'success' : 'error'}`}>
            {runResult.success && runResult.data ? (
              <div className="recon-summary">
                <div className="recon-summary-item">
                  <span className="label">状态</span>
                  <span className={`value ${reconStatusClass(runResult.data.status)}`}>
                    {reconStatusLabel(runResult.data.status)}
                  </span>
                </div>
                <div className="recon-summary-item">
                  <span className="label">本地笔数/金额</span>
                  <span className="value">{runResult.data.localCount}笔 / ¥{Number(runResult.data.localTotalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="recon-summary-item">
                  <span className="label">平台笔数/金额</span>
                  <span className="value">{runResult.data.remoteCount}笔 / ¥{Number(runResult.data.remoteTotalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="recon-summary-item">
                  <span className="label">差异笔数/金额</span>
                  <span className="value">{runResult.data.diffCount}笔 / ¥{Number(runResult.data.diffAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <pre>{JSON.stringify(runResult, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      {/* Query Tools */}
      <div className="admin-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">对帐明细:</span>
          <input type="number" className="toolbar-input" placeholder="对帐记录ID" value={detailRecordId}
            onChange={(e) => setDetailRecordId(e.target.value)} />
          <button className="btn btn-test" onClick={handleQueryDetails} disabled={detailLoading}>
            {detailLoading ? '查询中...' : '查询明细'}
          </button>
        </div>
        <div className="toolbar-group">
          <span className="toolbar-label">对帐统计:</span>
          <input type="date" value={statsForm.startDate}
            onChange={(e) => setStatsForm(p => ({ ...p, startDate: e.target.value }))} />
          <span className="toolbar-hint">至</span>
          <input type="date" value={statsForm.endDate}
            onChange={(e) => setStatsForm(p => ({ ...p, endDate: e.target.value }))} />
          <button className="btn btn-test" onClick={handleGetStats} disabled={statsLoading}>
            {statsLoading ? '查询中...' : '查询统计'}
          </button>
        </div>
      </div>

      {/* Details Result */}
      {details && (
        <div className="test-result">
          <div className="test-result-header">
            <span>对帐明细</span>
            <button className="btn-close" onClick={() => setDetails(null)}>×</button>
          </div>
          {details.success && details.data?.summary && (
            <div className="detail-summary">
              <span>总计: {details.data.summary.total}</span>
              <span className="success">一致: {details.data.summary.match}</span>
              <span className="warning">不符: {details.data.summary.mismatch}</span>
              <span className="error">仅本地: {details.data.summary.localOnly}</span>
              <span className="info">仅平台: {details.data.summary.remoteOnly}</span>
            </div>
          )}
          {details.success && details.data?.details?.length > 0 && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>交易号</th>
                  <th>本地金额</th>
                  <th>平台金额</th>
                  <th>本地状态</th>
                  <th>平台状态</th>
                  <th>差异类型</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {details.data.details.map(d => (
                  <tr key={d.id}>
                    <td>{d.orderNo}</td>
                    <td>{d.tradeNo || '-'}</td>
                    <td>¥{Number(d.localAmount || 0).toFixed(2)}</td>
                    <td>¥{Number(d.remoteAmount || 0).toFixed(2)}</td>
                    <td>{d.localStatus || '-'}</td>
                    <td>{d.remoteStatus || '-'}</td>
                    <td>{diffTypeLabel(d.diffType)}</td>
                    <td>{d.diffDesc || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(!details.data?.details || details.data.details.length === 0) && (
            <pre>{JSON.stringify(details, null, 2)}</pre>
          )}
        </div>
      )}

      {/* Stats Result */}
      {statsResult && (
        <div className="test-result">
          <div className="test-result-header">
            <span>对帐统计</span>
            <button className="btn-close" onClick={() => setStatsResult(null)}>×</button>
          </div>
          <pre>{JSON.stringify(statsResult, null, 2)}</pre>
        </div>
      )}

      {/* Records Table */}
      <div className="recon-table-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <table className="recon-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>对帐日期</th>
                  <th>支付方式</th>
                  <th>本地笔数</th>
                  <th>本地金额</th>
                  <th>平台笔数</th>
                  <th>平台金额</th>
                  <th>差异笔数</th>
                  <th>差异金额</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.reconDate}</td>
                      <td>{r.paymentMethod}</td>
                      <td>{r.localCount}</td>
                      <td>¥{Number(r.localTotalAmount || 0).toFixed(2)}</td>
                      <td>{r.remoteCount}</td>
                      <td>¥{Number(r.remoteTotalAmount || 0).toFixed(2)}</td>
                      <td>{r.diffCount}</td>
                      <td>¥{Number(r.diffAmount || 0).toFixed(2)}</td>
                      <td>
                        <span className={`status ${reconStatusClass(r.status)}`}>
                          {reconStatusLabel(r.status)}
                        </span>
                      </td>
                      <td>{r.createTime ? new Date(r.createTime).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="11" className="no-data">暂无对帐记录</td></tr>
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

      <div className="recon-info">
        <p>当前模式: <strong>{useAsync ? '异步（虚拟线程）' : '同步'}</strong></p>
        <p>自动对帐调度: 支付宝每日 2:00，微信支付每日 3:00</p>
      </div>
    </div>
  );
};

export default ReconciliationManagement;
