import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { ActionToolbar } from '../components/ui/ActionToolbar';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Toast } from '../components/ui/Toast';
import { exportToPDF, exportToExcel, printReport } from '../utils/exportUtils';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Dialog state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Form Fields
  const [categoryName, setCategoryName] = useState('');
  const [icon, setIcon] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      addToast(err.response?.data?.message || 'Failed to fetch categories.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Client-side filtering & search
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        cat.categoryName.toLowerCase().includes(q) ||
        (cat.icon && cat.icon.toLowerCase().includes(q))
      );
    });
  }, [categories, searchQuery]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  // Handlers for Add/Edit/View/Delete
  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setCategoryName('');
    setIcon('');
    setIsActive(true);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setCategoryName(category.categoryName);
    setIcon(category.icon || '');
    setIsActive(category.isActive);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (category) => {
    setSelectedCategory(category);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (category) => {
    setSelectedCategory(category);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      if (selectedCategory) {
        // PUT update
        await api.put(`/categories/${selectedCategory.categoryId}`, {
          categoryName: categoryName.trim(),
          icon: icon.trim() || null,
          isActive,
        });
        addToast('Category updated successfully.');
      } else {
        // POST create
        await api.post('/categories', {
          categoryName: categoryName.trim(),
          icon: icon.trim() || null,
        });
        addToast('Category created successfully.');
      }

      setIsFormModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Save error:', err);
      setFormError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      setDeleting(true);
      await api.delete(`/categories/${selectedCategory.categoryId}`);
      addToast('Category deleted successfully.');
      setIsConfirmOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Delete error:', err);
      addToast(err.response?.data?.message || 'Cannot delete category.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Export Handlers
  const handleExportPDF = () => {
    const headers = ['#', 'Category Name', 'Icon', 'Status'];
    const data = filteredCategories.map((c, i) => [
      i + 1,
      c.categoryName,
      c.icon || '-',
      c.isActive ? 'Active' : 'Inactive',
    ]);
    exportToPDF({
      title: 'Expense Categories Report',
      headers,
      data,
      fileName: 'categories_report.pdf',
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Category Name', 'Icon', 'Status'];
    const data = filteredCategories.map((c) => [
      c.categoryId,
      c.categoryName,
      c.icon || '-',
      c.isActive ? 'Active' : 'Inactive',
    ]);
    exportToExcel({
      title: 'Categories',
      headers,
      data,
      fileName: 'categories.xlsx',
    });
  };

  const columns = [
    { key: 'categoryName', label: 'Category Name', sortable: true },
    { key: 'icon', label: 'Icon', sortable: false },
    { key: 'isActive', label: 'Status', type: 'status', sortable: true },
  ];

  return (
    <div>
      <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Expense Categories</h1>
          <div className="breadcrumb">Manage category list for festival expenses</div>
        </div>
      </div>

      <ActionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search categories..."
        showDateFilter={false}
        onRefresh={fetchCategories}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={printReport}
        onAdd={handleOpenAdd}
        addBtnLabel="Add Category"
        refreshing={loading}
      />

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyMessage="No categories found."
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredCategories.length}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedCategory ? 'Edit Category' : 'Add New Category'}
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
              {saving ? 'Saving...' : selectedCategory ? 'Update Category' : 'Save Category'}
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
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Flowers, Decoration, Food..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Icon Name (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Flower, Utensils, Zap..."
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
          </div>

          {selectedCategory && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="isActiveCheck" className="form-label" style={{ margin: 0 }}>
                Category Active Status
              </label>
            </div>
          )}
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Category Details"
        footer={
          <button className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedCategory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Category ID:</strong>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>#{selectedCategory.categoryId}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Category Name:</strong>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {selectedCategory.categoryName}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Icon:</strong>
              <div>{selectedCategory.icon || '-'}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Status:</strong>
              <div>
                <span className={`badge ${selectedCategory.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {selectedCategory.isActive ? 'Active' : 'Inactive'}
                </span>
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
        title="Delete Category"
        message={`Are you sure you want to delete category "${selectedCategory?.categoryName}"? Note: Categories used in expenses cannot be deleted.`}
        loading={deleting}
      />
    </div>
  );
};
