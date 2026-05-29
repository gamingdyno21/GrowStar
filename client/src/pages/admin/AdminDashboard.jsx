import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import adminService from '../../services/adminService';
import { formatCurrency, formatDate } from '../../utils/helpers';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInvestors: 0,
    totalManagedCapital: 0,
    todaysProfitUpdates: 0,
    pendingMessages: 0,
  });

  const [pendingClients, setPendingClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminService.getStats();
      const usersRes = await adminService.getAllUsers();

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (usersRes.success) {
        // Filter users awaiting audit review
        const pending = usersRes.data.filter((u) => u.status === 'Pending');
        setPendingClients(pending);
      }
    } catch (err) {
      console.error('Failed to retrieve administrative statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this client account?')) return;
    try {
      const res = await adminService.updateUserStatus(id, 'Approved');
      if (res.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert('Verification status change failed.');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this client account?')) return;
    try {
      const res = await adminService.updateUserStatus(id, 'Rejected');
      if (res.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert('Verification status change failed.');
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
          <PageHeader
            title="Management Dashboard"
            subtitle="GrowStar Platform overview and daily client operations"
          />

          {loading ? (
            <Loader message="Fetching administrative summary..." />
          ) : (
            <div className="animate-fade">
              {/* Stats metrics - 5 column layout */}
              <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-5 g-3 mb-4 text-start">
                <div className="col">
                  <StatCard
                    title="Total Clients"
                    value={stats.totalUsers}
                    icon="bi-people-fill"
                    color="primary"
                  />
                </div>
                <div className="col">
                  <StatCard
                    title="Active Investors"
                    value={stats.activeInvestors}
                    icon="bi-graph-up-arrow"
                    color="success"
                  />
                </div>
                <div className="col">
                  <StatCard
                    title="Managed Capital"
                    value={formatCurrency(stats.totalManagedCapital)}
                    icon="bi-cash-coin"
                    color="cyan"
                  />
                </div>
                <div className="col">
                  <StatCard
                    title="Today's Profits"
                    value={formatCurrency(stats.todaysProfitUpdates)}
                    icon="bi-lightning-fill"
                    color="warning"
                  />
                </div>
                <div className="col">
                  <StatCard
                    title="Pending Messages"
                    value={stats.pendingMessages}
                    icon="bi-chat-left-dots-fill"
                    color="danger"
                  />
                </div>
              </div>

              {/* Awaiting Approvals and Actions */}
              <div className="row g-4 text-start">
                <div className="col-12">
                  <Card title={`KYC Document Audits Pending Approval (${pendingClients.length})`}>
                    {pendingClients.length === 0 ? (
                      <div className="text-center py-5 text-secondary">
                        <i className="bi bi-person-check fs-1 mb-2 d-block text-muted"></i>
                        No client accounts currently awaiting KYC verification reviews.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 text-start">
                          <thead>
                            <tr className="table-light">
                              <th className="ps-3 border-0">Full Name</th>
                              <th className="border-0">Email</th>
                              <th className="border-0">Phone</th>
                              <th className="border-0">PAN Card</th>
                              <th className="border-0">Registration Date</th>
                              <th className="text-end pe-3 border-0">Verification Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingClients.map((client) => (
                              <tr key={client._id}>
                                <td className="ps-3">
                                  <Link
                                    to={`/admin/users/${client._id}`}
                                    className="fw-bold text-primary text-decoration-none"
                                  >
                                    {client.fullName}
                                  </Link>
                                </td>
                                <td className="text-secondary">{client.email}</td>
                                <td className="text-secondary">{client.phone || client.phoneNumber || 'N/A'}</td>
                                <td className="text-secondary font-monospace">{client.panNumber}</td>
                                <td className="text-secondary">{formatDate(client.createdAt)}</td>
                                <td className="text-end pe-3">
                                  <button
                                    className="btn btn-sm btn-success px-3 me-2"
                                    onClick={() => handleApprove(client._id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger px-3"
                                    onClick={() => handleReject(client._id)}
                                  >
                                    Reject
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
