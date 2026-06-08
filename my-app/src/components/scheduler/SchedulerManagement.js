import React, { useState, useEffect, useCallback } from 'react';
import { reconciliationService } from '../../services';
import './SchedulerManagement.css';

const TASKS = [
  { key: 'alipay', name: '支付宝自动对帐', cron: '0 2 * * *', description: '每天凌晨 2:00，自动拉取前一日支付宝帐单与本地订单比对', icon: '💳' },
  { key: 'wechat', name: '微信支付自动对帐', cron: '0 3 * * *', description: '每天凌晨 3:00，自动拉取前一日微信支付帐单与本地订单比对', icon: '💚' },
  { key: 'health', name: '调度器健康监控', cron: '*/30 * * * *', description: '每 30 分钟打印调度器运行状态日志', icon: '💓' },
];

const parseCron = (cron) => {
  // Simple parsing for display: minute hour day month dow
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  const [min, hour] = parts;
  if (min === '0' && hour !== '*' && hour !== '*/') {
    return `每天 ${hour.padStart(2, '0')}:00`;
  }
  if (min.startsWith('*/')) {
    return `每 ${min.replace('*/', '')} 分钟`;
  }
  return cron;
};

const SchedulerManagement = () => {
  const [health, setHealth] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [healthR, recordsR, statsR] = await Promise.allSettled([
        reconciliationService.healthCheck(),
        reconciliationService.getRecords(1, 5),
        reconciliationService.getStats(),
      ]);
      if (healthR.status === 'fulfilled' && healthR.value?.success !== false) setHealth(healthR.value);
      if (recordsR.status === 'fulfilled' && recordsR.value?.success !== false)
        setRecords(recordsR.value.data || recordsR.value.records || []);
      if (statsR.status === 'fulfilled' && statsR.value?.success !== false) setStats(statsR.value);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRunReconciliation = async (asyncMode = false) => {
    setRunLoading(true);
    setRunResult(null);
    try {
      const data = { reconDate: new Date().toISOString().split('T')[0] };
      const r = asyncMode
        ? await reconciliationService.runReconciliationAsync(data)
        : await reconciliationService.runReconciliation(data);
      setRunResult({ ...r, asyncMode });
      if (r.success !== false) loadData();
    } catch (e) {
      setRunResult({ success: false, message: e.message, asyncMode });
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="scheduler-container">
      <div className="scheduler-header">
        <h2>调度任务</h2>
        <div className="scheduler-header-actions">
          <button className="btn btn-test" onClick={loadData} disabled={loading}>{loading ? '刷新中...' : '刷新'}</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Health status */}
      {health && (
        <div className={`scheduler-health ${health.status === 'UP' ? 'up' : 'down'}`}>
          <span className="health-dot"></span>
          <span>调度器状态: {health.status === 'UP' ? '运行中' : health.status}</span>
          <span style={{ marginLeft: 16, fontSize: 12, opacity: 0.7 }}>{health.message || ''}</span>
        </div>
      )}

      {/* Task cards */}
      <div className="scheduler-task-grid">
        {TASKS.map(task => (
          <div key={task.key} className="scheduler-task-card">
            <div className="task-card-header">
              <span className="task-card-icon">{task.icon}</span>
              <div>
                <div className="task-card-name">{task.name}</div>
                <div className="task-card-schedule">{parseCron(task.cron)}</div>
              </div>
            </div>
            <div className="task-card-body">
              <div className="task-card-desc">{task.description}</div>
              <div className="task-card-cron">
                <code>{task.cron}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual trigger */}
      <div className="scheduler-section">
        <h3>手动触发对帐</h3>
        <div className="scheduler-trigger-row">
          <button
            className="btn btn-primary"
            onClick={() => handleRunReconciliation(false)}
            disabled={runLoading}
          >
            {runLoading ? '运行中...' : '同步执行对帐'}
          </button>
          <button
            className="btn btn-test"
            onClick={() => handleRunReconciliation(true)}
            disabled={runLoading}
          >
            {runLoading ? '运行中...' : '异步执行对帐'}
          </button>
        </div>
        {runResult && (
          <div className={`scheduler-run-result ${runResult.success !== false ? 'success' : 'error'}`}>
            {runResult.asyncMode ? '异步' : '同步'}对帐: {runResult.success !== false ? '✅ 成功' : `❌ ${runResult.message || '失败'}`}
            {runResult.data && <span> — {JSON.stringify(runResult.data).substring(0, 120)}</span>}
          </div>
        )}
      </div>

      {/* Recent records */}
      <div className="scheduler-section">
        <h3>最近对帐记录</h3>
        {records.length > 0 ? (
          <table className="scheduler-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>对帐日期</th>
                <th>总订单数</th>
                <th>匹配数</th>
                <th>差异数</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.reconDate || '-'}</td>
                  <td>{r.totalCount ?? '-'}</td>
                  <td>{r.matchCount ?? '-'}</td>
                  <td><span style={{ color: (r.diffCount || 0) > 0 ? '#e53e3e' : '#38a169' }}>{r.diffCount ?? 0}</span></td>
                  <td><span className={`scheduler-status ${r.status === 'SUCCESS' ? 'success' : 'fail'}`}>{r.status || '-'}</span></td>
                  <td>{r.createTime ? new Date(r.createTime).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="loading" style={{ padding: 24 }}>暂无对帐记录</div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="scheduler-section">
          <h3>对帐统计</h3>
          <div className="scheduler-stats-grid">
            {stats.totalRecords != null && <div className="stat-card"><div className="stat-num">{stats.totalRecords}</div><div className="stat-label">总记录数</div></div>}
            {stats.matchedCount != null && <div className="stat-card"><div className="stat-num matched">{stats.matchedCount}</div><div className="stat-label">匹配成功</div></div>}
            {stats.diffCount != null && <div className="stat-card"><div className="stat-num diff">{stats.diffCount}</div><div className="stat-label">差异记录</div></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerManagement;
