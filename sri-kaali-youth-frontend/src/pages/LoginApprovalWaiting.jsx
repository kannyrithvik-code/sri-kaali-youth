import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const LoginApprovalWaiting = () => {
  const navigate = useNavigate();
  const { pendingLogin, clearPendingLoginData, login } = useAuth();
  const [status, setStatus] = useState('Pending'); // Pending, Approved, Rejected, Expired
  const [message, setMessage] = useState('Waiting for Admin approval...');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!pendingLogin || !pendingLogin.loginRequestId) {
      navigate('/login', { replace: true });
      return;
    }

    const checkStatus = async () => {
      try {
        setChecking(true);
        const reqId = pendingLogin.loginRequestId;
        let res;
        try {
          res = await api.get(`/auth/login-requests/${reqId}/status`, {
            params: pendingLogin.requestToken ? { requestToken: pendingLogin.requestToken } : {},
          });
        } catch (err1) {
          if (err1.response?.status === 404) {
            res = await api.get(`/auth/login-request/${reqId}/status`, {
              params: pendingLogin.requestToken ? { requestToken: pendingLogin.requestToken } : {},
            });
          } else {
            throw err1;
          }
        }

        const data = res.data;

        if (data.status === 'Approved') {
          setStatus('Approved');
          setMessage('Login approved! Redirecting...');
          if (data.token && data.user) {
            login(data.token, data.user);
            navigate('/dashboard', { replace: true });
          }
        } else if (data.status === 'Rejected') {
          setStatus('Rejected');
          setMessage(data.message || 'Your login request was rejected by the administrator.');
        } else if (data.status === 'Expired') {
          setStatus('Expired');
          setMessage(data.message || 'Your login request has expired. Please sign in again.');
        } else {
          setStatus('Pending');
          setMessage(data.message || 'Your account is awaiting administrator approval.');
        }
      } catch (err) {
        console.error('Check status error:', err.response?.status, err.response?.data);
      } finally {
        setChecking(false);
      }
    };

    // Run initial check immediately
    checkStatus();

    // Set interval for periodic polling (every 4 seconds)
    const interval = setInterval(() => {
      checkStatus();
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [pendingLogin, navigate, login]);

  const handleBackToLogin = () => {
    clearPendingLoginData();
    navigate('/login', { replace: true });
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
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          padding: '36px 30px',
          textAlign: 'center',
        }}
      >
        {status === 'Pending' && (
          <div>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#d97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
              }}
            >
              <Clock size={40} className="animate-spin-slow" />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Login Request Sent
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginBottom: '16px', lineHeight: 1.5 }}>
              Your login request has been sent to the Admin.
              <br />
              Please wait for Admin approval.
            </p>

            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '13px',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '24px',
                fontWeight: 600,
              }}
            >
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Status: Waiting for approval...</span>
            </div>

            <button
              onClick={handleBackToLogin}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Cancel & Back to Login</span>
            </button>
          </div>
        )}

        {status === 'Approved' && (
          <div>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <CheckCircle2 size={42} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Login Approved!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-600)' }}>
              Redirecting you to Member portal...
            </p>
          </div>
        )}

        {status === 'Rejected' && (
          <div>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <XCircle size={42} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Login Request Rejected
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginBottom: '24px', lineHeight: 1.5 }}>
              Your login request was not approved by the Admin.
              <br />
              Please contact the Admin or try again.
            </p>
            <button
              onClick={handleBackToLogin}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        )}

        {status === 'Expired' && (
          <div>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#ffedd5',
                color: '#ea580c',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <ShieldAlert size={42} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Login Request Expired
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginBottom: '24px', lineHeight: 1.5 }}>
              Your login approval request has expired.
              <br />
              Please login again.
            </p>
            <button
              onClick={handleBackToLogin}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
