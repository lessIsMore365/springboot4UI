import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services';
import './AiManagement.css';

// ========================= Tab 切换 =========================
const Tabs = ({ tabs, active, onChange }) => (
  <div className="ai-tabs">
    {tabs.map(t => (
      <button
        key={t.key}
        className={`ai-tab${active === t.key ? ' active' : ''}`}
        onClick={() => onChange(t.key)}
      >
        <span>{t.icon}</span> {t.label}
      </button>
    ))}
  </div>
);

// ========================= 状态提示 =========================
const Status = ({ loading, error, success }) => {
  if (loading) return <div className="ai-status"><span className="spinner" /> 处理中，请稍候...</div>;
  if (error) return <div className="ai-status error">⚠ {error}</div>;
  if (success) return <div className="ai-status success">✓ {success}</div>;
  return null;
};

const EmptyState = ({ icon, title, desc }) => (
  <div className="ai-chat-empty">
    <div className="ai-chat-empty-icon">{icon}</div>
    <strong style={{ color: '#475569' }}>{title}</strong>
    {desc && <p>{desc}</p>}
  </div>
);

// ========================= 1. AI 对话 =========================
const ChatTab = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('deepseek');
  const [enableFunctions, setEnableFunctions] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [providers, setProviders] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    aiService.getProviders().then(r => {
      if (r.success !== false && r.data) setProviders(r.data.providers || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const body = {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        enableFunctions,
        provider,
      };
      if (sessionId) body.sessionId = sessionId;

      const controller = new AbortController();
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              if (data.event === 'delta' && data.content) {
                aiContent += data.content;
                setMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { ...copy[copy.length - 1], content: aiContent };
                  return copy;
                });
              } else if (data.event === 'tool_call') {
                setMessages(prev => [...prev, {
                  role: 'tool',
                  content: `函数调用: ${data.functionName}\n参数: ${JSON.stringify(data.arguments, null, 2)}\n返回: ${JSON.stringify(data.result, null, 2)}`
                }]);
              } else if (data.event === 'session_id') {
                setSessionId(data.sessionId);
              } else if (data.event === 'error') {
                setMessages(prev => [...prev, { role: 'system', content: data.message }]);
              }
            } catch (e) { /* partial chunk */ }
          }
        }
      }

      if (!aiContent) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: '(收到空响应)' };
          return copy;
        });
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError('对话请求失败: ' + (e.message || '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setMessages([]); setSessionId(null); setError(''); };
  const avatarLabel = (role) => {
    switch (role) {
      case 'user': return 'You';
      case 'assistant': return 'AI';
      case 'tool': return 'Tool';
      case 'system': return 'Err';
      default: return '';
    }
  };

  return (
    <div className="ai-chat">
      <div className="ai-toolbar">
        <select value={provider} onChange={e => setProvider(e.target.value)} className="ai-select">
          {providers.length > 0
            ? providers.map(p => <option key={p.name} value={p.name}>{p.displayName || p.name}</option>)
            : <option value="deepseek">DeepSeek</option>}
        </select>
        <label className="ai-checkbox">
          <input type="checkbox" checked={enableFunctions} onChange={e => setEnableFunctions(e.target.checked)} />
          Function Calling
        </label>
        <div style={{ flex: 1 }} />
        <button className="ai-btn outline sm" onClick={clearChat} disabled={loading}>清空对话</button>
      </div>

      <Status loading={loading} error={error} />

      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <EmptyState
            icon="💬"
            title="开始对话"
            desc="支持 Function Calling，可查询 JVM 状态、在线用户、字典数据、支付订单等实时信息"
          />
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div className="ai-msg-avatar">{avatarLabel(m.role)}</div>
            <div className="ai-msg-body">
              <div className="ai-msg-label">{avatarLabel(m.role)}</div>
              <div className="ai-msg-bubble">{m.content || (m.role === 'assistant' && loading ? <span className="ai-typing"><span /><span /><span /></span> : m.content)}</div>
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
          <div className="ai-msg assistant">
            <div className="ai-msg-avatar">AI</div>
            <div className="ai-msg-body">
              <div className="ai-msg-label">AI</div>
              <div className="ai-typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="ai-chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="输入消息，Enter 发送..."
          disabled={loading}
        />
        <button className="ai-chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? '等待中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

// ========================= 2. 智能巡检 =========================
const InspectTab = () => {
  const [target, setTarget] = useState('all');
  const [provider, setProvider] = useState('deepseek');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    aiService.getProviders().then(r => {
      if (r.success !== false && r.data) setProviders(r.data.providers || []);
    }).catch(() => {});
  }, []);

  const runInspect = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await aiService.inspect(target, provider);
      if (r.success !== false) setResult(r.data || r);
      else setError(r.message || '巡检失败');
    } catch (e) {
      setError('请求失败: ' + (e.message || '网络错误'));
    } finally { setLoading(false); }
  };

  const metrics = result?.metrics;

  return (
    <div>
      <div className="ai-toolbar">
        <select value={target} onChange={e => setTarget(e.target.value)} className="ai-select">
          <option value="all">全部巡检</option>
          <option value="jvm">JVM 监控</option>
          <option value="db">数据库</option>
          <option value="server">服务器</option>
        </select>
        <select value={provider} onChange={e => setProvider(e.target.value)} className="ai-select">
          {providers.length > 0
            ? providers.map(p => <option key={p.name} value={p.name}>{p.displayName || p.name}</option>)
            : <option value="deepseek">DeepSeek</option>}
        </select>
        <button className="ai-btn" onClick={runInspect} disabled={loading}>
          {loading ? '巡检中...' : '开始巡检'}
        </button>
      </div>

      <Status loading={loading} error={error} />

      {metrics && (
        <>
          <div className="ai-metrics-grid">
            {metrics.jvm && (
              <div className="ai-metric-card">
                <div className="metric-header">
                  <div className="metric-icon" style={{ background: '#fef2f2' }}>🫗</div>
                  <span className="metric-title">JVM 虚拟机</span>
                </div>
                <div className="ai-metric-detail">
                  <div className="metric-item"><span className="metric-k">堆使用率</span><span className="metric-v" style={{ color: metrics.jvm.heapUsagePercent > 80 ? '#dc2626' : '#16a34a' }}>{metrics.jvm.heapUsagePercent}%</span></div>
                  <div className="metric-item"><span className="metric-k">堆已用</span><span className="metric-v">{metrics.jvm.heapUsedMB} MB</span></div>
                  <div className="metric-item"><span className="metric-k">堆最大</span><span className="metric-v">{metrics.jvm.heapMaxMB} MB</span></div>
                  <div className="metric-item"><span className="metric-k">线程数</span><span className="metric-v">{metrics.jvm.threadCount}（虚拟: {metrics.jvm.virtualThreadCount}）</span></div>
                  <div className="metric-item"><span className="metric-k">运行时间</span><span className="metric-v">{metrics.jvm.uptime}</span></div>
                </div>
              </div>
            )}
            {metrics.db && (
              <div className="ai-metric-card">
                <div className="metric-header">
                  <div className="metric-icon" style={{ background: '#eff6ff' }}>🗄️</div>
                  <span className="metric-title">数据库</span>
                </div>
                <div className="ai-metric-detail">
                  <div className="metric-item"><span className="metric-k">活跃连接</span><span className="metric-v">{metrics.db.activeConnections} / {metrics.db.totalConnections}</span></div>
                  <div className="metric-item"><span className="metric-k">连接使用率</span><span className="metric-v" style={{ color: metrics.db.usagePercent > 80 ? '#dc2626' : '#16a34a' }}>{metrics.db.usagePercent}%</span></div>
                  {metrics.db.tableCount != null && <div className="metric-item"><span className="metric-k">数据表数</span><span className="metric-v">{metrics.db.tableCount}</span></div>}
                  {metrics.db.totalDeadTuples != null && <div className="metric-item"><span className="metric-k">死元组</span><span className="metric-v" style={{ color: metrics.db.totalDeadTuples > 1000 ? '#d97706' : '#16a34a' }}>{metrics.db.totalDeadTuples}</span></div>}
                </div>
              </div>
            )}
            {metrics.server && (
              <div className="ai-metric-card">
                <div className="metric-header">
                  <div className="metric-icon" style={{ background: '#f0fdf4' }}>🖥️</div>
                  <span className="metric-title">服务器</span>
                </div>
                <div className="ai-metric-detail">
                  <div className="metric-item"><span className="metric-k">CPU 使用率</span><span className="metric-v" style={{ color: metrics.server.cpuLoadPercent > 80 ? '#dc2626' : '#16a34a' }}>{metrics.server.cpuLoadPercent}%</span></div>
                  <div className="metric-item"><span className="metric-k">内存使用率</span><span className="metric-v" style={{ color: metrics.server.memoryUsedPercent > 80 ? '#dc2626' : '#16a34a' }}>{metrics.server.memoryUsedPercent}%</span></div>
                  {metrics.server.swapUsedPercent != null && <div className="metric-item"><span className="metric-k">Swap</span><span className="metric-v" style={{ color: metrics.server.swapUsedPercent > 50 ? '#d97706' : '#16a34a' }}>{metrics.server.swapUsedPercent}%</span></div>}
                </div>
              </div>
            )}
          </div>

          {result.analysis && (
            <div className="ai-analysis-card">
              <h4>AI 健康评估</h4>
              <pre>{result.analysis}</pre>
              {result.model && <span className="ai-model-tag">模型: {result.model}</span>}
            </div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <EmptyState icon="🔍" title="智能巡检" desc="收集 JVM、数据库、服务器的实时指标，由 AI 进行健康评估并给出优化建议" />
      )}
    </div>
  );
};

// ========================= 3. Chat2SQL =========================
const Chat2sqlTab = () => {
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState('deepseek');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSql = async () => {
    if (!question.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await aiService.chat2sql(question.trim(), provider);
      if (r.success !== false) setResult(r.data || r);
      else setError(r.message || '查询失败');
    } catch (e) {
      setError('请求失败: ' + (e.message || '网络错误'));
    } finally { setLoading(false); }
  };

  const rows = result?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div>
      <div className="ai-toolbar">
        <select value={provider} onChange={e => setProvider(e.target.value)} className="ai-select">
          <option value="deepseek">DeepSeek</option>
          <option value="qwen">通义千问</option>
          <option value="kimi">Kimi</option>
          <option value="glm">智谱GLM</option>
        </select>
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSql()}
          placeholder="输入自然语言，例如: 查询最近一周创建的支付订单"
          disabled={loading}
        />
        <button className="ai-btn" onClick={runSql} disabled={loading || !question.trim()}>
          {loading ? '生成中...' : '生成 SQL'}
        </button>
      </div>

      <Status loading={loading} error={error} />

      {result && (
        <div>
          <div className="ai-sql-block">
            <h4>生成的 SQL 语句</h4>
            <pre className="ai-sql">{result.sql}</pre>
          </div>

          <div className="ai-card">
            <h4>查询结果 ({result.rowCount ?? rows.length} 行)</h4>
            <div className="ai-table-wrap">
              <table className="ai-table">
                <thead>
                  <tr>
                    {columns.map(k => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col, j) => (
                        <td key={j}>{typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '-')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.model && <span className="ai-model-tag">模型: {result.model}</span>}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState icon="📊" title="Chat2SQL" desc="用自然语言描述查询需求，AI 自动生成 SQL 并执行（仅允许 SELECT）" />
      )}
    </div>
  );
};

