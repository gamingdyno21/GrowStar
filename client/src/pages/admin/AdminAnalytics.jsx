import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Footer from '../../components/layout/Footer';
import adminService from '../../services/adminService';
import { formatCurrency } from '../../utils/helpers';

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalyticsData(); }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminService.getStats();
      const usersRes = await adminService.getAllUsers();
      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setClients(usersRes.data);
    } catch {
      console.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const getCount = (status) => clients.filter(c => c.status === status).length;

  const approvedCount  = getCount('Approved');
  const pendingCount   = getCount('Pending');
  const rejectedCount  = getCount('Rejected');
  const total          = clients.length || 1;
  const approvedPct    = ((approvedCount / total) * 100).toFixed(0);
  const pendingPct     = ((pendingCount  / total) * 100).toFixed(0);
  const rejectedPct    = ((rejectedCount / total) * 100).toFixed(0);
  const investorPct    = stats ? ((stats.activeInvestors / (stats.totalUsers || 1)) * 100).toFixed(0) : 0;

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f8fafc' }}>
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
          title="Platform Analytics"
          subtitle="Aggregate ledger distributions and KYC compliance statistics"
        />

        {loading ? (
          <Loader message="Compiling analytics..." skeleton rows={5} />
        ) : (
          <div className="row g-4 animate-fade">

            {/* Platform Overview */}
            <div className="col-lg-6">
              <Card title="Platform Overview">
                <div className="py-1">
                  {/* Capital */}
                  <div className="mb-4">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                      Total Managed Capital
                    </span>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginTop: '0.25rem' }}>
                      {formatCurrency(stats?.totalManagedCapital || 0)}
                    </div>
                  </div>

                  {/* Investors ratio */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                        Active Investors Ratio
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#2563EB' }}>
                        {stats?.activeInvestors} / {stats?.totalUsers}
                      </span>
                    </div>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${investorPct}%`, background: 'linear-gradient(135deg,#1E3A8A,#2563EB)' }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                      {investorPct}% of clients are actively investing
                    </span>
                  </div>

                  {/* Today's profits */}
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                      Today's Cumulative Profits
                    </span>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '0.25rem', color: stats?.todaysProfitUpdates >= 0 ? '#059669' : '#dc2626' }}>
                      {stats?.todaysProfitUpdates >= 0 ? '+' : ''}{formatCurrency(stats?.todaysProfitUpdates || 0)}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* KYC Distribution */}
            <div className="col-lg-6">
              <Card title="KYC Compliance Distribution">
                {/* Stat boxes */}
                <div className="row g-3 mb-4">
                  {[
                    { label: 'Approved', count: approvedCount, pct: approvedPct, bg: '#d1fae5', color: '#059669', icon: 'bi-check-circle-fill' },
                    { label: 'Pending',  count: pendingCount,  pct: pendingPct,  bg: '#fef3c7', color: '#d97706', icon: 'bi-clock-fill'        },
                    { label: 'Rejected', count: rejectedCount, pct: rejectedPct, bg: '#fee2e2', color: '#dc2626', icon: 'bi-x-circle-fill'      },
                  ].map(s => (
                    <div key={s.label} className="col-4">
                      <div className="text-center p-3 rounded-3" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                        <i className={`bi ${s.icon} d-block mb-2`} style={{ fontSize: '1.25rem', color: s.color }}></i>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                          {s.count}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, marginTop: '0.25rem' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: `${s.color}99` }}>
                          {s.pct}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stacked progress bar */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                    Compliance Meter
                  </span>
                  <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${approvedPct}%`, background: '#059669', transition: 'width 0.8s ease' }}></div>
                    <div style={{ width: `${pendingPct}%`,  background: '#d97706', transition: 'width 0.8s ease' }}></div>
                    <div style={{ width: `${rejectedPct}%`, background: '#dc2626', transition: 'width 0.8s ease' }}></div>
                  </div>
                  <div className="d-flex gap-3 mt-2">
                    {[['#059669','Approved'],['#d97706','Pending'],['#dc2626','Rejected']].map(([c,l]) => (
                      <span key={l} style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, display: 'inline-block' }}></span>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

          </div>
        )}

        <Footer adminMode={true} />
      </div>
    </div>
  );
};

export default AdminAnalytics;
