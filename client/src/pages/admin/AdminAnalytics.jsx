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

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminService.getStats();
      const usersRes = await adminService.getAllUsers();
      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setClients(usersRes.data);
    } catch (err) {
      console.error('Failed to load analytics dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status) => {
    return clients.filter(c => c.status === status).length;
  };

  return (
    <div className="container-fluid p-0 bg-light min-vh-100">
      <div className="row g-0">
        <div className="col-12 col-md-3 col-xl-2 d-flex flex-column">
          <Sidebar />
        </div>
        <div className="col-12 col-md-9 col-xl-10 p-4">
          <PageHeader title="Platform Analytics" subtitle="Aggregate ledger distributions and regulatory KYC audit statistics" />

          {loading ? (
            <Loader message="Compiling portfolio statistics..." />
          ) : (
            <div className="row g-4 text-start animate-fade">
              <div className="col-lg-6">
                <Card title="Managed Asset Allocations">
                  <div className="py-2">
                    <span className="small text-secondary fw-semibold text-uppercase d-block mb-1">Total Platform Capital</span>
                    <h3 className="fw-bold text-primary mb-4">{formatCurrency(stats?.totalManagedCapital || 0)}</h3>
                    
                    <span className="small text-secondary fw-semibold text-uppercase d-block mb-1">Active Investors Ratio</span>
                    <div className="d-flex align-items-center mb-3">
                      <div className="progress flex-grow-1" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          role="progressbar" 
                          style={{ width: `${(stats?.activeInvestors / (stats?.totalUsers || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ms-3 fw-bold small">{stats?.activeInvestors} / {stats?.totalUsers}</span>
                    </div>

                    <span className="small text-secondary fw-semibold text-uppercase d-block mb-1">Today's Cumulative Profits</span>
                    <h4 className={`fw-bold mb-0 ${stats?.todaysProfitUpdates >= 0 ? 'text-success' : 'text-danger'}`}>
                      {stats?.todaysProfitUpdates >= 0 ? '+' : ''}{formatCurrency(stats?.todaysProfitUpdates || 0)}
                    </h4>
                  </div>
                </Card>
              </div>

              <div className="col-lg-6">
                <Card title="KYC Audits Distribution">
                  <div className="row text-center py-2">
                    <div className="col-4">
                      <div className="p-3 border rounded-3 bg-white shadow-sm">
                        <span className="text-success fs-3 fw-bold d-block">{getStatusCount('Approved')}</span>
                        <span className="text-secondary small">Approved</span>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 border rounded-3 bg-white shadow-sm">
                        <span className="text-warning fs-3 fw-bold d-block">{getStatusCount('Pending')}</span>
                        <span className="text-secondary small">Pending</span>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 border rounded-3 bg-white shadow-sm">
                        <span className="text-danger fs-3 fw-bold d-block">{getStatusCount('Rejected')}</span>
                        <span className="text-secondary small">Rejected</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="small text-secondary fw-semibold text-uppercase d-block mb-2">Compliance Completion Meter</span>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${(getStatusCount('Approved') / (clients.length || 1)) * 100}%` }}
                      ></div>
                      <div 
                        className="progress-bar bg-warning" 
                        role="progressbar" 
                        style={{ width: `${(getStatusCount('Pending') / (clients.length || 1)) * 100}%` }}
                      ></div>
                      <div 
                        className="progress-bar bg-danger" 
                        role="progressbar" 
                        style={{ width: `${(getStatusCount('Rejected') / (clients.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="small text-secondary mt-2 d-block">Legend: Green (Approved KYC) | Yellow (Pending verification) | Red (Discrepancy Rejected)</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
          <Footer adminMode={true} />
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
