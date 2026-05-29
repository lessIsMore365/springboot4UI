import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentService } from '../../services';
import './Payment.css';

const INITIAL_FORM = { subject: '', body: '', amount: '', paymentMethod: 'ALIPAY' };

const processStatusLabel = (s) => {
  const map = {
    PROCESSED: '已处理', SIGN_INVALID: '验签失败', ORDER_NOT_FOUND: '订单不存在',
    DUPLICATE: '重复通知', RECEIVED: '已接收', FAILED: '处理异常'
  };
  return map[s] || s;
};

const processStatusClass = (s) => {
  const map = {
    PROCESSED: 'success', SIGN_INVALID: 'error', ORDER_NOT_FOUND: 'warning',
    DUPLICATE: 'info', RECEIVED: 'muted', FAILED: 'error'
  };
  return map[s] || '';
};

const PaymentManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'notify' ? 'notify' : 'orders';
  const [activeTab, setActiveTab] = useState(initialTab);

  // ---- Orders tab state ----
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [payResult, setPayResult] = useState(null);

  const [queryOrderNo, setQueryOrderNo] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const [closeOrderNo, setCloseOrderNo] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeResult, setCloseResult] = useState(null);

  const [refundForm, setRefundForm] = useState({ orderNo: '', amount: '', reason: '' });
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState(null);

  // ---- Notify logs tab state ----
  const [notifyLogs, setNotifyLogs] = useState([]);
  const [notifyPagination, setNotifyPagination] = useState({ page: 1, size: 10, total: 0, pages: 0 });
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [notifyFilterMethod, setNotifyFilterMethod] = useState('');
  const [notifyFilterOrderNo, setNotifyFilterOrderNo] = useState('');
  const [notifyDetail, setNotifyDetail] = useState(null);
  const [notifyDetailLoading, setNotifyDetailLoading] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupResult, setCleanupResult] = useState(null);

  // ======================== Orders functions ========================

  const loadOrders = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await paymentService.getOrders(page, pagination.size);
      if (result.success) {
        setOrders(result.data || []);
        setPagination(result.pagination || { page, size: pagination.size, total: 0, pages: 0 });
      } else {
        setError(result.message || '获取订单列表失败');
      }
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) loadOrders(newPage);
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM);
    setFormError('');
    setFormSuccess('');
    setPayResult(null);
    setShowCreateModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    setPayResult(null);
    try {
      const result = await paymentService.createPayment({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      if (result.success) {
        setFormSuccess('支付订单创建成功！');
        setPayResult(result.data);
        loadOrders(1);
      } else {
        setFormError(result.message || '创建失败');
      }
    } catch (err) {
      setFormError(err.message || '请求失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleQueryOrder = async () => {
    if (!queryOrderNo.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const result = await paymentService.getOrder(queryOrderNo.trim());
      setQueryResult(result);
    } catch (err) {
      setQueryResult({ success: false, message: err.message });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCloseOrder = async () => {
    if (!closeOrderNo.trim()) return;
    setCloseLoading(true);
    setCloseResult(null);
    try {
      const result = await paymentService.closeOrder(closeOrderNo.trim());
      setCloseResult(result);
      if (result.success) loadOrders(1);
    } catch (err) {
      setCloseResult({ success: false, message: err.message });
    } finally {
      setCloseLoading(false);
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refundForm.orderNo.trim()) return;
    setRefundLoading(true);
    setRefundResult(null);
    try {
      const result = await paymentService.refund({
        ...refundForm,
        amount: parseFloat(refundForm.amount) || undefined
      });
      setRefundResult(result);
      if (result.success) {
        setRefundForm({ orderNo: '', amount: '', reason: '' });
        loadOrders(1);
      }
    } catch (err) {
      setRefundResult({ success: false, message: err.message });
    } finally {
      setRefundLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const result = await paymentService.healthCheck();
      alert(`支付服务: ${result.status || 'UP'}\n支持方式: ${(result.supportedMethods || []).join(', ')}`);
    } catch (err) {
      alert(`健康检查失败: ${err.message}`);
    }
  };

  // ======================== Notify logs functions ========================

  const loadNotifyLogs = async (page = 1) => {
    setNotifyLoading(true);
    setNotifyError('');
    try {
      const result = await paymentService.getNotifyLogs(
        page, notifyPagination.size,
        notifyFilterMethod || undefined,
        notifyFilterOrderNo || undefined
      );
      if (result.success) {
        setNotifyLogs(result.data || []);
        setNotifyPagination(result.pagination || { page, size: notifyPagination.size, total: 0, pages: 0 });
      } else {
        setNotifyError(result.message || '获取回调日志失败');
      }
    } catch (err) {
      setNotifyError(err.message || '请求失败');
    } finally {
      setNotifyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notify') loadNotifyLogs();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNotifyPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= notifyPagination.pages) loadNotifyLogs(newPage);
  };

  const handleNotifyFilter = () => {
    loadNotifyLogs(1);
  };

  const handleViewNotifyDetail = async (id) => {
    setNotifyDetailLoading(true);
    setNotifyDetail(null);
    try {
      const result = await paymentService.getNotifyLog(id);
      setNotifyDetail(result);
    } catch (err) {
      setNotifyDetail({ success: false, message: err.message });
    } finally {
      setNotifyDetailLoading(false);
    }
  };

  const handleCleanupLogs = async () => {
    try {
      const result = await paymentService.deleteNotifyLogs(cleanupDays);
      setCleanupResult(result);
      if (result.success) loadNotifyLogs(1);
    } catch (err) {
      setCleanupResult({ success: false, message: err.message });
    }
  };

  // ======================== Shared helpers ========================

  const statusLabel = (s) => {
    const map = { PENDING: '待支付', SUCCESS: '已支付', CLOSED: '已关闭', REFUND: '已退款' };
    return map[s] || s;
  };

  const statusClass = (s) => {
    const map = { PENDING: 'warning', SUCCESS: 'success', CLOSED: 'muted', REFUND: 'info' };
    return map[s] || '';
  };

  // ======================== Render ========================

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h2>支付管理</h2>
        <div className="payment-actions">
          <button className="btn btn-create" onClick={openCreateModal}>创建支付订单</button>
          <button className="btn btn-health" onClick={handleHealthCheck}>健康检查</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="payment-tabs">
        <button className={'payment-tab' + (activeTab === 'orders' ? ' active' : '')} onClick={() => { setActiveTab('orders'); setSearchParams({}); }}>订单管理</button>
        <button className={'payment-tab' + (activeTab === 'notify' ? ' active' : '')} onClick={() => { setActiveTab('notify'); setSearchParams({ tab: 'notify' }); }}>回调日志</button>
      </div>

      {/* ======================== Orders Tab ======================== */}
      {activeTab === 'orders' && (
        <>
          {error && <div className="alert alert-error"><strong>错误:</strong> {error}</div>}

          <div className="admin-toolbar">
            <div className="toolbar-group">
              <span className="toolbar-label">查询订单:</span>
              <input type="text" className="toolbar-input" placeholder="订单号" value={queryOrderNo}
                onChange={(e) => setQueryOrderNo(e.target.value)} />
              <button className="btn btn-test" onClick={handleQueryOrder} disabled={queryLoading}>
                {queryLoading ? '查询中...' : '查询'}
              </button>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">关闭订单:</span>
              <input type="text" className="toolbar-input" placeholder="订单号" value={closeOrderNo}
                onChange={(e) => setCloseOrderNo(e.target.value)} />
              <button className="btn btn-batch" onClick={handleCloseOrder} disabled={closeLoading}>
                {closeLoading ? '关闭中...' : '关闭'}
              </button>
              {closeResult && (
                <span className={`toolbar-result ${closeResult.success ? 'success' : 'error'}`}>
                  {closeResult.message || JSON.stringify(closeResult)}
                </span>
              )}
            </div>
          </div>

          {queryResult && (
            <div className="test-result">
              <div className="test-result-header">
                <span>订单详情</span>
                <button className="btn-close" onClick={() => setQueryResult(null)}>×</button>
              </div>
              <pre>{JSON.stringify(queryResult, null, 2)}</pre>
            </div>
          )}

          <div className="payment-table-container">
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              <>
                <table className="payment-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>订单号</th>
                      <th>支付方式</th>
                      <th>金额</th>
                      <th>商品</th>
                      <th>状态</th>
                      <th>交易号</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map(order => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.orderNo}</td>
                          <td>{order.paymentMethod}</td>
                          <td>¥{order.amount != null ? Number(order.amount).toFixed(2) : '-'}</td>
                          <td>{order.subject || '-'}</td>
                          <td>
                            <span className={`status ${statusClass(order.status)}`}>
                              {statusLabel(order.status)}
                            </span>
                          </td>
                          <td>{order.tradeNo || '-'}</td>
                          <td>{order.createTime ? new Date(order.createTime).toLocaleString() : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" className="no-data">暂无支付订单</td></tr>
                    )}
                  </tbody>
                </table>
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}>上一页</button>
                    <span className="page-info">第 {pagination.page} 页，共 {pagination.pages} 页
                      {pagination.total > 0 && ` (总计 ${pagination.total} 条)`}</span>
                    <button className="page-btn" onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}>下一页</button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="refund-section">
            <h3>申请退款</h3>
            <form onSubmit={handleRefund} className="refund-form">
              <div className="form-row">
                <div className="form-group">
                  <label>订单号 *</label>
                  <input type="text" name="orderNo" value={refundForm.orderNo}
                    onChange={(e) => setRefundForm(p => ({ ...p, orderNo: e.target.value }))}
                    required disabled={refundLoading} />
                </div>
                <div className="form-group">
                  <label>退款金额</label>
                  <input type="number" step="0.01" name="amount" value={refundForm.amount}
                    onChange={(e) => setRefundForm(p => ({ ...p, amount: e.target.value }))}
                    disabled={refundLoading} />
                </div>
                <div className="form-group">
                  <label>退款原因</label>
                  <input type="text" name="reason" value={refundForm.reason}
                    onChange={(e) => setRefundForm(p => ({ ...p, reason: e.target.value }))}
                    disabled={refundLoading} />
                </div>
                <div className="form-group form-group-btn">
                  <button type="submit" className="btn btn-batch" disabled={refundLoading}>
                    {refundLoading ? '处理中...' : '申请退款'}
                  </button>
                </div>
              </div>
            </form>
            {refundResult && (
              <div className={`refund-result ${refundResult.success ? 'success' : 'error'}`}>
                {refundResult.success ? '退款成功' : '退款失败'}: {JSON.stringify(refundResult)}
              </div>
            )}
          </div>

        </>
      )}

      {/* ======================== Notify Logs Tab ======================== */}
      {activeTab === 'notify' && (
        <>
          {notifyError && <div className="alert alert-error"><strong>错误:</strong> {notifyError}</div>}

          {/* Filter Toolbar */}
          <div className="notify-toolbar">
            <div className="toolbar-group">
              <span className="toolbar-label">支付方式:</span>
              <select className="toolbar-select" value={notifyFilterMethod}
                onChange={(e) => setNotifyFilterMethod(e.target.value)}>
                <option value="">全部</option>
                <option value="ALIPAY">支付宝</option>
                <option value="WECHAT">微信支付</option>
              </select>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">订单号:</span>
              <input type="text" className="toolbar-input" placeholder="输入订单号" value={notifyFilterOrderNo}
                onChange={(e) => setNotifyFilterOrderNo(e.target.value)} />
            </div>
            <button className="btn btn-test" onClick={handleNotifyFilter}>查询</button>
            <div className="toolbar-spacer"></div>
            <div className="toolbar-group">
              <span className="toolbar-label">清理旧日志 (天):</span>
              <input type="number" className="toolbar-input toolbar-input-sm" value={cleanupDays}
                onChange={(e) => setCleanupDays(Number(e.target.value))} min="1" />
              <button className="btn btn-batch" onClick={handleCleanupLogs}>清理</button>
            </div>
          </div>

          {cleanupResult && (
            <div className={`notify-cleanup-result ${cleanupResult.success ? 'success' : 'error'}`}>
              {cleanupResult.message || JSON.stringify(cleanupResult)}
              <button className="btn-close-sm" onClick={() => setCleanupResult(null)}>×</button>
            </div>
          )}

          {/* Notify Logs Table */}
          <div className="payment-table-container">
            {notifyLoading ? (
              <div className="loading">加载中...</div>
            ) : (
              <>
                <table className="payment-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>支付方式</th>
                      <th>订单号</th>
                      <th>验签</th>
                      <th>处理状态</th>
                      <th>错误信息</th>
                      <th>IP 地址</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifyLogs.length > 0 ? (
                      notifyLogs.map(log => (
                        <tr key={log.id}>
                          <td>{log.id}</td>
                          <td>{log.paymentMethod}</td>
                          <td>{log.orderNo || '-'}</td>
                          <td>
                            <span className={`status ${log.signatureValid ? 'success' : 'error'}`}>
                              {log.signatureValid ? '通过' : '失败'}
                            </span>
                          </td>
                          <td>
                            <span className={`status ${processStatusClass(log.processStatus)}`}>
                              {processStatusLabel(log.processStatus)}
                            </span>
                          </td>
                          <td className="cell-ellipsis" title={log.errorMsg}>{log.errorMsg || '-'}</td>
                          <td>{log.ipAddress || '-'}</td>
                          <td>{log.createTime ? new Date(log.createTime).toLocaleString() : '-'}</td>
                          <td>
                            <button className="btn btn-test btn-sm"
                              onClick={() => handleViewNotifyDetail(log.id)}
                              disabled={notifyDetailLoading}>
                              详情
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" className="no-data">暂无回调日志</td></tr>
                    )}
                  </tbody>
                </table>
                {notifyPagination.pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => handleNotifyPageChange(notifyPagination.page - 1)}
                      disabled={notifyPagination.page <= 1}>上一页</button>
                    <span className="page-info">第 {notifyPagination.page} 页，共 {notifyPagination.pages} 页
                      {notifyPagination.total > 0 && ` (总计 ${notifyPagination.total} 条)`}</span>
                    <button className="page-btn" onClick={() => handleNotifyPageChange(notifyPagination.page + 1)}
                      disabled={notifyPagination.page >= notifyPagination.pages}>下一页</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Notify Detail Modal */}
          {notifyDetail && (
            <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setNotifyDetail(null); }}>
              <div className="modal-content modal-wide">
                <div className="modal-header">
                  <h3>回调日志详情</h3>
                  <button className="btn-close" onClick={() => setNotifyDetail(null)}>×</button>
                </div>
                {notifyDetail.success ? (
                  <div className="notify-detail">
                    <table className="detail-table">
                      <tbody>
                        <tr><td className="detail-label">ID</td><td>{notifyDetail.data?.id || notifyDetail.id}</td></tr>
                        <tr><td className="detail-label">支付方式</td><td>{notifyDetail.data?.paymentMethod}</td></tr>
                        <tr><td className="detail-label">订单号</td><td>{notifyDetail.data?.orderNo || '-'}</td></tr>
                        <tr><td className="detail-label">验签结果</td>
                          <td>
                            <span className={`status ${notifyDetail.data?.signatureValid ? 'success' : 'error'}`}>
                              {notifyDetail.data?.signatureValid ? '通过' : '失败'}
                            </span>
                          </td>
                        </tr>
                        <tr><td className="detail-label">处理状态</td>
                          <td>
                            <span className={`status ${processStatusClass(notifyDetail.data?.processStatus)}`}>
                              {processStatusLabel(notifyDetail.data?.processStatus)}
                            </span>
                          </td>
                        </tr>
                        <tr><td className="detail-label">错误信息</td><td>{notifyDetail.data?.errorMsg || '-'}</td></tr>
                        <tr><td className="detail-label">IP 地址</td><td>{notifyDetail.data?.ipAddress || '-'}</td></tr>
                        <tr><td className="detail-label">创建时间</td><td>{notifyDetail.data?.createTime ? new Date(notifyDetail.data.createTime).toLocaleString() : '-'}</td></tr>
                      </tbody>
                    </table>
                    <div className="notify-body-section">
                      <h4>回调原始数据</h4>
                      <pre className="notify-body-pre">
                        {(() => {
                          try { return JSON.stringify(JSON.parse(notifyDetail.data?.notifyBody), null, 2); }
                          catch { return notifyDetail.data?.notifyBody || '-'; }
                        })()}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-error">{notifyDetail.message || '获取详情失败'}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Payment Modal - works regardless of active tab */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>创建支付订单</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePayment}>
              {formError && <div className="alert alert-error">{formError}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>商品名称 *</label>
                  <input type="text" name="subject" value={formData.subject}
                    onChange={handleFormChange} required disabled={formLoading} />
                </div>
                <div className="form-group">
                  <label>金额 *</label>
                  <input type="number" step="0.01" name="amount" value={formData.amount}
                    onChange={handleFormChange} required disabled={formLoading} />
                </div>
                <div className="form-group">
                  <label>支付方式 *</label>
                  <select name="paymentMethod" value={formData.paymentMethod}
                    onChange={handleFormChange} disabled={formLoading}>
                    <option value="ALIPAY">支付宝</option>
                    <option value="WECHAT">微信支付</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label>商品描述</label>
                  <textarea name="body" value={formData.body}
                    onChange={handleFormChange} rows="2" disabled={formLoading} />
                </div>
              </div>
              {payResult && (
                <div className="pay-result">
                  <div className="pay-result-header">支付订单已生成</div>
                  <div className="pay-result-info">
                    <span>订单号: <strong>{payResult.orderNo}</strong></span>
                    <span>金额: <strong>¥{Number(payResult.amount).toFixed(2)}</strong></span>
                    <span>状态: <strong>{statusLabel(payResult.status)}</strong></span>
                  </div>
                  {payResult.payForm && (
                    <div className="pay-form-html" dangerouslySetInnerHTML={{ __html: payResult.payForm }} />
                  )}
                  {payResult.codeUrl && (
                    <div className="pay-qrcode">
                      <p>微信扫码支付:</p>
                      <code>{payResult.codeUrl}</code>
                    </div>
                  )}
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn btn-create" disabled={formLoading}>
                  {formLoading ? '创建中...' : '创建订单'}
                </button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
