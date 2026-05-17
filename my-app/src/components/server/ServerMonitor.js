import React, { useState, useEffect, useCallback } from 'react';
import { monitorService } from '../../services';
import './ServerMonitor.css';

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
  if (ms < 3600000) return (ms / 60000).toFixed(1) + 'min';
  return (ms / 3600000).toFixed(1) + 'h';
};

const ProgressBar = ({ label, used, total, formatFn = formatBytes }) => {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const color = pct > 90 ? '#e53e3e' : pct > 70 ? '#dd6b20' : '#38a169';
  return (
    <div className="svr-bar-item">
      <div className="svr-bar-label">
        <span>{label}</span>
        <span>{formatFn(used)} / {formatFn(total)}</span>
      </div>
      <div className="svr-bar-track">
        <div className="svr-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="svr-bar-pct" style={{ color }}>{pct.toFixed(1)}%</span>
    </div>
  );
};

const StatCard = ({ label, value, unit, highlight }) => (
  <div className={`svr-stat-card${highlight ? ' highlight' : ''}`}>
    <span className="svr-stat-val">{value}{unit && <span className="svr-stat-unit">{unit}</span>}</span>
    <span className="svr-stat-label">{label}</span>
  </div>
);

const ServerMonitor = () => {
  const [overview, setOverview] = useState(null);
  const [cpu, setCpu] = useState(null);
  const [memory, setMemory] = useState(null);
  const [disk, setDisk] = useState([]);
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled([
        monitorService.getServerOverview(),
        monitorService.getServerCpu(),
        monitorService.getServerMemory(),
        monitorService.getServerDisk(),
        monitorService.getServerNetwork(),
      ]);
      if (results[0].status === 'fulfilled' && results[0].value.success) setOverview(results[0].value.data);
      if (results[1].status === 'fulfilled' && results[1].value.success) setCpu(results[1].value.data);
      if (results[2].status === 'fulfilled' && results[2].value.success) setMemory(results[2].value.data);
      if (results[3].status === 'fulfilled' && results[3].value.success) setDisk(results[3].value.data || []);
      if (results[4].status === 'fulfilled' && results[4].value.success) setNetwork(results[4].value.data || []);
    } catch (err) {
      setError(err.message || '获取服务器监控数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchAll]);

  const os = overview?.os;
  const ocpu = overview?.cpu || cpu?.summary;
  const omem = overview?.memory || memory?.summary;
  const odisks = overview?.disks || disk;
  const onetworks = overview?.networks || network;
  const oproc = overview?.process;

  const cpuUsage = ocpu?.systemCpuLoadPercent;
  const cpuColor = cpuUsage > 90 ? '#e53e3e' : cpuUsage > 70 ? '#dd6b20' : '#38a169';
  const memUsedPercent = omem?.usedPercent;
  const memColor = memUsedPercent > 90 ? '#e53e3e' : memUsedPercent > 70 ? '#dd6b20' : '#38a169';

  const tabs = [
    { key: 'overview', label: '概览' },
    { key: 'cpu', label: 'CPU' },
    { key: 'memory', label: '内存' },
    { key: 'disk', label: '磁盘' },
    { key: 'network', label: '网络' },
  ];

  return (
    <div className="svr-container">
      <div className="svr-header">
        <div className="svr-header-left">
          <h2>服务器监控</h2>
          {os && <span className="svr-header-sub">{os.hostname} · {os.name} {os.version}</span>}
        </div>
        <div className="svr-header-right">
          <label className="svr-refresh-toggle">
            <input type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span>自动刷新 (10s)</span>
          </label>
          <button className="btn btn-test" onClick={fetchAll} disabled={loading}>
            {loading ? '刷新中...' : '手动刷新'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Quick stats bar */}
      {overview && (
        <div className="svr-quick-stats">
          {ocpu && <StatCard label="CPU 使用率" value={ocpu.systemCpuLoadPercent?.toFixed(1) || '-'} unit="%" highlight={cpuUsage > 90} />}
          {omem && <StatCard label="内存使用" value={omem.usedPercent?.toFixed(1) || '-'} unit="%" highlight={memUsedPercent > 90} />}
          {os && <StatCard label="系统负载" value={os.systemLoadAverage?.toFixed(2) || '-'} />}
          {os && <StatCard label="运行时间" value={os.uptimeFormatted || '-'} />}
          {odisks && <StatCard label="磁盘分区" value={odisks.length} unit=" 个" />}
          {onetworks && <StatCard label="网络接口" value={onetworks.filter(n => n.up).length} unit=" 活跃" />}
        </div>
      )}

      <div className="svr-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`svr-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >{tab.label}</button>
        ))}
      </div>

      {loading && !overview && <div className="svr-loading">加载中...</div>}

      <div className="svr-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="svr-grid">
            {/* OS Info */}
            {os && (
              <div className="svr-card">
                <h4>操作系统</h4>
                <div className="svr-info-grid">
                  <div className="svr-info-item"><label>主机名</label><span>{os.hostname}</span></div>
                  <div className="svr-info-item"><label>操作系统</label><span>{os.name} {os.version}</span></div>
                  <div className="svr-info-item"><label>架构</label><span>{os.arch}</span></div>
                  <div className="svr-info-item"><label>可用处理器</label><span>{os.availableProcessors}</span></div>
                  <div className="svr-info-item"><label>系统负载</label><span>{os.systemLoadAverage?.toFixed(2) || '-'}</span></div>
                  <div className="svr-info-item"><label>运行时间</label><span>{os.uptimeFormatted}</span></div>
                  <div className="svr-info-item"><label>JVM 厂商</label><span>{os.jvmVendor}</span></div>
                  <div className="svr-info-item"><label>JVM 版本</label><span>{os.jvmVersion}</span></div>
                </div>
              </div>
            )}

            {/* CPU */}
            {ocpu && (
              <div className="svr-card">
                <h4>CPU</h4>
                <div className="svr-cpu-gauge">
                  <svg viewBox="0 0 120 120" className="svr-gauge-svg">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#edf2f7" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={cpuColor} strokeWidth="10"
                      strokeDasharray={`${(ocpu.systemCpuLoadPercent || 0) * 3.14} 314`}
                      strokeLinecap="round" transform="rotate(-90 60 60)" />
                    <text x="60" y="55" textAnchor="middle" className="svr-gauge-pct">{ocpu.systemCpuLoadPercent?.toFixed(1)}%</text>
                    <text x="60" y="72" textAnchor="middle" className="svr-gauge-label">CPU</text>
                  </svg>
                </div>
                <div className="svr-info-grid">
                  <div className="svr-info-item"><label>物理核心</label><span>{ocpu.physicalCores || '-'}</span></div>
                  <div className="svr-info-item"><label>逻辑核心</label><span>{ocpu.logicalCores || '-'}</span></div>
                  <div className="svr-info-item"><label>进程 CPU</label><span>{ocpu.processCpuLoadPercent?.toFixed(2)}%</span></div>
                  <div className="svr-info-item"><label>型号</label><span className="svr-mono">{ocpu.cpuModel || '-'}</span></div>
                </div>
              </div>
            )}

            {/* Memory */}
            {omem && (
              <div className="svr-card">
                <h4>内存</h4>
                <ProgressBar label="物理内存" used={omem.usedPhysical} total={omem.totalPhysical} />
                <ProgressBar label="Swap" used={omem.usedSwap} total={omem.totalSwap} />
                <div className="svr-info-grid" style={{ marginTop: 12 }}>
                  <div className="svr-info-item"><label>进程 RSS</label><span>{formatBytes(omem.processRss)}</span></div>
                  <div className="svr-info-item"><label>进程 VMS</label><span>{formatBytes(omem.processVms)}</span></div>
                </div>
              </div>
            )}

            {/* Process */}
            {oproc && (
              <div className="svr-card">
                <h4>进程信息</h4>
                <div className="svr-info-grid">
                  <div className="svr-info-item"><label>PID</label><span>{oproc.pid}</span></div>
                  <div className="svr-info-item"><label>进程名</label><span>{oproc.processName}</span></div>
                  <div className="svr-info-item"><label>用户</label><span>{oproc.user}</span></div>
                  <div className="svr-info-item"><label>线程数</label><span>{oproc.threadCount}</span></div>
                  <div className="svr-info-item"><label>文件描述符</label><span>{oproc.openFileDescriptors} / {oproc.maxFileDescriptors}</span></div>
                  <div className="svr-info-item"><label>启动时间</label><span>{oproc.startTime}</span></div>
                </div>
              </div>
            )}

            {/* Disks Summary */}
            {odisks && odisks.length > 0 && (
              <div className="svr-card">
                <h4>磁盘概览</h4>
                {odisks.slice(0, 3).map((d, i) => (
                  <div key={i} className="svr-disk-summary">
                    <div className="svr-disk-summary-header">
                      <span className="svr-disk-mount">{d.mountPoint}</span>
                      <span className={d.usedPercent > 90 ? 'svr-text-danger' : d.usedPercent > 70 ? 'svr-text-warn' : ''}>{d.usedPercent?.toFixed(1)}%</span>
                    </div>
                    <div className="svr-bar-track" style={{ height: 6 }}>
                      <div className="svr-bar-fill" style={{
                        width: `${Math.min(d.usedPercent || 0, 100)}%`,
                        background: d.usedPercent > 90 ? '#e53e3e' : d.usedPercent > 70 ? '#dd6b20' : '#38a169',
                      }} />
                    </div>
                    <div className="svr-disk-summary-size">{d.usedDisplay} / {d.totalDisplay}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Networks Summary */}
            {onetworks && onetworks.length > 0 && (
              <div className="svr-card">
                <h4>网络概览</h4>
                {onetworks.slice(0, 4).map((n, i) => (
                  <div key={i} className="svr-net-summary">
                    <div className="svr-net-summary-header">
                      <span className="svr-net-name">{n.displayName}</span>
                      <span className={`svr-net-status ${n.up ? 'up' : 'down'}`}>{n.up ? 'UP' : 'DOWN'}</span>
                    </div>
                    <div className="svr-net-traffic">
                      <span>↓ {formatBytes(n.bytesReceived)}</span>
                      <span>↑ {formatBytes(n.bytesSent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CPU Tab */}
        {activeTab === 'cpu' && cpu && (
          <div className="svr-section">
            <div className="svr-card">
              <h4>CPU 详情</h4>
              {cpu.summary && (
                <>
                  <div className="svr-cpu-gauge" style={{ marginBottom: 16 }}>
                    <svg viewBox="0 0 120 120" className="svr-gauge-svg">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#edf2f7" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke={cpuColor} strokeWidth="10"
                        strokeDasharray={`${(cpu.summary.systemCpuLoadPercent || 0) * 3.14} 314`}
                        strokeLinecap="round" transform="rotate(-90 60 60)" />
                      <text x="60" y="55" textAnchor="middle" className="svr-gauge-pct">{cpu.summary.systemCpuLoadPercent?.toFixed(1)}%</text>
                      <text x="60" y="72" textAnchor="middle" className="svr-gauge-label">CPU</text>
                    </svg>
                  </div>
                  <div className="svr-info-grid">
                    <div className="svr-info-item"><label>系统 CPU</label><span>{cpu.summary.systemCpuLoadPercent?.toFixed(2)}%</span></div>
                    <div className="svr-info-item"><label>进程 CPU</label><span>{cpu.summary.processCpuLoadPercent?.toFixed(2)}%</span></div>
                    <div className="svr-info-item"><label>系统负载</label><span>{cpu.summary.systemLoadAverage?.toFixed(2)}</span></div>
                    <div className="svr-info-item"><label>可用处理器</label><span>{cpu.summary.availableProcessors}</span></div>
                    <div className="svr-info-item"><label>物理核心</label><span>{cpu.summary.physicalCores || '-'}</span></div>
                    <div className="svr-info-item"><label>逻辑核心</label><span>{cpu.summary.logicalCores || '-'}</span></div>
                    <div className="svr-info-item" style={{ gridColumn: 'span 2' }}><label>型号</label><span className="svr-mono">{cpu.summary.cpuModel || '-'}</span></div>
                  </div>
                </>
              )}
            </div>
            {cpu.perCoreLoad && cpu.perCoreLoad.length > 0 && (
              <div className="svr-card">
                <h4>每核负载</h4>
                <div className="svr-core-grid">
                  {cpu.perCoreLoad.map((c, i) => (
                    <div key={i} className="svr-core-item">
                      <span className="svr-core-label">Core {c.coreIndex}</span>
                      <div className="svr-bar-track" style={{ flex: 1 }}>
                        <div className="svr-bar-fill" style={{
                          width: `${Math.min(c.loadPercent || 0, 100)}%`,
                          background: c.loadPercent > 90 ? '#e53e3e' : c.loadPercent > 70 ? '#dd6b20' : '#38a169',
                        }} />
                      </div>
                      <span className="svr-core-pct">{c.loadPercent?.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && memory && memory.summary && (
          <div className="svr-section">
            <div className="svr-card">
              <h4>物理内存</h4>
              <ProgressBar label="物理内存" used={memory.summary.usedPhysical} total={memory.summary.totalPhysical} />
              <div className="svr-info-grid" style={{ marginTop: 12 }}>
                <div className="svr-info-item"><label>总量</label><span>{formatBytes(memory.summary.totalPhysical)}</span></div>
                <div className="svr-info-item"><label>空闲</label><span>{formatBytes(memory.summary.freePhysical)}</span></div>
                <div className="svr-info-item"><label>已用</label><span>{formatBytes(memory.summary.usedPhysical)}</span></div>
                <div className="svr-info-item"><label>使用率</label><span style={{ color: memColor }}>{memory.summary.usedPercent?.toFixed(1)}%</span></div>
              </div>
            </div>
            <div className="svr-card">
              <h4>Swap</h4>
              <ProgressBar label="Swap" used={memory.summary.usedSwap} total={memory.summary.totalSwap} />
              <div className="svr-info-grid" style={{ marginTop: 12 }}>
                <div className="svr-info-item"><label>总量</label><span>{formatBytes(memory.summary.totalSwap)}</span></div>
                <div className="svr-info-item"><label>空闲</label><span>{formatBytes(memory.summary.freeSwap)}</span></div>
                <div className="svr-info-item"><label>已用</label><span>{formatBytes(memory.summary.usedSwap)}</span></div>
                <div className="svr-info-item"><label>使用率</label><span>{memory.summary.swapUsedPercent?.toFixed(1)}%</span></div>
              </div>
            </div>
            <div className="svr-card">
              <h4>进程内存</h4>
              <div className="svr-info-grid">
                <div className="svr-info-item"><label>RSS (物理)</label><span>{formatBytes(memory.summary.processRss)}</span></div>
                <div className="svr-info-item"><label>VMS (虚拟)</label><span>{formatBytes(memory.summary.processVms)}</span></div>
                <div className="svr-info-item"><label>提交的虚拟内存</label><span>{formatBytes(memory.summary.committedVirtualMemory)}</span></div>
                <div className="svr-info-item"><label>JVM 堆已用</label><span>{formatBytes(memory.jvmHeapUsed)}</span></div>
                <div className="svr-info-item"><label>JVM 堆最大</label><span>{formatBytes(memory.jvmHeapMax)}</span></div>
                <div className="svr-info-item"><label>JVM 堆使用率</label><span>{memory.jvmHeapUsagePercent?.toFixed(1)}%</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Disk Tab */}
        {activeTab === 'disk' && (
          <div className="svr-section">
            <div className="svr-card">
              <h4>磁盘分区</h4>
              {disk.length === 0 ? (
                <div className="svr-empty">暂无磁盘数据</div>
              ) : (
                <div className="svr-table-wrap">
                  <table className="svr-table">
                    <thead>
                      <tr>
                        <th>挂载点</th>
                        <th>文件系统</th>
                        <th>总容量</th>
                        <th>已用</th>
                        <th>可用</th>
                        <th>使用率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disk.map((d, i) => (
                        <tr key={i}>
                          <td className="svr-td-name">{d.mountPoint}</td>
                          <td>{d.filesystem}</td>
                          <td>{d.totalDisplay}</td>
                          <td>{d.usedDisplay}</td>
                          <td>{d.freeDisplay}</td>
                          <td>
                            <div className="svr-table-bar">
                              <div className="svr-bar-track" style={{ width: 80 }}>
                                <div className="svr-bar-fill" style={{
                                  width: `${Math.min(d.usedPercent || 0, 100)}%`,
                                  background: d.usedPercent > 90 ? '#e53e3e' : d.usedPercent > 70 ? '#dd6b20' : '#38a169',
                                }} />
                              </div>
                              <span className={d.usedPercent > 90 ? 'svr-text-danger' : d.usedPercent > 70 ? 'svr-text-warn' : ''}>{d.usedPercent?.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="svr-section">
            <div className="svr-card">
              <h4>网络接口</h4>
              {network.length === 0 ? (
                <div className="svr-empty">暂无网络数据</div>
              ) : (
                <div className="svr-net-grid">
                  {network.map((n, i) => (
                    <div key={i} className="svr-net-card">
                      <div className="svr-net-card-header">
                        <span className="svr-net-card-name">{n.displayName}</span>
                        <span className={`svr-net-status ${n.up ? 'up' : 'down'}`}>{n.up ? 'UP' : 'DOWN'}</span>
                        {n.virtual && <span className="svr-net-tag">虚拟</span>}
                        {n.loopback && <span className="svr-net-tag">回环</span>}
                      </div>
                      {n.macAddress && <div className="svr-net-mac">MAC: {n.macAddress}</div>}
                      {n.ipAddresses && n.ipAddresses.length > 0 && (
                        <div className="svr-net-ips">
                          {n.ipAddresses.map((ip, j) => (
                            <code key={j} className="svr-net-ip">{ip}</code>
                          ))}
                        </div>
                      )}
                      <div className="svr-net-traffic-detail">
                        <div className="svr-net-traffic-item">
                          <span className="svr-net-traffic-dir">↓ 接收</span>
                          <span>{formatBytes(n.bytesReceived)}</span>
                        </div>
                        <div className="svr-net-traffic-item">
                          <span className="svr-net-traffic-dir">↑ 发送</span>
                          <span>{formatBytes(n.bytesSent)}</span>
                        </div>
                      </div>
                      <div className="svr-net-errors">
                        {(n.errorsIn > 0 || n.errorsOut > 0 || n.dropIn > 0 || n.dropOut > 0) ? (
                          <>
                            <span className="svr-text-danger">错误: 收{n.errorsIn} 发{n.errorsOut}</span>
                            <span className="svr-text-warn">丢弃: 收{n.dropIn} 发{n.dropOut}</span>
                          </>
                        ) : (
                          <span style={{ color: '#38a169', fontSize: 12 }}>无错误</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerMonitor;
