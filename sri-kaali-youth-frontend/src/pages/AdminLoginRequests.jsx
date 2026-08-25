import { useState, useEffect, useCallback } from 'react';
import { UserCheck, Check, X, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { Toast } from '../components/ui/Toast';
import { formatDate } from '../utils/formatters';

export const AdminLoginRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/auth/login-requests/pending');
      setRequests(res.data || []);
      window.dispatchEvent(new CustomEvent('pending-logins-updated'));
    } catch (err) {
      console.error('Error fetching login requests:', err.response?.status, err.response?.data);
      const errMsg = err.response?.data?.message || 'Unable to load member login requests.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [requestId]: 'approving' }));
      const res = await api.post(`/auth/login-requests/${requestId}/approve`);
      addToast(res.data?.message || 'Member login approved successfully.');
      fetchRequests();
    } catch (err) {
      console.error('Approve error:', err.response?.status, err.response?.data);
      addToast(err.response?.data?.message || 'Failed to approve request.', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [requestId]: 'rejecting' }));
      const res = await api.post(`/auth/login-requests/${requestId}/reject`);
      addToast(res.data?.message || 'Login request rejected.');
      fetchRequests();
    } catch (err) {
      console.error('Reject error:', err.response?.status, err.response?.data);
      addToast(err.response?.data?.message || 'Failed to reject request.', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: null }));
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={24} className="text-primary-600" />
            <span>Member Login Requests</span>
          </h1>
          <div className="breadcrumb">
            Manage pending Member login authorization requests
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={fetchRequests}
          disabled={loading}
          title="Refresh List"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Member Name</th>
                <th>Username</th>
                <th>Requested At</th>
                <th>Expires At</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--slate-500)' }}>
                    Loading pending requests...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-600)' }}>
                    <AlertTriangle size={32} style={{ margin: '0 auto 10px auto', color: '#dc2626' }} />
                    <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
                      {error}
                    </div>
                    <button
                      className="btn btn-outline"
                      style={{ marginTop: '8px', fontSize: '13px' }}
                      onClick={fetchRequests}
                    >
                      <RefreshCw size={14} /> Retry
                    </button>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                    <Clock size={32} style={{ margin: '0 auto 10px auto', color: 'var(--slate-400)' }} />
                    <div>No pending login requests right now.</div>
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => {
                  const requestId = req.loginRequestId ?? req.requestId ?? req.id;
                  const isProcessing = Boolean(actionLoading[requestId]);

                  return (
                    <tr key={requestId || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong style={{ color: 'var(--slate-900)' }}>
                          {req.memberName || req.name || 'Member'}
                        </strong>
                      </td>
                      <td>@{req.username}</td>
                      <td>{formatDate(req.requestedAt || req.createdAt)}</td>
                      <td>{formatDate(req.expiresAt)}</td>
                      <td>
                        <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {req.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleApprove(requestId)}
                            disabled={isProcessing}
                          >
                            <Check size={14} />
                            <span>
                              {actionLoading[requestId] === 'approving'
                                ? 'Approving...'
                                : 'Approve'}
                            </span>
                          </button>

                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleReject(requestId)}
                            disabled={isProcessing}
                          >
                            <X size={14} />
                            <span>
                              {actionLoading[requestId] === 'rejecting'
                                ? 'Rejecting...'
                                : 'Reject'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

