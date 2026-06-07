import React from 'react';

/**
 * Premium branded loader with optional skeleton variant.
 * Props:
 *   message  {string}  — loading text
 *   size     {string}  — "sm" | "md" | "lg"
 *   skeleton {bool}    — render skeleton rows instead of spinner
 *   rows     {number}  — number of skeleton rows (default 5)
 */
const Loader = ({ message = 'Loading...', size = 'md', skeleton = false, rows = 5 }) => {
  if (skeleton) {
    return (
      <div className="animate-fade-in" style={{ padding: '0.5rem 0' }}>
        {/* Skeleton header */}
        <div className="skeleton skeleton-title" style={{ width: '30%', marginBottom: '1.5rem' }}></div>
        {/* Skeleton rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton-row"
            style={{ marginBottom: '6px', opacity: 1 - i * 0.1 }}
          ></div>
        ))}
      </div>
    );
  }

  const spinnerSize = size === 'sm' ? 24 : size === 'lg' ? 52 : 36;
  const borderSize = size === 'sm' ? 2.5 : size === 'lg' ? 4 : 3;

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center animate-fade-in"
      style={{ padding: size === 'sm' ? '2rem' : '3rem' }}
    >
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `${borderSize}px solid rgba(37,99,235,0.1)`,
          borderTopColor: '#2563EB',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          marginBottom: '1rem',
        }}
      />
      {message && (
        <p
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            margin: 0,
            fontWeight: 500,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Loader;
