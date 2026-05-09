import React, { useState } from 'react';
import { java21Service } from '../../services';
import './Java21Demo.css';

const ResultBlock = ({ data, onClose }) => (
  <div className="j21-result">
    <div className="j21-result-header">
      <span>结果</span>
      <button className="btn-close" onClick={onClose}>×</button>
    </div>
    <pre>{typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}</pre>
  </div>
);

const EndpointCard = ({ title, description, endpoint, method = 'GET', params, children, onTest, loading, result, onClearResult }) => (
  <div className="j21-card">
    <div className="j21-card-header">
      <h4>{title}</h4>
      <span className="j21-method">{method}</span>
    </div>
    <p className="j21-card-desc">{description}</p>
    <code className="j21-card-endpoint">{endpoint}</code>
    {children}
    <div className="j21-card-actions">
      <button className="btn btn-test" onClick={onTest} disabled={loading}>
        {loading ? '请求中...' : '测试端点'}
      </button>
      {result && <button className="btn btn-clear" onClick={onClearResult}>清空</button>}
    </div>
    {result && <ResultBlock data={result} onClose={onClearResult} />}
  </div>
);

const Java21Demo = () => {
  const [activeTab, setActiveTab] = useState('virtual-thread');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  // Virtual Thread params
  const [vtCount, setVtCount] = useState(10000);
  const [vtPCount, setVtPCount] = useState(200);
  const [vtCompareV, setVtCompareV] = useState(10000);
  const [vtCompareP, setVtCompareP] = useState(200);
  const [vtMassive, setVtMassive] = useState(100000);
  const [vtTaskCount, setVtTaskCount] = useState(100);
  const [vtSleepMs, setVtSleepMs] = useState(50);

  // Structured Concurrency params
  const [scUserId, setScUserId] = useState(1);
  const [scCity, setScCity] = useState('北京');
  const [scOrderId, setScOrderId] = useState(1001);
  const [scCompUserId, setScCompUserId] = useState(1);
  const [scCompCity, setScCompCity] = useState('北京');

  // Scoped Value params
  const [svUserId, setSvUserId] = useState(1);
  const [svUsername, setSvUsername] = useState('admin');
  const [svRole, setSvRole] = useState('ROLE_ADMIN');

  // Pattern Matching params
  const [pmShape, setPmShape] = useState('circle');
  const [pmDim1, setPmDim1] = useState(5);
  const [pmDim2, setPmDim2] = useState('');
  const [pmValue, setPmValue] = useState('hello');
  const [pmCatShape, setPmCatShape] = useState('circle');
  const [pmCatDim1, setPmCatDim1] = useState(150);
  const [pmType, setPmType] = useState('success');
  const [pmUnnamedShape, setPmUnnamedShape] = useState('circle');
  const [pmUnnamedDim1, setPmUnnamedDim1] = useState(10);
  const [pmCompAreaShape, setPmCompAreaShape] = useState('circle');
  const [pmCompAreaDim1, setPmCompAreaDim1] = useState(5);
  const [pmCompDescValue, setPmCompDescValue] = useState('hello');
  const [pmCompApiType, setPmCompApiType] = useState('error');

  const run = async (key, fn) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fn();
      setResults(prev => ({ ...prev, [key]: res }));
    } catch (err) {
      setResults(prev => ({ ...prev, [key]: { success: false, message: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const clear = (key) => setResults(prev => { const n = { ...prev }; delete n[key]; return n; });

  const tabs = [
    { key: 'virtual-thread', label: '🧵 虚拟线程', icon: '🧵' },
    { key: 'structured-concurrency', label: '🔀 结构化并发', icon: '🔀' },
    { key: 'scoped-value', label: '📦 作用域值', icon: '📦' },
    { key: 'pattern-matching', label: '🔍 模式匹配', icon: '🔍' },
    { key: 'record', label: '📋 Record', icon: '📋' },
  ];

  const vtCards = [
    {
      key: 'vt-info', title: '虚拟线程信息', description: '查看当前请求线程信息（是否虚拟线程）',
      endpoint: '/java21/virtual-thread/info',
      onTest: () => run('vt-info', java21Service.virtualThread.info),
    },
    {
      key: 'vt-create', title: '创建虚拟线程', description: '批量创建虚拟线程，验证虚拟线程轻量特性',
      endpoint: `/java21/virtual-thread/create-virtual?count=${vtCount}`,
      children: (
        <div className="j21-params">
          <label>数量: <input type="number" value={vtCount} onChange={e => setVtCount(parseInt(e.target.value) || 10000)} min="1" max="1000000" /></label>
        </div>
      ),
      onTest: () => run('vt-create', () => java21Service.virtualThread.createVirtual(vtCount)),
    },
    {
      key: 'vt-platform', title: '创建平台线程', description: '批量创建平台线程（对比上限500）',
      endpoint: `/java21/virtual-thread/create-platform?count=${vtPCount}`,
      children: (
        <div className="j21-params">
          <label>数量: <input type="number" value={vtPCount} onChange={e => setVtPCount(parseInt(e.target.value) || 200)} min="1" max="500" /></label>
        </div>
      ),
      onTest: () => run('vt-platform', () => java21Service.virtualThread.createPlatform(vtPCount)),
    },
    {
      key: 'vt-compare', title: '虚拟线程 vs 平台线程对比', description: '同量级性能对比',
      endpoint: `/java21/virtual-thread/compare?vCount=${vtCompareV}&pCount=${vtCompareP}`,
      children: (
        <div className="j21-params">
          <label>虚拟线程: <input type="number" value={vtCompareV} onChange={e => setVtCompareV(parseInt(e.target.value) || 10000)} /></label>
          <label>平台线程: <input type="number" value={vtCompareP} onChange={e => setVtCompareP(parseInt(e.target.value) || 200)} /></label>
        </div>
      ),
      onTest: () => run('vt-compare', () => java21Service.virtualThread.compare(vtCompareV, vtCompareP)),
    },
    {
      key: 'vt-massive', title: '海量虚拟线程测试', description: '最大100万虚拟线程，验证极限并发',
      endpoint: `/java21/virtual-thread/massive?count=${vtMassive}`,
      children: (
        <div className="j21-params">
          <label>数量: <input type="number" value={vtMassive} onChange={e => setVtMassive(parseInt(e.target.value) || 100000)} min="1" max="1000000" /></label>
        </div>
      ),
      onTest: () => run('vt-massive', () => java21Service.virtualThread.massive(vtMassive)),
    },
    {
      key: 'vt-pinning', title: '线程Pinning检测', description: 'synchronized 块内 sleep 导致虚拟线程 pinning',
      endpoint: '/java21/virtual-thread/pinning',
      onTest: () => run('vt-pinning', java21Service.virtualThread.pinning),
    },
    {
      key: 'vt-async', title: '@Async 虚拟线程', description: 'Spring @Async 虚拟线程异步执行',
      endpoint: '/java21/virtual-thread/async',
      onTest: () => run('vt-async', java21Service.virtualThread.async),
    },
    {
      key: 'vt-builder', title: 'Builder API', description: 'Thread.ofVirtual() 链式 API 演示',
      endpoint: '/java21/virtual-thread/builder-api',
      onTest: () => run('vt-builder', java21Service.virtualThread.builderApi),
    },
    {
      key: 'vt-compare-trad', title: '传统线程池 vs 虚拟线程', description: '固定线程池 vs 虚拟线程并发处理对比',
      endpoint: `/java21/virtual-thread/compare-traditional?taskCount=${vtTaskCount}&sleepMs=${vtSleepMs}`,
      children: (
        <div className="j21-params">
          <label>任务数: <input type="number" value={vtTaskCount} onChange={e => setVtTaskCount(parseInt(e.target.value) || 100)} /></label>
          <label>休眠ms: <input type="number" value={vtSleepMs} onChange={e => setVtSleepMs(parseInt(e.target.value) || 50)} /></label>
        </div>
      ),
      onTest: () => run('vt-compare-trad', () => java21Service.virtualThread.compareTraditional(vtTaskCount, vtSleepMs)),
    },
  ];

  const scCards = [
    {
      key: 'sc-orders', title: '用户+订单并行获取', description: 'ShutdownOnFailure：任一任务失败则整体失败',
      endpoint: `/java21/structured-concurrency/user-orders?userId=${scUserId}`,
      children: (
        <div className="j21-params">
          <label>用户ID: <input type="number" value={scUserId} onChange={e => setScUserId(parseInt(e.target.value) || 1)} /></label>
        </div>
      ),
      onTest: () => run('sc-orders', () => java21Service.structuredConcurrency.userOrders(scUserId)),
    },
    {
      key: 'sc-weather', title: '多源竞速（天气）', description: 'ShutdownOnSuccess：多源竞速返回最先结果',
      endpoint: `/java21/structured-concurrency/weather?city=${encodeURIComponent(scCity)}`,
      children: (
        <div className="j21-params">
          <label>城市: <input type="text" value={scCity} onChange={e => setScCity(e.target.value)} /></label>
        </div>
      ),
      onTest: () => run('sc-weather', () => java21Service.structuredConcurrency.weather(scCity)),
    },
    {
      key: 'sc-payment', title: '支付+通知并行', description: '支付处理与通知发送并行执行',
      endpoint: `/java21/structured-concurrency/payment?orderId=${scOrderId}`,
      children: (
        <div className="j21-params">
          <label>订单ID: <input type="number" value={scOrderId} onChange={e => setScOrderId(parseInt(e.target.value) || 1001)} /></label>
        </div>
      ),
      onTest: () => run('sc-payment', () => java21Service.structuredConcurrency.payment(scOrderId)),
    },
    {
      key: 'sc-error', title: '错误处理', description: 'throwIfFailed(Function) 自定义异常包装',
      endpoint: '/java21/structured-concurrency/error-handling',
      onTest: () => run('sc-error', java21Service.structuredConcurrency.errorHandling),
    },
    {
      key: 'sc-timeout', title: '超时控制', description: 'joinUntil 超时控制演示',
      endpoint: '/java21/structured-concurrency/timeout',
      onTest: () => run('sc-timeout', java21Service.structuredConcurrency.timeout),
    },
    {
      key: 'sc-compare-trad', title: '传统 vs 结构化并发', description: 'CompletableFuture.allOf() vs StructuredTaskScope',
      endpoint: `/java21/structured-concurrency/compare-traditional?userId=${scCompUserId}`,
      children: (
        <div className="j21-params">
          <label>用户ID: <input type="number" value={scCompUserId} onChange={e => setScCompUserId(parseInt(e.target.value) || 1)} /></label>
        </div>
      ),
      onTest: () => run('sc-compare-trad', () => java21Service.structuredConcurrency.compareTraditional(scCompUserId)),
    },
    {
      key: 'sc-compare-race', title: '传统竞速 vs ShutdownOnSuccess', description: 'CompletableFuture.anyOf() vs ShutdownOnSuccess',
      endpoint: `/java21/structured-concurrency/compare-race?city=${encodeURIComponent(scCompCity)}`,
      children: (
        <div className="j21-params">
          <label>城市: <input type="text" value={scCompCity} onChange={e => setScCompCity(e.target.value)} /></label>
        </div>
      ),
      onTest: () => run('sc-compare-race', () => java21Service.structuredConcurrency.compareRace(scCompCity)),
    },
  ];

  const svCards = [
    {
      key: 'sv-basic', title: '基本用法', description: 'ScopedValue.where().call() 设置和获取',
      endpoint: '/java21/scoped-value/basic',
      onTest: () => run('sv-basic', java21Service.scopedValue.basic),
    },
    {
      key: 'sv-isolation', title: '作用域隔离', description: '嵌套覆盖 + 离开解绑，验证隔离性',
      endpoint: '/java21/scoped-value/isolation',
      onTest: () => run('sv-isolation', java21Service.scopedValue.isolation),
    },
    {
      key: 'sv-context', title: '请求上下文传递', description: 'Filter → Controller → Service → Repository 自动传递',
      endpoint: `/java21/scoped-value/request-context?userId=${svUserId}&username=${svUsername}&role=${encodeURIComponent(svRole)}`,
      children: (
        <div className="j21-params">
          <label>用户ID: <input type="number" value={svUserId} onChange={e => setSvUserId(parseInt(e.target.value) || 1)} /></label>
          <label>用户名: <input type="text" value={svUsername} onChange={e => setSvUsername(e.target.value)} /></label>
          <label>角色: <input type="text" value={svRole} onChange={e => setSvRole(e.target.value)} /></label>
        </div>
      ),
      onTest: () => run('sv-context', () => java21Service.scopedValue.requestContext(svUserId, svUsername, svRole)),
    },
    {
      key: 'sv-compare-tl', title: 'ScopedValue vs ThreadLocal', description: '10万次读写性能对比',
      endpoint: '/java21/scoped-value/compare-tl',
      onTest: () => run('sv-compare-tl', java21Service.scopedValue.compareTl),
    },
    {
      key: 'sv-fallback', title: '降级方法', description: 'orElse / orElseThrow 降级处理',
      endpoint: '/java21/scoped-value/fallback',
      onTest: () => run('sv-fallback', java21Service.scopedValue.fallback),
    },
    {
      key: 'sv-multi', title: '多值绑定', description: '同时绑定多个 ScopedValue',
      endpoint: '/java21/scoped-value/multi',
      onTest: () => run('sv-multi', java21Service.scopedValue.multi),
    },
    {
      key: 'sv-compare-trad', title: '传统 ThreadLocal 深度对比', description: '含内存泄漏演示，全面对比',
      endpoint: '/java21/scoped-value/compare-traditional',
      onTest: () => run('sv-compare-trad', java21Service.scopedValue.compareTraditional),
    },
  ];

  const pmCards = [
    {
      key: 'pm-area', title: '图形面积计算', description: 'switch + record pattern 计算面积',
      endpoint: `/java21/pattern-matching/area?shape=${pmShape}&dim1=${pmDim1}${pmDim2 ? `&dim2=${pmDim2}` : ''}`,
      children: (
        <div className="j21-params">
          <label>形状: <select value={pmShape} onChange={e => setPmShape(e.target.value)}>
            <option value="circle">Circle</option>
            <option value="rectangle">Rectangle</option>
            <option value="triangle">Triangle</option>
          </select></label>
          <label>参数1: <input type="number" value={pmDim1} onChange={e => setPmDim1(parseFloat(e.target.value) || 5)} /></label>
          {(pmShape === 'rectangle' || pmShape === 'triangle') && (
            <label>参数2: <input type="number" value={pmDim2} onChange={e => setPmDim2(e.target.value)} /></label>
          )}
        </div>
      ),
      onTest: () => run('pm-area', () => java21Service.patternMatching.area(pmShape, pmDim1, pmDim2 || undefined)),
    },
    {
      key: 'pm-describe', title: '类型识别', description: 'instanceof 类型模式匹配自动识别',
      endpoint: `/java21/pattern-matching/describe?value=${encodeURIComponent(pmValue)}`,
      children: (
        <div className="j21-params">
          <label>值: <input type="text" value={pmValue} onChange={e => setPmValue(e.target.value)} /></label>
        </div>
      ),
      onTest: () => run('pm-describe', () => java21Service.patternMatching.describe(pmValue)),
    },
    {
      key: 'pm-categorize', title: 'Guarded Pattern', description: 'when 子句条件匹配',
      endpoint: `/java21/pattern-matching/categorize?shape=${pmCatShape}&dim1=${pmCatDim1}`,
      children: (
        <div className="j21-params">
          <label>形状: <select value={pmCatShape} onChange={e => setPmCatShape(e.target.value)}>
            <option value="circle">Circle</option>
            <option value="rectangle">Rectangle</option>
            <option value="triangle">Triangle</option>
          </select></label>
          <label>参数: <input type="number" value={pmCatDim1} onChange={e => setPmCatDim1(parseFloat(e.target.value) || 150)} /></label>
        </div>
      ),
      onTest: () => run('pm-categorize', () => java21Service.patternMatching.categorize(pmCatShape, pmCatDim1)),
    },
    {
      key: 'pm-nested', title: '嵌套Record解构', description: '嵌套 record pattern 深层解构',
      endpoint: '/java21/pattern-matching/nested',
      onTest: () => run('pm-nested', java21Service.patternMatching.nested),
    },
    {
      key: 'pm-api-resp', title: 'Sealed接口 + API响应', description: 'sealed interface 穷举匹配',
      endpoint: `/java21/pattern-matching/api-response?type=${pmType}`,
      children: (
        <div className="j21-params">
          <label>类型: <select value={pmType} onChange={e => setPmType(e.target.value)}>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select></label>
        </div>
      ),
      onTest: () => run('pm-api-resp', () => java21Service.patternMatching.apiResponse(pmType)),
    },
    {
      key: 'pm-unnamed', title: 'Unnamed Pattern (_)', description: '无名模式匹配忽略不需要的变量',
      endpoint: `/java21/pattern-matching/unnamed?shape=${pmUnnamedShape}&dim1=${pmUnnamedDim1}`,
      children: (
        <div className="j21-params">
          <label>形状: <select value={pmUnnamedShape} onChange={e => setPmUnnamedShape(e.target.value)}>
            <option value="circle">Circle</option>
            <option value="rectangle">Rectangle</option>
            <option value="triangle">Triangle</option>
          </select></label>
          <label>参数: <input type="number" value={pmUnnamedDim1} onChange={e => setPmUnnamedDim1(parseFloat(e.target.value) || 10)} /></label>
        </div>
      ),
      onTest: () => run('pm-unnamed', () => java21Service.patternMatching.unnamed(pmUnnamedShape, pmUnnamedDim1)),
    },
    {
      key: 'pm-compare-area', title: '传统 vs 模式匹配（面积）', description: 'if-else+instanceof+转型 vs switch record',
      endpoint: `/java21/pattern-matching/compare-area?shape=${pmCompAreaShape}&dim1=${pmCompAreaDim1}`,
      children: (
        <div className="j21-params">
          <label>形状: <select value={pmCompAreaShape} onChange={e => setPmCompAreaShape(e.target.value)}>
            <option value="circle">Circle</option>
            <option value="rectangle">Rectangle</option>
            <option value="triangle">Triangle</option>
          </select></label>
          <label>参数: <input type="number" value={pmCompAreaDim1} onChange={e => setPmCompAreaDim1(parseFloat(e.target.value) || 5)} /></label>
        </div>
      ),
      onTest: () => run('pm-compare-area', () => java21Service.patternMatching.compareArea(pmCompAreaShape, pmCompAreaDim1)),
    },
    {
      key: 'pm-compare-desc', title: '传统 vs 模式匹配（类型）', description: 'if-else链 vs switch 类型模式',
      endpoint: `/java21/pattern-matching/compare-describe?value=${encodeURIComponent(pmCompDescValue)}`,
      children: (
        <div className="j21-params">
          <label>值: <input type="text" value={pmCompDescValue} onChange={e => setPmCompDescValue(e.target.value)} /></label>
        </div>
      ),
      onTest: () => run('pm-compare-desc', () => java21Service.patternMatching.compareDescribe(pmCompDescValue)),
    },
    {
      key: 'pm-compare-api', title: '传统 vs 模式匹配（API）', description: 'if-else/Visitor vs sealed+record pattern',
      endpoint: `/java21/pattern-matching/compare-api-response?type=${pmCompApiType}`,
      children: (
        <div className="j21-params">
          <label>类型: <select value={pmCompApiType} onChange={e => setPmCompApiType(e.target.value)}>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select></label>
        </div>
      ),
      onTest: () => run('pm-compare-api', () => java21Service.patternMatching.compareApiResponse(pmCompApiType)),
    },
  ];

  const recCards = [
    {
      key: 'rec-dto', title: 'Record作为DTO', description: '不可变DTO，自动生成规范方法',
      endpoint: '/java21/record/dto',
      onTest: () => run('rec-dto', java21Service.record.dto),
    },
    {
      key: 'rec-generic', title: '泛型Record', description: 'PageResult<T> 泛型Record保留类型信息',
      endpoint: '/java21/record/generic',
      onTest: () => run('rec-generic', java21Service.record.generic),
    },
    {
      key: 'rec-validation', title: '参数验证', description: 'Compact constructor 参数验证',
      endpoint: '/java21/record/validation',
      onTest: () => run('rec-validation', java21Service.record.validation),
    },
    {
      key: 'rec-nested', title: '嵌套Record', description: '深层不可变 + 链式访问',
      endpoint: '/java21/record/nested',
      onTest: () => run('rec-nested', java21Service.record.nested),
    },
    {
      key: 'rec-streams', title: 'Stream中使用Record', description: '分组/排序/聚合，不可变中间类型',
      endpoint: '/java21/record/streams',
      onTest: () => run('rec-streams', java21Service.record.streams),
    },
    {
      key: 'rec-serialization', title: 'JSON序列化', description: 'Jackson 2.12+ 原生支持往返一致',
      endpoint: '/java21/record/serialization',
      onTest: () => run('rec-serialization', java21Service.record.serialization),
    },
    {
      key: 'rec-implements', title: '接口实现', description: 'Record实现接口多态使用',
      endpoint: '/java21/record/implements',
      onTest: () => run('rec-implements', java21Service.record.implements),
    },
    {
      key: 'rec-methods', title: '自定义方法', description: '实例方法/静态方法在Record中',
      endpoint: '/java21/record/methods',
      onTest: () => run('rec-methods', java21Service.record.methods),
    },
    {
      key: 'rec-local', title: 'Local Record', description: '方法内定义临时数据结构',
      endpoint: '/java21/record/local',
      onTest: () => run('rec-local', java21Service.record.local),
    },
    {
      key: 'rec-compare-pojo', title: 'POJO vs Record对比', description: '传统~40行 vs Record 1行',
      endpoint: '/java21/record/compare-pojo',
      onTest: () => run('rec-compare-pojo', java21Service.record.comparePojo),
    },
  ];

  const renderCards = (cards) => (
    <div className="j21-cards-grid">
      {cards.map(card => (
        <EndpointCard
          key={card.key}
          {...card}
          loading={loading[card.key]}
          result={results[card.key]}
          onClearResult={() => clear(card.key)}
        />
      ))}
    </div>
  );

  return (
    <div className="j21-container">
      <div className="j21-header">
        <h2>Java 21+ 新特性交互式演示</h2>
        <p className="j21-subtitle">
          Spring Boot 4 / Java 21+ 五大新特性：虚拟线程、结构化并发、作用域值、模式匹配、Record 全生态化
        </p>
      </div>

      <div className="j21-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`j21-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="j21-content">
        {activeTab === 'virtual-thread' && (
          <div className="j21-section">
            <h3>虚拟线程 (Virtual Thread) — Java 21 正式特性</h3>
            <p className="j21-section-desc">虚拟线程是轻量级线程，由JVM管理而非OS，可轻松创建百万级并发任务。Spring Boot 4 全面支持虚拟线程。</p>
            {renderCards(vtCards)}
          </div>
        )}
        {activeTab === 'structured-concurrency' && (
          <div className="j21-section">
            <h3>结构化并发 (Structured Concurrency) — Java 23 预览特性 (JEP 480)</h3>
            <p className="j21-section-desc">通过 StructuredTaskScope 将并发任务组织在 try-with-resources 块中，自动管理生命周期和异常传播。</p>
            {renderCards(scCards)}
          </div>
        )}
        {activeTab === 'scoped-value' && (
          <div className="j21-section">
            <h3>作用域值 (Scoped Value) — Java 23 预览特性 (JEP 481)</h3>
            <p className="j21-section-desc">ScopedValue 是不可变的、词法作用域绑定的值传递机制，替代 ThreadLocal 的线程池泄漏问题。</p>
            {renderCards(svCards)}
          </div>
        )}
        {activeTab === 'pattern-matching' && (
          <div className="j21-section">
            <h3>模式匹配 (Pattern Matching) — Java 21 正式特性</h3>
            <p className="j21-section-desc">switch + record pattern + sealed class 提供类型安全的穷举匹配和解构，消除 instanceof 强制转型。</p>
            {renderCards(pmCards)}
          </div>
        )}
        {activeTab === 'record' && (
          <div className="j21-section">
            <h3>Record 全生态化 — Java 21 正式特性</h3>
            <p className="j21-section-desc">Record 是不可变数据载体，自动生成构造器、访问器、equals、hashCode、toString，天然线程安全。</p>
            {renderCards(recCards)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Java21Demo;
