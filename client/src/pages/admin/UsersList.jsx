import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/helpers';
import { ACCOUNT_STATUSES } from '../../utils/constants';

const UsersList = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers();
      if (res.success) {
        setClients(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...clients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.phone || c.phoneNumber || '').toLowerCase().includes(term) ||
          c.panNumber.toLowerCase().includes(term) ||
          c._id.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter);
    }

    setFilteredClients(result);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      const res = await adminService.updateUserStatus(id, newStatus);
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      alert('Verification status change failed.');
    }
  };

  const handleDeleteUser = async (id, name) => {
    const confirmation = window.confirm(
      `CRITICAL WARNING: Are you absolutely sure you want to permanently delete the client "${name}"?\n\nThis will permanently delete this client user and all associated active investments, daily profit timelines, messages, and ledger transactions from MongoDB. This action is irreversible.`
    );
    if (!confirmation) return;

    setLoading(true);
    try {
      const res = await adminService.deleteUser(id);
      if (res.success) {
        alert('Client and all records deleted successfully.');
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to delete client record.');
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 bg-light min-vh-100">
      <div className="row g-0">
        {/* Sidebar Column */}
        <div className="col-12 col-md-3 col-xl-2 d-flex flex-column">
          <Sidebar />
        </div>

        {/* Content Column */}
        <div className="col-12 col-md-9 col-xl-10 p-4">
          <PageHeader title="Client Directory" subtitle="Manage registered accounts, edit profiles, and purge records" />

          {/* Filter Toolbar */}
          <div className="card p-3 border-light shadow-sm rounded-3 mb-4 bg-white">
            <div className="row g-3">
              <div className="col-md-6 col-lg-8">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bi bi-search text-secondary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search by client name, ID, email, phone, or PAN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="d-flex align-items-center">
                  <label className="me-2 text-secondary fw-semibold small text-uppercase mb-0">Status:</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Accounts</option>
                    {ACCOUNT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <Loader message="Loading registered client database..." />
          ) : (
            <div className="animate-fade">
              <Card title={`Clients Registry (${filteredClients.length})`}>
                {filteredClients.length === 0 ? (
                  <div className="text-center py-5 text-secondary">
                    <i className="bi bi-people fs-1 mb-2 d-block text-muted"></i>
                    No client records found.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 text-start">
                      <thead>
                        <tr className="table-light">
                          <th className="ps-3 border-0">Client ID</th>
                          <th className="border-0">Full Name</th>
                          <th className="border-0">Phone</th>
                          <th className="border-0">Email</th>
                          <th className="border-0">PAN</th>
                          <th className="border-0">Registration Date</th>
                          <th className="border-0">Status</th>
                          <th className="text-end pe-3 border-0">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.map((client) => (
                          <tr key={client._id}>
                            <td className="ps-3 text-secondary font-monospace" style={{ fontSize: '0.8rem' }} title={client._id}>
                              #{client._id.substring(18).toUpperCase()}
                            </td>
                            <td>
                              <Link
                                to={`/admin/users/${client._id}`}
                                className="fw-bold text-primary text-decoration-none"
                              >
                                {client.fullName}
                              </Link>
                            </td>
                            <td className="text-secondary">{client.phone || client.phoneNumber || 'N/A'}</td>
                            <td className="text-secondary">{client.email}</td>
                            <td className="text-secondary font-monospace">{client.panNumber}</td>
                            <td className="text-secondary small">{formatDate(client.createdAt)}</td>
                            <td>
                              <span className={`badge badge-status ${client.status.toLowerCase()}`}>
                                {client.status}
                              </span>
                            </td>
                            <td className="text-end pe-3">
                              <Link
                                to={`/admin/users/${client._id}`}
                                className="btn btn-sm btn-outline-primary me-1 py-1"
                              >
                                <i className="bi bi-eye"></i> View
                              </Link>
                              <Link
                                to={`/admin/users/${client._id}`}
                                className="btn btn-sm btn-outline-secondary me-2 py-1"
                              >
                                <i className="bi bi-pencil-square"></i> Edit
                              </Link>
                              <button
                                className="btn btn-sm btn-danger py-1"
                                onClick={() => handleDeleteUser(client._id, client.fullName)}
                              >
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersList;
