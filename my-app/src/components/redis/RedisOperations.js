import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { redisService } from '../../services';
import './Redis.css';

const OPS = [
  { id: 'GET', label: '获取键值', icon: '🔍', desc: '根据 key 获取对应的 value', needsValue: false, needsField: false, needsTimeout: false },
  { id: 'SET', label: '设置键值', icon: '📝', desc: '设置 key-value，可指定过期时间', needsValue: true, needsField: false, needsTimeout: true },
  { id: 'DELETE', label: '删除键', icon: '🗑️', desc: '删除指定的 key', needsValue: false, needsField: false, needsTimeout: false },
  { id: 'EXISTS', label: '检查存在', icon: '✅', desc: '检查 key 是否存在于 Redis', needsValue: false, needsField: false, needsTimeout: false },
  { id: 'EXPIRE', label: '设置过期', icon: '⏱️', desc: '为 key 设置过期时间（秒）', needsValue: false, needsField: false, needsTimeout: true },
  { id: 'HSET', label: '哈希设置', icon: '📋', desc: '设置 Hash 中 field 的值', needsValue: true, needsField: true, needsTimeout: false },
  { id: 'HGET', label: '哈希获取', icon: '📄', desc: '获取 Hash 中 field 的值', needsValue: false, needsField: true, needsTimeout: false },
  { id: 'LPUSH', label: '列表左推', icon: '📥', desc: '向 List 左侧推入元素', needsValue: true, needsField: false, needsTimeout: false },
  { id: 'LRANGE', label: '列表范围', icon: '📊', desc: '获取 List 指定范围的元素', needsValue: false, needsField: false, needsTimeout: false },
  { id: 'SADD', label: '集合添加', icon: '➕', desc: '向 Set 中添加元素', needsValue: true, needsField: false, needsTimeout: false },
];

const NAMESPACES = [
  { ns: 'oauth2:authorization', ttl: '1h', purpose: 'OAuth2 授权对象' },
  { ns: 'oauth2:access_token', ttl: '1h', purpose: 'Access Token 索引' },
  { ns: 'oauth2:refresh_token', ttl: '30d', purpose: 'Refresh Token 索引' },
  { ns: 'oauth2:authorization_code', ttl: '5min', purpose: 'Authorization Code 索引' },
  { ns: 'oauth2:id_token', ttl: '1h', purpose: 'ID Token 索引' },
  { ns: 'lock:payment', ttl: '30s', purpose: '支付分布式锁' },
  { ns: 'idempotent', ttl: '24h', purpose: '幂等性缓存' },
  { ns: 'ratelimit', ttl: '2s', purpose: '限流滑动窗口' },
  { ns: 'captcha', ttl: '5min', purpose: '验证码数据' },
  { ns: 'sys_dict', ttl: '24h', purpose: '字典缓存' },
  { ns: 'cache:metrics', ttl: '7d', purpose: '缓存统计' },
  { ns: 'lock:internal', ttl: '10s', purpose: '内部操作锁' },
];

