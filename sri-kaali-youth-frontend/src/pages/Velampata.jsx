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
import { Gavel, CheckCircle } from 'lucide-react';

export const Velampata = () => {
  const { isAdmin } = useAuth();
  const { selectedFestivalId } = useFestival();
  const [entries, setEntries] = useState([]);
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
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [receiverName, setReceiverName] = useState('');
  const [entryDate, setEntryDate] = useState(formatDateForInput(new Date()));
  const [formError, setFormError] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchEntries = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await api.get('/velampata');
      setEntries(res.data || []);
    } catch (err) {
      console.error('Error fetching Velampata entries:', err);
      addToast(err.response?.data?.message || 'Failed to load Velampata entries.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Client-side filtering
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchItem = e.itemName.toLowerCase().includes(q);
        const matchPerson = e.personName.toLowerCase().includes(q);
        const matchReceiver = e.receiverName.toLowerCase().includes(q);
        if (!matchItem && !matchPerson && !matchReceiver) return false;
      }
      if (fromDate) {
        const itemDate = new Date(e.entryDate).setHours(0, 0, 0, 0);
        const from = new Date(fromDate).setHours(0, 0, 0, 0);
        if (itemDate < from) return false;
      }
      if (toDate) {
        const itemDate = new Date(e.entryDate).setHours(0, 0, 0, 0);
        const to = new Date(toDate).setHours(0, 0, 0, 0);
        if (itemDate > to) return false;
      }
      return true;
    });
  }, [entries, searchQuery, fromDate, toDate]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Total amount
  const totalAmount = useMemo(() => {
    return filteredEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredEntries]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setSelectedEntry(null);
    setItemName('');
    setPersonName('');
    setAmount('');
    setPaymentMode('Cash');
    setReceiverName('');
    setEntryDate(formatDateForInput(new Date()));
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (e) => {
    setSelectedEntry(e);
    setItemName(e.itemName);
    setPersonName(e.personName);
    setAmount(e.amount.toString());
    setPaymentMode(e.paymentMode || 'Cash');
    setReceiverName(e.receiverName);
    setEntryDate(formatDateForInput(e.entryDate));
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (e) => {
    setSelectedEntry(e);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (e) => {
    setSelectedEntry(e);
    setIsConfirmOpen(true);
  };

  const handleSave = async (evt) => {
    evt.preventDefault();
    if (!itemName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (!personName.trim()) {
      setFormError('Person name is required.');
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
        itemName: itemName.trim(),
        personName: personName.trim(),
        amount: numAmount,
        paymentMode: paymentMode,
        receiverName: receiverName.trim(),
        entryDate: new Date(entryDate).toISOString(),
      };

      if (selectedEntry) {
        // PUT Update
        await api.put(`/velampata/${selectedEntry.velampataId}`, payload);
        addToast('Velampata entry updated successfully.');
      } else {
        // POST Create
        await api.post('/velampata', payload);
        addToast('Velampata entry created successfully.');
      }

      setSuccessMsg('Velampata entry saved successfully!');
      if (isAdmin) {
        setIsFormModalOpen(false);
        fetchEntries();
      } else {
        setItemName('');
        setPersonName('');
        setAmount('');
        setPaymentMode('Cash');
        setReceiverName('');
        setEntryDate(formatDateForInput(new Date()));
      }
    } catch (err) {
      console.error('Save Velampata error:', err);
      setFormError(err.response?.data?.message || 'Failed to save Velampata entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      setDeleting(true);
      await api.delete(`/velampata/${selectedEntry.velampataId}`);
      addToast('Velampata entry deleted successfully.');
      setIsConfirmOpen(false);
      fetchEntries();
    } catch (err) {
      console.error('Delete Velampata error:', err);
      addToast(err.response?.data?.message || 'Failed to delete Velampata entry.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Export PDF & Excel
  const handleExportPDF = () => {
    const headers = ['#', 'Item Name', 'Person Name', 'Amount (₹)', 'Payment Mode', 'Receiver', 'Date'];
    const data = filteredEntries.map((e, i) => [
      i + 1,
      e.itemName,
      e.personName,
      formatCurrency(e.amount),
      e.paymentMode,
      e.receiverName,
      formatDate(e.entryDate),
    ]);

    exportToPDF({
      title: 'Velampata Auction Entries Report',
      subtitle: `Total Collection: ${formatCurrency(totalAmount)}`,
      headers,
      data,
      fileName: 'velampata_report.pdf',
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Item Name', 'Person Name', 'Amount', 'Payment Mode', 'Receiver', 'Date'];
    const data = filteredEntries.map((e) => [
      e.velampataId,
      e.itemName,
      e.personName,
      e.amount,
      e.paymentMode,
      e.receiverName,
      formatDate(e.entryDate),
    ]);

    exportToExcel({
      title: 'Velampata',
      headers,
      data,
      fileName: 'velampata.xlsx',
    });
  };

  const columns = [
    { key: 'itemName', label: 'Item Name', sortable: true },
    { key: 'personName', label: 'Person Name', sortable: true },
    { key: 'amount', label: 'Amount', type: 'currency', sortable: true },
    { key: 'paymentMode', label: 'Payment Mode', type: 'paymentMode', sortable: true },
    { key: 'receiverName', label: 'Receiver Name', sortable: true },
    { key: 'entryDate', label: 'Date', type: 'date', sortable: true },
  ];

  if (!isAdmin) {
    // MEMBER VIEW: Data Entry Form Only
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Gavel className="text-emerald-600" size={24} />
              <span>Add Velampata Entry</span>
            </h1>
            <div className="breadcrumb">Record auction / Velampata bid record</div>
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
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Laddu / Kalasham"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Person Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Anjaneyulu"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="e.g. 15000"
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
                  placeholder="e.g. Suresh"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entry Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
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
              {saving ? 'Submitting Entry...' : 'Submit Velampata Entry'}
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
          <h1 className="page-title">Velampata Auction</h1>
          <div className="breadcrumb">
            Total Velampata Collection: <strong>{formatCurrency(totalAmount)}</strong>
          </div>
        </div>
      </div>

      <ActionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search item or person..."
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        showDateFilter={true}
        onRefresh={fetchEntries}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={printReport}
        onAdd={handleOpenAdd}
        addBtnLabel="Add Velampata Entry"
        refreshing={loading}
      />

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyMessage="No Velampata entries found."
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredEntries.length}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedEntry ? 'Edit Velampata Entry' : 'Add Velampata Entry'}
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
              {saving ? 'Saving...' : selectedEntry ? 'Update Entry' : 'Save Entry'}
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Laddu / Kalasham"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Person Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Anjaneyulu"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="e.g. 15000"
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
                placeholder="e.g. Suresh"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Entry Date *</label>
              <input
                type="date"
                className="form-control"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
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
        title="Velampata Entry Details"
        footer={
          <button className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedEntry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Item Name:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {selectedEntry.itemName}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Person Name:</strong>
              <div>{selectedEntry.personName}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Amount:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                {formatCurrency(selectedEntry.amount)}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Payment Mode:</strong>
              <div>
                <span className={`badge badge-${selectedEntry.paymentMode.toLowerCase()}`}>
                  {selectedEntry.paymentMode}
                </span>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Receiver Name:</strong>
              <div>{selectedEntry.receiverName}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Entry Date:</strong>
              <div>{formatDate(selectedEntry.entryDate)}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Velampata Entry"
        message={`Are you sure you want to delete Velampata entry "${selectedEntry?.itemName}" for ${selectedEntry?.personName}?`}
        loading={deleting}
      />
    </div>
  );
};
