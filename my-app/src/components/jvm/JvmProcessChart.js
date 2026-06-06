import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { monitorService } from '../../services';

const formatBytes = (bytes) => {
  if (!bytes || bytes < 0) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
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

const JvmProcessChart = ({ onBack }) => {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const heapChartRef = useRef(null);
  const gcChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const uptimeChartRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await monitorService.getProcesses();
      if (r.success !== false && Array.isArray(r.data)) {
        setProcesses(r.data);
        // Fetch GC data for each process
        const gcResults = await Promise.allSettled(
          r.data.map(p => monitorService.getProcessGc(p.pid))
        );
        const enrichedProcesses = r.data.map((p, i) => {
          const gcResult = gcResults[i];
          const gcData = gcResult.status === 'fulfilled' && gcResult.value?.success !== false
            ? gcResult.value?.data : null;
          return { ...p, gcDetail: gcData };
        });
        setProcesses(enrichedProcesses);
      } else {
        setError(r.message || '获取进程列表失败');
      }
    } catch (e) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  // Heap bar chart
  useEffect(() => {
    if (!heapChartRef.current || processes.length === 0) return;
    const chart = echarts.init(heapChartRef.current, 'dark');
    const pids = processes.map(p => 'PID ' + p.pid);
    chart.setOption({
      tooltip: { trigger: 'axis', valueFormatter: v => formatBytes(v) },
      legend: { data: ['堆已用', '堆最大'] },
      grid: { left: 80, right: 30, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: pids, axisLabel: { rotate: 45, fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { formatter: v => formatBytes(v) } },
      series: [
        { name: '堆已用', type: 'bar', data: processes.map(p => p.heapUsedBytes || 0), itemStyle: { color: '#48bb78' } },
        { name: '堆最大', type: 'bar', data: processes.map(p => p.heapMaxBytes || 0), itemStyle: { color: '#4299e1' } },
      ],
    });
    const h = () => chart.resize();
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); chart.dispose(); };
  }, [processes]);

  // GC bar chart
  useEffect(() => {
    if (!gcChartRef.current || processes.length === 0) return;
    const chart = echarts.init(gcChartRef.current, 'dark');
    const pids = processes.map(p => 'PID ' + p.pid);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Young GC', 'Full GC'] },
      grid: { left: 50, right: 30, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: pids, axisLabel: { rotate: 45, fontSize: 11 } },
      yAxis: { type: 'value', name: '次数' },
      series: [
        { name: 'Young GC', type: 'bar', data: processes.map(p => p.gcDetail?.gcStats?.youngGcCount || 0), itemStyle: { color: '#48bb78' } },
        { name: 'Full GC', type: 'bar', data: processes.map(p => p.gcDetail?.gcStats?.fullGcCount || 0), itemStyle: { color: '#fc8181' } },
      ],
    });
    const h = () => chart.resize();
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); chart.dispose(); };
  }, [processes]);

  // Heap usage pie chart
  useEffect(() => {
    if (!pieChartRef.current || processes.length === 0) return;
    const chart = echarts.init(pieChartRef.current, 'dark');
    chart.setOption({
      tooltip: { trigger: 'item', formatter: p => `${p.name}: ${formatBytes(p.value)} (${p.percent}%)` },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: processes.map(p => ({
          name: p.mainClass ? p.mainClass.split('.').pop() : 'PID ' + p.pid,
          value: p.heapUsedBytes || 0,
        })),
        label: { formatter: '{b}\n{d}%' },
        itemStyle: { borderRadius: 4 },
      }],
    });
    const h = () => chart.resize();
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); chart.dispose(); };
  }, [processes]);

  // Uptime bar chart
  useEffect(() => {
    if (!uptimeChartRef.current || processes.length === 0) return;
    const chart = echarts.init(uptimeChartRef.current, 'dark');
    const pids = processes.map(p => 'PID ' + p.pid);
    chart.setOption({
      tooltip: { trigger: 'axis', valueFormatter: v => formatUptime(v) },
      grid: { left: 80, right: 30, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: pids, axisLabel: { rotate: 45, fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { formatter: v => formatUptime(v) } },
      series: [{
        type: 'bar', data: processes.map(p => p.uptimeMs || 0),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' },
          ]),
        },
      }],
    });
    const h = () => chart.resize();
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); chart.dispose(); };
  }, [processes]);

  return (
    <div style={{ background: '#1a1a2e', minHeight: '100vh', color: '#e2e8f0', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{ padding: '6px 12px', background: '#0f3460', color: '#a0aec0', border: '1px solid #4a5568', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                ← 返回进程监控
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>JVM 进程仪表盘</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ accentColor: '#667eea' }} />
              5秒自动刷新
            </label>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{ padding: '6px 16px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#742a2a', color: '#feb2b2', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Process Table */}
        <div style={{ background: '#16213e', borderRadius: 12, padding: 20, marginBottom: 20, overflow: 'auto' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>进程列表 ({processes.length})</h3>
          {loading && processes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>加载中...</div>
          ) : processes.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['PID', '主类', '堆已用', '堆最大', '使用率', '运行时长', 'JVM 版本'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', background: '#0f3460', color: '#a0aec0', fontWeight: 600, borderBottom: '2px solid #1a1a2e', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processes.map(p => {
                  const pct = p.heapMaxBytes > 0 ? (p.heapUsedBytes / p.heapMaxBytes) * 100 : 0;
                  return (
                    <tr key={p.pid} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600, color: '#667eea' }}>{p.pid}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12 }}>{p.mainClass}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{formatBytes(p.heapUsedBytes)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{formatBytes(p.heapMaxBytes)}</td>
                      <td style={{ padding: '8px 10px', color: pct > 85 ? '#fc8181' : pct > 60 ? '#f6ad55' : '#48bb78', fontWeight: 600 }}>{pct.toFixed(1)}%</td>
                      <td style={{ padding: '8px 10px' }}>{formatUptime(p.uptimeMs)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, color: '#a0aec0' }}>{p.jvmVersion || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>未发现 Java 进程</div>
          )}
        </div>

        {/* Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 20 }}>
          {/* Heap memory chart */}
          <div style={{ background: '#16213e', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>堆内存对比</h3>
            <div ref={heapChartRef} style={{ width: '100%', height: 350 }} />
          </div>

          {/* GC chart */}
          <div style={{ background: '#16213e', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>GC 统计对比</h3>
            <div ref={gcChartRef} style={{ width: '100%', height: 350 }} />
          </div>

          {/* Heap usage pie */}
          <div style={{ background: '#16213e', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>堆使用率分布</h3>
            <div ref={pieChartRef} style={{ width: '100%', height: 350 }} />
          </div>

          {/* Uptime chart */}
          <div style={{ background: '#16213e', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>进程运行时长</h3>
            <div ref={uptimeChartRef} style={{ width: '100%', height: 350 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JvmProcessChart;
