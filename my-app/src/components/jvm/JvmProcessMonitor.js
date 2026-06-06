import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { monitorService } from '../../services';
import './JvmMonitor.css';

const formatBytes = (bytes) => {
  if (!bytes || bytes < 0) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
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

const JvmProcessMonitor = ({ onOpenChart }) => {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPid, setSelectedPid] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  const [processGc, setProcessGc] = useState(null);
  const [processThreadDump, setProcessThreadDump] = useState(null);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await monitorService.getProcesses();
      if (r.success !== false) setProcesses(r.data || []);
      else setError(r.message || '获取进程列表失败');
    } catch (e) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProcesses(); }, [fetchProcesses]);

  const fetchDetail = async (pid) => {
    setSelectedPid(pid);
    setDetailLoading(true);
    setDetail(null);
    setProcessGc(null);
    setProcessThreadDump(null);
    setDetailTab('overview');
    try {
      const r = await monitorService.getProcessDetail(pid);
      if (r.success !== false) setDetail(r.data);
      else setError(r.message || '获取进程详情失败');
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setDetailLoading(false); }
  };

  const fetchProcessGc = async (pid) => {
    setDetailTab('gc');
    if (processGc) return;
    setDetailLoading(true);
    try {
      const r = await monitorService.getProcessGc(pid);
      if (r.success !== false) setProcessGc(r.data);
      else setError(r.message || '获取GC详情失败');
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setDetailLoading(false); }
  };

  const fetchProcessThreadDump = async (pid) => {
    setDetailTab('threadDump');
    if (processThreadDump) return;
    setDetailLoading(true);
    try {
      const r = await monitorService.getProcessThreadDump(pid);
      if (r.success !== false) setProcessThreadDump(r.data);
      else setError(r.message || '获取线程转储失败');
    } catch (e) { setError(e.message || '请求失败'); }
    finally { setDetailLoading(false); }
  };

  const openChartPage = () => {
    if (onOpenChart) { onOpenChart(); return; }
    navigate('/jvm-processes-chart');
  };

  const formatUptime = (ms) => {
    if (!ms) return '-';
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ${m % 60}m`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${m % 60}m`;
  };

  return (
    <div className="jvm-container">
      <div className="jvm-header">
        <h2>JVM 进程监控</h2>
        <div className="jvm-header-actions">
          <button className="btn btn-health" onClick={openChartPage}>图表仪表盘</button>
          <button className="btn btn-test" onClick={fetchProcesses} disabled={loading}>
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error"><strong>错误:</strong> {error}</div>}

      {/* Process List */}
      <div className="jvm-card">
        <h4>服务器 Java 进程 ({processes.length})</h4>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : processes.length > 0 ? (
          <div className="jvm-table-wrap">
            <table className="jvm-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>主类</th>
                  <th>堆已用</th>
                  <th>堆总容量</th>
                  <th>使用率</th>
                  <th>运行时长</th>
                  <th>JVM 版本</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {processes.map(p => {
                  const heapPct = p.heapMaxBytes > 0 ? (p.heapUsedBytes / p.heapMaxBytes) * 100 : 0;
                  return (
                    <tr key={p.pid} className={selectedPid === p.pid ? 'jvm-row-selected' : ''}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.pid}</td>
                      <td className="jvm-thread-name" title={p.mainClass}>{p.mainClass}</td>
                      <td>{formatBytes(p.heapUsedBytes)}</td>
                      <td>{formatBytes(p.heapMaxBytes)}</td>
                      <td>
                        <span style={{ color: heapPct > 85 ? '#e53e3e' : heapPct > 60 ? '#dd6b20' : '#38a169' }}>
                          {heapPct.toFixed(1)}%
                        </span>
                      </td>
                      <td>{formatUptime(p.uptimeMs)}</td>
                      <td style={{ fontSize: 12 }}>{p.jvmVersion || '-'}</td>
                      <td>
                        <button className="btn btn-test btn-sm" onClick={() => fetchDetail(p.pid)}>详情</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#718096', padding: 20, textAlign: 'center' }}>未发现 Java 进程</p>
        )}
      </div>

      {/* Process Detail */}
      {selectedPid && (
        <div className="jvm-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h4 style={{ margin: 0 }}>进程 {selectedPid} 详情</h4>
            <button className="btn-close" onClick={() => { setSelectedPid(null); setDetail(null); setProcessGc(null); setProcessThreadDump(null); }}>× 关闭</button>
          </div>

          {detailLoading ? (
            <div className="loading">加载详情中...</div>
          ) : detail ? (
            <>
              {/* Detail tabs */}
              <div className="jvm-tabs" style={{ marginTop: 12, marginBottom: 16 }}>
                {[
                  { key: 'overview', label: '概览' },
                  { key: 'gc', label: 'GC' },
                  { key: 'threadDump', label: '线程转储' },
                ].map(t => (
                  <button
                    key={t.key}
                    className={`jvm-tab ${detailTab === t.key ? 'active' : ''}`}
                    onClick={() => {
                      if (t.key === 'gc') fetchProcessGc(selectedPid);
                      else if (t.key === 'threadDump') fetchProcessThreadDump(selectedPid);
                      else setDetailTab('overview');
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {detailTab === 'overview' && (
                <>
                  {/* Basic info */}
                  <div className="jvm-info-bar" style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#4a5568' }}>
                    <span>主类: <strong>{detail.mainClass}</strong></span>
                    <span>JVM: <strong>{detail.jvmVersion}</strong></span>
                    <span>Java Home: <strong style={{ fontSize: 12 }}>{detail.javaHome}</strong></span>
                    <span>运行: <strong>{detail.uptime}</strong></span>
                    <span>线程: <strong>{detail.threadCount}</strong></span>
                  </div>

                  {detail.osInfo && (
                    <div className="jvm-stat-row" style={{ marginBottom: 16, fontSize: 12, color: '#a0aec0' }}>
                      OS: {detail.osInfo}
                    </div>
                  )}

                  {/* Heap Pools */}
                  {detail.heapPools && detail.heapPools.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 8px' }}>内存池</h4>
                      <div className="jvm-table-wrap">
                        <table className="jvm-table">
                          <thead>
                            <tr><th>名称</th><th>已用</th><th>容量</th><th>最大值</th><th>使用率</th></tr>
                          </thead>
                          <tbody>
                            {detail.heapPools.map((p, i) => (
                              <tr key={i}>
                                <td>{p.name}</td>
                                <td>{formatBytes(p.used)}</td>
                                <td>{formatBytes(p.capacity)}</td>
                                <td>{p.max > 0 ? formatBytes(p.max) : '无限制'}</td>
                                <td>
                                  <span style={{ color: p.usagePercent > 85 ? '#e53e3e' : p.usagePercent > 60 ? '#dd6b20' : '#38a169' }}>
                                    {p.usagePercent.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Heap bars */}
                  {detail.heapPools && detail.heapPools.filter(p => p.name !== 'Metaspace').map((p, i) => (
                    <ProgressBar key={i} label={p.name} used={p.used} max={p.capacity > 0 ? p.capacity : (p.max > 0 ? p.max : p.used * 2)} />
                  ))}

                  {/* GC Stats */}
                  {detail.gcStats && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ margin: '0 0 8px' }}>GC 统计</h4>
                      <div className="jvm-thread-stats">
                        <div className="jvm-thread-stat">
                          <span className="jvm-thread-num">{detail.gcStats.youngGcCount}</span>
                          <span className="jvm-thread-label">Young GC</span>
                        </div>
                        <div className="jvm-thread-stat">
                          <span className="jvm-thread-num">{detail.gcStats.youngGcTimeMs?.toFixed(0)}ms</span>
                          <span className="jvm-thread-label">Young GC 耗时</span>
                        </div>
                        <div className="jvm-thread-stat">
                          <span className="jvm-thread-num" style={{ color: detail.gcStats.fullGcCount > 0 ? '#e53e3e' : '#38a169' }}>{detail.gcStats.fullGcCount}</span>
                          <span className="jvm-thread-label">Full GC</span>
                        </div>
                        <div className="jvm-thread-stat">
                          <span className="jvm-thread-num">{detail.gcStats.fullGcTimeMs?.toFixed(0)}ms</span>
                          <span className="jvm-thread-label">Full GC 耗时</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* JVM Args */}
                  {detail.jvmArgs && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ margin: '0 0 8px' }}>JVM 启动参数</h4>
                      <pre style={{ background: '#1a202c', color: '#e2e8f0', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 120 }}>
                        {detail.jvmArgs}
                      </pre>
                    </div>
                  )}

                  {/* VM Flags */}
                  {detail.vmFlags && detail.vmFlags.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ margin: '0 0 8px' }}>JVM 标志</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {detail.vmFlags.map((f, i) => (
                          <span key={i} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', color: '#4a5568' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {detailTab === 'gc' && (
                processGc ? (
                  <div>
                    <div className="jvm-thread-stats" style={{ marginBottom: 16 }}>
                      <div className="jvm-thread-stat">
                        <span className="jvm-thread-num">{processGc.gcStats?.youngGcCount}</span>
                        <span className="jvm-thread-label">Young GC</span>
                      </div>
                      <div className="jvm-thread-stat">
                        <span className="jvm-thread-num">{processGc.gcStats?.youngGcTimeMs?.toFixed(0)}ms</span>
                        <span className="jvm-thread-label">耗时</span>
                      </div>
                      <div className="jvm-thread-stat">
                        <span className="jvm-thread-num" style={{ color: processGc.gcStats?.fullGcCount > 0 ? '#e53e3e' : '#38a169' }}>{processGc.gcStats?.fullGcCount}</span>
                        <span className="jvm-thread-label">Full GC</span>
                      </div>
                      <div className="jvm-thread-stat">
                        <span className="jvm-thread-num">{processGc.gcStats?.fullGcTimeMs?.toFixed(0)}ms</span>
                        <span className="jvm-thread-label">耗时</span>
                      </div>
                    </div>
                    {processGc.heapPools && processGc.heapPools.map((p, i) => (
                      <ProgressBar key={i} label={p.name} used={p.used} max={p.capacity > 0 ? p.capacity : p.used * 2} />
                    ))}
                  </div>
                ) : (
                  <div className="loading">加载 GC 数据...</div>
                )
              )}

              {detailTab === 'threadDump' && (
                processThreadDump ? (
                  <div>
                    <div className="jvm-thread-stats" style={{ marginBottom: 16 }}>
                      <div className="jvm-thread-stat">
                        <span className="jvm-thread-num">{processThreadDump.threadCount}</span>
                        <span className="jvm-thread-label">线程总数</span>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 8px' }}>线程转储</h4>
                    <pre style={{ background: '#1a202c', color: '#e2e8f0', padding: 16, borderRadius: 8, fontSize: 12, lineHeight: 1.5, overflow: 'auto', maxHeight: 500, whiteSpace: 'pre-wrap' }}>
                      {processThreadDump.rawDump || '无数据'}
                    </pre>
                  </div>
                ) : (
                  <div className="loading">加载线程转储...</div>
                )
              )}
            </>
          ) : (
            <p style={{ color: '#718096', padding: 20, textAlign: 'center' }}>无法获取进程详情</p>
          )}
        </div>
      )}

      {/* Hint */}
      {!selectedPid && processes.length > 0 && !loading && (
        <p style={{ textAlign: 'center', color: '#a0aec0', fontSize: 13, marginTop: 16 }}>
          点击进程行的"详情"按钮查看详细 JVM 信息
        </p>
      )}
    </div>
  );
};

export default JvmProcessMonitor;
