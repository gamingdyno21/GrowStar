import React from 'react';

/**
 * Premium page header with title, subtitle, and gradient accent bar.
 */
const PageHeader = ({ title, subtitle, action = null }) => {
  return (
    <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        <div className="page-header-divider"></div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
