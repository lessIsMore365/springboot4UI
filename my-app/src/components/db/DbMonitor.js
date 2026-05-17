import React, { useState, useEffect, useCallback } from 'react';
import { monitorService } from '../../services';
import './DbMonitor.css';

const StatusBadge = ({ status }) => {
  const color = status === 'HEALTHY' ? '#22c55e' : status === 'UNHEALTHY' ? '#f59e0b' : '#ef4444';
  return <span className="db-badge" style={{ background: color }}>{status || 'UNKNOWN'}</span>;
};

const DbMonitor = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [pool, setPool] = useState(null);
  const [tables, setTables] = useState([]);
  const [latency, setLatency] = useState(null);
  const [slowSql, setSlowSql] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const result = await monitorService.getDbOverview();
      if (result.success) setOverview(result.data);
    } catch { /* silent */ }
  }, []);

  const fetchPool = useCallback(async () => {
    try {
      const result = await monitorService.getDbPool();
      if (result.success) setPool(result.data);
    } catch { /* silent */ }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const result = await monitorService.getDbTables();
      if (result.success) setTables(result.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchLatency = useCallback(async () => {
    try {
      const result = await monitorService.getDbLatency();
      if (result.success) setLatency(result.data);
    } catch { /* silent */ }
  }, []);

  const fetchSlowSql = useCallback(async () => {
    try {
      const result = await monitorService.getSlowSql();
      if (result.success) setSlowSql(result.data);
    } catch { /* silent */ }
  }, []);

  const resetSlowSql = async () => {
    try {
      const result = await monitorService.resetSlowSql();
      if (result.success) {
        setSlowSql(null);
        fetchSlowSql();
      }
    } catch { /* silent */ }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchOverview(), fetchPool(), fetchTables(), fetchLatency()]);
    } catch (err) {
      setError(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, fetchPool, fetchTables, fetchLatency]);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchAll]);

  const tabs = [
    { key: 'overview', label: '概览' },
    { key: 'pool', label: '连接池' },
    { key: 'tables', label: '表统计' },
    { key: 'slowSql', label: '慢 SQL' },
    { key: 'latency', label: '延迟测试' },
  ];

  const db = overview?.db;
  const overviewPool = overview?.pool;

  return (
    <div className="db-page">
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h2>数据库监控</h2>
          <span className="db-header-sub">
            {db ? `${db.productName} ${db.productVersion}` : '加载中...'}
          </span>
        </div>
        <div className="db-header-right">
          <label className="db-refresh-toggle">
            <input type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span>自动刷新 (10s)</span>
          </label>
          <button className="db-btn db-btn-sm" onClick={fetchAll} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      {overview && (
        <div className="db-quick-stats">
          <div className="db-stat-card">
            <span className="db-stat-val">{overview.health === 'HEALTHY' ? '正常' : '异常'}</span>
            <span className="db-stat-label">健康状态</span>
          </div>
          <div className="db-stat-card">
            <span className="db-stat-val">{overviewPool?.activeConnections ?? '-'}</span>
            <span className="db-stat-label">活跃连接</span>
          </div>
          <div className="db-stat-card">
            <span className="db-stat-val">{overviewPool?.usagePercent != null ? overviewPool.usagePercent + '%' : '-'}</span>
            <span className="db-stat-label">池使用率</span>
          </div>
          <div className="db-stat-card">
            <span className="db-stat-val">{tables.length}</span>
            <span className="db-stat-label">用户表</span>
          </div>
        </div>
      )}

      {error && <div className="db-alert db-alert-error">{error}</div>}

      {/* Tabs */}
      <div className="db-tabs">
        {tabs.map(t => (
          <button key={t.key}
            className={`db-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(t.key);
              if (t.key === 'slowSql' && !slowSql) fetchSlowSql();
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && !overview && <div className="db-loading">加载中...</div>}

      {/* Tab: Overview */}
      {activeTab === 'overview' && overview && (
        <div className="db-card">
          {db && (
            <>
              <h4>数据库信息</h4>
              <div className="db-info-grid">
                <div className="db-info-item"><label>数据库</label><span>{db.productName} {db.productVersion}</span></div>
                <div className="db-info-item"><label>驱动</label><span>{db.driverName} {db.driverVersion}</span></div>
                <div className="db-info-item"><label>JDBC URL</label><span className="db-mono">{db.jdbcUrl}</span></div>
                <div className="db-info-item"><label>用户</label><span>{db.username}</span></div>
                <div className="db-info-item"><label>事务隔离</label><span>{db.defaultTransactionIsolation}</span></div>
                <div className="db-info-item"><label>最大连接数</label><span>{db.maxConnections}</span></div>
              </div>
            </>
          )}

          {overviewPool && (
            <>
              <h4 style={{ marginTop: db ? 28 : 0 }}>连接池状态</h4>
              <div className="db-pool-bars">
                <div className="db-pool-bar-item">
                  <div className="db-pool-bar-label">活跃 <strong>{overviewPool.activeConnections}</strong> / 最大 {overviewPool.maxPoolSize}</div>
                  <div className="db-pool-bar">
                    <div className="db-pool-bar-fill active"
                      style={{ width: `${Math.min((overviewPool.activeConnections / overviewPool.maxPoolSize) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="db-pool-bar-item">
                  <div className="db-pool-bar-label">空闲 <strong>{overviewPool.idleConnections}</strong> / 总数 {overviewPool.totalConnections}</div>
                  <div className="db-pool-bar">
                    <div className="db-pool-bar-fill idle"
                      style={{ width: `${(overviewPool.idleConnections / overviewPool.totalConnections) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="db-pool-grid">
                <div className="db-info-item"><label>等待连接线程</label><span className={overviewPool.threadsAwaitingConnection > 0 ? 'db-warn' : ''}>{overviewPool.threadsAwaitingConnection}</span></div>
                <div className="db-info-item"><label>最小空闲</label><span>{overviewPool.minIdle}</span></div>
                <div className="db-info-item"><label>使用率</label><span>{overviewPool.usagePercent}%</span></div>
                <div className="db-info-item"><label>连接超时</label><span>{overviewPool.connectionTimeoutMs}ms</span></div>
              </div>
            </>
          )}

          <div className="db-health-row">
            <span>健康状态：</span>
            <StatusBadge status={overview.health} />
          </div>
        </div>
      )}

      {/* Tab: Pool */}
      {activeTab === 'pool' && pool?.pool && (
        <div className="db-card">
          <h4>连接池详情</h4>
          <div className="db-pool-bars">
            <div className="db-pool-bar-item">
              <div className="db-pool-bar-label">活跃 <strong>{pool.pool.activeConnections}</strong> / 最大 {pool.pool.maxPoolSize}</div>
              <div className="db-pool-bar">
                <div className="db-pool-bar-fill active"
                  style={{ width: `${Math.min((pool.pool.activeConnections / pool.pool.maxPoolSize) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="db-pool-bar-item">
              <div className="db-pool-bar-label">空闲 <strong>{pool.pool.idleConnections}</strong> / 总数 {pool.pool.totalConnections}</div>
              <div className="db-pool-bar">
                <div className="db-pool-bar-fill idle"
                  style={{ width: `${(pool.pool.idleConnections / pool.pool.totalConnections) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="db-info-grid">
            <div className="db-info-item"><label>连接池名称</label><span>{pool.pool.poolName}</span></div>
            <div className="db-info-item"><label>使用率</label><span>{pool.pool.usagePercent}%</span></div>
            <div className="db-info-item"><label>等待连接数</label><span>{pool.pool.threadsAwaitingConnection}</span></div>
            <div className="db-info-item"><label>最小空闲</label><span>{pool.pool.minIdle}</span></div>
            <div className="db-info-item"><label>最大连接数</label><span>{pool.pool.maxPoolSize}</span></div>
            <div className="db-info-item"><label>连接超时</label><span>{pool.pool.connectionTimeoutMs}ms</span></div>
            <div className="db-info-item"><label>空闲超时</label><span>{pool.pool.idleTimeoutMs}ms</span></div>
            <div className="db-info-item"><label>最大生命周期</label><span>{pool.pool.maxLifetimeMs}ms</span></div>
          </div>

          {pool.cumulative && (
            <>
              <h4 style={{ marginTop: 28 }}>累计统计</h4>
              <div className="db-info-grid">
                <div className="db-info-item"><label>已创建连接</label><span>{pool.cumulative.totalConnectionsCreated}</span></div>
                <div className="db-info-item"><label>已关闭连接</label><span>{pool.cumulative.totalConnectionsClosed}</span></div>
                <div className="db-info-item"><label>超时次数</label><span className={pool.cumulative.totalConnectionTimeouts > 0 ? 'db-warn' : ''}>{pool.cumulative.totalConnectionTimeouts}</span></div>
                <div className="db-info-item"><label>验证失败</label><span className={pool.cumulative.totalFailedValidations > 0 ? 'db-warn' : ''}>{pool.cumulative.totalFailedValidations}</span></div>
              </div>
            </>
          )}

          {pool.uptimeFormatted && (
            <div className="db-uptime">运行时间: {pool.uptimeFormatted}</div>
          )}
        </div>
      )}

      {/* Tab: Tables */}
      {activeTab === 'tables' && (
        <div className="db-card">
          <h4>表统计</h4>
          {tables.length === 0 ? (
            <div className="db-empty">暂无表数据</div>
          ) : (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>表名</th>
                    <th>行数</th>
                    <th>总大小</th>
                    <th>表大小</th>
                    <th>索引大小</th>
                    <th>索引数</th>
                    <th>全表扫描</th>
                    <th>死行</th>
                    <th>上次 VACUUM</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map(t => (
                    <tr key={t.tableName}>
                      <td className="db-td-name">{t.schemaName}.{t.tableName}</td>
                      <td>{t.rowCountEstimate}</td>
                      <td>{t.totalSize}</td>
                      <td>{t.tableSize}</td>
                      <td>{t.indexSize}</td>
                      <td>{t.indexCount}</td>
                      <td>{t.seqScans}</td>
                      <td className={t.nDeadTup > 100 ? 'db-warn' : ''}>{t.nDeadTup}</td>
                      <td className="db-td-time">{t.lastVacuum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Slow SQL */}
      {activeTab === 'slowSql' && (
        <div className="db-card">
          <div className="db-slowsql-header">
            <h4 style={{ margin: 0 }}>慢 SQL 统计</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {slowSql && <span style={{ fontSize: 12, color: '#718096' }}>阈值: {slowSql.thresholdMs}ms</span>}
              <button className="db-btn db-btn-sm" onClick={fetchSlowSql}>刷新</button>
              <button className="db-btn db-btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
                onClick={resetSlowSql}>重置</button>
            </div>
          </div>

          {!slowSql ? (
            <div className="db-empty" style={{ marginTop: 16 }}>点击"慢 SQL"标签加载数据</div>
          ) : slowSql.stats && slowSql.stats.length === 0 ? (
            <div className="db-empty" style={{ marginTop: 16, color: '#38a169' }}>暂无慢 SQL 记录</div>
          ) : slowSql.stats && (
            <>
              <div style={{ marginBottom: 8, display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 13, color: '#718096' }}>SQL 模板数: <strong>{slowSql.stats.length}</strong></span>
                <span style={{ fontSize: 13, color: slowSql.totalSlowCount > 0 ? '#dd6b20' : '#38a169' }}>慢查询总数: <strong>{slowSql.totalSlowCount}</strong></span>
              </div>

              {/* Aggregated SQL Stats */}
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 300 }}>SQL 模板</th>
                      <th>执行次数</th>
                      <th>总耗时</th>
                      <th>平均</th>
                      <th>最大</th>
                      <th>慢次数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowSql.stats.map((s, i) => (
                      <tr key={i}>
                        <td className="db-sql-text">{s.sql}</td>
                        <td>{s.count}</td>
                        <td>{s.totalTimeMs}ms</td>
                        <td>{s.avgTimeMs?.toFixed(2)}ms</td>
                        <td className={s.maxTimeMs > slowSql.thresholdMs ? 'db-warn' : ''}>{s.maxTimeMs}ms</td>
                        <td className={s.slowCount > 0 ? 'db-warn' : ''}>{s.slowCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Recent Slow SQL Details */}
          {slowSql?.recentSlowSqls && slowSql.recentSlowSqls.length > 0 && (
            <>
              <h4 style={{ marginTop: 24, marginBottom: 12 }}>最近慢 SQL 明细</h4>
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 300 }}>SQL</th>
                      <th>耗时</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowSql.recentSlowSqls.map((s, i) => (
                      <tr key={i}>
                        <td className="db-sql-text">{s.sql}</td>
                        <td className="db-warn">{s.elapsedMs}ms</td>
                        <td style={{ fontSize: 12 }}>{new Date(s.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Latency */}
      {activeTab === 'latency' && latency && (
        <div className="db-card">
          <h4>连接延迟测试</h4>
          <div className="db-latency-card">
            <div className="db-latency-main">
              <span className="db-latency-val">{latency.latencyMs}</span>
              <span className="db-latency-unit">ms</span>
            </div>
            <div className="db-latency-info">
              <span>连接有效: <strong>{latency.valid ? '是' : '否'}</strong></span>
              <span>超时设置: <strong>{latency.timeoutMs}ms</strong></span>
              <span>结果: <strong>{latency.result}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DbMonitor;