// ========================= 4. 代码评审 =========================
const CodeReviewTab = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Java');
  const [provider, setProvider] = useState('deepseek');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runReview = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await aiService.codeReview(code, language, provider);
      if (r.success !== false) setResult(r.data || r);
      else setError(r.message || '评审失败');
    } catch (e) {
      setError('请求失败: ' + (e.message || '网络错误'));
    } finally { setLoading(false); }
  };

  const severityClass = (s) => {
    const map = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
    return map[s] || 'low';
  };

  const review = result?.review;
  const scoreLevel = review?.score >= 8 ? 'high' : review?.score >= 5 ? 'medium' : 'low';

  return (
    <div>
      <div className="ai-toolbar">
        <select value={language} onChange={e => setLanguage(e.target.value)} className="ai-select">
          <option value="Java">Java</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="SQL">SQL</option>
          <option value="Go">Go</option>
          <option value="TypeScript">TypeScript</option>
        </select>
        <select value={provider} onChange={e => setProvider(e.target.value)} className="ai-select">
          <option value="deepseek">DeepSeek</option>
          <option value="qwen">通义千问</option>
          <option value="kimi">Kimi</option>
          <option value="glm">智谱GLM</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="ai-btn" onClick={runReview} disabled={loading || !code.trim()}>
          {loading ? '评审中...' : '提交评审'}
        </button>
      </div>

      <textarea
        className="ai-textarea"
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="在此粘贴代码片段，AI 将检测空指针、SQL 注入、并发安全、资源泄漏、异常处理、代码规范等问题..."
        rows={12}
        disabled={loading}
      />

      <Status loading={loading} error={error} />

      {review && (
        <div className="ai-card">
          <div className="ai-review-header">
            <div>
              <h4>AI 代码评审报告</h4>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>{review.summary}</p>
            </div>
            <div className="ai-score-ring">
              <span className={`ai-score-num ${scoreLevel}`}>{review.score}</span>
              <span className="ai-score-label">/ 10 分</span>
            </div>
          </div>

          {review.issues?.map((issue, i) => (
            <div key={i} className={`ai-issue severity-${severityClass(issue.severity)}`}>
              <div className="ai-issue-header">
                <span className="ai-severity-dot" />
                <span className="ai-severity-tag">{issue.severity}</span>
                <span className="ai-issue-category">{issue.category}</span>
              </div>
              <p>{issue.description}</p>
              <div className="ai-fix"><strong>修复建议:</strong> {issue.suggestion}</div>
            </div>
          ))}

          {result.model && <span className="ai-model-tag" style={{ marginTop: 16 }}>模型: {result.model}</span>}
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState icon="🔎" title="代码评审" desc="粘贴代码片段，AI 将检测安全漏洞、性能问题、代码规范等多个维度的问题" />
      )}
    </div>
  );
};

