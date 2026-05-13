import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

/**
 * 首页组件
 */
const Home = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Spring Boot 4 RBAC 系统</h1>
        <p className="home-subtitle">
          基于 Spring Boot 4.1.0-M3 和 Java 21 虚拟线程的完整 RBAC 权限管理系统
        </p>
      </header>

      <div className="home-content">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>认证授权</h3>
            <p>
              支持 HTTP Basic 认证和 OAuth2/JWT 认证，
              完整的 RBAC（基于角色的访问控制）权限管理。
            </p>
            <Link to="/auth/login" className="feature-link">
              开始认证 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>用户管理</h3>
            <p>
              完整的用户 CRUD 操作，支持批量创建、
              分页查询、统计信息和性能测试。
            </p>
            <Link to="/users" className="feature-link">
              管理用户 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👑</div>
            <h3>角色管理</h3>
            <p>
              角色创建、分配、权限管理，
              支持为用户分配角色和为角色分配权限。
            </p>
            <Link to="/roles" className="feature-link">
              管理角色 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔑</div>
            <h3>权限管理</h3>
            <p>
              细粒度权限控制，支持 API、菜单、按钮、数据等权限类型，
              灵活的角色-权限映射。
            </p>
            <Link to="/permissions" className="feature-link">
              管理权限 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🗃️</div>
            <h3>Redis 操作</h3>
            <p>
              Redis 缓存操作，支持键值对、哈希、列表、集合等数据结构，
              用于 OAuth2 Token 存储。
            </p>
            <Link to="/redis" className="feature-link">
              Redis 操作 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>虚拟线程演示</h3>
            <p>
              Java 21 虚拟线程全面支持，
              优化数据库连接池和 HTTP 请求处理，提升并发性能。
            </p>
            <Link to="/demo" className="feature-link">
              查看演示 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>支付管理</h3>
            <p>
              支持支付宝和微信支付，包含订单创建、
              查询、关闭、退款等完整支付流程。
            </p>
            <Link to="/payment" className="feature-link">
              管理支付 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>对帐管理</h3>
            <p>
              自动/手动对帐，逐笔比对订单号、金额、
              状态，识别差异，支持历史查询和统计分析。
            </p>
            <Link to="/reconciliation" className="feature-link">
              查看对帐 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">☕</div>
            <h3>Java 21 新特性</h3>
            <p>
              虚拟线程、结构化并发、作用域值、模式匹配、
              Record 全生态化 — 五大新特性交互式演示。
            </p>
            <Link to="/java21" className="feature-link">
              探索特性 →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>JVM 监控</h3>
            <p>
              实时堆内存、虚拟线程 vs 平台线程统计、
              GC 详情、线程转储 — 全面监控面板。
            </p>
            <Link to="/jvm" className="feature-link">
              查看监控 →
            </Link>
          </div>
        </div>

        <div className="home-info">
          <div className="info-card">
            <h3>技术栈</h3>
            <ul>
              <li><strong>后端:</strong> Spring Boot 4.1.0-M3, Java 21</li>
              <li><strong>数据库:</strong> PostgreSQL, MyBatis Plus</li>
              <li><strong>缓存:</strong> Redis (OAuth2 Token 存储)</li>
              <li><strong>安全:</strong> Spring Security, HTTP Basic, OAuth2/JWT</li>
              <li><strong>前端:</strong> React 19, Create React App</li>
              <li><strong>虚拟线程:</strong> 全面支持 Java 21 虚拟线程</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>默认用户</h3>
            <ul>
              <li><strong>管理员:</strong> <code>admin</code> / <code>password</code></li>
              <li><strong>普通用户:</strong> <code>user</code> / <code>password</code></li>
            </ul>
            <p className="info-note">
              使用 HTTP Basic 认证进行测试，生产环境建议使用 OAuth2/JWT。
            </p>
          </div>

          <div className="info-card">
            <h3>API 文档</h3>
            <p>
              完整的 API 接口文档，包含认证、用户、角色、
              权限、Redis、支付、对帐等所有端点的详细说明。
            </p>
            <p className="info-note">
              后端服务运行在 <code>http://localhost:8080</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;