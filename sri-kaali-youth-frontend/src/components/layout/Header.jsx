import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFestival } from '../../context/FestivalContext';
import { getRoleBadgeClass } from '../../utils/formatters';
import api from '../../api/axios';

export const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { festivals, selectedFestivalId, setSelectedFestivalId } = useFestival();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingCount = async () => {
      try {
        const res = await api.get('/auth/login-requests/pending');
        if (Array.isArray(res.data)) {
          setPendingCount(res.data.length);
        } else if (res.data && typeof res.data.count === 'number') {
          setPendingCount(res.data.count);
        }
      } catch (err) {
        // Silently ignore if unauthorized or error
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);

    const handleUpdateEvent = () => {
      fetchPendingCount();
    };
    window.addEventListener('pending-logins-updated', handleUpdateEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pending-logins-updated', handleUpdateEvent);
    };
  }, [isAdmin]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          title="Toggle Navigation Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="festival-selector-wrapper">
          <Calendar size={16} className="text-primary-600" />
          <div className="festival-selector-label">Festival:</div>
          <select
            className="festival-select"
            value={selectedFestivalId || ''}
            onChange={(e) => setSelectedFestivalId(e.target.value)}
          >
            {festivals.length === 0 ? (
              <option value="">No Festivals Found</option>
            ) : (
              festivals.map((f) => (
                <option key={f.festivalId} value={f.festivalId}>
                  {f.festivalName} ({f.year})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="header-right">
        {isAdmin && (
          <div
            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Pending Member Login Requests"
            onClick={() => navigate('/admin/login-requests')}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '20px',
                background: pendingCount > 0 ? '#fef3c7' : '#f1f5f9',
                color: pendingCount > 0 ? '#d97706' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                border: pendingCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
              }}
            >
              <UserCheck size={16} />
              <span>Pending Logins: {pendingCount}</span>
            </div>
          </div>
        )}

        <div className="user-profile-badge">
          <div className="user-avatar">{userInitial}</div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className={`user-role-badge ${getRoleBadgeClass(user?.role)}`}>
              {user?.role || 'Member'}
            </span>
          </div>
        </div>

        <button className="btn-logout" onClick={logout} title="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
