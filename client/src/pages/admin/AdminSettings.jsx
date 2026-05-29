import React, { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

const AdminSettings = () => {
  const { user } = useAuth();
  
  const [params, setParams] = useState({
    platformFee: '0.25',
    maxWithLimit: '500000',
    timeoutLimit: '15',
    mfaEnabled: true
  });
  
  const [success, setSuccess] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess('Administrative parameters updated successfully.');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="container-fluid p-0 bg-light min-vh-100">
      <div className="row g-0">
        <div className="col-12 col-md-3 col-xl-2 d-flex flex-column">
          <Sidebar />
        </div>
        <div className="col-12 col-md-9 col-xl-10 p-4">
          <PageHeader title="Portal Settings" subtitle="Configure system parameters, advisory fees, and security compliance credentials" />

          <div className="row g-4 text-start animate-fade">
            <div className="col-lg-7">
              <Card title="System Variables & Thresholds">
                {success && <div className="alert alert-success py-2 small">{success}</div>}
                
                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary small">Advisory Commission Fee (%)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={params.platformFee}
                      onChange={(e) => setParams({ ...params, platformFee: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary small">Daily Withdrawal Limit per Transaction (INR)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={params.maxWithLimit}
                      onChange={(e) => setParams({ ...params, maxWithLimit: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary small">OTP Session Timeout (Minutes)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={params.timeoutLimit}
                      onChange={(e) => setParams({ ...params, timeoutLimit: e.target.value })}
                    />
                  </div>

                  <div className="form-check form-switch mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="mfaSwitch"
                      checked={params.mfaEnabled}
                      onChange={(e) => setParams({ ...params, mfaEnabled: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold text-secondary small ms-2" htmlFor="mfaSwitch">
                      Enforce Dual Factor SMS & Email Verification for Client Onboarding
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary px-4">
                    Save Configuration
                  </button>
                </form>
              </Card>
            </div>

            <div className="col-lg-5">
              <Card title="Administrative Identity">
                <div className="list-group list-group-flush text-start">
                  <div className="list-group-item bg-transparent px-0 border-light">
                    <span className="text-secondary small d-block">Operator Account Name</span>
                    <span className="fw-bold">{user?.fullName || 'Root Administrator'}</span>
                  </div>
                  <div className="list-group-item bg-transparent px-0 border-light">
                    <span className="text-secondary small d-block">Registered Support Email</span>
                    <span className="fw-bold">{user?.email || 'admin@growstar.com'}</span>
                  </div>
                  <div className="list-group-item bg-transparent px-0 border-light">
                    <span className="text-secondary small d-block">Assigned Role privileges</span>
                    <span className="badge bg-success-subtle text-success fs-7">Root Administrator Privilege</span>
                  </div>
                  <div className="list-group-item bg-transparent px-0 border-light pt-3">
                    <span className="d-block fw-bold text-primary small text-uppercase mb-2">Encryption Protocols</span>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-shield-lock-fill text-success fs-5 me-2"></i>
                      <span className="small text-secondary">SSL/TLS AES-256 Transport Encryption Active</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
