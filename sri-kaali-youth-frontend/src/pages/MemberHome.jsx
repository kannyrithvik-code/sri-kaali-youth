import { Link } from 'react-router-dom';
import { HeartHandshake, Sparkles, Ticket, Gavel, Award, PlusCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MemberHome = () => {
  const { user } = useAuth();

  const actions = [
    {
      title: 'Add Donation',
      description: 'Record a new donation received from devotees',
      icon: HeartHandshake,
      path: '/donations',
      color: '#0284c7',
      bg: '#e0f2fe',
    },
    {
      title: 'Add Expense',
      description: 'Record festival expenses (Decoration, Aagaman, Day-wise)',
      icon: Sparkles,
      path: '/expenses/decoration',
      color: '#d97706',
      bg: '#fef3c7',
    },
    {
      title: 'Add Lucky Draw',
      description: 'Create a new lucky draw ticket entry',
      icon: Ticket,
      path: '/lucky-draw',
      color: '#7c3aed',
      bg: '#ede9fe',
    },
    {
      title: 'Add Velampata',
      description: 'Record auction / Velampata items and bids',
      icon: Gavel,
      path: '/velampata',
      color: '#059669',
      bg: '#d1fae5',
    },
    {
      title: 'Add Sponsor',
      description: 'Add festival sponsor contribution details',
      icon: Award,
      path: '/sponsors',
      color: '#db2777',
      bg: '#fce7f3',
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '26px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Welcome, {user?.name || 'Member'}</span>
          </h1>
          <div className="breadcrumb" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} className="text-success-600" />
            <span>Authorized Member Data Entry Portal</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {actions.map((act) => {
          const IconComponent = act.icon;

          return (
            <Link
              key={act.title}
              to={act.path}
              className="card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                borderRadius: '16px',
                transition: 'all 0.2s ease-in-out',
                border: '1px solid var(--slate-200)',
                cursor: 'pointer',
              }}
            >
              <div>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    background: act.bg,
                    color: act.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <IconComponent size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '6px' }}>
                  {act.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--slate-500)', lineHeight: 1.5, marginBottom: '20px' }}>
                  {act.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: act.color,
                }}
              >
                <PlusCircle size={16} />
                <span>Perform Action</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
