import React from 'react';
import BrandLogo from '../common/BrandLogo';

const Footer = ({ adminMode = false }) => {
  return (
    <footer className="w-100 py-4 mt-5 border-top bg-white text-muted" style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
      <div className="container">
        <div className="row justify-content-between align-items-center g-3">
          <div className="col-12 col-md-6 text-center text-md-start">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-2">
              <BrandLogo className="me-2" width={22} height={22} />
              <span className="fw-bold text-dark small" style={{ letterSpacing: '-0.2px' }}>GrowStar Advisory Services</span>
            </div>
            <p className="small mb-0 text-secondary">
              GrowStar © {new Date().getFullYear()} Private Limited. All rights reserved.
            </p>
          </div>
          <div className="col-12 col-md-6 text-center text-md-end">
            <div className="d-flex flex-column align-items-center align-items-md-end gap-1">
              <span className="small text-secondary fw-semibold">
                <i className="bi bi-shield-fill-check text-success me-1"></i>
                256-bit AES Encrypted Secure Platform
              </span>
              <span className="small text-secondary">
                Support: <a href="mailto:support@grow-star.site" className="text-decoration-none fw-semibold" style={{ color: '#D4AF37' }}>support@grow-star.site</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
