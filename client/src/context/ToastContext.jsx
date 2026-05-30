import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="growstar-toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`growstar-toast growstar-toast-${toast.type} d-flex align-items-center justify-content-between`}
            role="alert"
          >
            <div className="d-flex align-items-center">
              <i className={`bi ${
                toast.type === 'success' ? 'bi-check-circle-fill' :
                toast.type === 'error' || toast.type === 'danger' ? 'bi-exclamation-triangle-fill' :
                toast.type === 'warning' ? 'bi-exclamation-circle-fill' :
                'bi-info-circle-fill'
              } me-2.5 fs-5`}></i>
              <span className="toast-message text-white small fw-medium">{toast.message}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white ms-3"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
              style={{ fontSize: '0.75rem', opacity: 0.7 }}
            ></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
