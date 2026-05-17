import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const menuCategories = [
  {
    key: 'system',
    icon: '⚙️',
    label: '系统管理',
    items: [
      { path: '/users', icon: '👥', label: '用户管理' },
      { path: '/roles', icon: '👑', label: '角色管理' },
      { path: '/permissions', icon: '🔑', label: '权限管理' },
    ],
  },
  {
    key: 'business',
    icon: '📋',
    label: '业务功能',
    items: [
      { path: '/payment', icon: '💰', label: '支付管理' },
      { path: '/reconciliation', icon: '📊', label: '对帐管理' },
    ],
  },
  {
    key: 'data',
    icon: '🗄️',
    label: '数据服务',
    items: [
      { path: '/redis', icon: '🗃️', label: 'Redis' },
    ],
  },
  {
    key: 'devtools',
    icon: '🔧',
    label: '开发工具',
    items: [
      { path: '/java21', icon: '☕', label: 'Java 21' },
      { path: '/jvm', icon: '📈', label: 'JVM 监控' },
      { path: '/db-monitor', icon: '🗄️', label: '数据库监控' },
      { path: '/server-monitor', icon: '🖥️', label: '服务器监控' },
    ],
  },
];

const standaloneItems = [
  { path: '/demo', icon: '⚡', label: '演示' },
];

const Sidebar = ({ isAuthenticated, currentUser, onLogout }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    system: true,
    business: false,
    data: false,
    devtools: false,
  });

  const isActive = (path) => location.pathname === path;

  const toggleCategory = (key) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedCategories(prev => ({ ...prev, [key]: true }));
      return;
    }
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <span className="sidebar-logo-icon">🛡️</span>
          <span className="sidebar-logo-text">RBAC System</span>
        </Link>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展开菜单' : '折叠菜单'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="sidebar-nav">
        {/* 首页 */}
        <Link
          to="/"
          className={`sidebar-item${isActive('/') ? ' active' : ''}`}
          style={{ paddingLeft: collapsed ? undefined : 16 }}
          title="首页"
        >
          <span className="sidebar-item-icon">🏠</span>
          <span className="sidebar-item-label">首页</span>
        </Link>

        {/* 未登录时只显示登录/注册入口 */}
        {!isAuthenticated && (
          <>
            <Link
              to="/auth/login"
              className={`sidebar-item${isActive('/auth/login') ? ' active' : ''}`}
              style={{ paddingLeft: collapsed ? undefined : 16 }}
              title="登录"
            >
              <span className="sidebar-item-icon">🔐</span>
              <span className="sidebar-item-label">登录</span>
            </Link>
            <Link
              to="/auth/register"
              className={`sidebar-item${isActive('/auth/register') ? ' active' : ''}`}
              style={{ paddingLeft: collapsed ? undefined : 16 }}
              title="注册"
            >
              <span className="sidebar-item-icon">📝</span>
              <span className="sidebar-item-label">注册</span>
            </Link>
          </>
        )}

        {/* 已登录时显示分类菜单 */}
        {isAuthenticated && (
          <>
            {menuCategories.map(cat => (
              <div key={cat.key} className="sidebar-category">
                <button
                  className="sidebar-category-header"
                  onClick={() => toggleCategory(cat.key)}
                  title={cat.label}
                >
                  <span className={`sidebar-category-arrow${expandedCategories[cat.key] ? ' open' : ''}`}>▶</span>
                  <span>{cat.icon}</span>
                  <span className="sidebar-category-label">{cat.label}</span>
                </button>
                <div
                  className={`sidebar-submenu${!expandedCategories[cat.key] && !collapsed ? ' collapsed' : ''}`}
                  style={{ maxHeight: expandedCategories[cat.key] ? cat.items.length * 40 + 4 : 0 }}
                >
                  {cat.items.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-item${isActive(item.path) ? ' active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="sidebar-item-icon">{item.icon}</span>
                      <span className="sidebar-item-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* 独立菜单项 */}
            {standaloneItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item${isActive(item.path) ? ' active' : ''}`}
                style={{ paddingLeft: collapsed ? undefined : 16 }}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-label">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* 用户信息区 */}
      {isAuthenticated && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">👤</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.username || '用户'}</div>
              <div className="sidebar-user-role">{currentUser?.roles || '—'}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={onLogout} title="登出">
            <span>🚪</span>
            <span>登出</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
