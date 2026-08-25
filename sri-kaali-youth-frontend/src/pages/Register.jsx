import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SunMedium, User, Lock, Phone, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    // 1. Full Name
    if (!fullName.trim()) {
      return 'Full Name is required.';
    }

    // 2. Username
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return 'Username is required.';
    }
    if (cleanUsername.length < 3) {
      return 'Username must be at least 3 characters long.';
    }
    if (/\s/.test(cleanUsername)) {
      return 'Username must not contain blank spaces.';
    }

    // 3. Phone Number (Indian mobile 10 digits starting with 6, 7, 8, 9)
    const phoneClean = phoneNumber.trim();
    if (!phoneClean) {
      return 'Phone Number is required.';
    }
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneRegex.test(phoneClean)) {
      return 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    // 4. Password (Min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    if (!password) {
      return 'Password is required.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter (A-Z).';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter (a-z).';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number (0-9).';
    }

    // 5. Confirm Password
    if (!confirmPassword) {
      return 'Please confirm your password.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/register', {
        name: fullName.trim(),
        username: username.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      const message =
        err.response?.data?.message || 'Something went wrong during registration. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
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
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '6px' }}>
            Member Account Registration
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Registration Submitted!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginBottom: '24px', lineHeight: 1.5 }}>
              Registration submitted successfully. Your account is waiting for administrator approval.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
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
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
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
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Username *</label>
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
                    placeholder="Choose username (no spaces)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone
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
                    type="tel"
                    maxLength={10}
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
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
                    placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Confirm Password *</label>
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
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '12px' }}
                disabled={loading}
              >
                {loading ? 'Submitting Registration...' : 'Create Account'}
              </button>

              <Link
                to="/login"
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', textDecoration: 'none' }}
              >
                Back to Login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
