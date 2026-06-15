import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfileCompletionProgress } from '../utils/helpers';

const ProtectedRoute = ({ children, isCompletionPage = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not logged in, or logged in as Admin, redirect to client login
  if (!user || user.role === 'admin') {
    return <Navigate to="/login" replace />;
  }

  // Enforce profile completion workflow redirects only away from completion page if complete
  const completionProgress = getProfileCompletionProgress(user);
  const isProfileComplete = completionProgress === 100;

  if (isProfileComplete && isCompletionPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
