import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authService } from './services';

// 导入页面组件
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserList from './components/users/UserList';
import RoleList from './components/roles/RoleList';
import PermissionList from './components/permissions/PermissionList';
import RedisOperations from './components/redis/RedisOperations';
import Demo from './components/demo/Demo';
import PaymentManagement from './components/payment/PaymentManagement';
import ReconciliationManagement from './components/reconciliation/ReconciliationManagement';
import Java21Demo from './components/java21/Java21Demo';
import JvmMonitor from './components/jvm/JvmMonitor';

import DbMonitor from './components/db/DbMonitor';
import ServerMonitor from './components/server/ServerMonitor';
import LogManagement from './components/log/LogManagement';
import OperlogManagement from './components/operlog/OperlogManagement';
import OnlineUserManagement from './components/online/OnlineUserManagement';
import DictManagement from './components/dict/DictManagement';
import MenuManagement from './components/menu/MenuManagement';
import AiManagement from './components/ai/AiManagement';
import Sidebar from './components/sidebar/Sidebar';

import './App.css';

/**
 * 错误边界组件
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React 渲染错误:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <div style={{ padding: '24px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', margin: '20px', fontFamily: 'sans-serif' }}>
          <h2 style={{ margin: '0 0 8px' }}>应用出现错误</h2>
          <p style={{ margin: '0 0 12px', color: '#b91c1c' }}>{msg}</p>
          {this.state.error && (
            <details style={{ marginTop: '8px', fontSize: '14px', background: '#fff', padding: '10px', borderRadius: '6px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#991b1b' }}>错误详情</summary>
              <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', color: '#333' }}>
                {this.state.error.stack || this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * 私有路由组件
 */
const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/auth/login" />;
};

/**
 * 页脚组件
 */
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Spring Boot 4 RBAC 系统 - 基于 Java 21 虚拟线程</p>
        <p>后端: Spring Boot 4.1.0-M3 | 前端: React 19 | 数据库: PostgreSQL | 缓存: Redis</p>
        <p>© {new Date().getFullYear()} RBAC System. 仅供演示使用。</p>
      </div>
    </footer>
  );
};

/**
 * 页面标题映射
 */
const pageTitles = {
  '/': '首页',
  '/users': '用户管理',
  '/roles': '角色管理',
  '/permissions': '权限管理',
  '/redis': 'Redis 操作',
  '/payment': '支付管理',
  '/reconciliation': '对帐管理',
  '/java21': 'Java 21 新特性',
  '/jvm': 'JVM 监控',
  '/db-monitor': '数据库监控',
  '/server-monitor': '服务器监控',
  '/logs': '日志管理',
  '/operlog': '操作日志',
  '/online': '在线用户',
  '/dict': '字典管理',
  '/menus': '菜单管理',
  '/ai': 'AI 智能助手',
  '/demo': '演示',
};

/**
 * 主应用内容
 */
const AppContent = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthPage = location.pathname.startsWith('/auth/');
  const pageTitle = pageTitles[location.pathname] || '';

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          setCurrentUser(authService.getCurrentUser());
        }
      } catch (error) {
        console.error('检查认证状态时出错:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    const timeoutId = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>加载中...</div>
      </div>
    );
  }

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/users" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <UserList />
        </PrivateRoute>
      } />
      <Route path="/roles" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <RoleList />
        </PrivateRoute>
      } />
      <Route path="/permissions" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <PermissionList />
        </PrivateRoute>
      } />
      <Route path="/redis" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <RedisOperations />
        </PrivateRoute>
      } />
      <Route path="/payment" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <PaymentManagement />
        </PrivateRoute>
      } />
      <Route path="/reconciliation" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <ReconciliationManagement />
        </PrivateRoute>
      } />
      <Route path="/java21" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <Java21Demo />
        </PrivateRoute>
      } />
      <Route path="/jvm" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <JvmMonitor />
        </PrivateRoute>
      } />
      <Route path="/jvm-processes" element={<Navigate to="/jvm?tab=processes" />} />
      <Route path="/jvm-processes-chart" element={<Navigate to="/jvm?tab=chart" />} />
      <Route path="/db-monitor" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <DbMonitor />
        </PrivateRoute>
      } />
      <Route path="/server-monitor" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <ServerMonitor />
        </PrivateRoute>
      } />
      <Route path="/logs" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <LogManagement />
        </PrivateRoute>
      } />
      <Route path="/operlog" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <OperlogManagement />
        </PrivateRoute>
      } />
      <Route path="/online" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <OnlineUserManagement />
        </PrivateRoute>
      } />
      <Route path="/dict" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <DictManagement />
        </PrivateRoute>
      } />
      <Route path="/menus" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <MenuManagement />
        </PrivateRoute>
      } />
      <Route path="/ai" element={
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <AiManagement />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  // 认证页面：全屏布局，无侧边栏无顶栏
  if (isAuthPage) {
    return (
      <div className="auth-layout-full">
        <Routes>
          <Route path="/auth/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/auth/login" />} />
        </Routes>
      </div>
    );
  }

  // 未登录：无侧边栏，顶栏显示登录/注册入口
  if (!isAuthenticated) {
    return (
      <div className="public-layout">
        <header className="public-topbar">
          <div className="public-topbar-inner">
            <a href="/" className="public-logo">🛡️ RBAC System</a>
            <nav className="public-nav">
              <a href="#/auth/login" className="public-nav-link">登录</a>
              <a href="#/auth/register" className="public-nav-btn">注册</a>
            </nav>
          </div>
        </header>
        <main className="public-content">
          {routes}
        </main>
        <Footer />
      </div>
    );
  }

  // 已登录：侧边栏 + 内容区
  return (
    <div className="app-layout">
      <Sidebar
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-breadcrumb">
              {pageTitle && <strong>{pageTitle}</strong>}
            </span>
          </div>
          <div className="topbar-right">
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              {currentUser?.username}
            </span>
          </div>
        </header>

        <main className="main-content-sidebar">
          {routes}
        </main>

        <Footer />
      </div>
    </div>
  );
};

/**
 * 应用根组件
 */
const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
};

export default App;
