import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar navbar-expand-lg client-navbar sticky-top bg-white border-bottom shadow-sm">
      <div className="container">
        <Link className="navbar-brand client-brand d-flex align-items-center text-decoration-none" to="/dashboard">
          <BrandLogo className="me-2" width={28} height={28} />
          <span className="fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>GrowStar</span>
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="clientNavbar"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="clientNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-4">
            <li className="nav-item">
              <Link className={`nav-link fw-semibold px-3 ${isActive('/dashboard') ? 'text-primary' : 'text-secondary'}`} to="/dashboard">
                <i className="bi bi-grid-1x2-fill me-1"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link fw-semibold px-3 ${isActive('/documents') ? 'text-primary' : 'text-secondary'}`} to="/documents">
                <i className="bi bi-folder2-open me-1"></i> Documents
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link fw-semibold px-3 ${isActive('/client/messages') ? 'text-primary' : 'text-secondary'}`} to="/client/messages">
                <i className="bi bi-chat-left-dots-fill me-1"></i> Messages
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link fw-semibold px-3 ${isActive('/profile') ? 'text-primary' : 'text-secondary'}`} to="/profile">
                <i className="bi bi-person-fill me-1"></i> Profile
              </Link>
            </li>
          </ul>
          <div className="d-flex align-items-center">
            {user && (
              <span className="me-3 text-dark fw-semibold">
                Client: <span className="text-primary">{user.fullName}</span>
                {user.status && (
                  <span className={`ms-2 badge badge-status ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                )}
              </span>
            )}
            <button className="btn btn-outline-danger btn-sm px-3 d-flex align-items-center" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
