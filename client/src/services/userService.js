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

// Financial Records CRUD
const getRecords = async () => {
  const response = await axios.get('/api/finance', getAuthHeaders());
  return response.data;
};

const createRecord = async (recordData) => {
  const response = await axios.post('/api/finance', recordData, getAuthHeaders());
  return response.data;
};

const updateRecord = async (id, recordData) => {
  const response = await axios.put(`/api/finance/${id}`, recordData, getAuthHeaders());
  return response.data;
};

const deleteRecord = async (id) => {
  const response = await axios.delete(`/api/finance/${id}`, getAuthHeaders());
  return response.data;
};

const userService = {
  getProfile,
  updateProfile,
  getActivity,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
};

export default userService;
