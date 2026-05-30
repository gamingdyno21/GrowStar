import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import BrandedPreloader from './components/common/BrandedPreloader';

function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <ErrorBoundary>
      {showPreloader && (
        <BrandedPreloader onComplete={() => setShowPreloader(false)} />
      )}
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

