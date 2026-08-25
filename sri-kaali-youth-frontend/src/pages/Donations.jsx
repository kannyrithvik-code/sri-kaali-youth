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
import { formatCurrency, formatDate, formatDateForInput } from '../utils/formatters';
import { HeartHandshake, CheckCircle } from 'lucide-react';

export const Donations = () => {
  const { isAdmin } = useAuth();
  const { selectedFestivalId } = useFestival();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(isAdmin);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Dialog state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [donorName, setDonorName] = useState('');
  const [villageArea, setVillageArea] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [receiverName, setReceiverName] = useState('');
  const [donationDate, setDonationDate] = useState(formatDateForInput(new Date()));
  const [formError, setFormError] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchDonations = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await api.get('/donations');
      setDonations(res.data || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
      addToast(err.response?.data?.message || 'Failed to load donations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Client-side filtering (Search donor/village/receiver & Date range)
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchDonor = d.donorName.toLowerCase().includes(q);
        const matchVillage = (d.villageArea || '').toLowerCase().includes(q);
        const matchReceiver = d.receiverName.toLowerCase().includes(q);
        if (!matchDonor && !matchVillage && !matchReceiver) return false;
      }
      if (fromDate) {
        const itemDate = new Date(d.donationDate).setHours(0, 0, 0, 0);
        const from = new Date(fromDate).setHours(0, 0, 0, 0);
        if (itemDate < from) return false;
      }
      if (toDate) {
        const itemDate = new Date(d.donationDate).setHours(0, 0, 0, 0);
        const to = new Date(toDate).setHours(0, 0, 0, 0);
        if (itemDate > to) return false;
      }
      return true;
    });
  }, [donations, searchQuery, fromDate, toDate]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDonations.slice(start, start + pageSize);
  }, [filteredDonations, currentPage, pageSize]);

  // Total calculated for current filtered dataset
  const totalAmount = useMemo(() => {
    return filteredDonations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredDonations]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setSelectedDonation(null);
    setDonorName('');
    setVillageArea('');
    setAmount('');
    setPaymentMode('Cash');
    setReceiverName('');
    setDonationDate(formatDateForInput(new Date()));
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setSelectedDonation(d);
    setDonorName(d.donorName);
    setVillageArea(d.villageArea || '');
    setAmount(d.amount.toString());
    setPaymentMode(d.paymentMode || 'Cash');
    setReceiverName(d.receiverName);
    setDonationDate(formatDateForInput(d.donationDate));
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (d) => {
    setSelectedDonation(d);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (d) => {
    setSelectedDonation(d);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!donorName.trim()) {
      setFormError('Donor name is required.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }
    if (!receiverName.trim()) {
      setFormError('Receiver name is required.');
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
        donorName: donorName.trim(),
        villageArea: villageArea.trim() || null,
        amount: numAmount,
        paymentMode: paymentMode,
        receiverName: receiverName.trim(),
        donationDate: new Date(donationDate).toISOString(),
      };

      if (selectedDonation) {
        // PUT Update
        await api.put(`/donations/${selectedDonation.donationId}`, payload);
        addToast('Donation updated successfully.');
      } else {
        // POST Create
        await api.post('/donations', payload);
        addToast('Donation created successfully.');
      }

      setSuccessMsg('Donation saved successfully!');
      if (isAdmin) {
        setIsFormModalOpen(false);
        fetchDonations();
      } else {
        // Clear form fields for Member
        setDonorName('');
        setVillageArea('');
        setAmount('');
        setPaymentMode('Cash');
        setReceiverName('');
        setDonationDate(formatDateForInput(new Date()));
      }
    } catch (err) {
      console.error('Save donation error:', err);
      setFormError(err.response?.data?.message || 'Failed to save donation.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDonation) return;
    try {
      setDeleting(true);
      await api.delete(`/donations/${selectedDonation.donationId}`);
      addToast('Donation deleted successfully.');
      setIsConfirmOpen(false);
      fetchDonations();
    } catch (err) {
      console.error('Delete donation error:', err);
      addToast(err.response?.data?.message || 'Failed to delete donation.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Export PDF & Excel
  const handleExportPDF = () => {
    const headers = ['#', 'Donor Name', 'Village / Area', 'Amount (₹)', 'Payment Mode', 'Receiver Name', 'Date'];
    const data = filteredDonations.map((d, i) => [
      i + 1,
      d.donorName,
      d.villageArea || '-',
      formatCurrency(d.amount),
      d.paymentMode,
      d.receiverName,
      formatDate(d.donationDate),
    ]);

    exportToPDF({
      title: 'Festival Donations Report',
      subtitle: `Total Collected: ${formatCurrency(totalAmount)}`,
      headers,
      data,
      fileName: 'donations_report.pdf',
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Donor Name', 'Village / Area', 'Amount', 'Payment Mode', 'Receiver Name', 'Date'];
    const data = filteredDonations.map((d) => [
      d.donationId,
      d.donorName,
      d.villageArea || '-',
      d.amount,
      d.paymentMode,
      d.receiverName,
      formatDate(d.donationDate),
    ]);

    exportToExcel({
      title: 'Donations',
      headers,
      data,
      fileName: 'donations.xlsx',
    });
  };

  const columns = [
    { key: 'donorName', label: 'Donor Name', sortable: true },
    { key: 'villageArea', label: 'Village / Area', sortable: true },
    { key: 'amount', label: 'Amount', type: 'currency', sortable: true },
    { key: 'paymentMode', label: 'Payment Mode', type: 'paymentMode', sortable: true },
    { key: 'receiverName', label: 'Receiver Name', sortable: true },
    { key: 'donationDate', label: 'Date', type: 'date', sortable: true },
  ];

  if (!isAdmin) {
    // MEMBER VIEW: Data Entry Form Only
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HeartHandshake className="text-primary-600" size={24} />
              <span>Add Donation</span>
            </h1>
            <div className="breadcrumb">Enter devotee donation record</div>
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
              <label className="form-label">Donor Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Village / Area</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Shalawada Main Road"
                value={villageArea}
                onChange={(e) => setVillageArea(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select
                  className="form-control"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Receiver Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Suresh Babu"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Donation Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}
              disabled={saving}
            >
              {saving ? 'Submitting Donation...' : 'Submit Donation Record'}
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
          <h1 className="page-title">Donations</h1>
          <div className="breadcrumb">
            Total Collected Donations: <strong>{formatCurrency(totalAmount)}</strong>
          </div>
        </div>
      </div>

      <ActionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search donor name or village..."
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        showDateFilter={true}
        onRefresh={fetchDonations}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={printReport}
        onAdd={handleOpenAdd}
        addBtnLabel="Add Donation"
        refreshing={loading}
      />

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyMessage="No donations found."
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredDonations.length}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Donation Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedDonation ? 'Edit Donation' : 'Add New Donation'}
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
              {saving ? 'Saving...' : selectedDonation ? 'Update Donation' : 'Save Donation'}
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
            <label className="form-label">Donor Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ramesh Kumar"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Village / Area</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Shalawada Main Road"
              value={villageArea}
              onChange={(e) => setVillageArea(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                className="form-control"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Receiver Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Suresh Babu"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Donation Date *</label>
              <input
                type="date"
                className="form-control"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Donation Details"
        footer={
          <button className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedDonation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Donor Name:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {selectedDonation.donorName}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Village / Area:</strong>
              <div>{selectedDonation.villageArea || '-'}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Amount:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                {formatCurrency(selectedDonation.amount)}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Payment Mode:</strong>
              <div>
                <span className={`badge badge-${selectedDonation.paymentMode.toLowerCase()}`}>
                  {selectedDonation.paymentMode}
                </span>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Receiver Name:</strong>
              <div>{selectedDonation.receiverName}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Date:</strong>
              <div>{formatDate(selectedDonation.donationDate)}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Donation"
        message={`Are you sure you want to delete donation from "${selectedDonation?.donorName}" for ${formatCurrency(selectedDonation?.amount)}?`}
        loading={deleting}
      />
    </div>
  );
};
