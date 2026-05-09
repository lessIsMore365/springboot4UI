import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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

import './App.css';

/**
 * 错误边界组件（用于捕获渲染错误）
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React 渲染错误:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: '20px', backgroundColor: '#fed7d7', color: '#742a2a', borderRadius: '8px', margin: '20px' }}>
          <h2>应用出现错误</h2>
          <p>抱歉，应用渲染时发生错误。请刷新页面或检查控制台。</p>
          {this.state.error && (
            <details style={{ marginTop: '10px', fontSize: '14px' }}>
              <summary>错误详情</summary>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: '10px', borderRadius: '4px' }}>
                {this.state.error.toString()}
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
 * 导航栏组件
 */
const Navbar = ({ isAuthenticated, currentUser, onLogout, isAuthPage }) => {
  const location = useLocation();

  // 在登录/注册页面隐藏导航栏，使其看起来像独立的页面
  if (isAuthPage) {
    return null;
  }

  // 检查当前路径是否激活
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span>RBAC System</span>
        </Link>

        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
              🏠 首页
            </Link>
          </li>

          {!isAuthenticated ? (
            <>
              <li className="navbar-item">
                <Link to="/auth/login" className={`navbar-link ${isActive('/auth/login') ? 'active' : ''}`}>
                  🔐 登录
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/auth/register" className={`navbar-link ${isActive('/auth/register') ? 'active' : ''}`}>
                  📝 注册
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="navbar-item">
                <Link to="/users" className={`navbar-link ${isActive('/users') ? 'active' : ''}`}>
                  👥 用户管理
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/roles" className={`navbar-link ${isActive('/roles') ? 'active' : ''}`}>
                  👑 角色管理
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/permissions" className={`navbar-link ${isActive('/permissions') ? 'active' : ''}`}>
                  🔑 权限管理
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/redis" className={`navbar-link ${isActive('/redis') ? 'active' : ''}`}>
                  🗃️ Redis
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/payment" className={`navbar-link ${isActive('/payment') ? 'active' : ''}`}>
                  💰 支付
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/reconciliation" className={`navbar-link ${isActive('/reconciliation') ? 'active' : ''}`}>
                  📊 对帐
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/java21" className={`navbar-link ${isActive('/java21') ? 'active' : ''}`}>
                  ☕ Java 21
                </Link>
              </li>
            </>
          )}

          <li className="navbar-item">
            <Link to="/demo" className={`navbar-link ${isActive('/demo') ? 'active' : ''}`}>
              ⚡ 演示
            </Link>
          </li>
        </ul>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <div className="auth-info">
                欢迎, <strong>{currentUser?.username || '用户'}</strong>
                {currentUser?.roles && ` (${currentUser.roles})`}
              </div>
              <button className="btn-logout" onClick={onLogout}>
                登出
              </button>
            </>
          ) : (
            <div className="auth-info">
              请先登录
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

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
 * 主应用组件
 */
const AppContent = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 判断是否在认证页面（登录/注册），用于隐藏导航和页脚
  const isAuthPage = location.pathname.startsWith('/auth/');

  // 检查认证状态
  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log('检查认证状态...');
        const authenticated = authService.isAuthenticated();
        console.log('认证状态:', authenticated);
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const user = authService.getCurrentUser();
          console.log('当前用户:', user);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('检查认证状态时出错:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 安全超时：确保 loading 状态不会无限期卡住
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  // 处理登录成功
  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  // 处理登出
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // 处理注册成功
  const handleRegisterSuccess = () => {
    // 注册成功后，Register组件会自动跳转到登录页
  };

  console.log('AppContent 渲染', { loading, isAuthenticated });

  if (loading) {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogout={handleLogout}
        isAuthPage={isAuthPage}
      />

      <main className={`main-content${isAuthPage ? ' auth-layout' : ''}`}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={
            <Login onLoginSuccess={handleLoginSuccess} />
          } />
          <Route path="/auth/register" element={
            <Register onRegisterSuccess={handleRegisterSuccess} />
          } />
          <Route path="/demo" element={<Demo />} />

          {/* 需要认证的路由 */}
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
          <Route path="/java21" element={<Java21Demo />} />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!isAuthPage && <Footer />}
    </div>
  );
};

/**
 * 应用根组件（包含路由）
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