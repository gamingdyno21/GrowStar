import React from 'react';

const colorMap = {
  primary: { bg: 'rgba(37,99,235,0.08)', color: '#2563EB', border: 'rgba(37,99,235,0.15)' },
  success: { bg: 'rgba(5,150,105,0.08)',  color: '#059669', border: 'rgba(5,150,105,0.15)' },
  danger:  { bg: 'rgba(220,38,38,0.08)', color: '#dc2626', border: 'rgba(220,38,38,0.15)' },
  warning: { bg: 'rgba(217,119,6,0.08)', color: '#d97706', border: 'rgba(217,119,6,0.15)' },
  cyan:    { bg: 'rgba(14,165,233,0.08)', color: '#0ea5e9', border: 'rgba(14,165,233,0.15)' },
  gold:    { bg: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: 'rgba(212,175,55,0.2)' },
};

/**
 * Premium metric / stat card with colored icon and optional trend.
 */
const StatCard = ({ title, value, icon, color = 'primary', trend = null, subtitle = null }) => {
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="metric-card h-100">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.7375rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#64748b',
              marginBottom: '0.5rem',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </div>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{subtitle}</p>
          )}
          {trend && (
            <div className="d-flex align-items-center gap-1 mt-2">
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: trend.type === 'up' ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <i className={`bi bi-arrow-${trend.type === 'up' ? 'up' : 'down'}-right`}></i>
                {trend.value}
              </span>
              {trend.label && (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: c.bg,
            border: `1.5px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: c.color,
            fontSize: '1.1875rem',
          }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
