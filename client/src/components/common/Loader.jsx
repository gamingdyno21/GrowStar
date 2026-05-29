import React from 'react';

const Loader = ({ message = 'Loading workspace data...' }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center p-5 w-100">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-secondary fw-medium">{message}</p>
    </div>
  );
};

export default Loader;
