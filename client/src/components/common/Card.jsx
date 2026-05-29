import React from 'react';

const Card = ({ title, children, className = '', footer = null, headerAction = null }) => {
  return (
    <div className={`finance-card ${className}`}>
      {(title || headerAction) && (
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-light">
          {title && <h5 className="fw-semibold text-primary mb-0">{title}</h5>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="card-body p-0">{children}</div>
      {footer && <div className="card-footer bg-transparent border-top border-light pt-3 mt-3">{footer}</div>}
    </div>
  );
};

export default Card;
