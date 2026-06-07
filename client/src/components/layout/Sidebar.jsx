import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { to: '/admin/dashboard', icon: 'bi-grid-fill', label: 'Dashboard' },
    { to: '/admin/users',     icon: 'bi-people-fill', label: 'Clients' },
    { to: '/admin/messages',  icon: 'bi-chat-left-text-fill', label: 'Messages' },
    { to: '/admin/analytics', icon: 'bi-bar-chart-line-fill', label: 'Analytics' },
  ];

  return (
    <div className={`admin-sidebar ${isOpen ? 'mobile-open' : ''}`} style={{ minHeight: '100vh' }}>
      {/* Brand + Mobile Toggle */}
      <div className="sidebar-brand">
        <div className="sidebar-mobile-toggle" style={{ width: '100%' }}>
          <div className="d-flex align-items-center gap-2">
            <BrandLogo width={28} height={28} />
            <span className="sidebar-brand-name">GrowStar</span>
          </div>
          <button
            className="btn btn-ghost d-md-none p-1 sidebar-mobile-toggle-btn"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle sidebar"
            style={{ color: '#94a3b8' }}
          >
            <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-4`}></i>
          </button>
        </div>
      </div>

      {/* Nav Content */}
      <div className={`sidebar-content ${isOpen ? 'd-flex' : 'd-none d-md-flex'} flex-column flex-grow-1`}>
        <p className="sidebar-section-label">Navigation</p>

        <ul className="sidebar-nav">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="sidebar-user-avatar">
              {getInitials(user?.fullName || user?.email)}
            </div>
            <div className="d-flex flex-column" style={{ minWidth: 0 }}>
              <span
                className="text-white fw-semibold"
                style={{ fontSize: '0.8125rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user?.fullName || 'Administrator'}
              </span>
              <span
                style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user?.email || ''}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-signout-btn"
          >
            <i className="bi bi-box-arrow-left"></i>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
