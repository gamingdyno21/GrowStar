import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import TransactionForm from '../../components/forms/TransactionForm';
import userService from '../../services/userService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { TRANSACTION_TYPES } from '../../utils/constants';

const Transactions = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, searchTerm, typeFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await userService.getRecords();
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error('Failed to get transactions:', err);
      showNotification('danger', 'Failed to retrieve transactions.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...records];

    if (searchTerm) {
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'All') {
      result = result.filter((r) => r.type === typeFilter);
    }

    setFilteredRecords(result);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingRecord) {
        // Edit record
        const res = await userService.updateRecord(editingRecord._id, formData);
        if (res.success) {
          showNotification('success', 'Transaction updated successfully!');
          fetchRecords();
        }
      } else {
        // Add new record
        const res = await userService.createRecord(formData);
        if (res.success) {
          showNotification('success', 'Transaction registered successfully!');
          fetchRecords();
        }
      }
      setShowForm(false);
      setEditingRecord(null);
    } catch (err) {
      console.error('Failed to submit form:', err);
      showNotification('danger', err.response?.data?.message || 'Action failed.');
    }
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this record?')) return;
    try {
      const res = await userService.deleteRecord(id);
      if (res.success) {
        showNotification('success', 'Transaction deleted successfully!');
        fetchRecords();
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      showNotification('danger', 'Failed to delete record.');
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-4 flex-grow-1">
        {notification.message && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show mb-4`} role="alert">
            {notification.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotification({ type: '', message: '' })}
            ></button>
          </div>
        )}

        <PageHeader
          title="Transaction Manager"
          subtitle="Add, remove and balance income, expense, and investments"
          action={
            !showForm && (
              <button className="btn btn-primary d-flex align-items-center" onClick={() => setShowForm(true)}>
                <i className="bi bi-plus-lg me-1"></i> Register Transaction
              </button>
            )
          }
        />

        {/* Form panel */}
        {showForm && (
          <div className="mb-4">
            <Card title={editingRecord ? 'Modify Financial Record' : 'Register New Transaction'}>
              <TransactionForm
                onSubmit={handleFormSubmit}
                initialData={editingRecord}
                onCancel={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                }}
              />
            </Card>
          </div>
        )}

        {/* Filters */}
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
                  placeholder="Search by description or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-center">
                <label className="me-2 text-secondary fw-semibold small text-uppercase mb-0">Type:</label>
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Transactions</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main List */}
        {loading ? (
          <Loader />
        ) : (
          <div className="animate-fade">
            <Card title={`Records History (${filteredRecords.length})`}>
              {filteredRecords.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <i className="bi bi-wallet2 fs-1 mb-2 d-block"></i>
                  No transaction records found matching your filters.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 text-start">
                    <thead>
                      <tr className="table-light">
                        <th className="ps-3 border-0">Title</th>
                        <th className="border-0">Category</th>
                        <th className="border-0">Date</th>
                        <th className="border-0">Status</th>
                        <th className="border-0">Amount</th>
                        <th className="text-end pe-3 border-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r) => (
                        <tr key={r._id}>
                          <td className="ps-3 fw-medium">
                            <div className="d-flex align-items-center">
                              <div
                                className={`p-2 rounded-circle me-3 bg-${
                                  r.type === 'Income' ? 'success' : r.type === 'Expense' ? 'danger' : 'info'
                                }-subtle text-${
                                  r.type === 'Income' ? 'success' : r.type === 'Expense' ? 'danger' : 'info'
                                } d-flex align-items-center justify-content-center`}
                                style={{ width: '32px', height: '32px' }}
                              >
                                <i
                                  className={`bi ${
                                    r.type === 'Income' ? 'bi-plus-circle-fill' : 'bi-dash-circle-fill'
                                  }`}
                                ></i>
                              </div>
                              <span>{r.title}</span>
                            </div>
                          </td>
                          <td className="text-secondary">{r.category}</td>
                          <td className="text-secondary">{formatDate(r.date)}</td>
                          <td>
                            <span className={`badge badge-status ${r.status.toLowerCase()}`}>
                              {r.status}
                            </span>
                          </td>
                          <td
                            className={`fw-bold ${
                              r.type === 'Income' ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {r.type === 'Income' ? '+' : '-'} {formatCurrency(r.amount)}
                          </td>
                          <td className="text-end pe-3">
                            <button
                              className="btn btn-sm btn-outline-primary me-2 border-0"
                              onClick={() => handleEditClick(r)}
                              title="Edit Record"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger border-0"
                              onClick={() => handleDeleteClick(r._id)}
                              title="Delete Record"
                            >
                              <i className="bi bi-trash-fill"></i>
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
      <Footer />
    </div>
  );
};

export default Transactions;
