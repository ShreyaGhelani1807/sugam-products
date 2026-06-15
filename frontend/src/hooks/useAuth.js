import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

export function useAuth() {
  const { user, token, setAuth, logout } = useAuthStore();

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAuth(data.user, data.token);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    setAuth(data.user, data.token);
    return data;
  };

  return { user, token, isAuthenticated: !!token, login, register, logout };
}
