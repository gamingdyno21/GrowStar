import axios from 'axios';
import { showGlobalToast } from '../context/ToastContext';

// Centralized log helper
const logInfo = (tag, message, ...args) => {
  console.log(`[${tag}] ${message}`, ...args);
};

const logError = (tag, message, err) => {
  console.error(`[${tag}] ERROR: ${message}`, err);
};

// Map raw Axios and network errors to friendly notifications
const mapErrorToFriendly = (error) => {
  const config = error.config || {};
  const url = config.url || '';
  const status = error.response ? error.response.status : null;
  const code = error.code;
  const messageStr = error.message || '';

  // Default values
  let title = 'Something Went Wrong';
  let message = 'We encountered a temporary issue. Please try again shortly.';
  let type = 'error'; // Red

  // 1. Diagnose specific connection/network/timeout statuses
  const isTimeout = code === 'ECONNABORTED' || messageStr.toLowerCase().includes('timeout') || code === 'ETIMEDOUT';
  const isNetwork = code === 'ERR_NETWORK' || messageStr.toLowerCase().includes('network error');
  const isReset = code === 'ERR_CONNECTION_RESET' || messageStr.toUpperCase().includes('ECONNRESET');

  if (isTimeout) {
    title = 'Request Timed Out';
    message = 'The request took longer than expected. Please retry once your connection becomes stable.';
    type = 'warning'; // Yellow
  } else if (isNetwork || isReset) {
    title = 'Connection Lost';
    message = 'Unable to connect to the server. Please check your internet connection and try again.';
    type = 'danger'; // Red
  } else if (status) {
    if (status === 503 || status === 502 || status === 504) {
      title = 'Service Temporarily Unavailable';
      message = 'Our servers are currently busy. Please try again after a few moments.';
      type = 'warning'; // Yellow
    } else if (status === 500) {
      title = 'Something Went Wrong';
      message = 'We encountered a temporary issue. Please try again shortly.';
      type = 'error'; // Red
    }
  }

  // 2. Map route-specific errors (only if it is a network/timeout/5xx issue)
  const isServerOrNetworkIssue = isTimeout || isNetwork || isReset || (status && status >= 500);

  if (isServerOrNetworkIssue) {
    if (url.includes('/api/auth/login')) {
      title = 'Unable to Sign In';
      message = "We couldn't complete your sign-in request. Please check your internet connection and try again.";
      type = 'danger';
    } else if (url.includes('/api/auth/generate-otp') || url.includes('/forgot-password') || url.includes('/verify-otp')) {
      title = 'OTP Delivery Delayed';
      message = "We're having trouble sending the verification code right now. Please wait a few moments and try again.";
      type = 'warning';
    } else if (url.includes('/api/user/profile')) {
      title = 'Unable to Save Changes';
      message = 'Your changes could not be saved due to a temporary connection issue. Please try again.';
      type = 'danger';
    } else if (url.includes('/upload') || config.headers?.['Content-Type']?.includes('multipart/form-data')) {
      title = 'Upload Interrupted';
      message = 'The upload was interrupted. Please check your connection and try again.';
      type = 'danger';
    }
  }

  // 3. Fallback for client-side errors (400, 401, 403) - use server message if available, else generic failed
  if (!isServerOrNetworkIssue && error.response && error.response.data) {
    title = 'Request Failed';
    message = error.response.data.message || 'An error occurred. Please try again.';
    type = 'warning';
  }

  return { title, message, type };
};

// Response Interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Reject immediately if no request config exists (e.g. aborts during initialization)
    if (!config) {
      const { title, message, type } = mapErrorToFriendly(error);
      showGlobalToast(message, type, 4500, title);
      return Promise.reject(error);
    }

    const code = error.code;
    const status = error.response ? error.response.status : null;
    const messageStr = error.message || '';

    // Check if error warrants a retry (timeouts, connection resets, network issues, 502/503/504 gateways)
    const isTimeout = code === 'ECONNABORTED' || messageStr.toLowerCase().includes('timeout') || code === 'ETIMEDOUT';
    const isNetwork = code === 'ERR_NETWORK' || messageStr.toLowerCase().includes('network error');
    const isReset = code === 'ERR_CONNECTION_RESET' || messageStr.toUpperCase().includes('ECONNRESET');
    const isServerUnavailable = status === 502 || status === 503 || status === 504;

    const shouldRetry = isTimeout || isNetwork || isReset || isServerUnavailable;

    if (shouldRetry) {
      config.retryCount = config.retryCount || 0;

      if (config.retryCount < 3) {
        // Progressive Delays: 1s, 2s, 5s
        const delay = [1000, 2000, 5000][config.retryCount];
        config.retryCount += 1;

        logInfo("API", `Attempting auto-retry ${config.retryCount}/3 in ${delay}ms for URL: ${config.url}`);
        
        // Show reconnecting loader warning
        showGlobalToast("Reconnecting...", "warning", delay, isTimeout ? "Connection Slow" : "Connection Lost");

        // Wait for the progressive delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Re-execute the request
        return axios(config);
      }
    }

    // If retries are exhausted or shouldn't retry, map friendly message and alert
    const { title, message, type } = mapErrorToFriendly(error);
    showGlobalToast(message, type, 4500, title);

    // Reject with a clean, user-friendly Error object to prevent stack traces/technical logs leaks
    const cleanError = new Error(message);
    cleanError.title = title;
    cleanError.type = type;
    cleanError.status = status;
    cleanError.originalError = error;

    return Promise.reject(cleanError);
  }
);

logInfo("API", "Global Axios interceptors configured with friendly error mapping and auto-retry.");
