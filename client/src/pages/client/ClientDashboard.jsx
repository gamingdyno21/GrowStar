import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import userService from '../../services/userService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const ClientDashboard = () => {
  const { user, refreshUser } = useAuth();
  
  // Dashboard & Profile Data
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile & Portfolio Details
      const profileRes = await userService.getProfile();
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      }

      // 2. Fetch Transaction History
      const recordsRes = await userService.getRecords();
      if (recordsRes.success) {
        // Only show Deposit & Withdrawal as per Section 4 requirement
        const filtered = recordsRes.data.filter(
          r => r.type === 'Deposit' || r.type === 'Withdrawal'
        );
        setTransactions(filtered);
      }
    } catch (err) {
      console.error('Failed to load client portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to draw SVG line chart for Section 3
  const renderSVGChart = (history) => {
    if (!history || history.length === 0) {
      return (
        <div className="text-center py-4 text-secondary my-3 bg-light-subtle rounded border">
          <i className="bi bi-graph-up d-block fs-3 mb-1 text-muted"></i>
          <span className="small">No profit history points added yet.</span>
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const padding = 20;

    const profits = history.map(h => h.profit);
    const maxProfit = Math.max(...profits, 100);
    const minProfit = Math.min(...profits, 0);
    const profitRange = maxProfit - minProfit || 1;

    const points = history.map((h, index) => {
      const x = padding + (index / (history.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((h.profit - minProfit) / profitRange) * (height - 2 * padding);
      return { x, y, profit: h.profit, date: new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) };
    });

    const pathD = points.reduce((acc, p, i) => {
      return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="bg-light p-3 rounded-3 border mb-3">
        <div className="ratio ratio-21x9" style={{ maxHeight: '160px' }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-100 h-100">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(37, 99, 235, 0.2)" />
                <stop offset="100%" stopColor="rgba(37, 99, 235, 0.0)" />
              </linearGradient>
            </defs>
            <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width-padding} y2={height - padding} stroke="#cbd5e1" />
            {areaD && <path d={areaD} fill="url(#chartGradient)" />}
            {pathD && <path d={pathD} fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" />}
            {points.map((p, i) => (
              <g key={i} className="chart-dot">
                <circle cx={p.x} cy={p.y} r="4" fill="var(--accent-blue)" stroke="#ffffff" strokeWidth="1.5" />
                <title>{`${p.date}: ₹${p.profit}`}</title>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const getPortfolioValue = () => {
    return profile?.portfolio || {
      totalInvested: 0,
      currentProfit: 0,
      totalPortfolioValue: 0,
      totalWithdrawn: 0,
      todaysProfit: 0
    };
  };

  const portfolio = getPortfolioValue();

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar />

      <div className="container py-4">
        {/* Verification Status Banner */}
        {profile?.status === 'Pending' && (
          <div className="alert alert-warning border-warning-subtle d-flex align-items-center mb-4 p-3 rounded-3 shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-4 text-warning me-3"></i>
            <div>
              <h6 className="alert-heading fw-bold mb-1">KYC Verification In Progress</h6>
              <span className="small text-secondary">
                Your PAN and Aadhaar credentials are currently undergoing review by our compliance team. Full investment options will remain view-only during auditing.
              </span>
            </div>
          </div>
        )}

        {profile?.status === 'Rejected' && (
          <div className="alert alert-danger border-danger-subtle d-flex align-items-center mb-4 p-3 rounded-3 shadow-sm" role="alert">
            <i className="bi bi-x-octagon-fill fs-4 text-danger me-3"></i>
            <div>
              <h6 className="alert-heading fw-bold mb-1">Verification Discrepancies Found</h6>
              <span className="small text-secondary">
                Our verification checks flagged errors in your uploaded KYC documentation. Please verify your details in the Profile page or contact support.
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <Loader message="Loading your GrowStar portfolio..." />
        ) : (
          <div className="animate-fade">
            
            {/* SECTION 1: Investment Summary Cards */}
            <div className="row g-3 mb-4 text-start">
              <div className="col-12 col-md">
                <div className="metric-card h-100 d-flex flex-row align-items-center ps-4">
                  <div className="bg-primary-subtle text-primary p-2.5 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }}>
                    <i className="bi bi-cash fs-5"></i>
                  </div>
                  <div>
                    <span className="text-secondary small fw-semibold d-block text-uppercase">Total Invested</span>
                    <h5 className="fw-bold text-dark mb-0">{formatCurrency(portfolio.totalInvested)}</h5>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md">
                <div className="metric-card h-100 d-flex flex-row align-items-center ps-4">
                  <div className="bg-success-subtle text-success p-2.5 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }}>
                    <i className="bi bi-graph-up-arrow fs-5"></i>
                  </div>
                  <div>
                    <span className="text-secondary small fw-semibold d-block text-uppercase">Current Profit</span>
                    <h5 className={`fw-bold mb-0 ${portfolio.currentProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {portfolio.currentProfit >= 0 ? '+' : ''}{formatCurrency(portfolio.currentProfit)}
                    </h5>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md">
                <div className="metric-card h-100 d-flex flex-row align-items-center ps-4">
                  <div className="bg-primary-subtle text-primary p-2.5 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: '#eff6ff', color: 'var(--accent-blue)' }}>
                    <i className="bi bi-shield-fill-check fs-5"></i>
                  </div>
                  <div>
                    <span className="text-secondary small fw-semibold d-block text-uppercase">Portfolio Value</span>
                    <h5 className="fw-bold text-dark mb-0">{formatCurrency(portfolio.totalPortfolioValue)}</h5>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md">
                <div className="metric-card h-100 d-flex flex-row align-items-center ps-4">
                  <div className="bg-danger-subtle text-danger p-2.5 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }}>
                    <i className="bi bi-wallet2 fs-5"></i>
                  </div>
                  <div>
                    <span className="text-secondary small fw-semibold d-block text-uppercase">Total Withdrawn</span>
                    <h5 className="fw-bold text-dark mb-0">{formatCurrency(portfolio.totalWithdrawn)}</h5>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md">
                <div className="metric-card h-100 d-flex flex-row align-items-center ps-4">
                  <div className="bg-warning-subtle text-warning p-2.5 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }}>
                    <i className="bi bi-lightning-fill fs-5"></i>
                  </div>
                  <div>
                    <span className="text-secondary small fw-semibold d-block text-uppercase">Today's Profit</span>
                    <h5 className={`fw-bold mb-0 ${portfolio.todaysProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {portfolio.todaysProfit >= 0 ? '+' : ''}{formatCurrency(portfolio.todaysProfit)}
                    </h5>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Grid: Sections 2 & 4 (Left) and Section 3 (Right) */}
            <div className="row g-4 text-start">
              
              {/* Left Column (Investment Tables & Transaction Ledger) */}
              <div className="col-lg-8">
                
                {/* SECTION 2: Active Investments Table */}
                <Card title="Active Investment Assets" className="mb-4 shadow-sm border-0">
                  {!profile?.activeInvestments || profile.activeInvestments.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-database-exclamation fs-1 mb-2 d-block text-muted"></i>
                      No active investments in your portfolio.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 text-start">
                        <thead>
                          <tr className="table-light text-secondary">
                            <th className="ps-3 border-0">Asset / Share Name</th>
                            <th className="border-0">Invested Capital</th>
                            <th className="border-0">Current Value</th>
                            <th className="border-0">Net Profit / Loss</th>
                            <th className="text-end pe-3 border-0">Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.activeInvestments.map((inv) => {
                            const netPL = inv.currentValue - inv.investedAmount;
                            const isProfit = netPL >= 0;
                            return (
                              <tr key={inv._id}>
                                <td className="ps-3 fw-bold text-dark">{inv.shareName}</td>
                                <td className="text-secondary">{formatCurrency(inv.investedAmount)}</td>
                                <td className="fw-semibold">{formatCurrency(inv.currentValue)}</td>
                                <td className={`fw-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
                                  {isProfit ? '+' : ''}{formatCurrency(netPL)}
                                </td>
                                <td className="text-end pe-3 text-secondary small">{formatDate(inv.lastUpdated)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* SECTION 4: Transaction History */}
                <Card title="Transaction History Ledger" className="shadow-sm border-0">
                  {transactions.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-wallet-fill fs-1 mb-2 d-block text-muted"></i>
                      No Deposit or Withdrawal activities found.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 text-start">
                        <thead>
                          <tr className="table-light text-secondary">
                            <th className="ps-3 border-0">Type</th>
                            <th className="border-0">Category / Purpose</th>
                            <th className="border-0">Transaction Date</th>
                            <th className="border-0">Status</th>
                            <th className="text-end pe-3 border-0">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((t) => (
                            <tr key={t._id}>
                              <td className="ps-3 fw-bold">
                                <span className={`badge ${t.type === 'Deposit' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2 py-1`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="text-secondary">{t.category}</td>
                              <td className="text-secondary">{formatDate(t.date)}</td>
                              <td>
                                <span className={`badge badge-status ${t.status.toLowerCase()}`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className={`text-end pe-3 fw-bold ${t.type === 'Deposit' ? 'text-success' : 'text-danger'}`}>
                                {t.type === 'Deposit' ? '+' : '-'} {formatCurrency(t.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

              </div>

              {/* Right Column (Profit history and timeline chart) */}
              <div className="col-lg-4">
                
                {/* SECTION 3: Daily Profit History */}
                <Card title="Daily Profit Analysis" className="shadow-sm border-0">
                  {renderSVGChart(profile?.dailyProfitHistory)}
                  
                  {!profile?.dailyProfitHistory || profile.dailyProfitHistory.length === 0 ? (
                    null
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: '315px', overflowY: 'auto' }}>
                      <table className="table table-sm align-middle text-start mb-0">
                        <thead>
                          <tr className="table-light small text-secondary">
                            <th className="ps-3 border-0">Date</th>
                            <th className="text-end pe-3 border-0">Daily Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...profile.dailyProfitHistory].reverse().map((h) => (
                            <tr key={h._id}>
                              <td className="ps-3 text-secondary">{formatDate(h.date)}</td>
                              <td className={`text-end pe-3 fw-bold ${h.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                {h.profit >= 0 ? '+' : ''}{formatCurrency(h.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
