import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import './Auth.css';

/**
 * 注册组件 (专业网站风格)
 */
const Register = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    age: '',
    roles: 'ROLE_USER',
    remark: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const userData = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : undefined
    };

    try {
      const result = await authService.register(userData);

      if (result.success) {
        setMessage(`注册成功！用户ID: ${result.userId}`);
        setFormData({
          username: '',
          password: '',
          email: '',
          age: '',
          roles: 'ROLE_USER',
          remark: ''
        });

        if (onRegisterSuccess) {
          onRegisterSuccess(result);
        }

        // 注册成功后延迟跳转到登录页
        setTimeout(() => {
          navigate('/auth/login');
        }, 1500);
      } else {
        setError(result.message || '注册失败');
      }
    } catch (err) {
      setError(err.message || '注册请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-logo">
            📝
          </div>
          <h2>创建账户</h2>
          <p className="auth-subtitle">注册新用户以访问系统</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {message && (
            <div className="auth-success">
              <span>✅</span> {message}
            </div>
          )}

          <div className="form-grid">
            <div className="input-group form-group-full">
              <span className="input-icon">👤</span>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="用户名"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="密码"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="邮箱"
                disabled={loading}
              />
            </div>

            <div className="input-group no-icon">
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="年龄"
                min="1"
                max="150"
                disabled={loading}
              />
            </div>

            <div className="input-group no-icon">
              <select
                id="roles"
                name="roles"
                value={formData.roles}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="ROLE_USER">普通用户</option>
                <option value="ROLE_ADMIN">管理员</option>
                <option value="ROLE_USER,ROLE_ADMIN">普通用户+管理员</option>
              </select>
            </div>

            <div className="form-group-full">
              <div className="input-group no-icon">
                <textarea
                  id="remark"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  placeholder="备注信息"
                  rows="3"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                注册中...
              </span>
            ) : (
              '注 册'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            已有账户? <Link to="/auth/login">返回登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
