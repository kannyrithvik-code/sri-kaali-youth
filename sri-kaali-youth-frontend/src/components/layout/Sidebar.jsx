import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Sparkles,
  PartyPopper,
  CalendarDays,
  HeartHandshake,
  Ticket,
  Gavel,
  Flame,
  Award,
  BarChart3,
  Users,
  Settings,
  UserCheck,
  Home,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [dayWiseOpen, setDayWiseOpen] = useState(() => {
    return location.pathname.startsWith('/expenses/day');
  });

  const toggleDayWise = (e) => {
    e.preventDefault();
    setDayWiseOpen((prev) => !prev);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <img
          src="/images/durga-matha.png"
          alt="Durga Matha"
          className="brand-image"
        />
        <div>
          <div className="brand-title">SRI KAALI YOUTH</div>
          <div className="brand-subtitle">SHALAWADA</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <LayoutDashboard className="icon" size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/categories"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <FolderTree className="icon" size={18} />
              <span>Category</span>
            </NavLink>

            <NavLink
              to="/expenses/decoration"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Sparkles className="icon" size={18} />
              <span>Decoration Expenses</span>
            </NavLink>

            <NavLink
              to="/expenses/aagaman"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <PartyPopper className="icon" size={18} />
              <span>Aagaman Day Expenses</span>
            </NavLink>

            {/* Collapsible Day Wise Expenses */}
            <div>
              <button
                className={`nav-item nav-group-title ${
                  location.pathname.startsWith('/expenses/day') ? 'active' : ''
                }`}
                onClick={toggleDayWise}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CalendarDays className="icon" size={18} />
                  <span>Day Wise Expenses</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`nav-group-arrow ${dayWiseOpen ? 'open' : ''}`}
                />
              </button>

              {dayWiseOpen && (
                <div className="sub-nav">
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((day) => (
                    <NavLink
                      key={day}
                      to={`/expenses/day/${day}`}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                      }
                      onClick={onClose}
                    >
                      <span>Day {day} Expenses</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <NavLink
              to="/donations"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <HeartHandshake className="icon" size={18} />
              <span>Donations</span>
            </NavLink>

            <NavLink
              to="/lucky-draw"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Ticket className="icon" size={18} />
              <span>Lucky Draw</span>
            </NavLink>

            <NavLink
              to="/velampata"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Gavel className="icon" size={18} />
              <span>Velampata</span>
            </NavLink>

            <NavLink
              to="/expenses/last-day"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Flame className="icon" size={18} />
              <span>Last Day Expenses</span>
            </NavLink>

            <NavLink
              to="/sponsors"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Award className="icon" size={18} />
              <span>Sponsors</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <BarChart3 className="icon" size={18} />
              <span>Reports</span>
            </NavLink>

            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Users className="icon" size={18} />
              <span>User Management</span>
            </NavLink>

            <NavLink
              to="/admin/login-requests"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <UserCheck className="icon" size={18} />
              <span>Login Requests</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Settings className="icon" size={18} />
              <span>Festival Settings</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/member"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Home className="icon" size={18} />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/donations"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <HeartHandshake className="icon" size={18} />
              <span>Add Donation</span>
            </NavLink>

            <NavLink
              to="/expenses/decoration"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Sparkles className="icon" size={18} />
              <span>Add Expense</span>
            </NavLink>

            <NavLink
              to="/lucky-draw"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Ticket className="icon" size={18} />
              <span>Add Lucky Draw</span>
            </NavLink>

            <NavLink
              to="/velampata"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Gavel className="icon" size={18} />
              <span>Add Velampata</span>
            </NavLink>

            <NavLink
              to="/sponsors"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Award className="icon" size={18} />
              <span>Add Sponsor</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};
