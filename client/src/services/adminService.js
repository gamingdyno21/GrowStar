import axios from 'axios';

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: user && user.token ? `Bearer ${user.token}` : '',
    },
  };
};

const login = async (email, password) => {
  const response = await axios.post('/api/admin/login', { email, password });
  return response.data;
};

const getAllUsers = async () => {
  const response = await axios.get('/api/admin/users', getAuthHeaders());
  return response.data;
};

const getUserDetails = async (id) => {
  const response = await axios.get(`/api/admin/users/${id}`, getAuthHeaders());
  return response.data;
};

const updateUserStatus = async (id, status) => {
  const response = await axios.put(`/api/admin/users/${id}/status`, { status }, getAuthHeaders());
  return response.data;
};

const getStats = async () => {
  const response = await axios.get('/api/admin/stats', getAuthHeaders());
  return response.data;
};

const updateUserPortfolio = async (id, portfolioData) => {
  const response = await axios.put(`/api/admin/users/${id}/portfolio`, portfolioData, getAuthHeaders());
  return response.data;
};

const addActiveInvestment = async (id, investmentData) => {
  const response = await axios.post(`/api/admin/users/${id}/investments`, investmentData, getAuthHeaders());
  return response.data;
};

const updateActiveInvestment = async (id, invId, investmentData) => {
  const response = await axios.put(`/api/admin/users/${id}/investments/${invId}`, investmentData, getAuthHeaders());
  return response.data;
};

const deleteActiveInvestment = async (id, invId) => {
  const response = await axios.delete(`/api/admin/users/${id}/investments/${invId}`, getAuthHeaders());
  return response.data;
};

const addDailyProfit = async (id, profitData) => {
  const response = await axios.post(`/api/admin/users/${id}/daily-profit`, profitData, getAuthHeaders());
  return response.data;
};

const deleteDailyProfit = async (id, profitId) => {
  const response = await axios.delete(`/api/admin/users/${id}/daily-profit/${profitId}`, getAuthHeaders());
  return response.data;
};

const addUserTransaction = async (id, transactionData) => {
  const response = await axios.post(`/api/admin/users/${id}/transactions`, transactionData, getAuthHeaders());
  return response.data;
};

const updateUserTransaction = async (id, transId, transactionData) => {
  const response = await axios.put(`/api/admin/users/${id}/transactions/${transId}`, transactionData, getAuthHeaders());
  return response.data;
};

const deleteUserTransaction = async (id, transId) => {
  const response = await axios.delete(`/api/admin/users/${id}/transactions/${transId}`, getAuthHeaders());
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(`/api/admin/users/${id}`, getAuthHeaders());
  return response.data;
};

const adminService = {
  login,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getStats,
  updateUserPortfolio,
  addActiveInvestment,
  updateActiveInvestment,
  deleteActiveInvestment,
  addDailyProfit,
  deleteDailyProfit,
  addUserTransaction,
  updateUserTransaction,
  deleteUserTransaction,
  deleteUser,
};

export default adminService;
