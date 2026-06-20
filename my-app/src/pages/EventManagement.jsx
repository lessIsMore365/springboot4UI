import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 异步事件管理页面 - 事件指标、死信队列、事件溯源查看
 */
const EventManagement = () => {
  const [activeTab, setActiveTab] = useState('metrics');

  // Metrics tab state
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // DLQ tab state
  const [dlqData, setDlqData] = useState({});
  const [dlqLoading, setDlqLoading] = useState(false);
  const [selectedDLQType, setSelectedDLQType] = useState('');

  // Source tab state
  const [sourceEvents, setSourceEvents] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceEventType, setSourceEventType] = useState('');
  const [sourceCount, setSourceCount] = useState(20);

  // Fetch metrics
  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await axios.get('/api/monitor/events/metrics');
      if (res.data?.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('获取指标失败:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
  }, []);

  // DLQ handlers
  const fetchDLQ = async () => {
    setDlqLoading(true);
    try {
      const url = selectedDLQType
        ? `/api/monitor/events/dlq/${encodeURIComponent(selectedDLQType)}`
        : '/api/monitor/events/dlq';
      const res = await axios.get(url);
      if (res.data?.success) {
        setDlqData(res.data.data || {});
      }
    } catch (err) {
      console.error('获取死信队列失败:', err);
    } finally {
      setDlqLoading(false);
    }
  };

  const clearDLQ = async (eventType) => {
    if (!window.confirm(`确定要清理事件类型 ${eventType} 的死信事件吗？`)) return;
    try {
      const res = await axios.delete(`/api/monitor/events/dlq/${encodeURIComponent(eventType)}`);
      if (res.data?.success) {
        alert(res.data.message || '清理成功');
        fetchDLQ();
      }
    } catch (err) {
      console.error('清理失败:', err);
      alert('清理失败');
    }
  };

  // Source handler
  const fetchSource = async () => {
    if (!sourceEventType) {
      alert('请输入事件类型');
      return;
    }
    setSourceLoading(true);
    try {
      const res = await axios.get(
        `/api/monitor/events/sourcing/${encodeURIComponent(sourceEventType)}`,
        { params: { count: sourceCount } }
      );
      if (res.data?.success) {
        setSourceEvents(res.data.data || []);
      }
    } catch (err) {
      console.error('获取源数据失败:', err);
    } finally {
      setSourceLoading(false);
    }
  };

  // Render metrics
  const renderMetrics = () => {
    if (metricsLoading) return <div className="loading">加载中...</div>;
    if (!metrics) return <div className="empty">暂无数据</div>;

    return (
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{metrics.total}</div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>总事件数</div>
        </div>
        <div className="metric-card" style={{ background: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{metrics.errors}</div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>错误事件</div>
        </div>
        {Object.entries(metrics.byType).map(([type, count]) => (
          <div key={type} style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{count}</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>{type}</div>
          </div>
        ))}
        {metrics.startTime && (
          <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>启动时间</div>
            <div style={{ fontSize: '16px', marginTop: '4px', color: '#92400e' }}>{metrics.startTime}</div>
          </div>
        )}
        {metrics.uptime && (
          <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>运行时间</div>
            <div style={{ fontSize: '16px', marginTop: '4px', color: '#1e40af' }}>{metrics.uptime}</div>
          </div>
        )}
      </div>
    );
  };

  // Render DLQ
  const renderDLQ = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <select
          value={selectedDLQType}
          onChange={(e) => setSelectedDLQType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '200px' }}
        >
          <option value="">全部类型</option>
          {metrics?.byType && Object.keys(metrics.byType).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button onClick={() => fetchDLQ()} disabled={dlqLoading} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
          {dlqLoading ? '加载中...' : '加载'}
        </button>
      </div>

      {dlqLoading ? (
        <div className="loading">加载中...</div>
      ) : Object.keys(dlqData).length > 0 ? (
        Object.entries(dlqData).map(([eventType, events]) => (
          <div key={eventType} style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '12px' }}>
              {eventType}
              <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>({events.length} 条)</span>
              <button onClick={() => clearDLQ(eventType)} style={{ marginLeft: '12px', padding: '4px 12px', borderRadius: '4px', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                清除该类型
              </button>
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {events.map((item, idx) => (
                <div key={idx} style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>事件 ID: {item.event?.eventId}</div>
                  <div style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '4px' }}>错误: {item.errorMessage}</div>
                  <div style={{ fontSize: '12px', color: '#991b1b' }}>监听器: {item.listenerName} | 时间: {item.failedAt}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : dlqData !== null ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无死信事件</div>
      ) : null}
    </div>
  );

  // Render Source
  const renderSource = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="输入事件类型 (如 ORDER.CREATED)"
          value={sourceEventType}
          onChange={(e) => setSourceEventType(e.target.value)}
          style={{ padding: '8px 12px', width: '250px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        />
        <input
          type="number"
          placeholder="数量"
          value={sourceCount}
          onChange={(e) => setSourceCount(Number(e.target.value))}
          style={{ padding: '8px 12px', width: '80px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        />
        <button onClick={() => fetchSource()} disabled={sourceLoading} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
          {sourceLoading ? '加载中...' : '加载'}
        </button>
      </div>

      {sourceLoading ? (
        <div className="loading">加载中...</div>
      ) : sourceEvents.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>事件ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>类型</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>操作人</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>摘要</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>时间</th>
            </tr>
          </thead>
          <tbody>
            {sourceEvents.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{item.eventId}</td>
                <td style={{ padding: '12px' }}>{item.eventType}</td>
                <td style={{ padding: '12px' }}>{item.operator}</td>
                <td style={{ padding: '12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>{item.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : sourceEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>请输入事件类型并加载</div>
      ) : null}
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '24px', color: '#111827' }}>⚡ 异步事件管理</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
        {[
          { key: 'metrics', label: '📊 事件指标' },
          { key: 'dlq', label: '⚠️ 死信队列' },
          { key: 'source', label: '📝 事件溯源' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'dlq') fetchDLQ();
              if (tab.key === 'source') fetchSource();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === tab.key ? '#3b82f6' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'metrics' && renderMetrics()}
        {activeTab === 'dlq' && renderDLQ()}
        {activeTab === 'source' && renderSource()}
      </div>
    </div>
  );
};

export default EventManagement;
