import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';
import { getProfileCompletionProgress } from '../../utils/helpers';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { to: '/dashboard',       icon: 'bi-grid-1x2-fill', label: 'Dashboard'  },
    { to: '/documents',       icon: 'bi-folder2-open',  label: 'Documents'  },
    { to: '/client/messages', icon: 'bi-chat-left-dots-fill', label: 'Messages' },
    { to: '/profile',         icon: 'bi-person-fill',   label: 'Profile'    },
  ];

  const completionProgress = getProfileCompletionProgress(user);
  const showBanner = user && user.role !== 'admin' && completionProgress < 100;

  return (
    <>
      {showBanner && (
        <div 
          className="w-100 py-2.5 px-3 border-bottom text-center animate-fade" 
          style={{ 
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
            borderColor: '#fde047', 
            fontSize: '0.8125rem',
            color: '#854d0e',
            zIndex: 1050,
            position: 'relative'
          }}
        >
          <div className="container d-flex flex-wrap align-items-center justify-content-center gap-2">
            <span className="fw-semibold">
              <i className="bi bi-exclamation-triangle-fill me-1.5" style={{ color: '#d97706' }}></i>
              Please complete your profile to unlock all platform features.
            </span>
            <div className="d-flex align-items-center gap-2">
              <div className="progress" style={{ width: '80px', height: '6px', background: 'rgba(0, 0, 0, 0.08)', borderRadius: '3px' }}>
                <div 
                  className="progress-bar bg-warning" 
                  role="progressbar" 
                  style={{ width: `${completionProgress}%` }}
                  aria-valuenow={completionProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <span className="fw-bold font-monospace" style={{ fontSize: '0.75rem' }}>{completionProgress}%</span>
              <Link 
                to="/complete-profile" 
                className="btn btn-xs btn-warning px-2.5 py-0.5 rounded fw-bold ms-2"
                style={{ fontSize: '0.72rem', color: '#1e293b', border: '1px solid rgba(0,0,0,0.1)' }}
              >
                Complete Profile
              </Link>
            </div>
          </div>
        </div>
      )}
      <nav className="client-navbar navbar navbar-expand-lg">
      <div className="container" style={{ maxWidth: '1280px', padding: '0 1.5rem' }}>
        {/* Brand */}
        <Link className="client-brand" to="/dashboard" onClick={() => setIsOpen(false)}>
          <BrandLogo width={26} height={26} />
          <span>GrowStar</span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler border-0 p-1"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="clientNavbar"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          style={{ color: '#64748b', background: 'none', outline: 'none' }}
        >
          <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
        </button>

        {/* Nav items */}
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="clientNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 mt-2 mt-lg-0">
            {navItems.map(item => (
              <li className="nav-item" key={item.to}>
                <Link
                  className={`nav-link-item ${isActive(item.to) ? 'active' : ''}`}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                >
                  <i className={`bi ${item.icon}`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="d-flex align-items-center gap-3 pb-2 pb-lg-0">
            {user && (
              <div className="nav-user-chip">
                <div className="nav-user-avatar">{getInitials(user.fullName)}</div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName?.split(' ')[0] || 'Client'}
                  </div>
                  {user.status && (
                    <span className={`status-badge ${user.status.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.1em 0.4em' }}>
                      {user.status}
                    </span>
                  )}
                </div>
              </div>
            )}
            <button
              className="btn btn-ghost btn-sm d-flex align-items-center gap-1"
              onClick={handleLogout}
              style={{ color: '#64748b', fontSize: '0.8125rem' }}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-lg-inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  </>
  );
};

export default Navbar;
