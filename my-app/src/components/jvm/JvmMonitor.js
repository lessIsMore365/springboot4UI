import React, { useState, useEffect, useCallback } from 'react';
import { monitorService } from '../../services';
import './JvmMonitor.css';

const formatBytes = (bytes) => {
  if (!bytes || bytes < 0) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
};

const formatMs = (ms) => {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  return (ms / 60000).toFixed(1) + 'min';
};

const ProgressBar = ({ label, used, max, formatFn = formatBytes }) => {
  const pct = max > 0 ? (used / max) * 100 : 0;
  const color = pct > 85 ? '#e53e3e' : pct > 60 ? '#dd6b20' : '#38a169';
  return (
    <div className="jvm-bar-item">
      <div className="jvm-bar-label">
        <span>{label}</span>
        <span>{formatFn(used)} / {formatFn(max)}</span>
      </div>
      <div className="jvm-bar-track">
        <div className="jvm-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="jvm-bar-pct" style={{ color }}>{pct.toFixed(1)}%</span>
    </div>
  );
};

const JvmMonitor = () => {
  const [overview, setOverview] = useState(null);
  const [threads, setThreads] = useState(null);
  const [threadDump, setThreadDump] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchOverview = useCallback(async () => {
    try {
      const [ov, th] = await Promise.all([
        monitorService.getOverview(),
        monitorService.getThreads(),
      ]);
      if (ov.success) setOverview(ov.data);
      if (th.success) setThreads(th.data);
      setError('');
    } catch (err) {
      setError(err.message || '获取监控数据失败');
    }
  }, []);

  const fetchThreadDump = async () => {
    setLoading(true);
    try {
      const result = await monitorService.getThreadDump();
      if (result.success) setThreadDump(result.data);
      else setError(result.message || '获取线程转储失败');
    } catch (err) {
      setError(err.message || '获取线程转储失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchOverview, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchOverview]);

  const mem = overview?.memory;

  const threadStateColors = {
    RUNNABLE: '#38a169',
    WAITING: '#718096',
    TIMED_WAITING: '#dd6b20',
    BLOCKED: '#e53e3e',
    TERMINATED: '#a0aec0',
  };

  return (
    <div className="jvm-container">
      <div className="jvm-header">
        <h2>JVM 监控</h2>
        <div className="jvm-header-actions">
          <label className="jvm-auto-refresh">
            <input type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span>自动刷新 (5s)</span>
          </label>
          <button className="btn btn-test" onClick={fetchOverview} disabled={loading}>
            {loading ? '刷新中...' : '手动刷新'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error"><strong>错误:</strong> {error}</div>}

      {overview && (
        <div className="jvm-overview-bar">
          <div className="jvm-info-chip">
            <span className="jvm-info-label">JVM</span>
            <span className="jvm-info-value">{overview.jvmName} {overview.jvmVersion}</span>
          </div>
          <div className="jvm-info-chip">
            <span className="jvm-info-label">运行时间</span>
            <span className="jvm-info-value">{overview.uptimeFormatted}</span>
          </div>
          <div className="jvm-info-chip">
            <span className="jvm-info-label">可用核心</span>
            <span className="jvm-info-value">{overview.availableProcessors}</span>
          </div>
          <div className="jvm-info-chip">
            <span className="jvm-info-label">系统负载</span>
            <span className="jvm-info-value">{overview.systemLoadAverage?.toFixed(2) || '-'}</span>
          </div>
        </div>
      )}

      <div className="jvm-tabs">
        {[
          { key: 'overview', label: '概览' },
          { key: 'memory', label: '内存' },
          { key: 'threads', label: '线程' },
          { key: 'gc', label: 'GC' },
          { key: 'threadDump', label: '线程转储' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`jvm-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'threadDump' && !threadDump) fetchThreadDump();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="jvm-content">
        {activeTab === 'overview' && overview && (
          <div className="jvm-grid">
            <div className="jvm-card">
              <h4>堆内存</h4>
              {mem && <ProgressBar label="堆内存使用" used={mem.heapUsed} max={mem.heapMax} />}
              {mem && <ProgressBar label="元空间" used={mem.metaspaceUsed} max={mem.metaspaceMax} />}
              {mem && <div className="jvm-stat-row">
                <span>非堆已用: {formatBytes(mem.nonHeapUsed)}</span>
                <span>堆已提交: {formatBytes(mem.heapCommitted)}</span>
              </div>}
            </div>
            <div className="jvm-card">
              <h4>线程</h4>
              {overview.threads && (
                <div className="jvm-thread-stats">
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{overview.threads.currentCount}</span>
                    <span className="jvm-thread-label">当前线程</span>
                  </div>
                  <div className="jvm-thread-stat virtual">
                    <span className="jvm-thread-num">{overview.threads.virtualCount}</span>
                    <span className="jvm-thread-label">虚拟线程</span>
                  </div>
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{overview.threads.platformCount}</span>
                    <span className="jvm-thread-label">平台线程</span>
                  </div>
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{overview.threads.peakCount}</span>
                    <span className="jvm-thread-label">历史峰值</span>
                  </div>
                </div>
              )}
            </div>
            <div className="jvm-card">
              <h4>GC</h4>
              {overview.gc && overview.gc.map((g, i) => (
                <div key={i} className="jvm-gc-row">
                  <span className="jvm-gc-name">{g.name}</span>
                  <span className="jvm-gc-stat">{g.collectionCount} 次</span>
                  <span className="jvm-gc-stat">{formatMs(g.collectionTimeMs)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'memory' && mem && (
          <div className="jvm-memory-section">
            <div className="jvm-card">
              <h4>堆内存概览</h4>
              <ProgressBar label="堆已用" used={mem.heapUsed} max={mem.heapMax} />
              <div className="jvm-stat-row" style={{ marginTop: 12 }}>
                <span>堆已提交: {formatBytes(mem.heapCommitted)}</span>
                <span>使用率: {mem.heapUsagePercent?.toFixed(1)}%</span>
              </div>
            </div>
            <div className="jvm-card">
              <h4>非堆内存</h4>
              <ProgressBar label="元空间" used={mem.metaspaceUsed} max={mem.metaspaceMax} />
              <div className="jvm-stat-row" style={{ marginTop: 12 }}>
                <span>非堆已用: {formatBytes(mem.nonHeapUsed)}</span>
                <span>非堆已提交: {formatBytes(mem.nonHeapCommitted)}</span>
              </div>
            </div>
            {mem.pools && mem.pools.length > 0 && (
              <div className="jvm-card">
                <h4>内存池</h4>
                <div className="jvm-table-wrap">
                  <table className="jvm-table">
                    <thead>
                      <tr><th>名称</th><th>已用</th><th>已提交</th><th>最大值</th><th>使用率</th></tr>
                    </thead>
                    <tbody>
                      {mem.pools.map((p, i) => (
                        <tr key={i}>
                          <td>{p.name}</td>
                          <td>{formatBytes(p.used)}</td>
                          <td>{formatBytes(p.committed)}</td>
                          <td>{p.max > 0 ? formatBytes(p.max) : '无限制'}</td>
                          <td>{p.usagePercent != null ? p.usagePercent.toFixed(1) + '%' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'threads' && threads && (
          <div className="jvm-threads-section">
            <div className="jvm-card">
              <h4>线程统计</h4>
              {threads.summary && (
                <div className="jvm-thread-stats">
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{threads.summary.currentCount}</span>
                    <span className="jvm-thread-label">当前</span>
                  </div>
                  <div className="jvm-thread-stat virtual">
                    <span className="jvm-thread-num">{threads.summary.virtualCount}</span>
                    <span className="jvm-thread-label">虚拟线程</span>
                  </div>
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{threads.summary.platformCount}</span>
                    <span className="jvm-thread-label">平台线程</span>
                  </div>
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{threads.summary.daemonCount}</span>
                    <span className="jvm-thread-label">守护线程</span>
                  </div>
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{threads.summary.peakCount}</span>
                    <span className="jvm-thread-label">峰值</span>
                  </div>
                  <div className="jvm-thread-stat">
                    <span className="jvm-thread-num">{threads.summary.totalStarted}</span>
                    <span className="jvm-thread-label">累计启动</span>
                  </div>
                </div>
              )}
            </div>
            {threads.stateDistribution && threads.stateDistribution.length > 0 && (
              <div className="jvm-card">
                <h4>线程状态分布</h4>
                <div className="jvm-state-bars">
                  {threads.stateDistribution.map((s, i) => {
                    const total = threads.summary?.currentCount || 1;
                    const pct = (s.count / total) * 100;
                    return (
                      <div key={i} className="jvm-state-bar-row">
                        <span className="jvm-state-name">{s.state}</span>
                        <div className="jvm-bar-track">
                          <div className="jvm-bar-fill" style={{
                            width: `${pct}%`,
                            background: threadStateColors[s.state] || '#a0aec0',
                          }} />
                        </div>
                        <span className="jvm-state-count">{s.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {threads.topCpuThreads && threads.topCpuThreads.length > 0 && (
              <div className="jvm-card">
                <h4>CPU Top 线程</h4>
                <div className="jvm-table-wrap">
                  <table className="jvm-table">
                    <thead>
                      <tr><th>ID</th><th>名称</th><th>状态</th><th>虚拟</th><th>CPU时间</th></tr>
                    </thead>
                    <tbody>
                      {threads.topCpuThreads.map((t, i) => (
                        <tr key={i}>
                          <td>{t.id}</td>
                          <td className="jvm-thread-name">{t.name}</td>
                          <td><span className="jvm-state-dot" style={{ background: threadStateColors[t.state] || '#a0aec0' }} />{t.state}</td>
                          <td>{t.virtual ? '是' : '否'}</td>
                          <td>{formatMs(t.cpuTimeMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gc' && overview?.gc && (
          <div className="jvm-gc-section">
            <div className="jvm-card">
              <h4>垃圾收集器</h4>
              <div className="jvm-table-wrap">
                <table className="jvm-table">
                  <thead>
                    <tr><th>名称</th><th>收集次数</th><th>总耗时</th><th>平均耗时</th></tr>
                  </thead>
                  <tbody>
                    {overview.gc.map((g, i) => (
                      <tr key={i}>
                        <td>{g.name}</td>
                        <td>{g.collectionCount}</td>
                        <td>{formatMs(g.collectionTimeMs)}</td>
                        <td>{g.collectionCount > 0 ? formatMs(g.collectionTimeMs / g.collectionCount) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threadDump' && (
          <div className="jvm-threaddump-section">
            {loading ? (
              <div className="loading">加载线程转储...</div>
            ) : threadDump ? (
              <>
                <div className="jvm-card">
                  <div className="jvm-thread-stats" style={{ marginBottom: 0 }}>
                    <div className="jvm-thread-stat">
                      <span className="jvm-thread-num">{threadDump.totalCount}</span>
                      <span className="jvm-thread-label">全部线程</span>
                    </div>
                    <div className="jvm-thread-stat virtual">
                      <span className="jvm-thread-num">{threadDump.virtualCount}</span>
                      <span className="jvm-thread-label">虚拟线程</span>
                    </div>
                    <div className="jvm-thread-stat">
                      <span className="jvm-thread-num">{threadDump.platformCount}</span>
                      <span className="jvm-thread-label">平台线程</span>
                    </div>
                  </div>
                </div>
                {threadDump.threads && threadDump.threads.map((t, i) => (
                  <div key={i} className="jvm-threaddump-item">
                    <div className="jvm-threaddump-header">
                      <span className="jvm-threaddump-id">#{t.id}</span>
                      <span className="jvm-threaddump-name">{t.name}</span>
                      <span className="jvm-state-dot" style={{ background: threadStateColors[t.state] || '#a0aec0' }} />
                      <span className="jvm-threaddump-state">{t.state}</span>
                      {t.virtual && <span className="jvm-threaddump-virtual">虚拟线程</span>}
                      {t.cpuTimeMs > 0 && <span className="jvm-threaddump-cpu">CPU: {formatMs(t.cpuTimeMs)}</span>}
                    </div>
                    {t.stackTrace && (
                      <pre className="jvm-threaddump-stack">{t.stackTrace}</pre>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="jvm-card">
                <p>点击"线程转储"标签加载数据</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JvmMonitor;
