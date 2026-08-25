import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { ActionToolbar } from '../components/ui/ActionToolbar';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Toast } from '../components/ui/Toast';
import { exportToPDF, exportToExcel, printReport } from '../utils/exportUtils';
import { formatDate } from '../utils/formatters';
import { UserCheck, Clock, Check, X, Users as UsersIcon, ShieldAlert } from 'lucide-react';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Active', 'RejectedDisabled'

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Dialog state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Form Fields
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      const data = res.data || [];
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      addToast(err.response?.data?.message || 'Failed to load users list.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Tabbed Categorization
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === 'Pending');
  }, [users]);

  const activeUsers = useMemo(() => {
    return users.filter((u) => u.status === 'Approved' || (u.isActive && u.status !== 'Pending' && u.status !== 'Rejected'));
  }, [users]);

  const rejectedDisabledUsers = useMemo(() => {
    return users.filter((u) => u.status === 'Rejected' || u.status === 'Disabled' || (!u.isActive && u.status !== 'Pending'));
  }, [users]);

  // Selected tab dataset
  const currentTabUsers = useMemo(() => {
    if (activeTab === 'Pending') return pendingUsers;
    if (activeTab === 'Active') return activeUsers;
    return rejectedDisabledUsers;
  }, [activeTab, pendingUsers, activeUsers, rejectedDisabledUsers]);

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    return currentTabUsers.filter((u) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.mobileNumber || '').toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [currentTabUsers, searchQuery]);

  // Pagination slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setSelectedUser(null);
    setName('');
    setMobileNumber('');
    setUsername('');
    setPassword('');
    setRole('Member');
    setIsActive(true);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setName(u.name);
    setMobileNumber(u.mobileNumber || '');
    setUsername(u.username);
    setPassword('');
    setRole(u.role || 'Member');
    setIsActive(u.isActive);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (u) => {
    setSelectedUser(u);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (u) => {
    setSelectedUser(u);
    setIsConfirmOpen(true);
  };

  const handleOpenApproveConfirm = (u) => {
    setSelectedUser(u);
    setIsApproveConfirmOpen(true);
  };

  const handleOpenRejectConfirm = (u) => {
    setSelectedUser(u);
    setIsRejectConfirmOpen(true);
  };

  const handleApproveMember = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await api.put(`/users/${selectedUser.userId}/approve`);
      addToast('Member approved successfully.');
      setIsApproveConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Approve error:', err);
      addToast(err.response?.data?.message || 'Failed to approve member account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectMember = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await api.put(`/users/${selectedUser.userId}/reject`);
      addToast('Member registration rejected.');
      setIsRejectConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Reject error:', err);
      addToast(err.response?.data?.message || 'Failed to reject member account.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!selectedUser && !password) {
      setFormError('Password is required for new users.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      if (selectedUser) {
        // PUT Update
        await api.put(`/users/${selectedUser.userId}`, {
          name: name.trim(),
          mobileNumber: mobileNumber.trim() || null,
          username: username.trim(),
          password: password ? password : undefined,
          role,
          isActive,
        });
        addToast('User updated successfully.');
      } else {
        // POST Create
        await api.post('/users', {
          name: name.trim(),
          mobileNumber: mobileNumber.trim() || null,
          username: username.trim(),
          password: password,
          role,
        });
        addToast('User created successfully.');
      }

      setIsFormModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Save user error:', err);
      setFormError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setDeleting(true);
      await api.delete(`/users/${selectedUser.userId}`);
      addToast('User deleted successfully.');
      setIsConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      addToast(err.response?.data?.message || 'Failed to delete user.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Export PDF & Excel
  const handleExportPDF = () => {
    const headers = ['#', 'Name', 'Phone Number', 'Username', 'Role', 'Status', 'Registration Date'];
    const data = filteredUsers.map((u, i) => [
      i + 1,
      u.name,
      u.mobileNumber || '-',
      u.username,
      u.role,
      u.status || (u.isActive ? 'Approved' : 'Disabled'),
      formatDate(u.createdAt),
    ]);

    exportToPDF({
      title: `Users Management (${activeTab} Members)`,
      subtitle: `Total Records: ${filteredUsers.length}`,
      headers,
      data,
      fileName: `users_${activeTab.toLowerCase()}_report.pdf`,
    });
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Name', 'Phone Number', 'Username', 'Role', 'Status', 'Registration Date'];
    const data = filteredUsers.map((u) => [
      u.userId,
      u.name,
      u.mobileNumber || '-',
      u.username,
      u.role,
      u.status || (u.isActive ? 'Approved' : 'Disabled'),
      formatDate(u.createdAt),
    ]);

    exportToExcel({
      title: `Users (${activeTab})`,
      headers,
      data,
      fileName: `users_${activeTab.toLowerCase()}.xlsx`,
    });
  };

  return (
    <div>
      <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={24} className="text-primary-600" />
            <span>User Management</span>
          </h1>
          <div className="breadcrumb">
            Manage member account registrations, approvals, and system administrators
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '2px solid var(--slate-200)',
          paddingBottom: '8px',
        }}
      >
        <button
          onClick={() => { setActiveTab('Pending'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'Pending' ? '#fef3c7' : 'transparent',
            color: activeTab === 'Pending' ? '#d97706' : 'var(--slate-600)',
          }}
        >
          <Clock size={16} />
          <span>Pending Members</span>
          {pendingUsers.length > 0 && (
            <span
              style={{
                background: '#d97706',
                color: '#fff',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
              }}
            >
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('Active'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'Active' ? '#dcfce7' : 'transparent',
            color: activeTab === 'Active' ? '#166534' : 'var(--slate-600)',
          }}
        >
          <UsersIcon size={16} />
          <span>Active Members</span>
          <span
            style={{
              background: '#16a34a',
              color: '#fff',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
            }}
          >
            {activeUsers.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('RejectedDisabled'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'RejectedDisabled' ? '#fee2e2' : 'transparent',
            color: activeTab === 'RejectedDisabled' ? '#991b1b' : 'var(--slate-600)',
          }}
        >
          <ShieldAlert size={16} />
          <span>Rejected / Disabled</span>
          <span
            style={{
              background: '#dc2626',
              color: '#fff',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
            }}
          >
            {rejectedDisabledUsers.length}
          </span>
        </button>
      </div>

      <ActionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search name, username, mobile..."
        showDateFilter={false}
        onRefresh={fetchUsers}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={printReport}
        onAdd={handleOpenAdd}
        addBtnLabel="Add User"
        refreshing={loading}
      />

      {/* Table Display */}
      {activeTab === 'Pending' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Phone Number</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--slate-500)' }}>
                      Loading pending members...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                      <Clock size={32} style={{ margin: '0 auto 10px auto', color: 'var(--slate-400)' }} />
                      <div>No pending member accounts right now.</div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((u, idx) => (
                    <tr key={u.userId}>
                      <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td>
                        <strong style={{ color: 'var(--slate-900)' }}>{u.name}</strong>
                      </td>
                      <td>@{u.username}</td>
                      <td>{u.mobileNumber || '-'}</td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          Pending
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleOpenApproveConfirm(u)}
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>

                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleOpenRejectConfirm(u)}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'username', label: 'Username', sortable: true },
            { key: 'mobileNumber', label: 'Phone Number', sortable: false },
            {
              key: 'role',
              label: 'Role',
              render: (roleVal) => (
                <span className={`user-role-badge ${roleVal === 'Admin' ? 'badge-admin' : 'badge-member'}`}>
                  {roleVal}
                </span>
              ),
              sortable: true,
            },
            {
              key: 'status',
              label: 'Status',
              render: (val, row) => {
                const s = val || (row.isActive ? 'Approved' : 'Disabled');
                if (s === 'Approved') return <span className="badge badge-active">Approved</span>;
                if (s === 'Rejected') return <span className="badge badge-inactive">Rejected</span>;
                if (s === 'Disabled') return <span className="badge badge-inactive">Disabled</span>;
                return <span className="badge badge-amber">{s}</span>;
              },
              sortable: true,
            },
            { key: 'createdAt', label: 'Registration Date', type: 'date', sortable: true },
          ]}
          data={paginatedData}
          loading={loading}
          emptyMessage={`No ${activeTab.toLowerCase()} members found.`}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      )}

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredUsers.length}
        onPageChange={setCurrentPage}
      />

      {/* Approve Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isApproveConfirmOpen}
        onClose={() => setIsApproveConfirmOpen(false)}
        onConfirm={handleApproveMember}
        title="Approve Member Account"
        message={`Approve this member account for "${selectedUser?.name}" (@${selectedUser?.username})? After approval, the member will be able to log in.`}
        loading={actionLoading}
      />

      {/* Reject Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRejectConfirmOpen}
        onClose={() => setIsRejectConfirmOpen(false)}
        onConfirm={handleRejectMember}
        title="Reject Member Account"
        message={`Reject member registration for "${selectedUser?.name}" (@${selectedUser?.username})?`}
        loading={actionLoading}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedUser ? 'Edit User Account' : 'Add New User Account'}
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
              {saving ? 'Saving...' : selectedUser ? 'Update User' : 'Save User'}
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
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rithvik Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. rithvik"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {selectedUser ? 'New Password (Leave blank to keep existing)' : 'Password *'}
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!selectedUser}
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {selectedUser && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="userActiveCheck"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="userActiveCheck" className="form-label" style={{ margin: 0 }}>
                User Account Active
              </label>
            </div>
          )}
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
        footer={
          <button className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Full Name:</strong>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {selectedUser.name}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Username:</strong>
              <div>@{selectedUser.username}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Phone Number:</strong>
              <div>{selectedUser.mobileNumber || '-'}</div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Role:</strong>
              <div>
                <span className={`user-role-badge ${selectedUser.role === 'Admin' ? 'badge-admin' : 'badge-member'}`}>
                  {selectedUser.role}
                </span>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Status:</strong>
              <div>
                <span className="badge badge-active">
                  {selectedUser.status || (selectedUser.isActive ? 'Approved' : 'Disabled')}
                </span>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Registration Date:</strong>
              <div>{formatDate(selectedUser.createdAt)}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete user account "${selectedUser?.name}" (@${selectedUser?.username})?`}
        loading={deleting}
      />
    </div>
  );
};
