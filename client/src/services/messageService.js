import axios from 'axios';

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    headers: {
      Authorization: user && user.token ? `Bearer ${user.token}` : '',
    },
  };
};

const sendMessage = async (type, message) => {
  const response = await axios.post(
    '/api/messages',
    { type, message },
    getAuthHeaders()
  );
  return response.data;
};

const getClientMessages = async () => {
  const response = await axios.get('/api/messages', getAuthHeaders());
  return response.data;
};

const getAdminMessages = async () => {
  const response = await axios.get('/api/messages/admin', getAuthHeaders());
  return response.data;
};

const replyMessage = async (id, reply) => {
  const response = await axios.put(
    `/api/messages/admin/${id}/reply`,
    { reply },
    getAuthHeaders()
  );
  return response.data;
};

const resolveMessage = async (id) => {
  const response = await axios.put(
    `/api/messages/admin/${id}/resolve`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

const messageService = {
  sendMessage,
  getClientMessages,
  getAdminMessages,
  replyMessage,
  resolveMessage,
};

export default messageService;
