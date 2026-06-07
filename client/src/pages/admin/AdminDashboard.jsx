import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import Footer from '../../components/layout/Footer';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import { formatCurrency, formatDate } from '../../utils/helpers';

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0, activeInvestors: 0, totalManagedCapital: 0,
    todaysProfitUpdates: 0, pendingMessages: 0,
  });
  const [pendingClients, setPendingClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, clientId: null, action: null, clientName: '' });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminService.getStats();
      const usersRes = await adminService.getAllUsers();
      if (statsRes.success)  setStats(statsRes.data);
      if (usersRes.success)  setPendingClients(usersRes.data.filter(u => u.status === 'Pending'));
    } catch {
      showToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (clientId, clientName, action) => {
    setConfirmModal({ isOpen: true, clientId, action, clientName });
  };

  const handleConfirm = async () => {
    const { clientId, action } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
      const res = await adminService.updateUserStatus(clientId, newStatus);
      if (res.success) {
        showToast(`Client account ${newStatus.toLowerCase()} successfully.`, 'success');
        fetchDashboardData();
      }
    } catch {
      showToast('Status update failed. Please try again.', 'error');
    }
  };

  const statCards = [
    { title: 'Total Clients',    value: stats.totalUsers,                      icon: 'bi-people-fill',         color: 'primary' },
    { title: 'Active Investors', value: stats.activeInvestors,                 icon: 'bi-graph-up-arrow',      color: 'success' },
    { title: 'Managed Capital',  value: formatCurrency(stats.totalManagedCapital), icon: 'bi-cash-coin',       color: 'cyan'    },
    { title: "Today's Profits",  value: formatCurrency(stats.todaysProfitUpdates), icon: 'bi-lightning-fill',  color: 'warning' },
    { title: 'Pending Messages', value: stats.pendingMessages,                 icon: 'bi-chat-left-dots-fill', color: 'danger'  },
  ];

  const isApprove = confirmModal.action === 'approve';

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={isApprove ? 'Approve Client KYC?' : 'Reject Client KYC?'}
        message={`${isApprove ? 'Approve' : 'Reject'} the KYC verification for "${confirmModal.clientName}"? This will update their account status.`}
        confirmText={isApprove ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        variant={isApprove ? 'info' : 'warning'}
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
          title="Management Dashboard"
          subtitle="GrowStar platform overview and daily client operations"
        />

        {loading ? (
          <Loader message="Loading dashboard..." skeleton rows={4} />
        ) : (
          <div className="animate-fade">
            {/* Stat Cards */}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-5 g-3 mb-4">
              {statCards.map(s => (
                <div key={s.title} className="col">
                  <StatCard {...s} />
                </div>
              ))}
            </div>

            {/* Pending KYC table */}
            <Card title={`KYC Pending Approvals (${pendingClients.length})`}>
              {pendingClients.length === 0 ? (
                <div className="text-center py-5" style={{ color: '#94a3b8' }}>
                  <i className="bi bi-person-check-fill d-block fs-1 mb-3" style={{ color: '#d1d5db' }}></i>
                  <p className="mb-1 fw-600" style={{ fontWeight: 600, color: '#475569' }}>All clear!</p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>No client accounts awaiting KYC review.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="ps-3">Full Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>PAN Card</th>
                        <th>Registered</th>
                        <th className="text-end pe-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingClients.map(client => (
                        <tr key={client._id}>
                          <td className="ps-3">
                            <Link
                              to={`/admin/users/${client._id}`}
                              style={{ fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
                            >
                              {client.fullName}
                            </Link>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{client.email}</td>
                          <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{client.phone || client.phoneNumber || 'N/A'}</td>
                          <td style={{ color: '#64748b', fontSize: '0.875rem', fontFamily: 'monospace' }}>{client.panNumber}</td>
                          <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{formatDate(client.createdAt)}</td>
                          <td className="text-end pe-3">
                            <button
                              className="btn btn-success btn-sm px-3 me-2"
                              onClick={() => openConfirm(client._id, client.fullName, 'approve')}
                            >
                              <i className="bi bi-check-lg me-1"></i>Approve
                            </button>
                            <button
                              className="btn btn-sm px-3"
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                              onClick={() => openConfirm(client._id, client.fullName, 'reject')}
                            >
                              <i className="bi bi-x-lg me-1"></i>Reject
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

        <Footer adminMode={true} />
      </div>
    </div>
  );
};

export default AdminDashboard;
