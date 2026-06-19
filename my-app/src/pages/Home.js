import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, demoService, paymentService, redisService, userService } from '../services';
import '../App.css';
import './Home.css';

const StatusDot = ({ status }) => {
  const color = status === 'UP' ? '#22c55e' : status === 'DOWN' ? '#ef4444' : '#f59e0b';
  const pulse = status === 'UP' ? 'status-pulse' : '';
  return <span className={`status-dot ${pulse}`} style={{ background: color }} />;
};

const QUICK_LINKS = [
  { path: '/users', icon: '👥', label: '用户管理', desc: '管理用户、分配角色' },
  { path: '/roles', icon: '👑', label: '角色管理', desc: '角色与权限配置' },
  { path: '/payment', icon: '💰', label: '支付管理', desc: '订单与对账' },
  { path: '/jvm', icon: '📈', label: 'JVM 监控', desc: '应用运行状态' },
  { path: '/db-monitor', icon: '🗄️', label: '数据库监控', desc: '连接池与查询' },
  { path: '/server-monitor', icon: '🖥️', label: '服务器监控', desc: 'CPU、内存、磁盘' },
];

const CAPABILITY_GROUPS = [
  { label: '权限模型', value: '用户 / 角色 / 权限 / 菜单 / 部门' },
  { label: '业务闭环', value: '支付订单 / 对帐 / 字典 / 调度任务' },
  { label: '可观测性', value: 'JVM / 数据库 / 服务器 / 日志 / 在线用户' },
  { label: '集成扩展', value: 'Redis / AI 助手 / API 文档 / Java 21 演示' },
];

const SERVICE_CHECKS = [
  {
    name: '认证服务',
    key: 'auth',
    action: () => authService.healthCheck(),
    ok: (r) => r.success || r.status === 'UP',
    hint: '确认 Spring Boot 后端已启动，且 /api/auth/health 可访问。',
  },
  {
    name: '数据库',
    key: 'db',
    action: () => demoService.databaseHealth(),
    ok: (r) => r.status === 'UP' || r.success,
    hint: '检查 PostgreSQL 是否运行在 127.0.0.1:5432，并确认后端数据源配置。',
  },
  {
    name: 'Redis',
    key: 'redis',
    action: () => redisService.healthCheck(),
    ok: (r) => r.status === 'UP' || r.success,
    hint: '检查 Redis 是否运行在 127.0.0.1:6379。',
  },
  {
    name: '支付服务',
    key: 'payment',
    action: () => paymentService.healthCheck(),
    ok: (r) => r.status === 'UP' || r.success,
    hint: '确认支付模块接口已注册，必要时查看后端业务日志。',
  },
];

const normalizeRoles = (user) => {
  const roles = user?.roles || user?.authorities || user?.roleCodes || [];
  if (Array.isArray(roles)) {
    return roles.map(role => typeof role === 'string' ? role : role.authority || role.code || role.name).filter(Boolean);
  }
  return String(roles).split(',').map(role => role.trim()).filter(Boolean);
};

