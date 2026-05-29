import React from 'react';

const StatCard = ({ title, value, icon, color = 'primary', trend = null }) => {
  return (
    <div className="metric-card h-100">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <span className="text-secondary fw-semibold small text-uppercase tracking-wider">{title}</span>
          <h3 className="fw-bold mt-2 mb-1 text-primary">{value}</h3>
          {trend && (
            <div className="d-flex align-items-center mt-2">
              <span className={`small fw-semibold text-${trend.type === 'up' ? 'success' : 'danger'}`}>
                <i className={`bi bi-arrow-${trend.type === 'up' ? 'up' : 'down'}-short me-1`}></i>
                {trend.value}
              </span>
              <span className="text-secondary small ms-2">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded bg-${color}-subtle text-${color} border border-${color}-subtle`}>
          <i className={`bi ${icon} fs-4`}></i>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
// Note: Bootstrap includes bg-primary-subtle and text-primary styling helpers since version 5.3
