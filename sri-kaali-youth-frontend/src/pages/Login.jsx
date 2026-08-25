import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SunMedium, Lock, User, AlertCircle, Clock, XCircle, ShieldAlert } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login, setPendingLoginData } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'Pending', 'Rejected', 'Disabled', 'Invalid'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      setErrorStatus('Invalid');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password: password,
      });

      const { requiresAdminApproval, requiresApproval, token, user, loginRequestId, requestId, requestToken } = response.data || {};
      const reqId = loginRequestId || requestId;

      if (requiresAdminApproval || requiresApproval || response.data?.status === 'Pending') {
        setPendingLoginData({
          loginRequestId: reqId,
          requestToken,
        });
        navigate('/login-approval');
      } else {
        login(token, user);
        if (user?.role === 'Admin') {
          navigate('/dashboard');
        } else {
          navigate('/member');
        }
      }
    } catch (err) {
      console.error('Login error:', err.response?.status, err.response?.data);
      const data = err.response?.data;
      const message = data?.message || 'Invalid username or password.';
      const status = data?.status;

      setError(message);
      if (data?.requiresAdminApproval || data?.requiresApproval || status === 'Pending' || status === 'PendingApproval' || message.includes('awaiting administrator approval')) {
        setErrorStatus('Pending');
        const reqId = data?.loginRequestId || data?.requestId;
        if (reqId) {
          setPendingLoginData({
            loginRequestId: reqId,
            requestToken: data?.requestToken,
          });
        }
      } else if (status === 'Rejected' || message.includes('rejected')) {
        setErrorStatus('Rejected');
      } else if (status === 'Disabled' || message.includes('disabled')) {
        setErrorStatus('Disabled');
      } else {
        setErrorStatus('Invalid');
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorIcon = () => {
    if (errorStatus === 'Pending') return <Clock size={18} style={{ color: '#d97706', flexShrink: 0 }} />;
    if (errorStatus === 'Rejected') return <XCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />;
    if (errorStatus === 'Disabled') return <ShieldAlert size={18} style={{ color: '#dc2626', flexShrink: 0 }} />;
    return <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />;
  };

  const getErrorBg = () => {
    if (errorStatus === 'Pending') return { background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' };
    return { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' };
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #190a38 0%, #4c1d95 50%, #6d28d9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          padding: '36px 30px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f59e0b, #6d28d9)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
              marginBottom: '16px',
            }}
          >
            <SunMedium size={36} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)' }}>
            SRI KAALI YOUTH
          </h2>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-amber)',
              letterSpacing: '2.5px',
              marginTop: '2px',
            }}
          >
            SHALAWADA
          </p>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '8px' }}>
            Festival Financial Management System
          </p>
        </div>

        {error && (
          <div
            style={{
              ...getErrorBg(),
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              lineHeight: 1.4,
            }}
          >
            {getErrorIcon()}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--slate-400)',
                }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--slate-400)',
                }}
              />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '13px',
            color: 'var(--slate-600)',
          }}
        >
          New member?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--primary-600)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};
