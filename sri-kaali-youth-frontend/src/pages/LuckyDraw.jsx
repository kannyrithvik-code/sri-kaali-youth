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
import { Ticket, CheckCircle } from 'lucide-react';

export const LuckyDraw = () => {
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
  const [ticketNumber, setTicketNumber] = useState('');
  const [personName, setPersonName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
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
      const res = await api.get('/lucky-draw');
      setEntries(res.data || []);
    } catch (err) {
      console.error('Error fetching lucky draw entries:', err);
      addToast(err.response?.data?.message || 'Failed to load lucky draw entries.', 'error');
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
        const matchTicket = e.ticketNumber.toLowerCase().includes(q);
        const matchPerson = e.personName.toLowerCase().includes(q);
        const matchMobile = (e.mobileNumber || '').toLowerCase().includes(q);
        const matchReceiver = e.receiverName.toLowerCase().includes(q);
        if (!matchTicket && !matchPerson && !matchMobile && !matchReceiver) return false;
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
    setTicketNumber('');
    setPersonName('');
    setMobileNumber('');
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
    setTicketNumber(e.ticketNumber);
    setPersonName(e.personName);
    setMobileNumber(e.mobileNumber || '');
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
    if (!ticketNumber.trim()) {
      setFormError('Ticket number is required.');
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
        ticketNumber: ticketNumber.trim(),
        personName: personName.trim(),
        mobileNumber: mobileNumber.trim() || null,
        amount: numAmount,
        paymentMode: paymentMode,
        receiverName: receiverName.trim(),
        entryDate: new Date(entryDate).toISOString(),
      };

      if (selectedEntry) {
        // PUT Update
        await api.put(`/lucky-draw/${selectedEntry.luckyDrawId}`, payload);
        addToast('Lucky draw entry updated successfully.');
      } else {
        // POST Create
        await api.post('/lucky-draw', payload);
        addToast('Lucky draw entry created successfully.');
      }

      setSuccessMsg('Lucky Draw entry saved successfully!');
      if (isAdmin) {
        setIsFormModalOpen(false);
        fetchEntries();
      } else {
        setTicketNumber('');
        setPersonName('');
        setMobileNumber('');
        setAmount('');
        setPaymentMode('Cash');
        setReceiverName('');
        setEntryDate(formatDateForInput(new Date()));
      }
    } catch (err) {
      console.error('Save lucky draw error:', err);
      setFormError(err.response?.data?.message || 'Failed to save lucky draw entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      setDeleting(true);
      await api.delete(`/lucky-draw/${selectedEntry.luckyDrawId}`);
      addToast('Lucky draw entry deleted successfully.');
      setIsConfirmOpen(false);
      fetchEntries();
    } catch (err) {
      console.error('Delete lucky draw error:', err);
      addToast(err.response?.data?.message || 'Failed to delete lucky draw entry.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Export PDF & Excel
  const handleExportPDF = () => {
    const headers = ['#', 'Ticket No', 'Person Name', 'Mobile No', 'Amount (₹)', 'Payment Mode', 'Receiver', 'Date'];
    const data = filteredEntries.map((e, i) => [
      i + 1,
      e.ticketNumber,
      e.personName,
      e.mobileNumber || '-',
      formatCurrency(e.amount),
      e.paymentMode,
      e.receiverName,
      formatDate(e.entryDate),
    ]);

    exportToPDF({
      title: 'Lucky Draw Entries Report',
      subtitle: `Total Collection: ${formatCurrency(totalAmount)}`,
      headers,
      data,
      fileName: 'lucky_draw_report.pdf',
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Ticket No', 'Person Name', 'Mobile No', 'Amount', 'Payment Mode', 'Receiver', 'Date'];
    const data = filteredEntries.map((e) => [
      e.luckyDrawId,
      e.ticketNumber,
      e.personName,
      e.mobileNumber || '-',
      e.amount,
      e.paymentMode,
      e.receiverName,
      formatDate(e.entryDate),
    ]);

    exportToExcel({
      title: 'Lucky Draw',
      headers,
      data,
      fileName: 'lucky_draw.xlsx',
    });
  };

  const columns = [
    { key: 'ticketNumber', label: 'Ticket No', sortable: true },
    { key: 'personName', label: 'Person Name', sortable: true },
    { key: 'mobileNumber', label: 'Mobile No', sortable: false },
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
              <Ticket className="text-purple-600" size={24} />
              <span>Add Lucky Draw Entry</span>
            </h1>
            <div className="breadcrumb">Record new ticket entry for lucky draw</div>
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
                <label className="form-label">Ticket Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. LD1001"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Person Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ramesh"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="e.g. 100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
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

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}
              disabled={saving}
            >
              {saving ? 'Submitting Entry...' : 'Submit Lucky Draw Entry'}
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
          <h1 className="page-title">Lucky Draw Entries</h1>
          <div className="breadcrumb">
            Total Lucky Draw Collection: <strong>{formatCurrency(totalAmount)}</strong>
          </div>
        </div>
      </div>

      <ActionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search ticket no, person, mobile..."
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
        addBtnLabel="Add Lucky Draw Entry"
        refreshing={loading}
      />

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyMessage="No lucky draw entries found."
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
        title={selectedEntry ? 'Edit Lucky Draw Entry' : 'Add Lucky Draw Entry'}
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
              <label className="form-label">Ticket Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. LD1001"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Person Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
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
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Lucky Draw Entry Details"
        footer={
          <button className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedEntry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Ticket Number:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {selectedEntry.ticketNumber}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Person Name:</strong>
              <div>{selectedEntry.personName}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Mobile Number:</strong>
              <div>{selectedEntry.mobileNumber || '-'}</div>
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
        title="Delete Lucky Draw Entry"
        message={`Are you sure you want to delete ticket #${selectedEntry?.ticketNumber} for ${selectedEntry?.personName}?`}
        loading={deleting}
      />
    </div>
  );
};
