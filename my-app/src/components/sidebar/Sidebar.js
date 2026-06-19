import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { menuService } from '../../services';
import './Sidebar.css';

// 静态后备菜单（API 获取失败时使用，与后端 seed data 结构一致）
const FALLBACK_CATEGORIES = [
  {
    key: 'system', icon: '⚙️', label: '系统管理',
    items: [
      { path: '/users', icon: '👥', label: '用户管理' },
      { path: '/roles', icon: '👑', label: '角色管理' },
      { path: '/permissions', icon: '🔑', label: '权限管理' },
      { path: '/dept', icon: '🏢', label: '部门管理' },
      { path: '/dict', icon: '📖', label: '字典管理' },
      { path: '/menus', icon: '📋', label: '菜单管理' },
      { path: '/notices', icon: '📢', label: '通知公告' },
    ],
  },
  {
    key: 'payment', icon: '💰', label: '支付管理',
    items: [
      { path: '/payment?tab=order', icon: '📋', label: '支付订单' },
      { path: '/reconciliation', icon: '📈', label: '对帐管理' },
      { path: '/payment?tab=stats', icon: '📊', label: '支付统计' },
    ],
  },
  {
    key: 'data', icon: '🗄️', label: '数据服务',
    items: [
      { path: '/redis?tab=ops', icon: '🔧', label: '基础操作' },
      { path: '/redis?tab=cache', icon: '📊', label: '缓存管理' },
      { path: '/redis?tab=monitor', icon: '📈', label: '服务监控' },
    ],
  },
  {
    key: 'monitor', icon: '🔧', label: '监控管理',
    items: [
      { path: '/java21', icon: '☕', label: 'Java 21' },
      { path: '/jvm?tab=app', icon: '📈', label: 'JVM 监控' },
      { path: '/db-monitor', icon: '🗄️', label: '数据库监控' },
      { path: '/server-monitor', icon: '🖥️', label: '服务器监控' },
      { path: '/logs', icon: '📜', label: '日志管理' },
      { path: '/operlog', icon: '📋', label: '操作日志' },
      { path: '/online', icon: '🟢', label: '在线用户' },
      { path: '/ai', icon: '🤖', label: 'AI 助手' },
    ],
  },
];

const FALLBACK_STANDALONE = [
  { path: '/scheduler', icon: '⏰', label: '调度任务' },
  { path: '/docs', icon: '📚', label: 'API 文档' },
  { path: '/demo', icon: '⚡', label: '演示' },
];

// 根据名称匹配图标（后备方案）
const NAME_ICON = {
  system: '⚙️', user: '👥', role: '👑', permission: '🔑', dept: '🏢', dict: '📖', menu: '📋', notice: '📢',
  business: '📋', money: '💰', reconciliation: '📈',
  data: '🗄️', redis: '🗃️',
  devtools: '🔧', java21: '☕', monitor: '📈', db: '🗄️', server: '🖥️',
  logs: '📜', operlog: '📋', online: '🟢', ai: '🤖',
  scheduler: '⏰', docs: '📚', demo: '⚡',
};

// 根据路由路径匹配图标（优先）
const PATH_ICON = [
  [/\/users\b/, '👥'], [/\/roles\b/, '👑'], [/\/permissions\b/, '🔑'],
  [/\/dept\b/, '🏢'], [/\/dict\b/, '📖'], [/\/menus\b/, '📋'], [/\/notices\b/, '📢'], [/\/payment\b/, '💰'],
  [/\/reconciliation\b/, '📈'], [/\/redis\b/, '🗃️'], [/\/java21\b/, '☕'],
  [/\/jvm\b/, '📈'], [/\/db-monitor\b/, '🗄️'], [/\/server-monitor\b/, '🖥️'],
  [/\/logs\b/, '📜'], [/\/operlog\b/, '📋'], [/\/online\b/, '🟢'],
  [/\/ai\b/, '🤖'], [/\/scheduler\b/, '⏰'], [/\/docs\b/, '📚'], [/\/demo\b/, '⚡'],
  [/system/, '⚙️'], [/monitor/, '🔧'],
];

const getIcon = (path, iconName, label) => {
  // 后端直接存储的 emoji 优先
  if (iconName && iconName.length <= 4 && /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2702}-\u{27B0}\u{1F900}-\u{1F9FF}\u{200D}\u{FE0F}]/u.test(iconName)) return iconName;
  // 路径匹配
  if (path) {
    for (const [pattern, emoji] of PATH_ICON) {
      if (pattern.test(path)) return emoji;
    }
  }
  // 名称匹配
  if (iconName && NAME_ICON[iconName]) return NAME_ICON[iconName];
  if (label && NAME_ICON[label]) return NAME_ICON[label];
  return '📄';
};