// ========================= 5. 对话历史 =========================
const HistoryTab = () => {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchSessions = async (page = 1) => {
    setLoading(true); setError('');
    try {
      const r = await aiService.getSessions(page, 10);
      if (r.success !== false) {
        setSessions(r.data || []);
        setPagination(r.pagination || { page: 1, size: 10, total: 0, pages: 0 });
      } else { setError(r.message || '加载失败'); }
    } catch (e) { setError('加载失败: ' + (e.message || '')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => {
    aiService.getHistoryStats().then(r => { if (r.success !== false) setStats(r.data); }).catch(() => {});
  }, []);

  const viewDetail = async (sessionId) => {
    setDetailLoading(true); setDetail(null);
    try {
      const r = await aiService.getSession(sessionId);
      if (r.success !== false) setDetail(r.data);
    } catch (e) { setError('加载详情失败'); }
    finally { setDetailLoading(false); }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('确认删除此会话？此操作不可撤销。')) return;
    try { await aiService.deleteSession(sessionId); fetchSessions(pagination.page); setDetail(null); }
    catch (e) { setError('删除失败'); }
  };

  return (
    <div>
      {stats && (
        <div className="ai-stats-row">
          <div className="ai-stat-card">
            <div className="ai-stat-icon blue">💬</div>
            <div><div className="ai-stat-label">总会话</div><div className="ai-stat-value">{stats.totalSessions}</div></div>
          </div>
          <div className="ai-stat-card">
            <div className="ai-stat-icon purple">💭</div>
            <div><div className="ai-stat-label">总消息</div><div className="ai-stat-value">{stats.totalMessages}</div></div>
          </div>
        </div>
      )}

      <Status loading={loading} error={error} />

      <div className="ai-table-wrap">
        <table className="ai-table">
          <thead>
            <tr>
              <th>会话 ID</th>
              <th>标题</th>
              <th>模型</th>
              <th>消息数</th>
              <th>Tokens</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.sessionId}>
                <td className="ai-mono">{s.sessionId?.slice(0, 12)}...</td>
                <td style={{ fontWeight: 500 }}>{s.title || '新对话'}</td>
                <td><span className="ai-badge neutral">{s.model}</span></td>
                <td>{s.messageCount}</td>
                <td>{s.totalTokens?.toLocaleString()}</td>
                <td style={{ fontSize: '12px', color: '#94a3b8' }}>{s.updateTime}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="ai-btn outline sm" onClick={() => viewDetail(s.sessionId)}>详情</button>
                    <button className="ai-btn sm danger" onClick={() => deleteSession(s.sessionId)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={7} className="ai-empty">暂无对话记录</td></tr>}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="ai-pagination">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`ai-page-btn${p === pagination.page ? ' active' : ''}`}
              onClick={() => fetchSessions(p)}>{p}</button>
          ))}
        </div>
      )}

      {detailLoading && <div className="ai-status"><span className="spinner" /> 加载会话详情...</div>}

      {detail && (
        <div className="ai-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>{detail.session?.title || '会话详情'}</h4>
            <button className="ai-btn outline sm" onClick={() => setDetail(null)}>关闭</button>
          </div>
          <div className="ai-chat-messages" style={{ maxHeight: 420, border: 'none', boxShadow: 'none', padding: 0 }}>
            {detail.messages?.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                <div className="ai-msg-avatar">{m.role === 'user' ? 'You' : 'AI'}</div>
                <div className="ai-msg-body">
                  <div className="ai-msg-label">{m.role === 'user' ? 'You' : 'AI'}</div>
                  <div className="ai-msg-bubble">{m.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================= 6. 用量统计 =========================
const UsageTab = () => {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchUsage = async (page = 1) => {
    setLoading(true); setError('');
    try {
      const r = await aiService.getUsage(page, 10);
      if (r.success !== false) {
        setRecords(r.data || []);
        setPagination(r.pagination || { page: 1, size: 10, total: 0, pages: 0 });
      } else { setError(r.message || '加载失败'); }
    } catch (e) { setError('加载失败: ' + (e.message || '')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsage(); }, []);
  useEffect(() => {
    aiService.getUsageSummary().then(r => { if (r.success !== false) setSummary(r.data); }).catch(() => {});
  }, []);

  const cleanOld = async () => {
    if (!window.confirm('确认清理 90 天前的用量记录？')) return;
    try {
      const r = await aiService.deleteUsage(90);
      alert(r.message || '清理完成');
      fetchUsage();
    } catch (e) { setError('清理失败'); }
  };

  const byModel = summary?.byModel || [];

  return (
    <div>
      {summary?.summary && (
        <div className="ai-stats-row">
          <div className="ai-stat-card">
            <div className="ai-stat-icon blue">🔢</div>
            <div><div className="ai-stat-label">总调用次数</div><div className="ai-stat-value">{summary.summary.call_count?.toLocaleString()}</div></div>
          </div>
          <div className="ai-stat-card">
            <div className="ai-stat-icon green">🪙</div>
            <div><div className="ai-stat-label">总 Token</div><div className="ai-stat-value">{summary.summary.total_tokens?.toLocaleString()}</div></div>
          </div>
          <div className="ai-stat-card">
            <div className="ai-stat-icon amber">💵</div>
            <div><div className="ai-stat-label">总成本</div><div className="ai-stat-value">${(summary.summary.total_cost || 0).toFixed(4)}</div></div>
          </div>
        </div>
      )}

      {byModel.length > 0 && (
        <div className="ai-stats-row" style={{ marginBottom: 16 }}>
          {byModel.map(m => (
            <div key={m.model} className="ai-stat-card">
              <div className="ai-stat-icon purple">🤖</div>
              <div>
                <div className="ai-stat-label">{m.model}</div>
                <div className="ai-stat-value" style={{ fontSize: '16px' }}>{m.call_count} 次 · {m.total_tokens?.toLocaleString()} tokens</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ai-toolbar">
        <button className="ai-btn outline sm danger" onClick={cleanOld}>清理 90 天前数据</button>
      </div>

      <Status loading={loading} error={error} />

      <div className="ai-table-wrap">
        <table className="ai-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>端点</th>
              <th>Prompt</th>
              <th>Completion</th>
              <th>总计 Token</th>
              <th>成本</th>
              <th>延迟</th>
              <th>状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td><span className="ai-badge neutral">{r.model}</span></td>
                <td className="ai-mono">{r.endpoint}</td>
                <td>{r.promptTokens?.toLocaleString()}</td>
                <td>{r.completionTokens?.toLocaleString()}</td>
                <td style={{ fontWeight: 600 }}>{r.totalTokens?.toLocaleString()}</td>
                <td>${(r.cost || 0).toFixed(5)}</td>
                <td>{r.latencyMs} ms</td>
                <td><span className={`ai-badge ${r.success ? 'success' : 'error'}`}>{r.success ? '成功' : '失败'}</span></td>
                <td style={{ fontSize: '12px', color: '#94a3b8' }}>{r.createTime}</td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={9} className="ai-empty">暂无用量记录</td></tr>}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="ai-pagination">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`ai-page-btn${p === pagination.page ? ' active' : ''}`}
              onClick={() => fetchUsage(p)}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================= 7. 知识库 (RAG) =========================
const RagTab = () => {
  const [kbs, setKbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newKb, setNewKb] = useState({ name: '', description: '' });

  const [selectedKb, setSelectedKb] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [question, setQuestion] = useState('');
  const [askResult, setAskResult] = useState(null);
  const [askLoading, setAskLoading] = useState(false);

  const fetchKbs = async () => {
    setLoading(true); setError('');
    try {
      const r = await aiService.listKbs();
      if (r.success !== false) setKbs(r.data || []);
      else setError(r.message || '加载失败');
    } catch (e) { setError('加载失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchKbs(); }, []);

  const createKb = async () => {
    if (!newKb.name.trim()) return;
    try {
      await aiService.createKb(newKb.name, newKb.description);
      setShowCreate(false); setNewKb({ name: '', description: '' });
      fetchKbs();
    } catch (e) { setError('创建失败'); }
  };

  const deleteKb = async (kbId) => {
    if (!window.confirm('确认删除此知识库及所有文档和分块？此操作不可撤销。')) return;
    try { await aiService.deleteKb(kbId); fetchKbs(); setSelectedKb(null); setDocs([]); setAskResult(null); }
    catch (e) { setError('删除失败'); }
  };

  const selectKb = async (kb) => {
    setSelectedKb(kb); setAskResult(null); setQuestion('');
    setDocsLoading(true);
    try {
      const r = await aiService.listDocs(kb.id);
      if (r.success !== false) setDocs(r.data || []);
    } catch (e) { setError('加载文档失败'); }
    finally { setDocsLoading(false); }
  };

  const uploadDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedKb) return;
    try { await aiService.uploadDoc(selectedKb.id, file); selectKb(selectedKb); }
    catch (err) { setError('上传失败，请检查文件格式和大小'); }
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('确认删除此文档及其所有分块？')) return;
    try { await aiService.deleteDoc(docId); selectKb(selectedKb); }
    catch (err) { setError('删除文档失败'); }
  };

  const askKb = async () => {
    if (!question.trim() || !selectedKb) return;
    setAskLoading(true); setAskResult(null);
    try {
      const r = await aiService.askKb(selectedKb.id, question.trim());
      if (r.success !== false) setAskResult(r.data || r);
      else setError(r.message || '问答失败');
    } catch (e) { setError('问答请求失败'); }
    finally { setAskLoading(false); }
  };

  return (
    <div>
      <Status loading={loading} error={error} />

      <div className="ai-toolbar" style={{ justifyContent: 'space-between' }}>
        <button className="ai-btn sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '取消' : '+ 新建知识库'}
        </button>
        {selectedKb && (
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            已选: <strong style={{ color: '#4f46e5' }}>{selectedKb.name}</strong>
          </span>
        )}
      </div>

      {showCreate && (
        <div className="ai-create-form">
          <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>新建知识库</h4>
          <div className="form-row">
            <input className="ai-input" placeholder="知识库名称（必填）" value={newKb.name}
              onChange={e => setNewKb(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && createKb()} />
            <input className="ai-input" placeholder="描述信息（可选）" value={newKb.description}
              onChange={e => setNewKb(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && createKb()} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ai-btn sm" onClick={createKb} disabled={!newKb.name.trim()}>创建</button>
            <button className="ai-btn sm outline" onClick={() => setShowCreate(false)}>取消</button>
          </div>
        </div>
      )}

      <div className="ai-kb-grid">
        {kbs.map(kb => (
          <div key={kb.id} className={`ai-kb-card${selectedKb?.id === kb.id ? ' selected' : ''}`}
            onClick={() => selectKb(kb)}>
            <div className="kb-icon">📚</div>
            <h4>{kb.name}</h4>
            <p>{kb.description || '暂无描述'}</p>
            <div className="kb-actions">
              <button className="ai-btn sm outline" onClick={e => { e.stopPropagation(); selectKb(kb); }}>
                {selectedKb?.id === kb.id ? '已选中' : '查看'}
              </button>
              <button className="ai-btn sm danger" onClick={e => { e.stopPropagation(); deleteKb(kb.id); }}>删除</button>
            </div>
          </div>
        ))}
        {kbs.length === 0 && (
          <div className="ai-kb-empty">
            <span className="empty-icon">📚</span>
            暂无知识库，点击上方按钮创建
          </div>
        )}
      </div>

      {selectedKb && (
        <div className="ai-card">
          <h4>{selectedKb.name} — 文档管理</h4>

          <div className="ai-toolbar">
            <label className="ai-btn sm outline" style={{ cursor: 'pointer' }}>
              📄 上传文档
              <input type="file" hidden onChange={uploadDoc}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.html,.md,.csv" />
            </label>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>支持 PDF / Word / Excel / TXT / Markdown 等</span>
          </div>

          {docsLoading ? (
            <div className="ai-status"><span className="spinner" /> 加载文档列表中...</div>
          ) : (
            <div className="ai-table-wrap">
              <table className="ai-table">
                <thead>
                  <tr><th>文件名</th><th>类型</th><th>大小</th><th>分块</th><th>状态</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 500 }}>{d.fileName}</td>
                      <td><span className="ai-badge neutral">{d.fileType}</span></td>
                      <td>{d.fileSize ? (d.fileSize / 1024).toFixed(1) + ' KB' : '-'}</td>
                      <td>{d.chunkCount}</td>
                      <td><span className={`ai-badge ${d.status === 'INDEXED' ? 'success' : d.status === 'PENDING' ? 'warning' : 'info'}`}>{d.status}</span></td>
                      <td><button className="ai-btn sm danger" onClick={() => deleteDoc(d.id)}>删除</button></td>
                    </tr>
                  ))}
                  {docs.length === 0 && <tr><td colSpan={6} className="ai-empty">暂无文档，请上传</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          <div className="ai-section">
            <h4>基于知识库问答</h4>
            <div className="ai-input-row">
              <input className="ai-input" value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askKb()}
                placeholder="基于已上传文档提出问题，AI 将检索相关内容后生成答案..."
                disabled={askLoading} />
              <button className="ai-btn" onClick={askKb} disabled={askLoading || !question.trim()}>
                {askLoading ? '检索中...' : '提问'}
              </button>
            </div>
            <Status loading={askLoading} />

            {askResult && (
              <div>
                <div className="ai-answer">{askResult.answer}</div>
                {askResult.sources?.length > 0 && (
                  <div className="ai-sources">
                    <h4>参考来源（{askResult.sources.length} 条相关内容）</h4>
                    {askResult.sources.map((s, i) => (
                      <div key={i} className="ai-source-item">
                        <span className="ai-source-idx">{i + 1}</span>
                        <span>{s.content?.slice(0, 300)}{s.content?.length > 300 ? '...' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                {askResult.model && <span className="ai-model-tag" style={{ marginTop: 12 }}>模型: {askResult.model}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================= 主组件 =========================
const TAB_LIST = [
  { key: 'chat', icon: '💬', label: 'AI 对话' },
  { key: 'inspect', icon: '🔍', label: '智能巡检' },
  { key: 'chat2sql', icon: '📊', label: 'Chat2SQL' },
  { key: 'review', icon: '🔎', label: '代码评审' },
  { key: 'history', icon: '📝', label: '对话历史' },
  { key: 'usage', icon: '📈', label: '用量统计' },
  { key: 'rag', icon: '📚', label: '知识库' },
];

const AiManagement = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="ai-container">
      <div className="ai-header">
        <h2>AI 智能助手</h2>
        <p>DeepSeek · 通义千问 · Kimi · 智谱GLM — 多模型 AI 服务平台</p>
      </div>
      <Tabs tabs={TAB_LIST} active={activeTab} onChange={setActiveTab} />
      <div className="ai-content">
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'inspect' && <InspectTab />}
        {activeTab === 'chat2sql' && <Chat2sqlTab />}
        {activeTab === 'review' && <CodeReviewTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'usage' && <UsageTab />}
        {activeTab === 'rag' && <RagTab />}
      </div>
    </div>
  );
};

export default AiManagement;
