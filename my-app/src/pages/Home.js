import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, demoService, redisService, paymentService } from '../services';
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

const Home = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([
    { name: '认证服务', key: 'auth', status: 'checking', info: '' },
    { name: '数据库', key: 'db', status: 'checking', info: '' },
    { name: 'Redis', key: 'redis', status: 'checking', info: '' },
    { name: '支付服务', key: 'payment', status: 'checking', info: '' },
  ]);

  useEffect(() => {
    const checks = [
      authService.healthCheck()
        .then(r => ({ key: 'auth', status: r.success ? 'UP' : 'DOWN', info: r.message || '' }))
        .catch(() => ({ key: 'auth', status: 'DOWN', info: '连接失败' })),
      demoService.databaseHealth()
        .then(r => ({ key: 'db', status: r.status === 'UP' || r.success ? 'UP' : 'DOWN', info: r.message || '' }))
        .catch(() => ({ key: 'db', status: 'DOWN', info: '连接失败' })),
      redisService.healthCheck()
        .then(r => ({ key: 'redis', status: r.status === 'UP' || r.success ? 'UP' : 'DOWN', info: r.message || '' }))
        .catch(() => ({ key: 'redis', status: 'DOWN', info: '连接失败' })),
      paymentService.healthCheck()
        .then(r => ({ key: 'payment', status: r.status === 'UP' || r.success ? 'UP' : 'DOWN', info: r.message || '' }))
        .catch(() => ({ key: 'payment', status: 'DOWN', info: '连接失败' })),
    ];

    Promise.all(checks).then(results => {
      setServices(prev => prev.map(s => {
        const updated = results.find(r => r.key === s.key);
        return updated ? { ...s, ...updated } : s;
      }));
    });
  }, []);

  const upCount = services.filter(s => s.status === 'UP').length;
  const totalCount = services.length;

  return (
    <div className="home-dashboard">
      {/* 欢迎横幅 */}
      <section className="welcome-banner">
        <div className="welcome-content">
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
      </section>

      {/* 系统状态 */}
      <section className="status-section">
        <div className="status-header">
          <h3>系统状态</h3>
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

      {/* 快捷入口 */}
      <section className="quick-section">
        <h3 className="quick-title">快捷入口</h3>
        <div className="quick-grid">
          {QUICK_LINKS.map(link => (
            <div key={link.path} className="quick-card" onClick={() => navigate(link.path)}>
              <span className="quick-icon">{link.icon}</span>
              <div className="quick-info">
                <span className="quick-label">{link.label}</span>
                <span className="quick-desc">{link.desc}</span>
              </div>
              <span className="quick-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* 项目信息 */}
      <section className="info-section">
        <div className="info-row">
          <div className="info-block">
            <h4>技术栈</h4>
            <p>后端 Spring Boot 4.1.0-M3 + MyBatis Plus，前端 React 19，PostgreSQL 数据库，Redis 缓存</p>
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
