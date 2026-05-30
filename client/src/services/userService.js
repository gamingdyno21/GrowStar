import axios from 'axios';

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: user && user.token ? `Bearer ${user.token}` : '',
    },
  };
};

const getProfile = async () => {
  const response = await axios.get('/api/user/profile', getAuthHeaders());
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await axios.put('/api/user/profile', profileData, getAuthHeaders());
  return response.data;
};

const getActivity = async () => {
  const response = await axios.get('/api/user/activity', getAuthHeaders());
  return response.data;
};

// Financial Records — Read Only (mutations are admin-only)
const getRecords = async () => {
  const response = await axios.get('/api/finance', getAuthHeaders());
  return response.data;
};

const userService = {
  getProfile,
  updateProfile,
  getActivity,
  getRecords,
};

export default userService;
