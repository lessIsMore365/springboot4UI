import React, { useState, useEffect } from 'react';
import { monitorService } from '../../services';
import './OnlineUserManagement.css';

const OnlineUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offlineResult, setOfflineResult] = useState(null);
  const [confirmOffline, setConfirmOffline] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await monitorService.getOnlineUsers();
      if (result.success) {
        setUsers(result.data || []);
        setTotal(result.total || 0);
      } else {
        setError(result.message || '获取在线用户失败');
      }
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleForceOffline = async (authorizationId) => {
    try {
      const result = await monitorService.forceOffline(authorizationId);
      setOfflineResult(result);
      setConfirmOffline(null);
      if (result.success) loadUsers();
    } catch (err) {
      setOfflineResult({ success: false, message: err.message });
    }
  };

  return (
    <div className="online-container">
      <div className="online-header">
        <h2>在线用户</h2>
        <button className="btn btn-test" onClick={loadUsers} disabled={loading}>
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {offlineResult && (
        <div className={`online-result ${offlineResult.success ? 'success' : 'error'}`}>
          {offlineResult.message || JSON.stringify(offlineResult)}
          <button className="btn-close-sm" onClick={() => setOfflineResult(null)}>×</button>
        </div>
      )}

      <div className="online-table-wrap">
        {loading ? <div className="loading">加载中...</div> : (
          <table className="online-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>登录时间</th>
                <th>过期时间</th>
                <th>剩余时间</th>
                <th>Token 类型</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map(u => (
                <tr key={u.authorizationId}>
                  <td className="online-username">{u.username}</td>
                  <td>{u.loginTime ? new Date(u.loginTime).toLocaleString() : '-'}</td>
                  <td>{u.expireTime ? new Date(u.expireTime).toLocaleString() : '-'}</td>
                  <td><span className={`online-remaining ${u.remainingSeconds < 300 ? 'expiring' : ''}`}>{u.remainingDisplay || '-'}</span></td>
                  <td>{u.tokenType || '-'}</td>
                  <td>
                    {confirmOffline === u.authorizationId ? (
                      <span className="online-confirm">
                        <span style={{ fontSize: 12, color: '#e53e3e', marginRight: 8 }}>确认强制下线?</span>
                        <button className="btn btn-batch btn-sm" onClick={() => handleForceOffline(u.authorizationId)}>确认</button>
                        <button className="btn btn-cancel btn-sm" onClick={() => setConfirmOffline(null)} style={{ marginLeft: 4 }}>取消</button>
                      </span>
                    ) : (
                      <button className="btn btn-batch btn-sm" onClick={() => setConfirmOffline(u.authorizationId)}>强制下线</button>
                    )}
                  </td>
                </tr>
              )) : <tr><td colSpan="6" className="no-data">当前无在线用户</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <div className="online-footer">
        <span>在线用户总数: <strong>{total}</strong></span>
      </div>
    </div>
  );
};

export default OnlineUserManagement;
