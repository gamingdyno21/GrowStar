import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/helpers';
import { ACCOUNT_STATUSES } from '../../utils/constants';

const UsersList = () => {
  const { showToast } = useToast();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, clientId: null, clientName: '' });

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { applyFilters(); }, [clients, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers();
      if (res.success) setClients(res.data);
    } catch {
      showToast('Failed to load client list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...clients];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.fullName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.phone || c.phoneNumber || '').toLowerCase().includes(term) ||
        c.panNumber.toLowerCase().includes(term) ||
        c._id.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }
    setFilteredClients(result);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await adminService.updateUserStatus(id, newStatus);
      if (res.success) {
        showToast(`Client status updated to ${newStatus}.`, 'success');
        fetchUsers();
      }
    } catch {
      showToast('Status update failed.', 'error');
    }
  };

  /* ── BUG FIX: Delete with proper modal + error handling ── */
  const openDeleteModal = (id, name) => {
    setDeleteModal({ isOpen: true, clientId: id, clientName: name });
  };

  const handleConfirmDelete = async () => {
    const { clientId, clientName } = deleteModal;
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
    setDeletingId(clientId);
    try {
      const res = await adminService.deleteUser(clientId);
      if (res.success) {
        showToast(`"${clientName}" and all associated records permanently deleted.`, 'success');
        // Optimistically remove from state for instant UI update
        setClients(prev => prev.filter(c => c._id !== clientId));
      } else {
        showToast('Failed to delete client record. Please try again.', 'error');
        fetchUsers(); // Refresh to sync state
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete client record.';
      showToast(msg, 'error');
      fetchUsers(); // Refresh to sync state
    } finally {
      setDeletingId(null);
    }
  };

  const statusColors = {
    Approved: { bg: '#d1fae5', color: '#059669' },
    Pending:  { bg: '#fef3c7', color: '#d97706' },
    Rejected: { bg: '#fee2e2', color: '#dc2626' },
  };

  const filterOptions = ['All', ...ACCOUNT_STATUSES];

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Client Account?"
        message={`This will permanently delete "${deleteModal.clientName}" and ALL associated data — investments, profits, transactions, and messages. This action is irreversible.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        variant="danger"
      />

      {/* Sidebar */}
      <div className="d-none d-md-block" style={{ width: '240px', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <div className="d-md-none">
        <Sidebar />
      </div>

      {/* Content */}
      <div className="flex-grow-1" style={{ minWidth: 0, padding: '1.75rem 2rem', overflowX: 'hidden' }}>
        <PageHeader
          title="Client Directory"
          subtitle="Manage registered accounts, edit profiles, and purge records"
        />

        {/* Search + Filter Bar */}
        <div
          className="mb-4 p-3 rounded-3 d-flex flex-column flex-md-row align-items-md-center gap-3"
          style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}
        >
          {/* Search */}
          <div className="search-bar flex-grow-1">
            <i className="bi bi-search search-bar-icon"></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, phone, PAN, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter pills */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
              Status:
            </span>
            <div className="filter-pills">
              {filterOptions.map(f => (
                <button
                  key={f}
                  className={`filter-pill ${statusFilter === f ? (f === 'Approved' ? 'active-success' : f === 'Rejected' ? 'active-danger' : f === 'Pending' ? 'active-warning' : 'active') : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <Loader message="Loading client database..." skeleton rows={6} />
        ) : (
          <div className="animate-fade">
            <Card title={`Clients Registry (${filteredClients.length} of ${clients.length})`}>
              {filteredClients.length === 0 ? (
                <div className="text-center py-5" style={{ color: '#94a3b8' }}>
                  <i className="bi bi-people d-block fs-1 mb-3" style={{ color: '#d1d5db' }}></i>
                  <p className="mb-1" style={{ fontWeight: 600, color: '#475569' }}>No clients found</p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="ps-3">Client</th>
                        <th>Contact</th>
                        <th>PAN</th>
                        <th>Registered</th>
                        <th>Status</th>
                        <th className="text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map(client => {
                        const sc = statusColors[client.status] || statusColors.Pending;
                        const isDeleting = deletingId === client._id;
                        return (
                          <tr key={client._id} style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                            <td className="ps-3">
                              <div className="d-flex align-items-center gap-2">
                                {/* Avatar */}
                                <div
                                  className="avatar avatar-sm avatar-blue flex-shrink-0"
                                  style={{ fontFamily: "'Outfit', sans-serif" }}
                                >
                                  {client.fullName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <Link
                                    to={`/admin/users/${client._id}`}
                                    style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', fontSize: '0.875rem', display: 'block' }}
                                  >
                                    {client.fullName}
                                  </Link>
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                    #{client._id.substring(18).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.8375rem', color: '#475569' }}>{client.email}</div>
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{client.phone || client.phoneNumber || 'N/A'}</div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#475569' }}>
                              {client.panNumber}
                            </td>
                            <td style={{ fontSize: '0.8375rem', color: '#64748b' }}>
                              {formatDate(client.createdAt)}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.2em 0.625em', borderRadius: '9999px',
                                  fontSize: '0.75rem', fontWeight: 600,
                                  background: sc.bg, color: sc.color,
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.color, flexShrink: 0 }}></span>
                                {client.status}
                              </span>
                            </td>
                            <td className="text-end pe-3">
                              <div className="d-flex align-items-center justify-content-end gap-1">
                                <Link
                                  to={`/admin/users/${client._id}`}
                                  className="btn btn-sm"
                                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.3125rem 0.625rem' }}
                                  title="View & Edit"
                                >
                                  <i className="bi bi-eye me-1"></i>View
                                </Link>
                                <button
                                  className="btn btn-sm"
                                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.3125rem 0.625rem' }}
                                  onClick={() => openDeleteModal(client._id, client.fullName)}
                                  disabled={isDeleting}
                                  title="Delete Client"
                                >
                                  {isDeleting ? (
                                    <span style={{ width:'14px',height:'14px',border:'2px solid rgba(220,38,38,0.3)',borderTopColor:'#dc2626',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}} />
                                  ) : (
                                    <><i className="bi bi-trash3"></i></>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;
