import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

// Set up the backend API URL for production deployment
const prodApiUrl = 'https://growstar-backend.onrender.com';
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? prodApiUrl : '');
axios.defaults.timeout = 15000; // 15 seconds request timeout

// Import interceptor configuration to attach to defaults
import './utils/axiosConfig';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
