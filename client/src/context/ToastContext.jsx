import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ICONS = {
  success: 'bi-check-lg',
  error:   'bi-exclamation-triangle-fill',
  danger:  'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-circle-fill',
  info:    'bi-info-circle-fill',
};

const TITLES = {
  success: 'Success',
  error:   'Error',
  danger:  'Error',
  warning: 'Warning',
  info:    'Notice',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4500) => {
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
            className={`growstar-toast growstar-toast-${toast.type}`}
            role="alert"
          >
            {/* Icon chip */}
            <div className="growstar-toast-icon">
              <i className={`bi ${ICONS[toast.type] || ICONS.info}`}></i>
            </div>

            {/* Text */}
            <div className="growstar-toast-body">
              <div className="toast-title">{TITLES[toast.type] || 'Notice'}</div>
              <div className="toast-message">{toast.message}</div>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '0.25rem',
                fontSize: '0.875rem',
                lineHeight: 1,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
