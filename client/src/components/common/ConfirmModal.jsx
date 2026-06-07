import React, { useEffect } from 'react';

/**
 * Premium Confirmation Modal — replaces window.confirm()
 * Props:
 *   isOpen      {bool}    — controls visibility
 *   title       {string}  — modal heading
 *   message     {string}  — body text / warning details
 *   confirmText {string}  — confirm button label (default "Confirm")
 *   cancelText  {string}  — cancel button label  (default "Cancel")
 *   onConfirm   {fn}      — called when user confirms
 *   onCancel    {fn}      — called when user cancels or clicks backdrop
 *   variant     {string}  — "danger" | "warning" | "info"
 *   loading     {bool}    — show spinner on confirm button
 */
const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    danger:  'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info:    'bi-info-circle-fill',
  };

  return (
    <div
      className="confirm-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="confirm-modal">
        {/* Header */}
        <div className="confirm-modal-header">
          <div className={`confirm-modal-icon ${variant}`}>
            <i className={`bi ${icons[variant] || icons.danger}`}></i>
          </div>
          <div>
            <p className="confirm-modal-title" id="confirm-modal-title">{title}</p>
            <p className="confirm-modal-message">{message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                  style={{ width: '14px', height: '14px', borderWidth: '2px' }}
                />
                <span>Processing...</span>
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
