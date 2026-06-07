import React from 'react';

/**
 * Premium finance card with optional header, action, and footer.
 */
const Card = ({ title, children, className = '', footer = null, headerAction = null }) => {
  return (
    <div className={`finance-card ${className}`}>
      {(title || headerAction) && (
        <div className="card-header-line">
          {title && (
            <h5
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h5>
          )}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="card-body p-0">{children}</div>
      {footer && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '1rem' }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
