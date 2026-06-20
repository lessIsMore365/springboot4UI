import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 登录日志管理页面 - 分页查询、清理旧日志
 */
const LoginLogManagement = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [filterUsername, setFilterUsername] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [deleteCount, setDeleteCount] = useState(0);

  const statusLabels = {
    SUCCESS: '成功',
    FAIL_LOCKED: '锁定',
    FAIL_PASSWORD: '密码错误',
    FAIL_CAPTCHA: '验证码错误'
  };

  const statusClasses = {
    SUCCESS: 'status-success',
    FAIL_LOCKED: 'status-locked',
    FAIL_PASSWORD: 'status-fail',
    FAIL_CAPTCHA: 'status-fail'
  };

  // Fetch login logs
  const fetchLogs = async (page = pagination.page) => {
    setLoading(true);
    try {
      const params = { page, size: pagination.size };
      if (filterUsername) params.username = filterUsername;
      if (filterStatus) params.status = filterStatus;

      const res = await axios.get('/api/monitor/loginlog', { params });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        const p = res.data.pagination;
        setPagination(p || { page, size: pagination.size, total: 0, pages: 0 });
      }
    } catch (err) {
      console.error('获取登录日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup old logs
  const cleanupLogs = async () => {
    if (!window.confirm(`确定要清理 ${cleanupDays} 天前的登录日志吗？`)) return;
    setCleanupLoading(true);
    try {
      const res = await axios.delete('/api/monitor/loginlog', { params: { beforeDays: cleanupDays } });
      if (res.data?.success) {
        setDeleteCount(res.data.deletedCount || 0);
        setResultMessage(res.data.message);
        fetchLogs();
      }
    } catch (err) {
      console.error('清理失败:', err);
      setResultMessage('清理失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setCleanupLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, []);

  const totalPages = pagination.pages || 0;
  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(totalPages, pagination.page + 2);

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '24px', color: '#111827' }}>📝 登录日志管理</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="用户名筛选"
          value={filterUsername}
          onChange={(e) => setFilterUsername(e.target.value)}
          style={{ padding: '8px 12px', width: '150px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        >
          <option value="">全部状态</option>
          <option value="SUCCESS">成功</option>
          <option value="FAIL_LOCKED">锁定</option>
          <option value="FAIL_PASSWORD">密码错误</option>
          <option value="FAIL_CAPTCHA">验证码错误</option>
        </select>
        <button onClick={() => fetchLogs(1)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
          查询
        </button>
      </div>

      {/* Results message */}
      {resultMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          background: deleteCount > 0 ? '#d1fae5' : '#fef2f2',
          color: deleteCount > 0 ? '#065f46' : '#991b1b',
          border: `1px solid ${deleteCount > 0 ? '#a7f3d0' : '#fecaca'}`
        }}>
          {resultMessage}
          {deleteCount > 0 && <span> (共删除 {deleteCount} 条)</span>}
        </div>
      )}

      {/* Cleanup section */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#92400e' }}>🗑️ 清理旧日志</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#78716c' }}>清理 N 天前:</label>
          <input
            type="number"
            value={cleanupDays}
            onChange={(e) => setCleanupDays(Number(e.target.value))}
            min="1"
            max="3650"
            style={{ padding: '8px 12px', width: '80px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <button
            onClick={cleanupLogs}
            disabled={cleanupLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: cleanupLoading ? '#9ca3af' : '#ef4444',
              color: 'white',
              cursor: cleanupLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {cleanupLoading ? '清理中...' : '执行清理'}
          </button>
        </div>
      </div>

      {/* Logs table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>加载中...</div>
      ) : logs.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>用户名</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>状态</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>IP</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>位置</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>浏览器</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>操作系统</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>信息</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>登录时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{log.id}</td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{log.username}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`status-badge ${statusClasses[log.status] || ''}`} style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: log.status === 'SUCCESS' ? '#d1fae5' : '#fee2e2',
                      color: log.status === 'SUCCESS' ? '#065f46' : '#991b1b'
                    }}>
                      {statusLabels[log.status] || log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{log.ip}</td>
                  <td style={{ padding: '12px' }}>{log.location}</td>
                  <td style={{ padding: '12px' }}>{log.browser}</td>
                  <td style={{ padding: '12px' }}>{log.os}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{log.message}</td>
                  <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>{log.loginTime}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '24px' }}>
              <button
                onClick={() => fetchLogs(1)}
                disabled={pagination.page <= 1}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                ««
              </button>
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                «
              </button>

              {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => fetchLogs(pageNum)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    background: pageNum === pagination.page ? '#3b82f6' : 'white',
                    color: pageNum === pagination.page ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontWeight: pageNum === pagination.page ? 'bold' : 'normal'
                  }}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: pagination.page >= totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= totalPages ? 0.5 : 1 }}
              >
                »
              </button>
              <button
                onClick={() => fetchLogs(totalPages)}
                disabled={pagination.page >= totalPages}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: pagination.page >= totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= totalPages ? 0.5 : 1 }}
              >
                »»
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无登录日志数据</div>
      )}
    </div>
  );
};

export default LoginLogManagement;
