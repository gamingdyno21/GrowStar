import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { useToast } from '../../context/ToastContext';
import userService from '../../services/userService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

/* ── SVG Chart ──────────────────────────────────────────────── */
const ProfitChart = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: '#94a3b8' }}>
        <i className="bi bi-graph-up d-block" style={{ fontSize: '2.5rem', color: '#d1d5db', marginBottom: '0.75rem' }}></i>
        <p style={{ fontSize: '0.875rem', margin: 0, color: '#94a3b8' }}>No profit history yet.</p>
      </div>
    );
  }

  const W = 500, H = 140, PAD = 20;
  const profits = history.map(h => h.profit);
  const maxP = Math.max(...profits, 100);
  const minP = Math.min(...profits, 0);
  const range = maxP - minP || 1;

  const pts = history.map((h, i) => ({
    x: PAD + (i / Math.max(history.length - 1, 1)) * (W - 2 * PAD),
    y: H - PAD - ((h.profit - minP) / range) * (H - 2 * PAD),
    profit: h.profit,
    date: new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  }));

  const pathD = pts.reduce((a, p, i) => a + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = pts.length
    ? `${pathD} L ${pts[pts.length-1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`
    : '';

  return (
    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '120px' }}>
        <defs>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD} y1={H/2} x2={W-PAD} y2={H/2} stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1={PAD} y1={H-PAD} x2={W-PAD} y2={H-PAD} stroke="#e2e8f0" />
        {areaD && <path d={areaD} fill="url(#profitGrad)" />}
        {pathD  && <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#2563EB" stroke="#fff" strokeWidth="2" />
            <title>{`${p.date}: ₹${p.profit.toLocaleString('en-IN')}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────── */
const ClientDashboard = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

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
      const profileRes = await userService.getProfile();
      if (profileRes.success && profileRes.data) setProfile(profileRes.data);

      const recordsRes = await userService.getRecords();
      if (recordsRes.success) {
        setTransactions(recordsRes.data.filter(r => r.type === 'Deposit' || r.type === 'Withdrawal'));
      }
    } catch {
      showToast('Failed to load portfolio details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const portfolio = profile?.portfolio || {
    totalInvested: 0, currentProfit: 0, totalPortfolioValue: 0,
    totalWithdrawn: 0, todaysProfit: 0,
  };

  const metricCards = [
    {
      label: 'Total Invested',
      value: formatCurrency(portfolio.totalInvested),
      icon: 'bi-cash-stack',
      iconBg: 'rgba(37,99,235,0.08)',
      iconColor: '#2563EB',
    },
    {
      label: 'Current Profit',
      value: (portfolio.currentProfit >= 0 ? '+' : '') + formatCurrency(portfolio.currentProfit),
      icon: 'bi-graph-up-arrow',
      iconBg: portfolio.currentProfit >= 0 ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
      iconColor: portfolio.currentProfit >= 0 ? '#059669' : '#dc2626',
      valueColor: portfolio.currentProfit >= 0 ? '#059669' : '#dc2626',
    },
    {
      label: 'Portfolio Value',
      value: formatCurrency(portfolio.totalPortfolioValue),
      icon: 'bi-pie-chart-fill',
      iconBg: 'rgba(124,58,237,0.08)',
      iconColor: '#7c3aed',
    },
    {
      label: 'Total Withdrawn',
      value: formatCurrency(portfolio.totalWithdrawn),
      icon: 'bi-wallet2',
      iconBg: 'rgba(217,119,6,0.08)',
      iconColor: '#d97706',
    },
    {
      label: "Today's Profit",
      value: (portfolio.todaysProfit >= 0 ? '+' : '') + formatCurrency(portfolio.todaysProfit),
      icon: 'bi-lightning-charge-fill',
      iconBg: portfolio.todaysProfit >= 0 ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
      iconColor: portfolio.todaysProfit >= 0 ? '#059669' : '#dc2626',
      valueColor: portfolio.todaysProfit >= 0 ? '#059669' : '#dc2626',
    },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div className="container flex-grow-1 py-4" style={{ maxWidth: '1280px' }}>

        {/* Status banners */}
        {profile?.status === 'Pending' && (
          <div
            className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 animate-fade"
            style={{ background: '#fefce8', border: '1px solid #fde047', color: '#854d0e' }}
          >
            <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0" style={{ color: '#d97706' }}></i>
            <div>
              <strong style={{ display: 'block', fontSize: '0.875rem' }}>KYC Verification In Progress</strong>
              <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>
                Your PAN and Aadhaar are under review. Full features available after approval.
              </span>
            </div>
          </div>
        )}
        {profile?.status === 'Rejected' && (
          <div
            className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 animate-fade"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
          >
            <i className="bi bi-x-octagon-fill fs-5 flex-shrink-0" style={{ color: '#dc2626' }}></i>
            <div>
              <strong style={{ display: 'block', fontSize: '0.875rem' }}>Verification Discrepancies Found</strong>
              <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>
                KYC verification flagged errors. Please update your profile or contact support.
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <Loader message="Loading your portfolio..." skeleton rows={5} />
        ) : (
          <div className="animate-fade">

            {/* Welcome line */}
            <div className="mb-4">
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.375rem', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                Welcome back, {user?.fullName?.split(' ')[0] || 'Investor'} 👋
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                Here's your portfolio overview for today
              </p>
            </div>

            {/* Metric Cards */}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-5 g-3 mb-4">
              {metricCards.map((m, i) => (
                <div key={i} className="col">
                  <div className="metric-card h-100">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.iconColor, fontSize: '1.1875rem' }}>
                        <i className={`bi ${m.icon}`}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.25rem' }}>
                          {m.label}
                        </span>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: m.valueColor || '#0f172a', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.value}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Content Grid */}
            <div className="row g-4">

              {/* Left Column */}
              <div className="col-lg-8">

                {/* Active Investments */}
                <Card title="Active Investment Assets" className="mb-4">
                  {!profile?.activeInvestments || profile.activeInvestments.length === 0 ? (
                    <div className="text-center py-5" style={{ color: '#94a3b8' }}>
                      <i className="bi bi-database-exclamation d-block" style={{ fontSize: '2.5rem', color: '#d1d5db', marginBottom: '0.75rem' }}></i>
                      <p style={{ fontSize: '0.875rem', margin: 0 }}>No active investments in your portfolio.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr>
                            <th className="ps-2">Asset / Share</th>
                            <th>Invested</th>
                            <th>Current Value</th>
                            <th>P&amp;L</th>
                            <th className="text-end pe-2">Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.activeInvestments.map(inv => {
                            const pl = inv.currentValue - inv.investedAmount;
                            const isProfit = pl >= 0;
                            return (
                              <tr key={inv._id}>
                                <td className="ps-2 fw-600" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                                  {inv.shareName}
                                </td>
                                <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{formatCurrency(inv.investedAmount)}</td>
                                <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(inv.currentValue)}</td>
                                <td>
                                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isProfit ? '#059669' : '#dc2626' }}>
                                    {isProfit ? '+' : ''}{formatCurrency(pl)}
                                  </span>
                                </td>
                                <td className="text-end pe-2" style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                                  {formatDate(inv.lastUpdated)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Transaction History */}
                <Card title="Transaction History">
                  {transactions.length === 0 ? (
                    <div className="text-center py-5" style={{ color: '#94a3b8' }}>
                      <i className="bi bi-wallet-fill d-block" style={{ fontSize: '2.5rem', color: '#d1d5db', marginBottom: '0.75rem' }}></i>
                      <p style={{ fontSize: '0.875rem', margin: 0 }}>No deposit or withdrawal activities found.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr>
                            <th className="ps-2">Type</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th className="text-end pe-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(t => (
                            <tr key={t._id}>
                              <td className="ps-2">
                                <span
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    padding: '0.2em 0.625em', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                                    background: t.type === 'Deposit' ? '#d1fae5' : '#fee2e2',
                                    color: t.type === 'Deposit' ? '#059669' : '#dc2626',
                                  }}
                                >
                                  <i className={`bi ${t.type === 'Deposit' ? 'bi-arrow-down-circle-fill' : 'bi-arrow-up-circle-fill'}`}></i>
                                  {t.type}
                                </span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{t.category}</td>
                              <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{formatDate(t.date)}</td>
                              <td>
                                <span className={`badge-status ${t.status.toLowerCase()}`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="text-end pe-2">
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: t.type === 'Deposit' ? '#059669' : '#dc2626' }}>
                                  {t.type === 'Deposit' ? '+' : '-'} {formatCurrency(t.amount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column */}
              <div className="col-lg-4">
                <Card title="Daily Profit Analysis">
                  <ProfitChart history={profile?.dailyProfitHistory} />

                  {profile?.dailyProfitHistory && profile.dailyProfitHistory.length > 0 && (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table align-middle mb-0" style={{ fontSize: '0.8375rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                          <tr>
                            <th className="ps-0" style={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                            <th className="text-end pe-0" style={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...profile.dailyProfitHistory].reverse().map(h => (
                            <tr key={h._id}>
                              <td className="ps-0" style={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(h.date)}</td>
                              <td className="text-end pe-0" style={{ fontWeight: 700, color: h.profit >= 0 ? '#059669' : '#dc2626' }}>
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

      <Footer />
    </div>
  );
};

export default ClientDashboard;
