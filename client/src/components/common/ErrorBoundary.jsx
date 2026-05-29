import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="card shadow border-0 p-5 text-center animate-fade" style={{ maxWidth: '500px', borderRadius: '8px' }}>
            <div className="mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-shield-slash-fill fs-1"></i>
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-2">Unexpected Exception</h3>
            <p className="text-secondary small mb-4">
              GrowStar encountered a runtime rendering exception. Your funds and session remain secure. Click below to return to the dashboard.
            </p>
            <button className="btn btn-primary px-4 py-2.5 fw-semibold" onClick={this.handleReset}>
              <i className="bi bi-house-door-fill me-1"></i> Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