const Home = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState(
    SERVICE_CHECKS.map(({ name, key, hint }) => ({ name, key, hint, status: 'checking', info: '' }))
  );
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [stats, setStats] = useState({ loading: false, data: null, error: '' });
  const isAuthed = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const roles = useMemo(() => normalizeRoles(currentUser), [currentUser]);

  const refreshHealth = useCallback(async () => {
    setChecking(true);
    setServices(prev => prev.map(service => ({ ...service, status: 'checking', info: '' })));

    const results = await Promise.all(SERVICE_CHECKS.map(check =>
      check.action()
        .then(r => ({
          key: check.key,
          status: check.ok(r) ? 'UP' : 'DOWN',
          info: r.message || r.status || '',
        }))
        .catch(error => ({
          key: check.key,
          status: 'DOWN',
          info: error.message || '连接失败',
        }))
    ));

    setServices(prev => prev.map(s => {
      const updated = results.find(r => r.key === s.key);
      return updated ? { ...s, ...updated } : s;
    }));
    setLastCheckedAt(new Date());
    setChecking(false);
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    setStats({ loading: true, data: null, error: '' });
    userService.getUserStats()
      .then(response => {
        if (cancelled) return;
        setStats({ loading: false, data: response.data || response, error: '' });
      })
      .catch(error => {
        if (cancelled) return;
        setStats({ loading: false, data: null, error: error.message || '统计数据暂不可用' });
      });
    return () => { cancelled = true; };
  }, [isAuthed]);

  const upCount = services.filter(s => s.status === 'UP').length;
  const downServices = services.filter(s => s.status === 'DOWN');
  const totalCount = services.length;
  const healthPercent = Math.round((upCount / totalCount) * 100);
  const statusLabel = upCount === totalCount ? '全部正常' : upCount === 0 ? '全部异常' : '部分异常';
  const userStats = stats.data || {};
  const totalUsers = userStats.totalUsers ?? userStats.total ?? userStats.userCount ?? '--';
  const activeUsers = userStats.activeUsers ?? userStats.enabledUsers ?? userStats.activeCount ?? '--';

  return (
    <div className="home-dashboard">
      <section className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-kicker">{isAuthed ? '控制台工作台' : '公开预览'}</span>
          <h1>Spring Boot 4 RBAC</h1>
          <p>基于 Java 21 虚拟线程的权限管理系统</p>
          <div className="welcome-tags">
            <span className="welcome-tag">Spring Boot 4.1</span>
            <span className="welcome-tag">Java 21</span>
            <span className="welcome-tag">Virtual Threads</span>
            <span className="welcome-tag">PostgreSQL</span>
            <span className="welcome-tag">Redis</span>
          </div>
        </div>
        <div className="welcome-panel">
          <span className="welcome-panel-label">运行健康度</span>
          <strong>{healthPercent}%</strong>
          <span>{statusLabel}</span>
          <button type="button" onClick={refreshHealth} disabled={checking}>
            {checking ? '检测中...' : '刷新状态'}
          </button>
        </div>
      </section>

      <section className="overview-grid">
        <div className="overview-card">
          <span className="overview-label">当前账号</span>
          <strong>{currentUser?.username || '未登录'}</strong>
          <span className="overview-muted">
            {isAuthed ? (roles.length ? roles.join(' / ') : '已认证') : '登录后可进入管理模块'}
          </span>
        </div>
        <div className="overview-card">
          <span className="overview-label">用户总数</span>
          <strong>{stats.loading ? '读取中' : totalUsers}</strong>
          <span className="overview-muted">{isAuthed ? (stats.error || '来自 /api/users/stats') : '需要登录后读取'}</span>
        </div>
        <div className="overview-card">
          <span className="overview-label">活跃用户</span>
          <strong>{stats.loading ? '读取中' : activeUsers}</strong>
          <span className="overview-muted">用于快速确认账号体系状态</span>
        </div>
      </section>

      <section className="status-section">
        <div className="status-header">
          <div>
            <h3>系统状态</h3>
            {lastCheckedAt && (
              <span className="status-time">
                最近检测 {lastCheckedAt.toLocaleTimeString('zh-CN', { hour12: false })}
              </span>
            )}
          </div>
          <span className="status-summary">
            {upCount}/{totalCount} 服务正常
          </span>
        </div>
        <div className="status-grid">
          {services.map(s => (
            <div key={s.key} className={`status-card ${s.status === 'UP' ? 'healthy' : s.status === 'DOWN' ? 'down' : ''}`}>
              <div className="status-card-top">
                <StatusDot status={s.status} />
                <span className="status-name">{s.name}</span>
              </div>
              <span className="status-text">
                {s.status === 'checking' ? '检测中...' : s.status === 'UP' ? '运行正常' : s.info || '不可用'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {downServices.length > 0 && (
        <section className="insight-section">
          <div className="insight-header">
            <h3>联调建议</h3>
            <span>{downServices.length} 项需要关注</span>
          </div>
          <div className="insight-list">
            {downServices.map(service => (
              <div key={service.key} className="insight-item">
                <strong>{service.name}</strong>
                <span>{service.hint}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="quick-section">
        <h3 className="quick-title">快捷入口</h3>
        <div className="quick-grid">
          {QUICK_LINKS.map(link => (
            <button key={link.path} type="button" className="quick-card" onClick={() => navigate(link.path)}>
              <span className="quick-icon">{link.icon}</span>
              <span className="quick-info">
                <span className="quick-label">{link.label}</span>
                <span className="quick-desc">{link.desc}</span>
              </span>
              <span className="quick-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="capability-section">
        <h3>功能覆盖</h3>
        <div className="capability-grid">
          {CAPABILITY_GROUPS.map(item => (
            <div key={item.label} className="capability-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="info-section">
        <div className="info-row">
          <div className="info-block">
            <h4>建议补强</h4>
            <p>后续可以增加全局权限指令、表格列配置、审计导出和登录态自动刷新，让管理端更接近生产可用。</p>
          </div>
          <div className="info-block">
            <h4>安全认证</h4>
            <p>Spring Authorization Server + OAuth2 password grant + JWT，完整 RBAC 权限模型（用户/角色/权限）</p>
          </div>
          <div className="info-block">
            <h4>虚拟线程</h4>
            <p>全面支持 Java 21 虚拟线程，优化 Tomcat 和 HikariCP 连接池，异步端点返回 CompletableFuture</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
