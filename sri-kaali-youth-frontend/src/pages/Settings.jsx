import { useState } from 'react';
import { Settings as SettingsIcon, Server, Shield, Calendar, Plus } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Toast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../utils/formatters';

export const Settings = () => {
  const { festivals, selectedFestival, refreshFestivals } = useFestival();
  const { user, isAdmin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [festivalName, setFestivalName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleCreateFestival = async (e) => {
    e.preventDefault();
    if (!festivalName.trim()) {
      setFormError('Festival name is required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date cannot be before start date.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      await api.post('/festivals', {
        festivalName: festivalName.trim(),
        year: Number(year),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      addToast('New festival created successfully.');
      setIsModalOpen(false);
      refreshFestivals();
    } catch (err) {
      console.error('Error creating festival:', err);
      setFormError(err.response?.data?.message || 'Failed to create festival.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <div className="breadcrumb">System configuration, API status & festival management</div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Active Festival Card */}
        <div className="chart-card">
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="text-primary-600" />
              <span>Active Festival Event</span>
            </div>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                <Plus size={14} /> New Festival
              </button>
            )}
          </div>

          {selectedFestival ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Event Name:</strong>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>
                  {selectedFestival.festivalName}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Year:</strong>
                  <div style={{ fontWeight: 700 }}>{selectedFestival.year}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Start Date:</strong>
                  <div>{formatDate(selectedFestival.startDate)}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>End Date:</strong>
                  <div>{formatDate(selectedFestival.endDate)}</div>
                </div>
              </div>
            </div>
          ) : (
            <p>No festival selected.</p>
          )}

          <div style={{ marginTop: '16px', borderTop: '1px solid var(--slate-200)', paddingTop: '12px' }}>
            <strong style={{ fontSize: '12px', color: 'var(--slate-500)' }}>All Festivals ({festivals.length}):</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '16px', fontSize: '13px' }}>
              {festivals.map((f) => (
                <li key={f.festivalId} style={{ marginBottom: '4px' }}>
                  {f.festivalName} ({f.year}) {f.isActive ? <span className="badge badge-active">Active</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Backend API Status Inspector */}
        <div className="chart-card">
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} className="text-primary-600" />
              <span>Backend API Server</span>
            </div>
            <span className="badge badge-active">Connected</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Base Endpoint:</strong>
              <div style={{ fontFamily: 'monospace', background: 'var(--slate-100)', padding: '6px 10px', borderRadius: '6px', marginTop: '4px' }}>
                https://localhost:7271/api
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Authentication Protocol:</strong>
              <div>JWT Bearer Token</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Database Engine:</strong>
              <div>PostgreSQL (EF Core 8.0)</div>
            </div>
          </div>
        </div>

        {/* User Account Info Card */}
        <div className="chart-card">
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} className="text-primary-600" />
              <span>User Session Info</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Logged In User:</strong>
              <div style={{ fontWeight: 700 }}>{user?.name || 'User'}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Username:</strong>
              <div>@{user?.username}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Role Permission:</strong>
              <div>
                <span className={`user-role-badge ${user?.role === 'Admin' ? 'badge-admin' : 'badge-member'}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Festival Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Festival Event"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateFestival} disabled={saving}>
              {saving ? 'Creating...' : 'Create Festival'}
            </button>
          </>
        }
      >
        {formError && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateFestival}>
          <div className="form-group">
            <label className="form-label">Festival Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Durganavaratri 2026"
              value={festivalName}
              onChange={(e) => setFestivalName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Year *</label>
            <input
              type="number"
              className="form-control"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
