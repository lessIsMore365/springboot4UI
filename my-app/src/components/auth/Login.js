import React, { useState, useEffect } from 'react';
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

  // Captcha state
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const result = await authService.getCaptcha();
      if (result.success) {
        setCaptchaKey(result.data.captchaKey);
        setCaptchaImage(result.data.captchaImage);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
      setCaptchaCode('');
    } finally {
      setLoading(false);
    }
  };

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

          {/* Captcha */}
          <div className="captcha-group">
            <div className="captcha-row">
              {captchaLoading ? (
                <div className="captcha-placeholder">加载验证码...</div>
              ) : captchaImage ? (
                <img
                  src={captchaImage}
                  alt="验证码"
                  className="captcha-image"
                  onClick={fetchCaptcha}
                  title="点击刷新验证码"
                />
              ) : (
                <div className="captcha-placeholder">验证码加载失败</div>
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
            <div className="input-group no-icon">
              <input
                type="text"
                placeholder="请输入验证码"
                value={captchaCode}
                onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                maxLength={4}
                className="captcha-input"
              />
            </div>
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
            disabled={loading}
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
