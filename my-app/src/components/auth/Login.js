import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import './Auth.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [promptText, setPromptText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [clickPositions, setClickPositions] = useState([]);
  const captchaImgRef = useRef(null);

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    setClickPositions([]);
    try {
      const result = await authService.getCaptcha();
      if (result.success && result.data) {
        setCaptchaKey(result.data.captchaKey);
        setCaptchaImage(result.data.captchaImage);
        setPromptText(result.data.promptText || '');
        setCharCount(result.data.charCount || 0);
      }
    } catch (err) {
      console.error('获取验证码失败:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => { fetchCaptcha(); }, []);

  const handleCaptchaClick = useCallback((e) => {
    if (loading || clickPositions.length >= charCount) return;
    const img = captchaImgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setClickPositions(prev => [...prev, { x, y }]);
  }, [loading, clickPositions.length, charCount]);

  const clearClicks = () => setClickPositions([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const captchaCode = authService.parseCaptchaText(promptText);
      const result = await authService.login(username, password, captchaKey, captchaCode);
      if (result.success) {
        if (onLoginSuccess) onLoginSuccess(result.user);
        navigate('/');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError(err.message || '登录失败');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const clicksRemaining = charCount - clickPositions.length;

  return (
    <div className="login-page">
      {/* 左侧品牌区 */}
      <div className="login-page-left">
        <Link to="/" className="login-page-home">← 首页</Link>
        <div className="login-page-brand">
          <h1>RBAC</h1>
          <p>身份认证与权限管理系统</p>
        </div>
        <div className="login-page-info">
          <span>Java 21</span>
          <span>Spring Boot 4</span>
          <span>PostgreSQL</span>
          <span>Redis</span>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="login-page-right">
        <div className="login-page-form">
          <h2>欢迎回来</h2>
          <p className="login-page-sub">请登录您的账户</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="login-page-error">{error}</div>}

            <div className="login-page-field">
              <label>用户名</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="login-page-field">
              <label>密码</label>
              <input
                type="password"
                placeholder="········"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="login-page-field">
              <label>安全验证</label>
              {captchaLoading ? (
                <div className="login-page-captcha-placeholder">加载中…</div>
              ) : captchaImage ? (
                <div className="login-page-captcha">
                  {promptText && <span className="login-page-captcha-hint">{promptText}</span>}
                  <div className="login-page-captcha-img">
                    <img
                      ref={captchaImgRef}
                      src={captchaImage}
                      alt="验证码"
                      onClick={handleCaptchaClick}
                      style={{
                        cursor: clicksRemaining > 0 && !loading ? 'pointer' : 'default',
                        width: 260, height: 134, display: 'block', borderRadius: 6,
                      }}
                    />
                    {clickPositions.map((pos, idx) => (
                      <span key={idx} className="login-page-dot"
                        style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}>
                        {idx + 1}
                      </span>
                    ))}
                  </div>
                  <div className="login-page-captcha-bar">
                    <span>{clicksRemaining > 0 ? `依次点击 ${clicksRemaining} 个汉字` : '已就绪'}</span>
                    {clickPositions.length > 0 && <button type="button" onClick={clearClicks}>重选</button>}
                    <button type="button" onClick={fetchCaptcha} disabled={captchaLoading}>刷新</button>
                  </div>
                </div>
              ) : (
                <div className="login-page-captcha-placeholder">
                  加载失败 <button type="button" onClick={fetchCaptcha}>重试</button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="login-page-btn"
              disabled={loading || clickPositions.length !== charCount}
            >
              {loading ? '验证中…' : '登 录'}
            </button>
          </form>

          <div className="login-page-bottom">
            还没有账户？<Link to="/auth/register">立即注册</Link>
          </div>

          <div className="login-page-demo">
            <code>admin</code> / <code>password</code>&emsp;<code>user</code> / <code>password</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
