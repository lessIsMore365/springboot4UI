import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { docsService } from '../../services';
import './DocsViewer.css';

const CACHE_KEY = 'api_docs_cache';

const DocsViewer = () => {
  const [sections, setSections] = useState([]);
  const [version, setVersion] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [polling, setPolling] = useState(false);
  const [changelog, setChangelog] = useState(null);

  const loadCached = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && cached.sections && cached.version) {
        setSections(cached.sections);
        setVersion(cached.version);
        setUpdatedAt(cached.updatedAt || '');
        return cached;
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  const saveCache = (s, v, u) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ sections: s, version: v, updatedAt: u }));
    } catch (e) { /* ignore */ }
  };

  const mergeChangelog = useCallback((current, changes) => {
    let merged = [...current];
    const sectionMap = new Map(merged.map(s => [s.id, s]));

    // Remove deleted
    for (const r of (changes.removed || [])) {
      sectionMap.delete(r.id);
    }
    // Add new
    for (const a of (changes.added || [])) {
      sectionMap.set(a.id, a);
    }
    // Update modified
    for (const m of (changes.modified || [])) {
      sectionMap.set(m.id, m);
    }

    return Array.from(sectionMap.values());
  }, []);

  const fetchDocs = useCallback(async (cachedVersion) => {
    setLoading(true);
    setError('');
    try {
      if (cachedVersion) {
        // Incremental update
        const r = await docsService.getChangelog(cachedVersion);
        if (r.success) {
          const changes = r.data;
          if (changes.added.length === 0 && changes.modified.length === 0 && changes.removed.length === 0) {
            setChangelog({ status: 'up-to-date', message: '文档已是最新版本' });
          } else {
            const merged = mergeChangelog(sections, changes);
            setSections(merged);
            setVersion(changes.toVersion);
            setUpdatedAt(changes.toDate);
            saveCache(merged, changes.toVersion, changes.toDate);
            setChangelog({
              status: 'updated',
              added: changes.added.length,
              modified: changes.modified.length,
              removed: changes.removed.length,
            });
          }
        }
      } else {
        // Full load
        const r = await docsService.getFullDocs();
        if (r.success) {
          const { sections: s, version: v, updatedAt: u } = r.data;
          setSections(s || []);
          setVersion(v);
          setUpdatedAt(u);
          saveCache(s, v, u);
          if (s && s.length > 0) setActiveSection(s[0].id);
        } else {
          setError(r.message || '获取文档失败');
        }
      }
    } catch (e) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [sections, mergeChangelog]);

  useEffect(() => {
    const cached = loadCached();
    if (cached && cached.sections.length > 0) {
      setActiveSection(cached.sections[0].id);
    }
    fetchDocs(cached?.version);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePoll = async () => {
    setPolling(true);
    try {
      const r = await docsService.getVersion();
      if (r.success) {
        const latestVersion = r.data.commitHash;
        if (latestVersion !== version) {
          await fetchDocs(version);
        } else {
          setChangelog({ status: 'up-to-date', message: `版本 ${latestVersion.substring(0, 8)} 已是最新` });
        }
      }
    } catch (e) {
      setError('版本检查失败: ' + e.message);
    } finally {
      setPolling(false);
    }
  };

  const renderMarkdown = (content) => {
    if (!content) return null;
    // Simple markdown to HTML conversion
    let html = content;
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="docs-code-block"><code class="${lang}">${escapeHtml(code)}</code></pre>`
    );
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="docs-inline-code">$1</code>');
    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4 class="docs-h4">$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="docs-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="docs-h2">$1</h2>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Tables - convert markdown tables to HTML
    html = html.replace(/(\|.+\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*))/g, (match) => {
      const lines = match.trim().split('\n');
      if (lines.length < 2) return match;
      const headers = lines[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
      const bodyLines = lines.slice(2).map(line => {
        const cells = line.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table class="docs-table"><thead><tr>${headers}</tr></thead><tbody>${bodyLines}</tbody></table>`;
    });
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr class="docs-hr">');
    // Line breaks
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return <div className="docs-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
  };

  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const activeContent = sections.find(s => s.id === activeSection);

  return (
    <div className="docs-viewer">
      <div className="docs-header">
        <h2>API 接口文档</h2>
        <div className="docs-header-actions">
          {version && (
            <span className="docs-version">
              版本: {version.substring(0, 8)}
              {updatedAt && ` (${new Date(updatedAt).toLocaleString()})`}
            </span>
          )}
          <button className="btn btn-test" onClick={handlePoll} disabled={polling}>
            {polling ? '检查中...' : '检查更新'}
          </button>
          <button className="btn btn-test" onClick={() => {
            localStorage.removeItem(CACHE_KEY);
            setSections([]);
            setVersion('');
            fetchDocs(null);
          }} disabled={loading}>
            {loading ? '加载中...' : '重新加载'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {changelog && (
        <div className={`docs-changelog ${changelog.status}`}>
          {changelog.status === 'up-to-date' ? (
            <span>{changelog.message}</span>
          ) : (
            <span>
              已更新: 新增 {changelog.added} 章节, 修改 {changelog.modified} 章节, 删除 {changelog.removed} 章节
            </span>
          )}
          <button className="btn-close" onClick={() => setChangelog(null)}>×</button>
        </div>
      )}

      {loading && sections.length === 0 && (
        <div className="loading">加载文档中...</div>
      )}

      {sections.length > 0 && (
        <div className="docs-layout">
          <nav className="docs-nav">
            {sections.map(s => (
              <button
                key={s.id}
                className={`docs-nav-item${s.id === activeSection ? ' active' : ''}`}
                onClick={() => setActiveSection(s.id)}
                title={s.title}
              >
                {s.title}
              </button>
            ))}
          </nav>
          <div className="docs-body">
            {activeContent ? renderMarkdown(activeContent.content) : (
              <div className="loading">请选择章节</div>
            )}
          </div>
        </div>
      )}

      {!loading && sections.length === 0 && !error && (
        <div style={{ padding: 24, color: '#a0aec0' }}>暂无文档数据</div>
      )}
    </div>
  );
};

export default DocsViewer;
