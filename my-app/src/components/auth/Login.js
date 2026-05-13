import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import './Auth.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Click-based Chinese character captcha state
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

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleCaptchaClick = useCallback((e) => {
    if (loading || clickPositions.length >= charCount) return;
    const img = captchaImgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
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
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
        navigate('/');
      } else {
        setError(result.message || '登录失败，请检查用户名和密码');
      }
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const clicksRemaining = charCount - clickPositions.length;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            🛡️
          </div>
          <h2>欢迎回来</h2>
          <p className="auth-subtitle">请登录您的账户以继续</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="input-group">
            <span className="input-icon">👤</span>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Click-based Chinese character captcha */}
          <div className="captcha-group">
            {captchaLoading ? (
              <div className="captcha-placeholder">加载验证码...</div>
            ) : captchaImage ? (
              <div className="captcha-click-area">
                {promptText && (
                  <div className="captcha-prompt">{promptText}</div>
                )}
                <div className="captcha-image-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    ref={captchaImgRef}
                    src={captchaImage}
                    alt="验证码"
                    className="captcha-image captcha-clickable"
                    onClick={handleCaptchaClick}
                    title={clicksRemaining > 0 ? `请点击 ${clicksRemaining} 个汉字` : '已选择全部汉字'}
                    style={{ cursor: clicksRemaining > 0 && !loading ? 'crosshair' : 'default', width: 350, height: 180 }}
                  />
                  {clickPositions.map((pos, idx) => (
                    <span
                      key={idx}
                      className="captcha-click-marker"
                      style={{
                        left: `${(pos.x / 350) * 100}%`,
                        top: `${(pos.y / 180) * 100}%`,
                      }}
                    >
                      {idx + 1}
                    </span>
                  ))}
                </div>
                <div className="captcha-actions">
                  <span className="captcha-click-hint">
                    {clicksRemaining > 0
                      ? `请在图片中依次点击 ${clicksRemaining} 个汉字`
                      : '已选择全部字符'}
                  </span>
                  {clickPositions.length > 0 && (
                    <button type="button" className="captcha-clear-btn" onClick={clearClicks}>
                      重选
                    </button>
                  )}
                  <button
                    type="button"
                    className="captcha-refresh"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading}
                    title="刷新验证码"
                  >
                    🔄
                  </button>
                </div>
              </div>
            ) : (
              <div className="captcha-placeholder">验证码加载失败</div>
            )}
          </div>

          <div className="auth-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>记住我</span>
            </label>
            <a href="/forgot-password" className="forgot-password" onClick={(e) => e.preventDefault()}>
              忘记密码?
            </a>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading || clickPositions.length !== charCount}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                登录中...
              </span>
            ) : (
              '登 录'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            还没有账户? <Link to="/auth/register">立即注册</Link>
          </p>
        </div>

        <div className="auth-credentials-hint">
          <p>演示账户:</p>
          <p><code>admin</code> / <code>password</code> (管理员)</p>
          <p><code>user</code> / <code>password</code> (普通用户)</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
