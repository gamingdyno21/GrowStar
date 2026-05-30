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

  return (
    <div className={`admin-sidebar d-flex flex-column p-3 text-white ${isOpen ? 'mobile-open' : ''}`}>
      <div className="d-flex align-items-center justify-content-between mb-2 mb-md-4 ps-1 mt-2">
        <div className="d-flex align-items-center">
          <BrandLogo className="me-2" width={30} height={30} />
          <span className="fs-4 fw-bold tracking-tight text-white" style={{ letterSpacing: '-0.3px' }}>GrowStar</span>
        </div>
        <button
          className="btn btn-link text-white d-md-none p-0 border-0"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Admin Sidebar"
        >
          <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-3`}></i>
        </button>
      </div>
      
      <div className={`sidebar-content flex-column flex-grow-1 ${isOpen ? 'd-flex' : 'd-none d-md-flex'}`}>
        <hr className="bg-secondary my-2 my-md-3" />
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-grid-fill"></i>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-people-fill"></i>
              Clients
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/messages"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-chat-left-text-fill"></i>
              Messages
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-bar-chart-line-fill"></i>
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-gear-fill"></i>
              Settings
            </NavLink>
          </li>
        </ul>
        <hr className="bg-secondary" />
        <div className="dropdown pb-3 ps-2">
          <div className="d-flex align-items-center text-white text-decoration-none">
            <div className="me-2 rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-person-badge fs-5"></i>
            </div>
            <div className="d-flex flex-column text-start">
              <span className="fw-semibold text-white small leading-none">{user?.fullName || 'Administrator'}</span>
              <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>{user?.email || 'admin@growstar.com'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-light btn-sm w-100 mt-3 d-flex align-items-center justify-content-center border-secondary text-secondary"
          >
            <i className="bi bi-box-arrow-left me-1"></i> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
