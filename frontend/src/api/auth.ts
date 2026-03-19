import client from './client';

export const authApi = {
  login: async (email: string, password: string, persistent: boolean) => {
    const res = await client.post('/auth/login', { email, password, persistent });
    return res.data;
  },
  register: async (email: string, password: string) => {
    const res = await client.post('/auth/register', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await client.get('/auth/me');
    return res.data;
  }
};
