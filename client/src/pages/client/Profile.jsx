import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { useToast } from '../../context/ToastContext';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { formatPhone } from '../../utils/helpers';

const Profile = () => {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    panNumber: '',
    aadhaarNumber: '',
    status: '',
    profilePic: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const pRes = await userService.getProfile();

      if (pRes.success && pRes.data) {
        const u = pRes.data;
        setProfile({
          ...u,
          phoneNumber: u.phone || u.phoneNumber || '',
          profilePic: u.profilePic || '',
          bankName: u.bankDetails?.bankName || '',
          accountNumber: u.bankDetails?.accountNumber || '',
          ifscCode: u.bankDetails?.ifscCode || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
      showToast('Failed to load profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'phoneNumber') formatted = formatPhone(value);
    setProfile({ ...profile, [name]: formatted });
  };

  // Image Upload handler (Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Selected image is too large. Max limit is 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          profilePic: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!profile.fullName.trim()) {
      setErrorMsg('Full name cannot be blank');
      return;
    }
    if (profile.phoneNumber.length < 10) {
      setErrorMsg('Phone number must be at least 10 digits');
      return;
    }
    if (!profile.address.trim()) {
      setErrorMsg('Address is required');
      return;
    }

    setUpdating(true);
    try {
      const res = await userService.updateProfile({
        fullName: profile.fullName,
        phone: profile.phoneNumber,
        address: profile.address,
        profilePic: profile.profilePic,
        bankDetails: {
          bankName: profile.bankName,
          accountNumber: profile.accountNumber,
          ifscCode: profile.ifscCode
        }
      });

      if (res.success) {
        setSuccessMsg('Profile updated successfully!');
        refreshUser();
      } else {
        setErrorMsg(res.message || 'Profile update failed.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-4 flex-grow-1">
        <PageHeader title="Profile & Settlement Settings" subtitle="Adjust bank credentials, personal details and view KYC status" />

        {loading ? (
          <Loader />
        ) : (
          <div className="row justify-content-center animate-fade">
            {/* Account Status and Details */}
            <div className="col-md-10 col-lg-8">
              <Card title="Personal & Settlement Details">
                {successMsg && <div className="alert alert-success small py-2">{successMsg}</div>}
                {errorMsg && <div className="alert alert-danger small py-2">{errorMsg}</div>}

                <form onSubmit={handleSubmit} className="text-start">
                  
                  {/* Photo upload preview */}
                  <div className="d-flex align-items-center mb-4 p-3 bg-light rounded-3 border">
                    <div className="me-3">
                      {profile.profilePic ? (
                        <img
                          src={profile.profilePic}
                          alt="Profile Pic"
                          className="rounded-circle border object-fit-cover shadow"
                          style={{ width: '70px', height: '70px' }}
                        />
                      ) : (
                        <div className="rounded-circle bg-primary-subtle text-primary border d-flex align-items-center justify-content-center shadow" style={{ width: '70px', height: '70px' }}>
                          <i className="bi bi-person fs-2" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="d-block fw-semibold text-dark small mb-1">Profile Photo</span>
                      <label className="btn btn-sm btn-outline-primary position-relative px-3 py-1">
                        Choose Photo
                        <input
                          type="file"
                          className="position-absolute opacity-0 start-0 top-0 w-100 h-100"
                          style={{ cursor: 'pointer' }}
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <span className="d-block text-secondary small mt-1" style={{ fontSize: '0.7rem' }}>Max size 2MB (JPEG/PNG)</span>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        className="form-control"
                        value={profile.fullName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Registered Email</label>
                      <input
                        type="email"
                        className="form-control bg-light"
                        value={profile.email}
                        disabled
                        readOnly
                      />
                      <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                        Email cannot be modified directly.
                      </span>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Phone Number</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        className="form-control"
                        value={profile.phoneNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-12">
                      <label className="form-label fw-semibold text-secondary small">Residential Address</label>
                      <textarea
                        name="address"
                        className="form-control"
                        rows="3"
                        value={profile.address}
                        onChange={handleChange}
                      ></textarea>
                    </div>
                  </div>

                  <hr className="my-4 text-secondary" />
                  <h6 className="fw-bold text-primary mb-3 text-uppercase">Settlement Bank Details</h6>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        className="form-control"
                        placeholder="e.g. State Bank of India"
                        value={profile.bankName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-secondary small">Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        className="form-control"
                        placeholder="e.g. 100234902344"
                        value={profile.accountNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary small">IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        className="form-control"
                        placeholder="e.g. SBIN0001234"
                        value={profile.ifscCode}
                        onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  {/* Document Display Section */}
                  <div className="card p-3 border-light bg-light-subtle rounded-3 mb-4 mt-2">
                    <span className="fw-semibold text-primary mb-3 d-block">KYC Information (Read Only)</span>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <label className="text-secondary small fw-medium">PAN Number</label>
                        <div className="p-2 border rounded bg-white font-monospace">{profile.panNumber || 'N/A'}</div>
                      </div>
                      <div className="col-md-6 mb-2">
                        <label className="text-secondary small fw-medium">Aadhaar Number</label>
                        <div className="p-2 border rounded bg-white font-monospace">XXXX-XXXX-{profile.aadhaarNumber?.slice(-4) || 'XXXX'}</div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary px-4" disabled={updating}>
                    {updating ? 'Saving Profile...' : 'Save Settings & Bank Details'}
                  </button>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
