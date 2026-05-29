import React from 'react';

const PageHeader = ({ title, subtitle, action = null }) => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom border-light">
      <div>
        <h2 className="fw-bold text-primary tracking-tight mb-1">{title}</h2>
        {subtitle && <p className="text-secondary mb-0 fw-medium">{subtitle}</p>}
      </div>
      {action && <div className="mt-3 mt-md-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