const buildTree = (menus) => {
  if (!menus?.length) return { categories: [], standaloneItems: [] };
  const visible = (m) => m.visible !== false && m.status !== false;
  const sorted = (arr) => [...arr].sort((a, b) => a.sortOrder - b.sortOrder);
  const dirs = sorted(menus.filter(m => m.menuType === 'M' && visible(m)));
  const topItems = sorted(menus.filter(m => m.menuType === 'C' && visible(m) && m.parentId === 0));

  const categories = dirs.map(dir => ({
    key: `menu-${dir.id}`,
    icon: dir.icon || 'default',
    label: dir.name,
    items: sorted((dir.children || []).filter(c => c.menuType === 'C' && visible(c)))
      .map(c => ({ path: c.path, icon: c.icon || 'default', label: c.name })),
  }));

  const standaloneItems = topItems.map(item => ({
    path: item.path,
    icon: item.icon || 'default',
    label: item.name,
  }));

  return { categories, standaloneItems };
};

const Sidebar = ({ isAuthenticated, currentUser, onLogout }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState(null);
  const [dynamicStandalone, setDynamicStandalone] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // 加载动态菜单
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const fetchMenus = async () => {
      setMenuLoading(true);
      try {
        const r = await menuService.getUserMenus();
        if (!cancelled && r.success !== false && Array.isArray(r.data) && r.data.length > 0) {
          const { categories, standaloneItems } = buildTree(r.data);
          if (!cancelled && categories.length > 0) {
            setDynamicCategories(categories);
            setDynamicStandalone(standaloneItems);
            const initialExpanded = {};
            categories.forEach((cat, i) => { initialExpanded[cat.key] = i === 0; });
            setExpandedCategories(prev => Object.keys(prev).length === 0 ? initialExpanded : prev);
          }
        }
      } catch (e) { /* fallback to static menus */ }
      finally { if (!cancelled) setMenuLoading(false); }
    };
    fetchMenus();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const menuCategories = dynamicCategories || FALLBACK_CATEGORIES;
  const dynamicStandaloneItems = dynamicStandalone || FALLBACK_STANDALONE;
  // 确保通知公告始终可见（即使后端动态菜单未包含）
  const hasNotice = (cats, items) => {
    if (items.some(i => i.path === '/notices')) return true;
    return cats.some(c => c.items?.some(i => i.path === '/notices'));
  };
  const standaloneItems = hasNotice(menuCategories, dynamicStandaloneItems)
    ? dynamicStandaloneItems
    : [...dynamicStandaloneItems, { path: '/notices', icon: '📢', label: '通知公告' }];

  const isActive = (path) => {
    const [pathOnly, query] = path.split('?');
    if (location.pathname !== pathOnly) return false;
    if (query) return location.search === `?${query}`;
    return !location.search || location.search === '';
  };

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
            <Link to="/auth/login" className={`sidebar-item${isActive('/auth/login') ? ' active' : ''}`} style={{ paddingLeft: collapsed ? undefined : 16 }} title="登录">
              <span className="sidebar-item-icon">🔐</span>
              <span className="sidebar-item-label">登录</span>
            </Link>
            <Link to="/auth/register" className={`sidebar-item${isActive('/auth/register') ? ' active' : ''}`} style={{ paddingLeft: collapsed ? undefined : 16 }} title="注册">
              <span className="sidebar-item-icon">📝</span>
              <span className="sidebar-item-label">注册</span>
            </Link>
          </>
        )}

        {/* 已登录时显示动态菜单 */}
        {isAuthenticated && (
          <>
            {menuLoading && dynamicCategories === null && (
              <div style={{ padding: '12px 16px', color: '#a0aec0', fontSize: 12 }}>加载菜单中...</div>
            )}
            {menuCategories.map(cat => (
              <div key={cat.key} className="sidebar-category">
                <button
                  className="sidebar-category-header"
                  onClick={() => toggleCategory(cat.key)}
                  title={cat.label}
                >
                  <span className={`sidebar-category-arrow${expandedCategories[cat.key] ? ' open' : ''}`}>▶</span>
                  <span>{getIcon(null, cat.icon, cat.label)}</span>
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
                      <span className="sidebar-item-icon">{getIcon(item.path, item.icon, item.label)}</span>
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
                <span className="sidebar-item-icon">{getIcon(item.path, item.icon, item.label)}</span>
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
