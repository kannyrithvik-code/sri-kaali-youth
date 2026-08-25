import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useFestival } from '../context/FestivalContext';
import { ActionToolbar } from '../components/ui/ActionToolbar';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Toast } from '../components/ui/Toast';
import { exportToPDF, exportToExcel, printReport } from '../utils/exportUtils';
import { Award, CheckCircle } from 'lucide-react';

export const Sponsors = () => {
  const { isAdmin } = useAuth();
  const { selectedFestivalId } = useFestival();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(isAdmin);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Dialog state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [sponsorName, setSponsorName] = useState('');
  const [villageArea, setVillageArea] = useState('');
  const [contribution, setContribution] = useState('');
  const [formError, setFormError] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchSponsors = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await api.get('/sponsors');
      setSponsors(res.data || []);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
      addToast(err.response?.data?.message || 'Failed to load sponsors.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  // Client-side filtering
  const filteredSponsors = useMemo(() => {
    return sponsors.filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.sponsorName.toLowerCase().includes(q) ||
        (s.villageArea || '').toLowerCase().includes(q) ||
        s.contribution.toLowerCase().includes(q)
      );
    });
  }, [sponsors, searchQuery]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSponsors.slice(start, start + pageSize);
  }, [filteredSponsors, currentPage, pageSize]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setSelectedSponsor(null);
    setSponsorName('');
    setVillageArea('');
    setContribution('');
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setSelectedSponsor(s);
    setSponsorName(s.sponsorName);
    setVillageArea(s.villageArea || '');
    setContribution(s.contribution);
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (s) => {
    setSelectedSponsor(s);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (s) => {
    setSelectedSponsor(s);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!sponsorName.trim()) {
      setFormError('Sponsor name is required.');
      return;
    }
    if (!contribution.trim()) {
      setFormError('Contribution is required.');
      return;
    }
    if (!selectedFestivalId) {
      setFormError('Please select an active festival in top header.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const payload = {
        festivalId: Number(selectedFestivalId),
        sponsorName: sponsorName.trim(),
        villageArea: villageArea.trim() || null,
        contribution: contribution.trim(),
      };

      if (selectedSponsor) {
        // PUT Update
        await api.put(`/sponsors/${selectedSponsor.sponsorId}`, payload);
        addToast('Sponsor updated successfully.');
      } else {
        // POST Create
        await api.post('/sponsors', payload);
        addToast('Sponsor created successfully.');
      }

      setSuccessMsg('Sponsor record saved successfully!');
      if (isAdmin) {
        setIsFormModalOpen(false);
        fetchSponsors();
      } else {
        setSponsorName('');
        setVillageArea('');
        setContribution('');
      }
    } catch (err) {
      console.error('Save sponsor error:', err);
      setFormError(err.response?.data?.message || 'Failed to save sponsor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSponsor) return;
    try {
      setDeleting(true);
      await api.delete(`/sponsors/${selectedSponsor.sponsorId}`);
      addToast('Sponsor deleted successfully.');
      setIsConfirmOpen(false);
      fetchSponsors();
    } catch (err) {
      console.error('Delete sponsor error:', err);
      addToast(err.response?.data?.message || 'Failed to delete sponsor.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Export PDF & Excel
  const handleExportPDF = () => {
    const headers = ['#', 'Sponsor Name', 'Village / Area', 'Contribution Details'];
    const data = filteredSponsors.map((s, i) => [
      i + 1,
      s.sponsorName,
      s.villageArea || '-',
      s.contribution,
    ]);

    exportToPDF({
      title: 'Festival Sponsors List',
      subtitle: `Total Sponsors: ${filteredSponsors.length}`,
      headers,
      data,
      fileName: 'sponsors_list.pdf',
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Sponsor Name', 'Village / Area', 'Contribution Details'];
    const data = filteredSponsors.map((s) => [
      s.sponsorId,
      s.sponsorName,
      s.villageArea || '-',
      s.contribution,
    ]);

    exportToExcel({
      title: 'Sponsors',
      headers,
      data,
      fileName: 'sponsors.xlsx',
    });
  };

  const columns = [
    { key: 'sponsorName', label: 'Sponsor Name', sortable: true },
    { key: 'villageArea', label: 'Village / Area', sortable: true },
    { key: 'contribution', label: 'Contribution', sortable: false },
  ];

  if (!isAdmin) {
    // MEMBER VIEW: Data Entry Form Only
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award className="text-pink-600" size={24} />
              <span>Add Sponsor</span>
            </h1>
            <div className="breadcrumb">Enter sponsor contribution record</div>
          </div>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {successMsg && (
            <div
              style={{
                background: '#dcfce7',
                border: '1px solid #86efac',
                color: '#166534',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                fontWeight: 600,
              }}
            >
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {formError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Sponsor Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Venkat Rao & Family"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Village / Area</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Shalawada"
                value={villageArea}
                onChange={(e) => setVillageArea(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contribution Details *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Food / Annadanam sponsorship or ₹25,000"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}
              disabled={saving}
            >
              {saving ? 'Submitting Sponsor Record...' : 'Submit Sponsor Record'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ADMIN VIEW: Full Table & Analytics
  return (
    <div>
      <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Festival Sponsors</h1>
          <div className="breadcrumb">
            Total Sponsors: <strong>{filteredSponsors.length}</strong>
          </div>
        </div>
      </div>

      <ActionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search sponsor name, village..."
        showDateFilter={false}
        onRefresh={fetchSponsors}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={printReport}
        onAdd={handleOpenAdd}
        addBtnLabel="Add Sponsor"
        refreshing={loading}
      />

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyMessage="No sponsors found."
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredSponsors.length}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedSponsor ? 'Edit Sponsor' : 'Add New Sponsor'}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setIsFormModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : selectedSponsor ? 'Update Sponsor' : 'Save Sponsor'}
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

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Sponsor Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Venkat Rao & Family"
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Village / Area</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Shalawada"
              value={villageArea}
              onChange={(e) => setVillageArea(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contribution Details *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Food / Annadanam sponsorship or ₹25,000"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sponsor Details"
        footer={
          <button className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedSponsor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Sponsor Name:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {selectedSponsor.sponsorName}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Village / Area:</strong>
              <div>{selectedSponsor.villageArea || '-'}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Contribution:</strong>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-800)' }}>
                {selectedSponsor.contribution}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Sponsor"
        message={`Are you sure you want to delete sponsor "${selectedSponsor?.sponsorName}"?`}
        loading={deleting}
      />
    </div>
  );
};
