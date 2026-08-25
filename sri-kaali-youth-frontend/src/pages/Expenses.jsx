import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { Sparkles, CheckCircle } from 'lucide-react';

export const Expenses = () => {
  const { day } = useParams();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { selectedFestivalId } = useFestival();

  // Determine expenseType and page title from URL route
  const { expenseType, pageTitle, dayNumber } = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/expenses/decoration')) {
      return { expenseType: 'Decoration', pageTitle: 'Decoration Expenses', dayNumber: null };
    }
    if (path.includes('/expenses/aagaman')) {
      return { expenseType: 'Aagaman', pageTitle: 'Aagaman Day Expenses', dayNumber: null };
    }
    if (path.includes('/expenses/last-day')) {
      return { expenseType: 'LastDay', pageTitle: 'Last Day Expenses', dayNumber: null };
    }
    if (path.includes('/expenses/day/')) {
      const d = Number(day) || 1;
      return { expenseType: 'DayWise', pageTitle: `Day ${d} Expenses`, dayNumber: d };
    }
    return { expenseType: 'Decoration', pageTitle: 'Decoration Expenses', dayNumber: null };
  }, [location.pathname, day]);

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [expenseDate, setExpenseDate] = useState(formatDateForInput(new Date()));
  const [formError, setFormError] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch Categories for dropdown selector (permitted for both Admin and Member)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch expenses for Admin only
  const fetchExpenses = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      let endpoint = '/expenses';
      if (expenseType === 'Decoration') endpoint = '/expenses/decoration';
      else if (expenseType === 'Aagaman') endpoint = '/expenses/aagaman';
      else if (expenseType === 'LastDay') endpoint = '/expenses/last-day';
      else if (expenseType === 'DayWise' && dayNumber) endpoint = `/expenses/day/${dayNumber}`;

      const res = await api.get(endpoint);
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      addToast(err.response?.data?.message || 'Failed to load expenses.', 'error');
    } finally {
      setLoading(false);
    }
  }, [expenseType, dayNumber, isAdmin]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Category ID to Name Map
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.categoryId] = c.categoryName;
    });
    return map;
  }, [categories]);

  // Client-side filtering (Search & Date Range)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const catName = (categoryMap[exp.categoryId] || '').toLowerCase();
        const matchItem = exp.itemName.toLowerCase().includes(q);
        const matchCat = catName.includes(q);
        const matchMode = exp.paymentMode.toLowerCase().includes(q);
        if (!matchItem && !matchCat && !matchMode) return false;
      }
      if (fromDate) {
        const itemDate = new Date(exp.expenseDate).setHours(0, 0, 0, 0);
        const from = new Date(fromDate).setHours(0, 0, 0, 0);
        if (itemDate < from) return false;
      }
      if (toDate) {
        const itemDate = new Date(exp.expenseDate).setHours(0, 0, 0, 0);
        const to = new Date(toDate).setHours(0, 0, 0, 0);
        if (itemDate > to) return false;
      }
      return true;
    });
  }, [expenses, searchQuery, fromDate, toDate, categoryMap]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  // Total calculated for current filtered dataset
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setSelectedExpense(null);
    setItemName('');
    setAmount('');
    setCategoryId('');
    setPaymentMode('Cash');
    setExpenseDate(formatDateForInput(new Date()));
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setSelectedExpense(exp);
    setItemName(exp.itemName);
    setAmount(exp.amount.toString());
    setCategoryId(exp.categoryId ? exp.categoryId.toString() : '');
    setPaymentMode(exp.paymentMode || 'Cash');
    setExpenseDate(formatDateForInput(exp.expenseDate));
    setFormError(null);
    setSuccessMsg(null);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (exp) => {
    setSelectedExpense(exp);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (exp) => {
    setSelectedExpense(exp);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Amount must be greater than zero.');
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
        categoryId: categoryId ? Number(categoryId) : null,
        expenseType: expenseType,
        festivalDay: expenseType === 'DayWise' ? dayNumber : null,
        itemName: itemName.trim(),
        amount: numAmount,
        paymentMode: paymentMode,
        expenseDate: new Date(expenseDate).toISOString(),
      };

      if (selectedExpense) {
        // PUT Update
        await api.put(`/expenses/${selectedExpense.expenseId}`, {
          ...selectedExpense,
          ...payload,
        });
        addToast('Expense updated successfully.');
      } else {
        // POST Create
        await api.post('/expenses', payload);
        addToast('Expense created successfully.');
      }

      setSuccessMsg('Expense saved successfully!');
      if (isAdmin) {
        setIsFormModalOpen(false);
        fetchExpenses();
      } else {
        setItemName('');
        setAmount('');
        setCategoryId('');
        setPaymentMode('Cash');
        setExpenseDate(formatDateForInput(new Date()));
      }
    } catch (err) {
      console.error('Save expense error:', err);
      setFormError(err.response?.data?.message || 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      setDeleting(true);
      await api.delete(`/expenses/${selectedExpense.expenseId}`);
      addToast('Expense deleted successfully.');
      setIsConfirmOpen(false);
      fetchExpenses();
    } catch (err) {
      console.error('Delete expense error:', err);
      addToast(err.response?.data?.message || 'Failed to delete expense.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Export PDF & Excel
  const handleExportPDF = () => {
    const headers = ['#', 'Date', 'Item Name', 'Category', 'Amount (₹)', 'Payment Mode'];
    const data = filteredExpenses.map((exp, i) => [
      i + 1,
      formatDate(exp.expenseDate),
      exp.itemName,
      categoryMap[exp.categoryId] || '-',
      formatCurrency(exp.amount),
      exp.paymentMode,
    ]);

    exportToPDF({
      title: `${pageTitle} Report`,
      subtitle: `Total Expenses: ${formatCurrency(totalAmount)}`,
      headers,
      data,
      fileName: `${pageTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Date', 'Item Name', 'Category', 'Amount', 'Payment Mode'];
    const data = filteredExpenses.map((exp) => [
      exp.expenseId,
      formatDate(exp.expenseDate),
      exp.itemName,
      categoryMap[exp.categoryId] || '-',
      exp.amount,
      exp.paymentMode,
    ]);

    exportToExcel({
      title: pageTitle,
      headers,
      data,
      fileName: `${pageTitle.toLowerCase().replace(/\s+/g, '_')}.xlsx`,
    });
  };

  const columns = [
    { key: 'expenseDate', label: 'Date', type: 'date', sortable: true },
    { key: 'itemName', label: 'Item Name', sortable: true },
    { key: 'categoryId', label: 'Category', render: (val) => categoryMap[val] || '-', sortable: true },
    { key: 'amount', label: 'Amount', type: 'currency', sortable: true },
    { key: 'paymentMode', label: 'Payment Mode', type: 'paymentMode', sortable: true },
  ];

  if (!isAdmin) {
    // MEMBER VIEW: Data Entry Form Only
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles className="text-amber-600" size={24} />
              <span>Add Expense ({expenseType})</span>
            </h1>
            <div className="breadcrumb">Enter festival expense record</div>
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
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Flower Garland, Lights, Rice..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select Category (Optional)</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
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
                <label className="form-label">Expense Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
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
              {saving ? 'Submitting Expense...' : 'Submit Expense Record'}
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
          <h1 className="page-title">{pageTitle}</h1>
          <div className="breadcrumb">
            Total Filtered Expenses: <strong>{formatCurrency(totalAmount)}</strong>
          </div>
        </div>
      </div>

      <ActionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search item or category..."
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        showDateFilter={true}
        onRefresh={fetchExpenses}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={printReport}
        onAdd={handleOpenAdd}
        addBtnLabel="Add Expense"
        refreshing={loading}
      />

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyMessage={`No ${pageTitle.toLowerCase()} found.`}
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredExpenses.length}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedExpense ? `Edit ${pageTitle}` : `Add ${pageTitle}`}
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
              {saving ? 'Saving...' : selectedExpense ? 'Update Expense' : 'Save Expense'}
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
            <label className="form-label">Item Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Flower Garland, Lights, Rice..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="e.g. 2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
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
              <label className="form-label">Expense Date *</label>
              <input
                type="date"
                className="form-control"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
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
        title="Expense Details"
        footer={
          <button className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedExpense && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Expense ID:</strong>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>#{selectedExpense.expenseId}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Item Name:</strong>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {selectedExpense.itemName}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Amount:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                {formatCurrency(selectedExpense.amount)}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Category:</strong>
              <div>{categoryMap[selectedExpense.categoryId] || 'Uncategorized'}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Payment Mode:</strong>
              <div>
                <span className={`badge badge-${selectedExpense.paymentMode.toLowerCase()}`}>
                  {selectedExpense.paymentMode}
                </span>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Date:</strong>
              <div>{formatDate(selectedExpense.expenseDate)}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete expense "${selectedExpense?.itemName}" for ${formatCurrency(selectedExpense?.amount)}?`}
        loading={deleting}
      />
    </div>
  );
};
