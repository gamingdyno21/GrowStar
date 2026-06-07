import React from 'react';
import BrandLogo from '../common/BrandLogo';

const Footer = ({ adminMode = false }) => {
  return (
    <footer
      className="w-100 py-4 mt-5 border-top"
      style={{ borderColor: '#f1f5f9', background: '#ffffff' }}
    >
      <div className={adminMode ? '' : 'container'} style={adminMode ? { padding: '0 2rem' } : {}}>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          {/* Brand */}
          <div className="d-flex align-items-center gap-2">
            <BrandLogo width={20} height={20} />
            <span
              className="fw-700"
              style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}
            >
              GrowStar
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Right */}
          <div className="d-flex align-items-center gap-4">
            <a
              href="mailto:support@grow-star.site"
              className="text-decoration-none d-flex align-items-center gap-1"
              style={{ fontSize: '0.8125rem', color: '#64748b', transition: 'color 0.15s' }}
            >
              <i className="bi bi-envelope"></i>
              support@grow-star.site
            </a>
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
