import axios from 'axios';

const API_URL = '/api/auth';

const requestOTP = async (email, phoneNumber) => {
  const endpoint = (!phoneNumber && email) ? `${API_URL}/forgot-password` : `${API_URL}/generate-otp`;
  const response = await axios.post(endpoint, { email, phoneNumber });
  return response.data;
};

// Always uses /generate-otp — for signup initial send AND resend
const resendOTP = async (email, phone) => {
  const response = await axios.post(`${API_URL}/generate-otp`, { email, phone });
  return response.data;
};

const verifyOTP = async (identifier, otp) => {
  const response = await axios.post(`${API_URL}/verify-otp`, { identifier, otp });
  return response.data;
};

const signup = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

const login = async (loginIdentifier, password) => {
  const response = await axios.post(`${API_URL}/login`, { loginIdentifier, password });
  return response.data;
};

const resetPassword = async (email, otp, newPassword, confirmPassword) => {
  const response = await axios.post(`${API_URL}/reset-password`, {
    email,
    otp,
    newPassword,
    confirmPassword,
  });
  return response.data;
};

const authService = {
  requestOTP,
  resendOTP,
  verifyOTP,
  signup,
  login,
  resetPassword,
};

export default authService;
