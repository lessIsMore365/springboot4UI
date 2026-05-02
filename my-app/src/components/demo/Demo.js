import React, { useState } from 'react';
import { demoService } from '../../services';
import './Demo.css';

/**
 * 演示组件（公开端点）
 */
const Demo = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [error, setError] = useState('');

  // 执行演示端点测试
  const testEndpoint = async (endpointName) => {
    setLoading(true);
    setError('');

    try {
      let response;

      switch (endpointName) {
        case 'hello':
          response = await demoService.hello();
          break;
        case 'demoHello':
          response = await demoService.demoHello();
          break;
        case 'testDatabase':
          response = await demoService.testDatabase();
          break;
        case 'databaseHealth':
          response = await demoService.databaseHealth();
          break;
        default:
          throw new Error('未知端点');
      }

      setResults(prev => ({
        ...prev,
        [endpointName]: response
      }));
    } catch (err) {
      setError(`测试 ${endpointName} 失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试所有端点
  const testAllEndpoints = async () => {
    setLoading(true);
    setError('');
    const newResults = {};

    try {
      const endpoints = [
        { name: 'hello', service: demoService.hello },
        { name: 'demoHello', service: demoService.demoHello },
        { name: 'testDatabase', service: demoService.testDatabase },
        { name: 'databaseHealth', service: demoService.databaseHealth },
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await endpoint.service();
          newResults[endpoint.name] = response;
        } catch (err) {
          newResults[endpoint.name] = { error: err.message };
        }
      }

      setResults(newResults);
    } catch (err) {
      setError(`批量测试失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 清空结果
  const clearResults = () => {
    setResults({});
    setError('');
  };

  // 格式化结果
  const formatResult = (result) => {
    if (!result) return '无结果';

    if (result.error) {
      return `错误: ${result.error}`;
    }

    if (typeof result === 'string') {
      return result;
    }

    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }

    return String(result);
  };

  // 端点配置
  const endpoints = [
    {
      id: 'hello',
      name: 'Hello端点',
      description: '简单的Hello端点，返回欢迎消息',
      endpoint: '/hello',
      method: 'GET'
    },
    {
      id: 'demoHello',
      name: '虚拟线程演示',
      description: '演示Java 21虚拟线程的端点',
      endpoint: '/demo/hello',
      method: 'GET'
    },
    {
      id: 'testDatabase',
      name: '数据库测试',
      description: '测试PostgreSQL数据库连接和虚拟线程支持',
      endpoint: '/db/test',
      method: 'GET'
    },
    {
      id: 'databaseHealth',
      name: '数据库健康检查',
      description: '检查数据库连接健康状况',
      endpoint: '/db/health',
      method: 'GET'
    }
  ];

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h2>系统演示端点</h2>
        <p className="demo-subtitle">
          这些是公开端点，无需认证即可访问。用于测试系统基本功能和虚拟线程支持。
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>错误:</strong> {error}
        </div>
      )}

      <div className="demo-controls">
        <button
          className="btn btn-primary"
          onClick={testAllEndpoints}
          disabled={loading}
        >
          {loading ? '测试中...' : '测试所有端点'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={clearResults}
          disabled={loading}
        >
          清空结果
        </button>
      </div>

      <div className="endpoints-grid">
        {endpoints.map(endpoint => (
          <div key={endpoint.id} className="endpoint-card">
            <div className="endpoint-header">
              <h3>{endpoint.name}</h3>
              <span className="endpoint-method">{endpoint.method}</span>
            </div>

            <div className="endpoint-info">
              <p><strong>端点:</strong> <code>{endpoint.endpoint}</code></p>
              <p><strong>描述:</strong> {endpoint.description}</p>
            </div>

            <button
              className="btn btn-test"
              onClick={() => testEndpoint(endpoint.id)}
              disabled={loading}
            >
              测试端点
            </button>

            {results[endpoint.id] && (
              <div className="endpoint-result">
                <h4>结果:</h4>
                <pre>{formatResult(results[endpoint.id])}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="demo-info">
        <h4>关于虚拟线程:</h4>
        <ul>
          <li>Spring Boot 4.1.0-M3 支持 Java 21 虚拟线程</li>
          <li>虚拟线程提供了更高效的并发处理能力</li>
          <li>数据库连接池和HTTP请求处理已优化支持虚拟线程</li>
          <li><code>/demo/hello</code> 端点会打印线程信息，确认是否使用虚拟线程</li>
        </ul>

        <h4>关于数据库:</h4>
        <ul>
          <li>数据库: PostgreSQL (localhost:5432)</li>
          <li>连接池: HikariCP with virtual thread support</li>
          <li>测试端点验证数据库连接和虚拟线程集成</li>
        </ul>
      </div>
    </div>
  );
};

export default Demo;