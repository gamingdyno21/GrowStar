import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import userService from '../../services/userService';
import { formatCurrency, formatDate } from '../../utils/helpers';

/**
 * Documents — Read-only view of admin-uploaded financial records and data.
 * Users can view, search, and filter records but cannot add, edit, or delete them.
 */
const Documents = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

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
      console.error('Failed to load documents:', err);
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

  // Unique types present in the data (dynamic)
  const availableTypes = ['All', ...new Set(records.map((r) => r.type))];

  // Summary totals
  const totalDeposits = records
    .filter((r) => r.type === 'Deposit')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalWithdrawals = records
    .filter((r) => r.type === 'Withdrawal')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-4 flex-grow-1">
        <PageHeader
          title="Financial Documents"
          subtitle="View your admin-uploaded financial records and transaction history"
        />

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="metric-card d-flex flex-row align-items-center ps-4 h-100">
              <div
                className="bg-success-subtle text-success me-3 d-flex align-items-center justify-content-center"
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              >
                <i className="bi bi-file-earmark-text fs-5"></i>
              </div>
              <div>
                <span className="text-secondary small fw-semibold d-block text-uppercase">Total Records</span>
                <h5 className="fw-bold text-dark mb-0">{records.length}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="metric-card d-flex flex-row align-items-center ps-4 h-100">
              <div
                className="bg-primary-subtle text-primary me-3 d-flex align-items-center justify-content-center"
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              >
                <i className="bi bi-arrow-down-circle fs-5"></i>
              </div>
              <div>
                <span className="text-secondary small fw-semibold d-block text-uppercase">Total Deposits</span>
                <h5 className="fw-bold text-success mb-0">{formatCurrency(totalDeposits)}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="metric-card d-flex flex-row align-items-center ps-4 h-100">
              <div
                className="bg-danger-subtle text-danger me-3 d-flex align-items-center justify-content-center"
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              >
                <i className="bi bi-arrow-up-circle fs-5"></i>
              </div>
              <div>
                <span className="text-secondary small fw-semibold d-block text-uppercase">Total Withdrawals</span>
                <h5 className="fw-bold text-danger mb-0">{formatCurrency(totalWithdrawals)}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="metric-card d-flex flex-row align-items-center ps-4 h-100">
              <div
                className="bg-warning-subtle text-warning me-3 d-flex align-items-center justify-content-center"
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              >
                <i className="bi bi-shield-lock fs-5"></i>
              </div>
              <div>
                <span className="text-secondary small fw-semibold d-block text-uppercase">Managed By</span>
                <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Admin Only</h5>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="alert d-flex align-items-start border-0 mb-4 p-3 rounded-3 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid #bfdbfe' }}>
          <i className="bi bi-info-circle-fill text-primary me-3 mt-1 fs-5"></i>
          <div>
            <span className="fw-semibold text-dark d-block">Records uploaded by your portfolio manager</span>
            <span className="small text-secondary">
              All financial records below are managed exclusively by the GrowStar admin team. 
              For any inquiries or discrepancies, please use the <strong>Messages</strong> section.
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-3 border-light shadow-sm rounded-3 mb-4 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-md-7 col-lg-8">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="bi bi-search text-secondary"></i>
                </span>
                <input
                  type="text"
                  id="doc-search"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by title or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-5 col-lg-4">
              <div className="d-flex align-items-center">
                <label htmlFor="doc-type-filter" className="me-2 text-secondary fw-semibold small text-uppercase mb-0 text-nowrap">
                  Type:
                </label>
                <select
                  id="doc-type-filter"
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t === 'All' ? 'All Types' : t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Records Table — Read Only */}
        {loading ? (
          <Loader message="Loading your financial documents..." />
        ) : (
          <div className="animate-fade">
            <Card title={`Records (${filteredRecords.length})`} className="shadow-sm border-0">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <i className="bi bi-folder2-open fs-1 mb-3 d-block text-muted"></i>
                  <p className="fw-semibold mb-1">No documents found</p>
                  <span className="small">
                    {records.length === 0
                      ? 'Your portfolio manager has not uploaded any records yet.'
                      : 'No records match your current search or filter.'}
                  </span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 text-start">
                    <thead>
                      <tr className="table-light text-secondary">
                        <th className="ps-3 border-0">Title</th>
                        <th className="border-0">Category</th>
                        <th className="border-0">Date</th>
                        <th className="border-0">Type</th>
                        <th className="border-0">Status</th>
                        <th className="text-end pe-3 border-0">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r) => (
                        <tr key={r._id}>
                          <td className="ps-3">
                            <div className="d-flex align-items-center">
                              <div
                                className={`me-3 d-flex align-items-center justify-content-center rounded-circle bg-${
                                  r.type === 'Deposit' ? 'success' : r.type === 'Withdrawal' ? 'danger' : 'info'
                                }-subtle text-${
                                  r.type === 'Deposit' ? 'success' : r.type === 'Withdrawal' ? 'danger' : 'info'
                                }`}
                                style={{ width: '34px', height: '34px', flexShrink: 0 }}
                              >
                                <i
                                  className={`bi ${
                                    r.type === 'Deposit'
                                      ? 'bi-arrow-down-circle-fill'
                                      : r.type === 'Withdrawal'
                                      ? 'bi-arrow-up-circle-fill'
                                      : 'bi-file-earmark-fill'
                                  } small`}
                                ></i>
                              </div>
                              <span className="fw-medium text-dark">{r.title}</span>
                            </div>
                          </td>
                          <td className="text-secondary">{r.category}</td>
                          <td className="text-secondary">{formatDate(r.date)}</td>
                          <td>
                            <span
                              className={`badge px-2 py-1 ${
                                r.type === 'Deposit'
                                  ? 'bg-success-subtle text-success'
                                  : r.type === 'Withdrawal'
                                  ? 'bg-danger-subtle text-danger'
                                  : 'bg-info-subtle text-info'
                              }`}
                            >
                              {r.type}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-status ${r.status.toLowerCase()}`}>
                              {r.status}
                            </span>
                          </td>
                          <td
                            className={`text-end pe-3 fw-bold ${
                              r.type === 'Deposit' ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {r.type === 'Deposit' ? '+' : '-'} {formatCurrency(r.amount)}
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

export default Documents;
