import api from './api';

const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getProfile: (token) =>
    api.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  getDepartments: () => api.get('/api/departments'),
};

export default auth;
