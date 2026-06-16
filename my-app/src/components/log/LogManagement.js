import React, { useState, useEffect } from 'react';
import { logService } from '../../services';
import './LogManagement.css';

const LEVEL_OPTIONS = ['', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];

const LogManagement = () => {
  const [activeTab, setActiveTab] = useState('tail');

  // Tail state
  const [tailLines, setTailLines] = useState(100);
  const [tailLevel, setTailLevel] = useState('');
  const [tailFile, setTailFile] = useState('');
  const [tailData, setTailData] = useState(null);
  const [tailLoading, setTailLoading] = useState(false);
  const [tailError, setTailError] = useState('');

  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLevel, setSearchLevel] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchFile, setSearchFile] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const [searchData, setSearchData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Files state
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // App selector state
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [appsLoading, setAppsLoading] = useState(false);

  // App CRUD state
  const [appFormName, setAppFormName] = useState('');
  const [appFormPath, setAppFormPath] = useState('');
  const [appFormError, setAppFormError] = useState('');
  const [appFormLoading, setAppFormLoading] = useState(false);
  const [editAppName, setEditAppName] = useState(null);
  const [editAppPath, setEditAppPath] = useState('');
  const [editAppEnabled, setEditAppEnabled] = useState(true);
  const [editAppLoading, setEditAppLoading] = useState(false);
  const [appMessage, setAppMessage] = useState(null);

  // Loggers state
  const [loggers, setLoggers] = useState({});
  const [loggersLoading, setLoggersLoading] = useState(false);
  const [editLogger, setEditLogger] = useState(null);
  const [editLevel, setEditLevel] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState(null);

  // Helper to copy search params
  const searchParams = (pageOverride) => {
    const p = { page: pageOverride || searchPage, size: 20 };
    if (searchKeyword) p.keyword = searchKeyword;
    if (searchLevel) p.level = searchLevel;
    if (searchFrom) p.from = searchFrom;
    if (searchTo) p.to = searchTo;
    if (searchFile) p.file = searchFile;
    if (selectedApp) p.app = selectedApp;
    return p;
  };

  // ---- Apps ----
  useEffect(() => {
    const loadApps = async () => {
      setAppsLoading(true);
      try {
        const result = await logService.getApps();
        if (result.success) setApps(result.data || []);
      } catch (err) { /* ignore */ }
      finally { setAppsLoading(false); }
    };
    loadApps();
  }, []);

  // Auto-refresh current tab when app changes
  useEffect(() => {
    if (activeTab === 'tail' && tailData) handleTail();
    else if (activeTab === 'search' && searchData) handleSearch(searchPage);
    else if (activeTab === 'files') loadFiles();
    else if (activeTab === 'loggers') loadLoggers();
    else if (activeTab === 'apps') reloadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp]);

  // Auto-clear app message
  useEffect(() => {
    if (appMessage) {
      const t = setTimeout(() => setAppMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [appMessage]);

  const selectedAppInfo = apps.find(a => a.name === selectedApp);
  const isExternalApp = selectedAppInfo?.type === 'external';

  const reloadApps = async () => {
    setAppsLoading(true);
    try {
      const result = await logService.getApps();
      if (result.success) setApps(result.data || []);
    } catch (err) { /* ignore */ }
    finally { setAppsLoading(false); }
  };

  const handleAddApp = async (e) => {
    e.preventDefault();
    if (!appFormName.trim() || !appFormPath.trim()) {
      setAppFormError('名称和路径不能为空');
      return;
    }
    setAppFormLoading(true);
    setAppFormError('');
    setAppMessage(null);
    try {
      const result = await logService.addApp(appFormName.trim(), appFormPath.trim());
      if (result.success) {
        setAppMessage({ type: 'success', text: result.message || '应用已添加' });
        setAppFormName('');
        setAppFormPath('');
        reloadApps();
      } else {
        setAppFormError(result.message || '添加失败');
      }
    } catch (err) {
      setAppFormError(err.message || '请求失败');
    } finally {
      setAppFormLoading(false);
    }
  };

  const handleUpdateApp = async (name) => {
    setEditAppLoading(true);
    setAppMessage(null);
    try {
      const data = { path: editAppPath };
      if (editAppEnabled !== null) data.enabled = editAppEnabled;
      const result = await logService.updateApp(name, data);
      if (result.success) {
        setAppMessage({ type: 'success', text: result.message || '应用已更新' });
        setEditAppName(null);
        reloadApps();
      } else {
        setAppMessage({ type: 'error', text: result.message || '更新失败' });
      }
    } catch (err) {
      setAppMessage({ type: 'error', text: err.message || '请求失败' });
    } finally {
      setEditAppLoading(false);
    }
  };

  const handleDeleteApp = async (name) => {
    if (!window.confirm(`确定要删除外部应用 '${name}' 吗？此操作不可撤销。`)) return;
    setAppMessage(null);
    try {
      const result = await logService.deleteApp(name);
      if (result.success) {
        setAppMessage({ type: 'success', text: result.message || '应用已删除' });
        if (selectedApp === name) setSelectedApp('');
        reloadApps();
      } else {
        setAppMessage({ type: 'error', text: result.message || '删除失败' });
      }
    } catch (err) {
      setAppMessage({ type: 'error', text: err.message || '请求失败' });
    }
  };

  // ---- Tail ----
  const handleTail = async () => {
    setTailLoading(true);
    setTailError('');
    setTailData(null);
    try {
      const result = await logService.tail(tailLines, tailLevel || undefined, tailFile || undefined, selectedApp || undefined);
      setTailData(result);
    } catch (err) {
      setTailError(err.message || '请求失败');
    } finally {
      setTailLoading(false);
    }
  };

  // ---- Search ----
  const handleSearch = async (page = 1) => {
    setSearchLoading(true);
    setSearchError('');
    try {
      const result = await logService.search(searchParams(page));
      setSearchData(result);
      setSearchPage(page);
    } catch (err) {
      setSearchError(err.message || '搜索失败');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchPageChange = (newPage) => {
    if (searchData && newPage >= 1 && newPage <= Math.ceil(searchData.total / searchData.size)) {
      handleSearch(newPage);
    }
  };

  // ---- Files ----
  const loadFiles = async () => {
    setFilesLoading(true);
    try {
      const result = await logService.getFiles(selectedApp || undefined);
      if (result.success) setFiles(result.data || []);
    } catch (err) { /* ignore */ }
    finally { setFilesLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'files') loadFiles();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (fileName) => {
    try {
      const blob = await logService.download(fileName, selectedApp || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('下载失败: ' + (err.message || ''));
    }
  };

  // ---- Loggers ----
  const loadLoggers = async () => {
    setLoggersLoading(true);
    try {
      const result = await logService.getLoggers(selectedApp || undefined);
      if (result.success) setLoggers(result.data || {});
    } catch (err) { /* ignore */ }
    finally { setLoggersLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'loggers') loadLoggers();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEditLogger = (name, currentLevel) => {
    setEditLogger(name);
    setEditLevel(currentLevel);
    setEditResult(null);
  };

  const handleSetLevel = async () => {
    if (!editLogger || !editLevel) return;
    setEditLoading(true);
    setEditResult(null);
    try {
      const result = await logService.setLevel(editLogger, editLevel, selectedApp || undefined);
      setEditResult(result);
      if (result.success) {
        setLoggers(prev => ({ ...prev, [editLogger]: editLevel }));
        setTimeout(() => { setEditLogger(null); setEditResult(null); }, 1500);
      }
    } catch (err) {
      setEditResult({ success: false, message: err.message });
    } finally {
      setEditLoading(false);
    }
  };

  // ---- Render helpers ----
  const levelBadge = (line) => {
    if (line.includes(' ERROR ')) return <span className="log-level error">ERROR</span>;
    if (line.includes(' WARN ')) return <span className="log-level warn">WARN</span>;
    if (line.includes(' DEBUG ')) return <span className="log-level debug">DEBUG</span>;
    if (line.includes(' TRACE ')) return <span className="log-level trace">TRACE</span>;
    if (line.includes(' INFO ')) return <span className="log-level info">INFO</span>;
    return null;
  };

  return (
    <div className="log-container">
      <div className="log-header">
        <h2>日志管理</h2>
        <div className="log-app-selector">
          <span className="toolbar-label">应用:</span>
          <select className="toolbar-select" value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)} disabled={appsLoading}>
            <option value="">(当前应用)</option>
            {apps.filter(a => a.type === 'external').map(a => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
          {selectedAppInfo?.type === 'external' && (
            <span className="log-app-badge">外部</span>
          )}
        </div>
      </div>

      <div className="log-tabs">
        {[
          { key: 'tail', label: '实时查看' },
          { key: 'search', label: '日志搜索' },
          { key: 'files', label: '文件管理' },
          { key: 'loggers', label: '日志级别' },
          { key: 'apps', label: '应用管理' },
        ].map(t => (
          <button
            key={t.key}
            className={`log-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ======== Tail Tab ======== */}
      {activeTab === 'tail' && (
        <div className="log-section">
          <div className="log-toolbar">
            <div className="toolbar-group">
              <span className="toolbar-label">行数:</span>
              <input type="number" className="toolbar-input toolbar-input-sm" value={tailLines}
                onChange={(e) => setTailLines(Number(e.target.value))} min="1" max="2000" />
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">级别:</span>
              <select className="toolbar-select" value={tailLevel} onChange={(e) => setTailLevel(e.target.value)}>
                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l || '全部'}</option>)}
              </select>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">文件:</span>
              <select className="toolbar-select" value={tailFile} onChange={(e) => setTailFile(e.target.value)}>
                <option value="">application.log</option>
                <option value="error.log">error.log</option>
              </select>
            </div>
            <button className="btn btn-test" onClick={handleTail} disabled={tailLoading}>
              {tailLoading ? '加载中...' : '查看'}
            </button>
          </div>

          {tailError && <div className="alert alert-error">{tailError}</div>}

          {tailData?.data && (
            <div className="log-lines">
              <div className="log-lines-header">
                <span>最近 {tailData.data.count} 行 ({tailData.data.file}){tailData.data.app ? ` — ${tailData.data.app}` : ''}</span>
              </div>
              <div className="log-lines-content">
                {tailData.data.lines.map((line, i) => (
                  <div key={i} className="log-line">
                    <span className="log-line-num">{i + 1}</span>
                    {levelBadge(line)}
                    <code>{line}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======== Search Tab ======== */}
      {activeTab === 'search' && (
        <div className="log-section">
          <div className="log-toolbar log-toolbar-wrap">
            <div className="toolbar-group">
              <span className="toolbar-label">关键字:</span>
              <input type="text" className="toolbar-input" placeholder="搜索关键字" value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)} />
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">级别:</span>
              <select className="toolbar-select" value={searchLevel} onChange={(e) => setSearchLevel(e.target.value)}>
                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l || '全部'}</option>)}
              </select>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">从:</span>
              <input type="datetime-local" className="toolbar-input" value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)} />
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">到:</span>
              <input type="datetime-local" className="toolbar-input" value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)} />
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">文件:</span>
              <select className="toolbar-select" value={searchFile} onChange={(e) => setSearchFile(e.target.value)}>
                <option value="">application.log</option>
                <option value="error.log">error.log</option>
              </select>
            </div>
            <button className="btn btn-test" onClick={() => handleSearch(1)} disabled={searchLoading}>
              {searchLoading ? '搜索中...' : '搜索'}
            </button>
          </div>

          {searchError && <div className="alert alert-error">{searchError}</div>}

          {searchData && (
            <div className="log-lines">
              <div className="log-lines-header">
                <span>找到 {searchData.total} 条记录，扫描 {searchData.scannedLines} 行
                  {searchData.truncated && <span className="log-truncated"> (已截断)</span>}
                  {searchData.app ? ` — ${searchData.app}` : ''}
                </span>
                <span>第 {searchData.page}/{Math.ceil(searchData.total / searchData.size)} 页</span>
              </div>
              <div className="log-lines-content">
                {searchData.records?.length > 0 ? (
                  searchData.records.map((line, i) => (
                    <div key={i} className="log-line">
                      <span className="log-line-num">{(searchData.page - 1) * searchData.size + i + 1}</span>
                      {levelBadge(line)}
                      <code>{line}</code>
                    </div>
                  ))
                ) : (
                  <div className="log-no-data">无匹配日志</div>
                )}
              </div>
              {searchData.total > searchData.size && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => handleSearchPageChange(searchData.page - 1)}
                    disabled={searchData.page <= 1}>上一页</button>
                  <span className="page-info">第 {searchData.page} 页，共 {Math.ceil(searchData.total / searchData.size)} 页 (总计 {searchData.total} 条)</span>
                  <button className="page-btn" onClick={() => handleSearchPageChange(searchData.page + 1)}
                    disabled={searchData.page >= Math.ceil(searchData.total / searchData.size)}>下一页</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======== Files Tab ======== */}
      {activeTab === 'files' && (
        <div className="log-section">
          <div className="log-files-toolbar">
            {selectedApp && <span className="log-app-info">应用: {selectedApp}</span>}
          </div>
          {filesLoading ? (
            <div className="loading">加载中...</div>
          ) : (
            <div className="log-files-table-wrap">
              <table className="log-files-table">
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>大小</th>
                    <th>最后修改</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {files.length > 0 ? (
                    files.map((f, i) => (
                      <tr key={i}>
                        <td className="log-file-name">{f.name}</td>
                        <td>{f.sizeDisplay || '-'}</td>
                        <td>{f.lastModifiedDisplay || (f.lastModified ? new Date(f.lastModified).toLocaleString() : '-')}</td>
                        <td>
                          <button className="btn btn-test btn-sm" onClick={() => handleDownload(f.name)}>下载</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="no-data">未找到日志文件</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======== Apps Tab ======== */}
      {activeTab === 'apps' && (
        <div className="log-section">
          {appMessage && (
            <div className={`alert ${appMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {appMessage.text}
              <button className="btn-close" onClick={() => setAppMessage(null)}>×</button>
            </div>
          )}

          {/* Add app form */}
          <div className="log-app-form-section">
            <h3 className="log-section-title">添加外部应用</h3>
            <form className="log-app-form" onSubmit={handleAddApp}>
              <div className="log-app-form-fields">
                <input
                  type="text"
                  className="toolbar-input"
                  placeholder="应用名称 (如 order-service)"
                  value={appFormName}
                  onChange={(e) => setAppFormName(e.target.value)}
                  disabled={appFormLoading}
                />
                <input
                  type="text"
                  className="toolbar-input"
                  placeholder="日志目录路径 (如 /opt/order-service/logs)"
                  value={appFormPath}
                  onChange={(e) => setAppFormPath(e.target.value)}
                  disabled={appFormLoading}
                />
                <button type="submit" className="btn btn-create" disabled={appFormLoading}>
                  {appFormLoading ? '添加中...' : '添加'}
                </button>
              </div>
              {appFormError && <div className="form-error">{appFormError}</div>}
            </form>
          </div>

          {/* External apps list */}
          <div className="log-app-list-section">
            <h3 className="log-section-title">已配置应用</h3>
            {appsLoading ? (
              <div className="loading">加载中...</div>
            ) : (
              <div className="log-files-table-wrap">
                <table className="log-files-table">
                  <thead>
                    <tr>
                      <th>应用名称</th>
                      <th>日志路径</th>
                      <th>类型</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app.name}>
                        <td className="log-file-name">
                          {app.name}
                          {app.loggerManagement && <span className="log-app-badge" style={{marginLeft: 6}}>日志级别管理</span>}
                        </td>
                        <td style={{fontSize: 13, fontFamily: 'monospace'}}>{app.path}</td>
                        <td>{app.type === 'current' ? '当前应用' : '外部应用'}</td>
                        <td>
                          {app.type === 'external' ? (
                            <span className={`log-app-status ${app.enabled ? 'enabled' : 'disabled'}`}>
                              {app.enabled ? '已启用' : '已禁用'}
                            </span>
                          ) : (
                            <span className="log-app-status enabled">运行中</span>
                          )}
                        </td>
                        <td>
                          {app.type === 'external' && (
                            <div className="log-app-actions">
                              {editAppName === app.name ? (
                                <>
                                  <input
                                    type="text"
                                    className="toolbar-input toolbar-input-sm"
                                    value={editAppPath}
                                    onChange={(e) => setEditAppPath(e.target.value)}
                                    style={{width: 180}}
                                  />
                                  <select
                                    className="toolbar-select"
                                    value={editAppEnabled}
                                    onChange={(e) => setEditAppEnabled(e.target.value === 'true')}
                                    style={{fontSize: 12}}
                                  >
                                    <option value="true">启用</option>
                                    <option value="false">禁用</option>
                                  </select>
                                  <button
                                    className="btn btn-create btn-sm"
                                    onClick={() => handleUpdateApp(app.name)}
                                    disabled={editAppLoading}
                                  >
                                    {editAppLoading ? '...' : '保存'}
                                  </button>
                                  <button
                                    className="btn btn-cancel btn-sm"
                                    onClick={() => setEditAppName(null)}
                                  >
                                    取消
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-test btn-sm"
                                    onClick={() => {
                                      setEditAppName(app.name);
                                      setEditAppPath(app.path);
                                      setEditAppEnabled(app.enabled !== false);
                                    }}
                                  >
                                    编辑
                                  </button>
                                  <button
                                    className="btn btn-danger-outline btn-sm"
                                    onClick={() => handleDeleteApp(app.name)}
                                  >
                                    删除
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {apps.length === 0 && (
                      <tr><td colSpan="5" className="no-data">暂无应用配置</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======== Loggers Tab ======== */}
      {activeTab === 'loggers' && (
        <div className="log-section">
          {isExternalApp && (
            <div className="alert alert-warning">
              日志级别管理仅对当前应用可用，远程应用 &apos;{selectedApp}&apos; 不支持此操作
            </div>
          )}
          {loggersLoading ? (
            <div className="loading">加载中...</div>
          ) : (
            <>
              <div className="log-files-table-wrap">
                <table className="log-files-table">
                  <thead>
                    <tr>
                      <th>记录器</th>
                      <th>当前级别</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(loggers).length > 0 ? (
                      Object.entries(loggers).sort(([a], [b]) => a.localeCompare(b)).map(([name, level]) => (
                        <tr key={name}>
                          <td className="log-file-name">{name}</td>
                          <td><span className={`log-level ${level.toLowerCase()}`}>{level}</span></td>
                          <td>
                            <button className="btn btn-test btn-sm"
                              onClick={() => openEditLogger(name, level)}
                              disabled={isExternalApp}
                              title={isExternalApp ? '外部应用不支持日志级别管理' : ''}>修改</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="no-data">无法获取日志记录器</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Edit Logger Modal */}
              {editLogger && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditLogger(null); }}>
                  <div className="modal-content modal-sm">
                    <div className="modal-header">
                      <h3>修改日志级别</h3>
                      <button className="btn-close" onClick={() => setEditLogger(null)}>×</button>
                    </div>
                    <div className="log-edit-body">
                      <div className="log-edit-name">{editLogger}</div>
                      <select className="toolbar-select log-edit-select" value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value)}>
                        {LEVEL_OPTIONS.filter(Boolean).map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    {editResult && (
                      <div className={`log-edit-result ${editResult.success ? 'success' : 'error'}`}>
                        {editResult.message || JSON.stringify(editResult)}
                      </div>
                    )}
                    <div className="modal-actions">
                      <button className="btn btn-create" onClick={handleSetLevel} disabled={editLoading}>
                        {editLoading ? '提交中...' : '确认修改'}
                      </button>
                      <button className="btn btn-cancel" onClick={() => setEditLogger(null)}>取消</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LogManagement;
