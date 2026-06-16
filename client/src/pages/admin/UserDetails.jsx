import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import Footer from '../../components/layout/Footer';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import adminService from '../../services/adminService';
import { formatCurrency, formatDate } from '../../utils/helpers';

const UserDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('dossier'); // dossier, portfolio, investments, profits, ledger
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  // Portfolio Summary Form State
  const [portfolioForm, setPortfolioForm] = useState({
    totalInvested: '',
    currentProfit: '',
    totalPortfolioValue: '',
    totalWithdrawn: '',
    todaysProfit: ''
  });

  // Active Investments Forms State
  const [newInv, setNewInv] = useState({ shareName: '', investedAmount: '', currentValue: '' });
  const [editingInv, setEditingInv] = useState(null); // holds inv object being edited

  // Daily Profit Forms State
  const [newProfit, setNewProfit] = useState({ date: '', profit: '' });

  // Transactions Forms State
  const [newTrans, setNewTrans] = useState({
    title: '',
    amount: '',
    type: 'Deposit',
    category: 'Bank Deposit',
    date: '',
    status: 'Completed',
    description: ''
  });
  const [editingTrans, setEditingTrans] = useState(null); // holds trans object being edited

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUserDetails(id);
      if (res.success && res.data) {
        setData(res.data);
        const userProf = res.data.profile;
        const port = userProf.portfolio || {};
        setPortfolioForm({
          totalInvested: port.totalInvested !== undefined ? port.totalInvested : 0,
          currentProfit: port.currentProfit !== undefined ? port.currentProfit : 0,
          totalPortfolioValue: port.totalPortfolioValue !== undefined ? port.totalPortfolioValue : 0,
          totalWithdrawn: port.totalWithdrawn !== undefined ? port.totalWithdrawn : 0,
          todaysProfit: port.todaysProfit !== undefined ? port.todaysProfit : 0
        });
      }
    } catch (err) {
      console.error('Failed to retrieve client details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!window.confirm(`Set status of this account to ${status}?`)) return;
    setUpdating(true);
    try {
      const res = await adminService.updateUserStatus(id, status);
      if (res.success) {
        fetchClientDetails();
      }
    } catch (err) {
      alert('Verification status change failed.');
    } finally {
      setUpdating(false);
    }
  };

  // 1. Submit Portfolio Stats
  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await adminService.updateUserPortfolio(id, portfolioForm);
      if (res.success) {
        alert('Client portfolio statistics successfully updated.');
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to update portfolio statistics.');
    } finally {
      setUpdating(false);
    }
  };

  // 2. Active Investments Actions
  const handleAddInvestment = async (e) => {
    e.preventDefault();
    if (!newInv.shareName || newInv.investedAmount === '' || newInv.currentValue === '') {
      alert('Please fill out all investment fields.');
      return;
    }
    setUpdating(true);
    try {
      const res = await adminService.addActiveInvestment(id, newInv);
      if (res.success) {
        setNewInv({ shareName: '', investedAmount: '', currentValue: '' });
        alert('Investment asset successfully added.');
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to add investment asset.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateInvestment = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await adminService.updateActiveInvestment(id, editingInv._id, editingInv);
      if (res.success) {
        setEditingInv(null);
        alert('Investment asset successfully updated.');
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to update investment asset.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteInvestment = async (invId) => {
    if (!window.confirm('Delete this active investment asset?')) return;
    setUpdating(true);
    try {
      const res = await adminService.deleteActiveInvestment(id, invId);
      if (res.success) {
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to delete investment.');
    } finally {
      setUpdating(false);
    }
  };

  // 3. Daily Profit Actions
  const handleAddDailyProfit = async (e) => {
    e.preventDefault();
    if (newProfit.profit === '') {
      alert('Profit amount is required.');
      return;
    }
    setUpdating(true);
    try {
      const res = await adminService.addDailyProfit(id, newProfit);
      if (res.success) {
        setNewProfit({ date: '', profit: '' });
        alert('Daily profit data point successfully registered.');
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to register profit data point.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDailyProfit = async (profitId) => {
    if (!window.confirm('Remove this profit history entry?')) return;
    setUpdating(true);
    try {
      const res = await adminService.deleteDailyProfit(id, profitId);
      if (res.success) {
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to remove profit history entry.');
    } finally {
      setUpdating(false);
    }
  };

  // 4. Ledger Transaction Actions
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTrans.title || newTrans.amount === '' || !newTrans.type || !newTrans.category) {
      alert('Please fill out title, amount, type and category.');
      return;
    }
    setUpdating(true);
    try {
      const res = await adminService.addUserTransaction(id, newTrans);
      if (res.success) {
        setNewTrans({
          title: '',
          amount: '',
          type: 'Deposit',
          category: 'Bank Deposit',
          date: '',
          status: 'Completed',
          description: ''
        });
        alert('Transaction successfully registered in ledger.');
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to register transaction.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await adminService.updateUserTransaction(id, editingTrans._id, editingTrans);
      if (res.success) {
        setEditingTrans(null);
        alert('Transaction record successfully updated.');
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to update transaction record.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTransaction = async (transId) => {
    if (!window.confirm('Are you sure you want to delete this transaction ledger record?')) return;
    setUpdating(true);
    try {
      const res = await adminService.deleteUserTransaction(id, transId);
      if (res.success) {
        fetchClientDetails();
      }
    } catch (err) {
      alert('Failed to remove transaction record.');
    } finally {
      setUpdating(false);
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
          <div className="mb-3">
            <Link to="/admin/users" className="btn btn-link text-decoration-none p-0 text-secondary">
              <i className="bi bi-arrow-left me-1"></i> Back to Client List
            </Link>
          </div>

          {loading ? (
            <Loader message="Loading client portfolio dossier..." />
          ) : !data ? (
            <div className="alert alert-danger">Client dossier not found.</div>
          ) : (
            <div className="animate-fade">
              <PageHeader
                title={data.profile.fullName}
                subtitle={`Verification Status: ${data.profile.status}`}
                action={
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusUpdate('Approved')}
                      disabled={updating || data.profile.status === 'Approved'}
                    >
                      <i className="bi bi-patch-check me-1"></i> Approve KYC
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleStatusUpdate('Rejected')}
                      disabled={updating || data.profile.status === 'Rejected'}
                    >
                      <i className="bi bi-x-octagon me-1"></i> Reject KYC
                    </button>
                  </div>
                }
              />

              {/* Sub-navigation tabs */}
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button className={`nav-link fw-semibold px-4 ${activeTab === 'dossier' ? 'active text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('dossier')}>
                    <i className="bi bi-person-vcard me-2"></i> KYC Dossier & Security
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-semibold px-4 ${activeTab === 'portfolio' ? 'active text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('portfolio')}>
                    <i className="bi bi-percent me-2"></i> Portfolio Summary
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-semibold px-4 ${activeTab === 'investments' ? 'active text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('investments')}>
                    <i className="bi bi-graph-up-arrow me-2"></i> Active Investments
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-semibold px-4 ${activeTab === 'profits' ? 'active text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('profits')}>
                    <i className="bi bi-clock-history me-2"></i> Daily Profits
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-semibold px-4 ${activeTab === 'ledger' ? 'active text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('ledger')}>
                    <i className="bi bi-journal-text me-2"></i> Transactions Ledger
                  </button>
                </li>
              </ul>

              <div className="tab-content text-start">
                
                {/* TAB 1: KYC Dossier and details */}
                {activeTab === 'dossier' && (
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <Card title="KYC Dossier & Credentials">
                        <div className="list-group list-group-flush text-start">
                          {data.profile.profilePic ? (
                            <div className="list-group-item bg-transparent px-0 border-light text-center py-3">
                              <img
                                src={data.profile.profilePic}
                                alt="Profile Avatar"
                                className="rounded-circle border object-fit-cover shadow"
                                style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                                onClick={() => setShowFullPhoto(true)}
                              />
                              <div className="text-secondary small mt-2">
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold text-primary" 
                                  onClick={() => setShowFullPhoto(true)}
                                >
                                  <i className="bi bi-zoom-in me-1"></i> View Full Size Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="list-group-item bg-transparent px-0 border-light text-center py-3 text-secondary small">
                              <i className="bi bi-person-circle fs-3 d-block mb-1 text-muted"></i>
                              No profile photo uploaded.
                            </div>
                          )}
                          <div className="list-group-item bg-transparent px-0 border-light">
                            <span className="text-secondary small d-block">Full Legal Name</span>
                            <span className="fw-bold">{data.profile.fullName}</span>
                          </div>
                          <div className="list-group-item bg-transparent px-0 border-light">
                            <span className="text-secondary small d-block">Email Address</span>
                            <span className="fw-bold">{data.profile.email}</span>
                          </div>
                          <div className="list-group-item bg-transparent px-0 border-light">
                            <span className="text-secondary small d-block">Contact Phone</span>
                            <span className="fw-bold">{data.profile.phone || data.profile.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="list-group-item bg-transparent px-0 border-light">
                            <span className="text-secondary small d-block">Residential Address</span>
                            <span className="fw-bold">{data.profile.address}</span>
                          </div>
                          <div className="list-group-item bg-transparent px-0 border-light">
                            <div className="row">
                              <div className="col-6">
                                <span className="text-secondary small d-block">PAN Number</span>
                                <span className="fw-bold font-monospace">{data.profile.panNumber || 'N/A'}</span>
                              </div>
                              <div className="col-6">
                                <span className="text-secondary small d-block">Aadhaar Number</span>
                                <span className="fw-bold font-monospace">{data.profile.aadhaarNumber || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="list-group-item bg-transparent px-0 border-light pt-3">
                            <span className="d-block fw-bold text-primary small text-uppercase mb-2">Settlement Bank Account</span>
                            <div className="row">
                              <div className="col-md-6 mb-2">
                                <span className="text-secondary small d-block">Bank Name</span>
                                <span className="fw-semibold">{data.profile.bankDetails?.bankName || 'Not Set'}</span>
                              </div>
                              <div className="col-md-6 mb-2">
                                <span className="text-secondary small d-block">Account Number</span>
                                <span className="fw-semibold font-monospace">{data.profile.bankDetails?.accountNumber || 'Not Set'}</span>
                              </div>
                              <div className="col-md-6 mb-2">
                                <span className="text-secondary small d-block">IFSC Code</span>
                                <span className="fw-semibold font-monospace">{data.profile.bankDetails?.ifscCode || 'Not Set'}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </Card>
                    </div>

                    <div className="col-lg-6">
                      <Card title="Security Audit Logs">
                        {data.logs.length === 0 ? (
                          <div className="text-center py-4 text-secondary">
                            No operations registered in client activity log.
                          </div>
                        ) : (
                          <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="pe-1">
                            <div className="list-group list-group-flush text-start">
                              {data.logs.map((log) => (
                                <div key={log._id} className="list-group-item bg-transparent px-0 border-light py-2">
                                  <div className="d-flex justify-content-between small mb-1">
                                    <span className="fw-bold text-primary">{log.action}</span>
                                    <span className="text-secondary">{formatDate(log.createdAt)}</span>
                                  </div>
                                  <p className="text-secondary mb-1 small">{log.details}</p>
                                  <small className="text-secondary font-monospace" style={{ fontSize: '0.7rem' }}>
                                    IP: {log.ipAddress || '127.0.0.1'}
                                  </small>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                )}

                {/* TAB 2: Edit Portfolio Stats */}
                {activeTab === 'portfolio' && (
                  <div className="row g-4">
                    <div className="col-md-8 col-lg-6">
                      <Card title="Configure Portfolio Summary Numbers">
                        <form onSubmit={handlePortfolioSubmit}>
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small">Total Invested Amount (INR)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={portfolioForm.totalInvested}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, totalInvested: e.target.value })}
                              placeholder="e.g. 45000"
                            />
                          </div>
                          
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small">Current Profit (INR - use negative for loss)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={portfolioForm.currentProfit}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, currentProfit: e.target.value })}
                              placeholder="e.g. 8200"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small">Total Portfolio Value (INR)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={portfolioForm.totalPortfolioValue}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, totalPortfolioValue: e.target.value })}
                              placeholder="e.g. 53200"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small">Total Withdrawn Amount (INR)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={portfolioForm.totalWithdrawn}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, totalWithdrawn: e.target.value })}
                              placeholder="e.g. 12000"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small">Today's Profit (INR - use negative for loss)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={portfolioForm.todaysProfit}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, todaysProfit: e.target.value })}
                              placeholder="e.g. 450"
                            />
                          </div>

                          <button type="submit" className="btn btn-primary px-4 mt-2" disabled={updating}>
                            {updating ? 'Saving Stats...' : 'Save Portfolio Statistics'}
                          </button>
                        </form>
                      </Card>
                    </div>
                  </div>
                )}

                {/* TAB 3: Manage Investments */}
                {activeTab === 'investments' && (
                  <div className="row g-4">
                    {/* List Investments */}
                    <div className="col-lg-8">
                      <Card title="Current Asset Holdings">
                        {!data.profile.activeInvestments || data.profile.activeInvestments.length === 0 ? (
                          <div className="text-center py-5 text-secondary">
                            No active investments added yet.
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 text-start">
                              <thead>
                                <tr className="table-light">
                                  <th className="ps-3 border-0">Asset Name</th>
                                  <th className="border-0">Invested Capital</th>
                                  <th className="border-0">Current Value</th>
                                  <th className="border-0">Profit/Loss</th>
                                  <th className="text-end pe-3 border-0">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.profile.activeInvestments.map((inv) => {
                                  const netPL = inv.currentValue - inv.investedAmount;
                                  return (
                                    <tr key={inv._id}>
                                      <td className="ps-3 fw-bold">{inv.shareName}</td>
                                      <td>{formatCurrency(inv.investedAmount)}</td>
                                      <td>{formatCurrency(inv.currentValue)}</td>
                                      <td className={`fw-bold ${netPL >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {netPL >= 0 ? '+' : ''}{formatCurrency(netPL)}
                                      </td>
                                      <td className="text-end pe-3">
                                        <button
                                          className="btn btn-sm btn-outline-secondary px-2 me-2"
                                          onClick={() => setEditingInv(inv)}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="btn btn-sm btn-danger px-2"
                                          onClick={() => handleDeleteInvestment(inv._id)}
                                        >
                                          Delete
                                        </button>
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

                    {/* Add/Edit Panel */}
                    <div className="col-lg-4">
                      {editingInv ? (
                        <Card title="Edit Investment Asset">
                          <form onSubmit={handleUpdateInvestment}>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Share Name</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editingInv.shareName}
                                onChange={(e) => setEditingInv({ ...editingInv, shareName: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Invested Amount (INR)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editingInv.investedAmount}
                                onChange={(e) => setEditingInv({ ...editingInv, investedAmount: e.target.value })}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small text-secondary fw-semibold">Current Value (INR)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editingInv.currentValue}
                                onChange={(e) => setEditingInv({ ...editingInv, currentValue: e.target.value })}
                              />
                            </div>
                            <div className="d-flex gap-2">
                              <button type="submit" className="btn btn-success btn-sm flex-grow-1" disabled={updating}>
                                Save Changes
                              </button>
                              <button type="button" className="btn btn-secondary btn-sm flex-grow-1" onClick={() => setEditingInv(null)}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        </Card>
                      ) : (
                        <Card title="Add Asset Holding">
                          <form onSubmit={handleAddInvestment}>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Share Name</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. Reliance"
                                value={newInv.shareName}
                                onChange={(e) => setNewInv({ ...newInv, shareName: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Invested Amount (INR)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="e.g. 20000"
                                value={newInv.investedAmount}
                                onChange={(e) => setNewInv({ ...newInv, investedAmount: e.target.value })}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small text-secondary fw-semibold">Current Value (INR)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="e.g. 23500"
                                value={newInv.currentValue}
                                onChange={(e) => setNewInv({ ...newInv, currentValue: e.target.value })}
                              />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm w-100" disabled={updating}>
                              Add Asset
                            </button>
                          </form>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: Daily Profit Timeline */}
                {activeTab === 'profits' && (
                  <div className="row g-4">
                    {/* List Profit Timeline */}
                    <div className="col-lg-8">
                      <Card title="Daily Profit Timeline History">
                        {!data.profile.dailyProfitHistory || data.profile.dailyProfitHistory.length === 0 ? (
                          <div className="text-center py-5 text-secondary">
                            No profit history points added yet.
                          </div>
                        ) : (
                          <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            <table className="table table-hover align-middle mb-0 text-start">
                              <thead>
                                <tr className="table-light">
                                  <th className="ps-3 border-0">Date</th>
                                  <th className="border-0">Profit Registered</th>
                                  <th className="text-end pe-3 border-0">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...data.profile.dailyProfitHistory].reverse().map((h) => (
                                  <tr key={h._id}>
                                    <td className="ps-3">{formatDate(h.date)}</td>
                                    <td className={`fw-bold ${h.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                      {h.profit >= 0 ? '+' : ''}{formatCurrency(h.profit)}
                                    </td>
                                    <td className="text-end pe-3">
                                      <button
                                        className="btn btn-sm btn-danger px-2 py-0.5"
                                        onClick={() => handleDeleteDailyProfit(h._id)}
                                      >
                                        Delete
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

                    {/* Add Profit Timeline entry */}
                    <div className="col-lg-4">
                      <Card title="Register Daily Profit Point">
                        <form onSubmit={handleAddDailyProfit}>
                          <div className="mb-2">
                            <label className="form-label small text-secondary fw-semibold">Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={newProfit.date}
                              onChange={(e) => setNewProfit({ ...newProfit, date: e.target.value })}
                            />
                            <span className="text-secondary small d-block mt-0.5" style={{ fontSize: '0.7rem' }}>Leave blank to default to today.</span>
                          </div>
                          <div className="mb-3">
                            <label className="form-label small text-secondary fw-semibold">Profit Amount (INR - use negative for loss)</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="e.g. 450"
                              value={newProfit.profit}
                              onChange={(e) => setNewProfit({ ...newProfit, profit: e.target.value })}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary btn-sm w-100" disabled={updating}>
                            Add Profit Point
                          </button>
                        </form>
                      </Card>
                    </div>
                  </div>
                )}

                {/* TAB 5: Manage Ledger (Transactions) */}
                {activeTab === 'ledger' && (
                  <div className="row g-4">
                    {/* List Ledger */}
                    <div className="col-lg-8">
                      <Card title="Ledger Transactions Registry">
                        {data.records.length === 0 ? (
                          <div className="text-center py-5 text-secondary">
                            No transactions exist in client ledger.
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 text-start">
                              <thead>
                                <tr className="table-light">
                                  <th className="ps-3 border-0">Type</th>
                                  <th className="border-0">Category / Purpose</th>
                                  <th className="border-0">Date</th>
                                  <th className="border-0">Status</th>
                                  <th className="border-0">Amount</th>
                                  <th className="text-end pe-3 border-0">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.records.map((r) => (
                                  <tr key={r._id}>
                                    <td className="ps-3">
                                      <span className={`badge ${r.type === 'Deposit' || r.type === 'Income' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2 py-0.5`}>
                                        {r.type}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="fw-semibold d-block">{r.title}</span>
                                      <span className="small text-secondary">{r.category}</span>
                                    </td>
                                    <td className="text-secondary small">{formatDate(r.date)}</td>
                                    <td>
                                      <span className={`badge badge-status ${r.status.toLowerCase()}`}>
                                        {r.status}
                                      </span>
                                    </td>
                                    <td className={`fw-bold ${r.type === 'Deposit' || r.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                                      {r.type === 'Deposit' || r.type === 'Income' ? '+' : '-'} {formatCurrency(r.amount)}
                                    </td>
                                    <td className="text-end pe-3">
                                      <button
                                        className="btn btn-sm btn-outline-secondary px-2 me-1 py-0.5"
                                        onClick={() => setEditingTrans(r)}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="btn btn-sm btn-danger px-2 py-0.5"
                                        onClick={() => handleDeleteTransaction(r._id)}
                                      >
                                        Delete
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

                    {/* Add/Edit Panel */}
                    <div className="col-lg-4">
                      {editingTrans ? (
                        <Card title="Edit Ledger Entry">
                          <form onSubmit={handleUpdateTransaction}>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Title</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editingTrans.title}
                                onChange={(e) => setEditingTrans({ ...editingTrans, title: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Amount (INR)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editingTrans.amount}
                                onChange={(e) => setEditingTrans({ ...editingTrans, amount: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Type</label>
                              <select
                                className="form-select form-select-sm"
                                value={editingTrans.type}
                                onChange={(e) => setEditingTrans({ ...editingTrans, type: e.target.value })}
                              >
                                <option value="Deposit">Deposit</option>
                                <option value="Withdrawal">Withdrawal</option>
                                <option value="Income">Income (Legacy)</option>
                                <option value="Expense">Expense (Legacy)</option>
                                <option value="Investment">Investment (Legacy)</option>
                              </select>
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Category</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editingTrans.category}
                                onChange={(e) => setEditingTrans({ ...editingTrans, category: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Date</label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={editingTrans.date ? editingTrans.date.split('T')[0] : ''}
                                onChange={(e) => setEditingTrans({ ...editingTrans, date: e.target.value })}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small text-secondary fw-semibold">Status</label>
                              <select
                                className="form-select form-select-sm"
                                value={editingTrans.status}
                                onChange={(e) => setEditingTrans({ ...editingTrans, status: e.target.value })}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Failed">Failed</option>
                              </select>
                            </div>
                            <div className="d-flex gap-2">
                              <button type="submit" className="btn btn-success btn-sm flex-grow-1" disabled={updating}>
                                Save Record
                              </button>
                              <button type="button" className="btn btn-secondary btn-sm flex-grow-1" onClick={() => setEditingTrans(null)}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        </Card>
                      ) : (
                        <Card title="Add Ledger Transaction">
                          <form onSubmit={handleAddTransaction}>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Transaction Title</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. Deposit Rel Capital"
                                value={newTrans.title}
                                onChange={(e) => setNewTrans({ ...newTrans, title: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Amount (INR)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="e.g. 10000"
                                value={newTrans.amount}
                                onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Type</label>
                              <select
                                className="form-select form-select-sm"
                                value={newTrans.type}
                                onChange={(e) => setNewTrans({ ...newTrans, type: e.target.value })}
                              >
                                <option value="Deposit">Deposit</option>
                                <option value="Withdrawal">Withdrawal</option>
                              </select>
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Category</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. Bank Deposit"
                                value={newTrans.category}
                                onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value })}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small text-secondary fw-semibold">Date</label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={newTrans.date}
                                onChange={(e) => setNewTrans({ ...newTrans, date: e.target.value })}
                              />
                              <span className="text-secondary small d-block mt-0.5" style={{ fontSize: '0.7rem' }}>Leave blank to default to today.</span>
                            </div>
                            <div className="mb-3">
                              <label className="form-label small text-secondary fw-semibold">Status</label>
                              <select
                                className="form-select form-select-sm"
                                value={newTrans.status}
                                onChange={(e) => setNewTrans({ ...newTrans, status: e.target.value })}
                              >
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                              </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm w-100" disabled={updating}>
                              Add Ledger Entry
                            </button>
                          </form>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <Footer adminMode={true} />
        </div>
      </div>
      {/* Full Size Profile Photo Modal */}
      {showFullPhoto && data?.profile?.profilePic && (
        <div 
          className="modal show d-block animate-fade" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 2000, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => setShowFullPhoto(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="modal-header">
                <h5 className="modal-title">Full Size Profile Photo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowFullPhoto(false)}
                ></button>
              </div>
              <div className="modal-body text-center bg-dark p-3">
                <img 
                  src={data.profile.profilePic} 
                  alt="Full Size Profile Avatar" 
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowFullPhoto(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