const RedisOperations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ops';

  // Tab 1: Basic Operations
  const [operation, setOperation] = useState('GET');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [field, setField] = useState('');
  const [timeout, setTimeout_] = useState('');
  const [listValues, setListValues] = useState('');
  const [listStart, setListStart] = useState('0');
  const [listEnd, setListEnd] = useState('-1');
  const [setValues, setSetValues] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Tab 2: Cache Management
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [keysPattern, setKeysPattern] = useState('*');
  const [keysData, setKeysData] = useState(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [evictKey, setEvictKey] = useState('');
  const [evictResult, setEvictResult] = useState(null);
  const [evictLoading, setEvictLoading] = useState(false);

  // Tab 3: Service Monitor
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [infoData, setInfoData] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [perfCount, setPerfCount] = useState(100);
  const [perfResult, setPerfResult] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [concCount, setConcCount] = useState(10);
  const [concResult, setConcResult] = useState(null);
  const [concLoading, setConcLoading] = useState(false);
  const [flushConfirm, setFlushConfirm] = useState('');
  const [flushLoading, setFlushLoading] = useState(false);
  const [connResult, setConnResult] = useState(null);
  const [connLoading, setConnLoading] = useState(false);

  const currentOp = OPS.find(op => op.id === operation);

  // Auto-load cache stats on tab switch
  useEffect(() => {
    if (activeTab === 'cache') fetchCacheStats();
    if (activeTab === 'monitor') fetchHealth();
  }, [activeTab]);

  // --- Tab 1 Handlers ---
  const clearForm = () => {
    setKey(''); setValue(''); setField(''); setTimeout_('');
    setListValues(''); setListStart('0'); setListEnd('-1'); setSetValues('');
    setResult(null); setError('');
  };

  const executeOperation = async () => {
    if (!key.trim()) { setError('请输入键'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      let response;
      switch (operation) {
        case 'GET': response = await redisService.get(key); break;
        case 'SET': response = await redisService.set(key, value, timeout ? parseInt(timeout) : undefined, 'SECONDS'); break;
        case 'DELETE': response = await redisService.delete(key); break;
        case 'EXISTS': response = await redisService.exists(key); break;
        case 'EXPIRE': response = await redisService.expire(key, parseInt(timeout), 'SECONDS'); break;
        case 'HSET': response = await redisService.hashSet(key, field, value); break;
        case 'HGET': response = await redisService.hashGet(key, field); break;
        case 'LPUSH': response = await redisService.listPushLeft(key, listValues); break;
        case 'LRANGE': response = await redisService.getListRange(key, parseInt(listStart), parseInt(listEnd)); break;
        case 'SADD': response = await redisService.setAdd(key, setValues.split(',').map(s => s.trim()).filter(s => s)); break;
        default: throw new Error('未知操作');
      }
      if (response.success !== false) setResult(response);
      else setError(response.message || '操作失败');
    } catch (err) { setError(err.message || '请求失败'); }
    finally { setLoading(false); }
  };

  // --- Tab 2 Handlers ---
  const fetchCacheStats = async () => {
    setCacheLoading(true);
    try { setCacheStats(await redisService.getStats()); }
    catch (err) { setCacheStats({ success: false, message: err.message }); }
    finally { setCacheLoading(false); }
  };

  const handleGetKeys = async () => {
    setKeysLoading(true); setKeysData(null);
    try { setKeysData(await redisService.getKeys(keysPattern)); }
    catch (err) { setKeysData({ success: false, message: err.message }); }
    finally { setKeysLoading(false); }
  };

  const handleEvict = async () => {
    if (!evictKey.trim()) return;
    setEvictLoading(true); setEvictResult(null);
    try { setEvictResult(await redisService.delete(evictKey)); }
    catch (err) { setEvictResult({ success: false, message: err.message }); }
    finally { setEvictLoading(false); }
  };

  // --- Tab 3 Handlers ---
  const fetchHealth = async () => {
    setHealthLoading(true);
    try { setHealthData(await redisService.healthCheck()); }
    catch (err) { setHealthData({ status: 'DOWN', message: err.message }); }
    finally { setHealthLoading(false); }
  };

  const fetchInfo = async () => {
    setInfoLoading(true);
    try { setInfoData(await redisService.getInfo()); }
    catch (err) { setInfoData({ success: false, message: err.message }); }
    finally { setInfoLoading(false); }
  };

  const handleConnTest = async () => {
    setConnLoading(true); setConnResult(null);
    try { setConnResult(await redisService.testConnection()); }
    catch (err) { setConnResult({ success: false, message: err.message }); }
    finally { setConnLoading(false); }
  };

  const handlePerfTest = async () => {
    setPerfLoading(true); setPerfResult(null);
    try { setPerfResult(await redisService.performanceBatchSet(perfCount)); }
    catch (err) { setPerfResult({ success: false, message: err.message }); }
    finally { setPerfLoading(false); }
  };

  const handleConcTest = async () => {
    setConcLoading(true); setConcResult(null);
    try { setConcResult(await redisService.concurrentTest(concCount)); }
    catch (err) { setConcResult({ success: false, message: err.message }); }
    finally { setConcLoading(false); }
  };

  const handleFlushDb = async () => {
    if (flushConfirm !== '确认清空') { setError('请输入"确认清空"来确认操作'); return; }
    setFlushLoading(true); setError('');
    try {
      const res = await redisService.flushDb();
      if (res.success) setResult({ success: true, message: 'Redis 数据库已清空' });
      else setError(res.message || '清空失败');
    } catch (err) { setError(err.message || '请求失败'); }
    finally { setFlushLoading(false); }
  };

  const formatVal = (d) => {
    if (d === null || d === undefined) return null;
    if (typeof d === 'object') return JSON.stringify(d, null, 2);
    return String(d);
  };

  const cache = cacheStats?.data?.cache || {};
  const memory = cacheStats?.data?.memory || {};

  return (
    <div className="redis-container">
      <div className="redis-header">
        <h2>数据服务</h2>
        <p className="redis-subtitle">Redis · 三层抽象架构（RedisOps / RedisCache / RedisLock·RateLimiter）</p>
      </div>

      <div className="redis-tabs">
        <button className={'redis-tab' + (activeTab === 'ops' ? ' active' : '')} onClick={() => setSearchParams({ tab: 'ops' })}>
          <span className="tab-icon">🔧</span> 基础操作
        </button>
        <button className={'redis-tab' + (activeTab === 'cache' ? ' active' : '')} onClick={() => setSearchParams({ tab: 'cache' })}>
          <span className="tab-icon">📊</span> 缓存管理
        </button>
        <button className={'redis-tab' + (activeTab === 'monitor' ? ' active' : '')} onClick={() => setSearchParams({ tab: 'monitor' })}>
          <span className="tab-icon">📈</span> 服务监控
        </button>
      </div>

      {/* ========== Tab 1: 基础操作 ========== */}
      {activeTab === 'ops' && (
        <div className="ops-layout">
          <div className="ops-sidebar">
            <h3 className="ops-sidebar-title">操作类型</h3>
            {OPS.map(op => (
              <div key={op.id}
                className={'op-card' + (operation === op.id ? ' active' : '')}
                onClick={() => { setOperation(op.id); clearForm(); }}>
                <span className="op-card-icon">{op.icon}</span>
                <div className="op-card-body">
                  <span className="op-card-label">{op.label}</span>
                  <span className="op-card-desc">{op.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ops-main">
            <div className="ops-form">
              <h3>{currentOp?.icon} {currentOp?.label}</h3>
              <p className="ops-form-desc">{currentOp?.desc}</p>

              <div className="form-group">
                <label>键 (Key) *</label>
                <input type="text" value={key} onChange={(e) => setKey(e.target.value)} placeholder="输入 Redis 键" disabled={loading} />
              </div>

              {currentOp.needsField && (
                <div className="form-group">
                  <label>字段 (Field)</label>
                  <input type="text" value={field} onChange={(e) => setField(e.target.value)} placeholder="输入字段名" disabled={loading} />
                </div>
              )}

              {(currentOp.needsValue && (operation === 'SET' || operation === 'HSET')) && (
                <div className="form-group">
                  <label>值 (Value)</label>
                  <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="输入值" rows="3" disabled={loading} />
                </div>
              )}

              {operation === 'LPUSH' && (
                <div className="form-group">
                  <label>值（逗号分隔多个）</label>
                  <textarea value={listValues} onChange={(e) => setListValues(e.target.value)} placeholder="值1, 值2, 值3" rows="2" disabled={loading} />
                </div>
              )}

              {operation === 'LRANGE' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>起始索引</label>
                    <input type="number" value={listStart} onChange={(e) => setListStart(e.target.value)} disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label>结束索引</label>
                    <input type="number" value={listEnd} onChange={(e) => setListEnd(e.target.value)} disabled={loading} />
                  </div>
                </div>
              )}

              {operation === 'SADD' && (
                <div className="form-group">
                  <label>元素（逗号分隔多个）</label>
                  <textarea value={setValues} onChange={(e) => setSetValues(e.target.value)} placeholder="元素1, 元素2, 元素3" rows="2" disabled={loading} />
                </div>
              )}

              {currentOp.needsTimeout && (
                <div className="form-group">
                  <label>过期时间（秒）</label>
                  <input type="number" value={timeout} onChange={(e) => setTimeout_(e.target.value)} placeholder="可选" min="1" disabled={loading} />
                </div>
              )}

              <div className="form-actions">
                <button className="btn-exec" onClick={executeOperation} disabled={loading}>
                  {loading ? '执行中...' : '执行'}
                </button>
                <button className="btn-clear" onClick={clearForm} disabled={loading}>清空</button>
              </div>
            </div>

            {(error || result) && (
              <div className="ops-result">
                <h4>执行结果</h4>
                {error && <div className="result-error">{error}</div>}
                {result && <pre className="result-data">{formatVal(result)}</pre>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== Tab 2: 缓存管理 ========== */}
      {activeTab === 'cache' && (
        <div className="cache-tab">
          {/* Stats Dashboard */}
          <section className="section-card">
            <div className="section-header">
              <h3>缓存统计</h3>
              <button className="btn-refresh" onClick={fetchCacheStats} disabled={cacheLoading}>
                {cacheLoading ? '加载中...' : '刷新'}
              </button>
            </div>
            {cacheStats?.success && (
              <div className="stats-grid">
                <div className="stat-card highlight">
                  <span className="stat-value">{cache.hitRate != null ? (cache.hitRate * 100).toFixed(1) + '%' : '—'}</span>
                  <span className="stat-label">命中率</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{cache.hits ?? '—'}</span>
                  <span className="stat-label">命中次数</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{cache.misses ?? '—'}</span>
                  <span className="stat-label">未命中次数</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{cache.putCount ?? '—'}</span>
                  <span className="stat-label">写入次数</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{cache.evictCount ?? '—'}</span>
                  <span className="stat-label">逐出次数</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{cacheStats?.data?.dbSize ?? '—'}</span>
                  <span className="stat-label">数据库 Key 总数</span>
                </div>
              </div>
            )}
            {cacheStats && !cacheStats.success && (
              <div className="result-error">获取统计失败: {cacheStats.message}</div>
            )}
          </section>

          {/* Key Namespaces */}
          <section className="section-card">
            <h3>Key 命名空间</h3>
            <p className="section-desc">RedisKeyNamespace 枚举管理的 12 种 Key 前缀及默认 TTL</p>
            <div className="ns-table-wrap">
              <table className="ns-table">
                <thead>
                  <tr><th>命名空间前缀</th><th>默认 TTL</th><th>用途</th></tr>
                </thead>
                <tbody>
                  {NAMESPACES.map((ns, i) => (
                    <tr key={i}>
                      <td><code>{ns.ns}</code></td>
                      <td><span className="ttl-badge">{ns.ttl}</span></td>
                      <td>{ns.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Key Browser */}
          <section className="section-card">
            <h3>Key 浏览器</h3>
            <p className="section-desc">使用 SCAN 游标迭代（非阻塞）查询 Key</p>
            <div className="toolbar">
              <input type="text" value={keysPattern} onChange={(e) => setKeysPattern(e.target.value)}
                placeholder="匹配模式 (默认 *)" className="toolbar-input" />
              <button className="btn-exec" onClick={handleGetKeys} disabled={keysLoading}>
                {keysLoading ? '查询中...' : '查询'}
              </button>
            </div>
            {keysData?.success && (
              <div className="keys-result">
                <span className="keys-count">找到 {keysData.data?.length ?? 0} 个 Key</span>
                {keysData.data?.length > 0 && (
                  <div className="keys-list">
                    {keysData.data.map((k, i) => <code key={i} className="key-chip">{k}</code>)}
                  </div>
                )}
              </div>
            )}
            {keysData && !keysData.success && <div className="result-error">{keysData.message}</div>}
          </section>

          {/* Cache Eviction */}
          <section className="section-card danger-zone">
            <h3>缓存逐出</h3>
            <p className="section-desc">删除指定 Key 以逐出缓存</p>
            <div className="toolbar">
              <input type="text" value={evictKey} onChange={(e) => setEvictKey(e.target.value)}
                placeholder="输入要逐出的 Key" className="toolbar-input" />
              <button className="btn-warn" onClick={handleEvict} disabled={evictLoading || !evictKey.trim()}>
                {evictLoading ? '逐出中...' : '逐出'}
              </button>
            </div>
            {evictResult && (
              <div className={evictResult.success ? 'result-ok' : 'result-error'}>
                {evictResult.success ? '逐出成功' : evictResult.message}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========== Tab 3: 服务监控 ========== */}
      {activeTab === 'monitor' && (
        <div className="monitor-tab">
          {/* Quick Actions */}
          <section className="section-card">
            <div className="section-header">
              <h3>服务状态</h3>
              <div className="header-actions">
                <button className="btn-refresh" onClick={handleConnTest} disabled={connLoading}>
                  {connLoading ? '...' : '连接测试'}
                </button>
                <button className="btn-refresh" onClick={fetchHealth} disabled={healthLoading}>
                  {healthLoading ? '...' : '健康检查'}
                </button>
                <button className="btn-refresh" onClick={fetchInfo} disabled={infoLoading}>
                  {infoLoading ? '...' : '服务器信息'}
                </button>
              </div>
            </div>

            <div className="monitor-cards">
              {/* Connection Test */}
              {connResult && (
                <div className={'monitor-card ' + (connResult.success ? 'ok' : 'fail')}>
                  <span className="monitor-card-icon">{connResult.success ? '✅' : '❌'}</span>
                  <span className="monitor-card-label">连接测试</span>
                  <span className="monitor-card-msg">{connResult.message || (connResult.success ? 'PONG' : '失败')}</span>
                </div>
              )}

              {/* Health */}
              {healthData && (
                <div className={'monitor-card ' + (healthData.status === 'UP' ? 'ok' : 'fail')}>
                  <span className="monitor-card-icon">{healthData.status === 'UP' ? '💚' : '💔'}</span>
                  <span className="monitor-card-label">健康状态</span>
                  <span className="monitor-card-msg">{healthData.status}</span>
                </div>
              )}

              {/* DB Size */}
              {healthData?.status === 'UP' && cacheStats?.data && (
                <div className="monitor-card info">
                  <span className="monitor-card-icon">🗄️</span>
                  <span className="monitor-card-label">DB 大小</span>
                  <span className="monitor-card-msg">{cacheStats.data.dbSize ?? '—'} keys</span>
                </div>
              )}
            </div>
          </section>

          {/* Memory & Performance */}
          <div className="monitor-two-col">
            {/* Memory */}
            <section className="section-card">
              <h3>内存信息</h3>
              {memory && Object.keys(memory).length > 0 ? (
                <table className="info-table">
                  <tbody>
                    {Object.entries(memory).map(([k, v]) => (
                      <tr key={k}><td className="info-key">{k}</td><td>{String(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-hint">点击"服务器信息"加载内存数据</p>
              )}
            </section>

            {/* Server Info */}
            <section className="section-card">
              <h3>服务器信息</h3>
              {infoData?.success && infoData?.data ? (
                <table className="info-table">
                  <tbody>
                    {Object.entries(infoData.data).map(([k, v]) => (
                      <tr key={k}><td className="info-key">{k}</td><td>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-hint">点击"服务器信息"加载数据</p>
              )}
            </section>
          </div>

          {/* Performance Test */}
          <section className="section-card">
            <h3>性能测试 — Pipeline 批量写入</h3>
            <p className="section-desc">使用 Redis Pipeline 批量写入键值对，测试吞吐量</p>
            <div className="toolbar">
              <span className="toolbar-label">批量数:</span>
              <input type="number" value={perfCount} onChange={(e) => setPerfCount(parseInt(e.target.value) || 100)}
                min="1" max="10000" className="toolbar-input" />
              <button className="btn-exec" onClick={handlePerfTest} disabled={perfLoading}>
                {perfLoading ? '测试中...' : '开始测试'}
              </button>
            </div>
            {perfResult?.success && perfResult?.data?.stats && (
              <div className="perf-cards">
                <div className="perf-card"><span className="perf-val">{perfResult.data.stats.total}</span><span className="perf-lbl">总数</span></div>
                <div className="perf-card"><span className="perf-val">{perfResult.data.stats.durationMs} ms</span><span className="perf-lbl">耗时</span></div>
                <div className="perf-card"><span className="perf-val">{perfResult.data.stats.throughput?.toFixed(1)}</span><span className="perf-lbl">吞吐量/秒</span></div>
              </div>
            )}
            {perfResult && !perfResult.success && <div className="result-error">{perfResult.message}</div>}
          </section>

          {/* Concurrent Test */}
          <section className="section-card">
            <h3>并发测试 — 虚拟线程</h3>
            <p className="section-desc">使用虚拟线程并发写入，测试并发处理能力</p>
            <div className="toolbar">
              <span className="toolbar-label">并发数:</span>
              <input type="number" value={concCount} onChange={(e) => setConcCount(parseInt(e.target.value) || 10)}
                min="1" max="100" className="toolbar-input" />
              <button className="btn-exec" onClick={handleConcTest} disabled={concLoading}>
                {concLoading ? '测试中...' : '开始测试'}
              </button>
            </div>
            {concResult?.success && concResult?.data?.stats && (
              <div className="perf-cards">
                <div className="perf-card"><span className="perf-val">{concResult.data.stats.concurrentCount}</span><span className="perf-lbl">并发数</span></div>
                <div className="perf-card"><span className="perf-val">{concResult.data.stats.successCount}</span><span className="perf-lbl">成功数</span></div>
              </div>
            )}
            {concResult && !concResult.success && <div className="result-error">{concResult.message}</div>}
          </section>

          {/* Danger Zone */}
          <section className="section-card danger-zone">
            <h3>清空数据库</h3>
            <p className="flush-warning">此操作将清空当前 Redis 数据库中的所有数据，不可恢复！</p>
            <div className="toolbar">
              <input type="text" value={flushConfirm} onChange={(e) => setFlushConfirm(e.target.value)}
                placeholder='输入"确认清空"' className="toolbar-input" />
              <button className="btn-danger" onClick={handleFlushDb}
                disabled={flushLoading || flushConfirm !== '确认清空'}>
                {flushLoading ? '清空中...' : '清空数据库'}
              </button>
            </div>
            {error && <div className="result-error">{error}</div>}
            {result && activeTab === 'monitor' && <div className="result-ok">{result.message}</div>}
          </section>
        </div>
      )}

      {/* Tips */}
      <div className="redis-tips">
        <h4>架构说明</h4>
        <ul>
          <li><strong>RedisOps</strong>（底层）— SCAN 游标迭代、Pipeline 批量、连接复用、异步变体</li>
          <li><strong>RedisCache</strong>（中间层）— Cache-Aside 模式 + ObjectMapper 序列化 + 命中率统计</li>
          <li><strong>RedisLock</strong>（上层）— Lua HSET 可重入锁 + 续期 + 多实例安全</li>
          <li><strong>RedisRateLimiter</strong>（上层）— Lua Token Bucket 原子实现</li>
        </ul>
      </div>
    </div>
  );
};

export default RedisOperations;
