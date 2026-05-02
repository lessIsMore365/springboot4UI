import React, { useState } from 'react';
import { redisService } from '../../services';
import './Redis.css';

const RedisOperations = () => {
  const [activeTab, setActiveTab] = useState('ops');
  const [operation, setOperation] = useState('GET');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [field, setField] = useState('');
  const [timeout, setTimeout_] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [listValues, setListValues] = useState('');
  const [listStart, setListStart] = useState('0');
  const [listEnd, setListEnd] = useState('-1');
  const [setValues, setSetValues] = useState('');

  // Admin tab state
  const [infoData, setInfoData] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [keysPattern, setKeysPattern] = useState('*');
  const [keysData, setKeysData] = useState(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [perfCount, setPerfCount] = useState(100);
  const [perfResult, setPerfResult] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [concCount, setConcCount] = useState(10);
  const [concResult, setConcResult] = useState(null);
  const [concLoading, setConcLoading] = useState(false);
  const [flushLoading, setFlushLoading] = useState(false);
  const [flushConfirm, setFlushConfirm] = useState('');

  const operations = [
    { id: 'GET', label: '获取键值', needsValue: false, needsField: false, needsTimeout: false },
    { id: 'SET', label: '设置键值', needsValue: true, needsField: false, needsTimeout: true },
    { id: 'DELETE', label: '删除键', needsValue: false, needsField: false, needsTimeout: false },
    { id: 'EXISTS', label: '检查存在', needsValue: false, needsField: false, needsTimeout: false },
    { id: 'EXPIRE', label: '设置过期', needsValue: false, needsField: false, needsTimeout: true },
    { id: 'HSET', label: '哈希设置', needsValue: true, needsField: true, needsTimeout: false },
    { id: 'HGET', label: '哈希获取', needsValue: false, needsField: true, needsTimeout: false },
    { id: 'LPUSH', label: '列表左推', needsValue: true, needsField: false, needsTimeout: false },
    { id: 'LRANGE', label: '列表范围', needsValue: false, needsField: false, needsTimeout: false },
    { id: 'SADD', label: '集合添加', needsValue: true, needsField: false, needsTimeout: false },
  ];

  const currentOp = operations.find(op => op.id === operation);
  const executeOperation = async () => {
    if (!key.trim()) { setError('请输入键'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let response;
      switch (operation) {
        case 'GET':
          response = await redisService.get(key);
          break;
        case 'SET':
          response = await redisService.set(key, value, timeout ? parseInt(timeout) : undefined, 'SECONDS');
          break;
        case 'DELETE':
          response = await redisService.delete(key);
          break;
        case 'EXISTS':
          response = await redisService.exists(key);
          break;
        case 'EXPIRE':
          response = await redisService.expire(key, parseInt(timeout), 'SECONDS');
          break;
        case 'HSET':
          response = await redisService.hashSet(key, field, value);
          break;
        case 'HGET':
          response = await redisService.hashGet(key, field);
          break;
        case 'LPUSH':
          response = await redisService.listPushLeft(key, listValues);
          break;
        case 'LRANGE':
          response = await redisService.getListRange(key, parseInt(listStart), parseInt(listEnd));
          break;
        case 'SADD':
          response = await redisService.setAdd(key, setValues.split(',').map(s => s.trim()).filter(s => s));
          break;
        default:
          throw new Error('未知操作');
      }
      if (response.success !== false) setResult(response);
      else setError(response.message || '操作失败');
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try { setResult(await redisService.testConnection()); }
    catch (err) { setError(err.message || '连接测试失败'); }
    finally { setLoading(false); }
  };

  const healthCheck = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try { setResult(await redisService.healthCheck()); }
    catch (err) { setError(err.message || '健康检查失败'); }
    finally { setLoading(false); }
  };

  const clearForm = () => {
    setKey(''); setValue(''); setField(''); setTimeout_('');
    setListValues(''); setListStart('0'); setListEnd('-1'); setSetValues('');
    setResult(null); setError('');
  };

  // Admin handlers
  const handleGetInfo = async () => {
    setInfoLoading(true);
    try { setInfoData(await redisService.getInfo()); }
    catch (err) { setInfoData({ success: false, message: err.message }); }
    finally { setInfoLoading(false); }
  };

  const handleGetStats = async () => {
    setStatsLoading(true);
    try { setStatsData(await redisService.getStats()); }
    catch (err) { setStatsData({ success: false, message: err.message }); }
    finally { setStatsLoading(false); }
  };

  const handleGetKeys = async () => {
    setKeysLoading(true);
    setKeysData(null);
    try { setKeysData(await redisService.getKeys(keysPattern)); }
    catch (err) { setKeysData({ success: false, message: err.message }); }
    finally { setKeysLoading(false); }
  };

  const handlePerfTest = async () => {
    setPerfLoading(true);
    setPerfResult(null);
    try { setPerfResult(await redisService.performanceBatchSet(perfCount)); }
    catch (err) { setPerfResult({ success: false, message: err.message }); }
    finally { setPerfLoading(false); }
  };

  const handleConcTest = async () => {
    setConcLoading(true);
    setConcResult(null);
    try { setConcResult(await redisService.concurrentTest(concCount)); }
    catch (err) { setConcResult({ success: false, message: err.message }); }
    finally { setConcLoading(false); }
  };

  const handleFlushDb = async () => {
    if (flushConfirm !== '确认清空') {
      setError('请输入"确认清空"来确认操作');
      return;
    }
    setFlushLoading(true);
    setError('');
    try {
      const result = await redisService.flushDb();
      if (result.success) setResult({ success: true, message: 'Redis数据库已清空' });
      else setError(result.message || '清空失败');
    } catch (err) { setError(err.message || '请求失败'); }
    finally { setFlushLoading(false); }
  };

  const formatResult = (data) => {
    if (data === null || data === undefined) return null;
    if (typeof data === 'object') return JSON.stringify(data, null, 2);
    return String(data);
  };
  return (
    <div className="redis-container">
      <div className="redis-header">
        <h2>Redis操作</h2>
        <div className="redis-info">
          <p>Redis连接: <code>127.0.0.1:6379</code></p>
          <div className="redis-actions">
            <button className="btn btn-test" onClick={testConnection} disabled={loading}>测试连接</button>
            <button className="btn btn-health" onClick={healthCheck} disabled={loading}>健康检查</button>
          </div>
        </div>
      </div>

      <div className="redis-tabs">
        <button className={'redis-tab' + (activeTab === 'ops' ? ' active' : '')} onClick={() => setActiveTab('ops')}>基本操作</button>
        <button className={'redis-tab' + (activeTab === 'admin' ? ' active' : '')} onClick={() => setActiveTab('admin')}>管理功能</button>
      </div>
      {activeTab === 'ops' && (
        <div className="redis-operations">
          <div className="operation-selector">
            <h3>选择操作</h3>
            <div className="operation-buttons">
              {operations.map(op => (
                <button key={op.id}
                  className={'btn-op' + (operation === op.id ? ' active' : '')}
                  onClick={() => { setOperation(op.id); clearForm(); }}>
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className="operation-form">
            <h3>{currentOp?.label}</h3>

            <div className="form-group">
              <label>键 (Key) *</label>
              <input type="text" value={key} onChange={(e) => setKey(e.target.value)}
                placeholder="输入Redis键" disabled={loading} />
            </div>

            {currentOp.needsField && (
              <div className="form-group">
                <label>字段 (Field)</label>
                <input type="text" value={field} onChange={(e) => setField(e.target.value)}
                  placeholder="输入字段名" disabled={loading} />
              </div>
            )}

            {currentOp.needsValue && operation === 'SET' && (
              <div className="form-group">
                <label>值 (Value)</label>
                <textarea value={value} onChange={(e) => setValue(e.target.value)}
                  placeholder="输入值" rows="3" disabled={loading} />
              </div>
            )}

            {currentOp.needsValue && operation === 'HSET' && (
              <div className="form-group">
                <label>字段值</label>
                <textarea value={value} onChange={(e) => setValue(e.target.value)}
                  placeholder="输入字段值" rows="3" disabled={loading} />
              </div>
            )}

            {operation === 'LPUSH' && (
              <div className="form-group">
                <label>值 (可多个，用逗号分隔)</label>
                <textarea value={listValues} onChange={(e) => setListValues(e.target.value)}
                  placeholder="值1, 值2, 值3" rows="2" disabled={loading} />
              </div>
            )}

            {operation === 'LRANGE' && (
              <div className="form-group-row">
                <div className="form-group">
                  <label>起始索引</label>
                  <input type="number" value={listStart} onChange={(e) => setListStart(e.target.value)}
                    disabled={loading} />
                </div>
                <div className="form-group">
                  <label>结束索引</label>
                  <input type="number" value={listEnd} onChange={(e) => setListEnd(e.target.value)}
                    disabled={loading} />
                </div>
              </div>
            )}

            {operation === 'SADD' && (
              <div className="form-group">
                <label>元素 (可多个，用逗号分隔)</label>
                <textarea value={setValues} onChange={(e) => setSetValues(e.target.value)}
                  placeholder="元素1, 元素2, 元素3" rows="2" disabled={loading} />
              </div>
            )}

            {currentOp.needsTimeout && (
              <div className="form-group">
                <label>过期时间 (秒)</label>
                <input type="number" value={timeout} onChange={(e) => setTimeout_(e.target.value)}
                  placeholder="输入过期时间" min="1" disabled={loading} />
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-execute" onClick={executeOperation} disabled={loading}>
                {loading ? '执行中...' : '执行操作'}
              </button>
              <button className="btn btn-clear" onClick={clearForm} disabled={loading}>清空</button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'admin' && (
        <div className="redis-admin">
          <h3>管理功能</h3>

          {/* Info & Stats & Keys */}
          <div className="admin-section">
            <div className="admin-actions-row">
              <div className="admin-action-item">
                <button className="btn btn-test" onClick={handleGetInfo} disabled={infoLoading}>
                  {infoLoading ? '获取中...' : '获取Redis信息'}
                </button>
                {infoData && (
                  <div className="redis-admin-result">
                    <pre>{formatResult(infoData)}</pre>
                  </div>
                )}
              </div>
              <div className="admin-action-item">
                <button className="btn btn-test" onClick={handleGetStats} disabled={statsLoading}>
                  {statsLoading ? '获取中...' : '获取Redis统计'}
                </button>
                {statsData && (
                  <div className="redis-admin-result">
                    <pre>{formatResult(statsData)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h4>查询键</h4>
            <div className="admin-actions-row">
              <input type="text" className="toolbar-input" value={keysPattern}
                onChange={(e) => setKeysPattern(e.target.value)} placeholder="模式 (默认 *)"
                style={{ width: '150px' }} />
              <button className="btn btn-test" onClick={handleGetKeys} disabled={keysLoading}>
                {keysLoading ? '查询中...' : '查询键'}
              </button>
              {keysData && (
                <span className={'toolbar-result ' + (keysData.success ? 'success' : 'error')}>
                  {keysData.success
                    ? (keysData.data ? '找到 ' + keysData.data.length + ' 个键' : '键列表')
                    : keysData.message}
                </span>
              )}
            </div>
            {keysData?.success && keysData?.data && keysData.data.length > 0 && (
              <div className="redis-admin-result">
                <pre>{formatResult(keysData.data)}</pre>
              </div>
            )}
          </div>
          {/* Performance & Concurrent Tests */}
          <div className="admin-section">
            <h4>性能测试</h4>
            <div className="admin-actions-row">
              <span className="toolbar-label">批量数:</span>
              <input type="number" className="toolbar-input" value={perfCount}
                onChange={(e) => setPerfCount(parseInt(e.target.value) || 100)} min="1" max="10000" />
              <button className="btn btn-batch" onClick={handlePerfTest} disabled={perfLoading}>
                {perfLoading ? '测试中...' : '批量设置性能测试'}
              </button>
              {perfResult && (
                <span className={'toolbar-result ' + (perfResult.success ? 'success' : 'error')}>
                  {perfResult.message || (perfResult.success ? '完成' : '失败')}
                </span>
              )}
            </div>
            {perfResult && (
              <div className="redis-admin-result">
                <pre>{formatResult(perfResult)}</pre>
              </div>
            )}
          </div>

          <div className="admin-section">
            <h4>并发测试</h4>
            <div className="admin-actions-row">
              <span className="toolbar-label">并发数:</span>
              <input type="number" className="toolbar-input" value={concCount}
                onChange={(e) => setConcCount(parseInt(e.target.value) || 10)} min="1" max="100" />
              <button className="btn btn-test" onClick={handleConcTest} disabled={concLoading}>
                {concLoading ? '测试中...' : '并发测试'}
              </button>
              {concResult && (
                <span className={'toolbar-result ' + (concResult.success ? 'success' : 'error')}>
                  {concResult.message || (concResult.success ? '完成' : '失败')}
                </span>
              )}
            </div>
            {concResult && (
              <div className="redis-admin-result">
                <pre>{formatResult(concResult)}</pre>
              </div>
            )}
          </div>

          {/* Flush DB */}
          <div className="admin-section flush-section">
            <h4>清空数据库</h4>
            <p className="flush-warning">警告: 此操作会清空当前Redis数据库中的所有数据，不可恢复！</p>
            <div className="admin-actions-row">
              <input type="text" className="toolbar-input" value={flushConfirm}
                onChange={(e) => setFlushConfirm(e.target.value)}
                placeholder='输入"确认清空"' style={{ width: '150px' }} />
              <button className="btn btn-batch" onClick={handleFlushDb} disabled={flushLoading || flushConfirm !== '确认清空'}
                style={{ background: '#e53e3e' }}>
                {flushLoading ? '清空中...' : '清空数据库'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Result */}
      {(error || result) && (
        <div className="operation-result">
          <h3>执行结果</h3>
          {error && <div className="result-error"><strong>错误:</strong> {error}</div>}
          {result && (
            <div className="result-success">
              <strong>成功:</strong>
              <pre>{formatResult(result)}</pre>
            </div>
          )}
        </div>
      )}

      <div className="redis-tips">
        <h4>使用提示:</h4>
        <ul>
          <li>键名示例: <code>user:1001</code>, <code>session:abc123</code></li>
          <li>哈希操作需要同时指定键和字段</li>
          <li>LPUSH 和 SADD 的值可用逗号分隔多个</li>
          <li>LRANGE: 0 到 -1 表示全部元素</li>
          <li>默认Redis数据库: <code>0</code></li>
        </ul>
      </div>
    </div>
  );
};

export default RedisOperations;
