import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from '../config/api';
import { showToast } from '../components/common/Toast';
import { User } from '../types/meetings.types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    role: string,
  ) => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Persist user on page load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Failed to parse stored user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
    try {
      if (token) {
        const response = await api.get('/auth/me');
        const userData: User | undefined = response.data?.user;
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data;

      const userWithRole: User = {
        ...userData,
        role: userData.role.toUpperCase(),
      };

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userWithRole));

      setToken(authToken);
      setUser(userWithRole);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      showToast.success(`Welcome back, ${userData.name}! 🎉`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      showToast.error(errorMsg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    showToast.success('Logged out successfully');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string,
  ) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
      });
      const { user: userData, token: authToken } = response.data;

      const userWithRole: User = {
        ...userData,
        role: userData.role.toUpperCase(),
      };

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userWithRole));

      setToken(authToken);
      setUser(userWithRole);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      showToast.success('Registration successful! Welcome! 🎉');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      showToast.error(errorMsg);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        register,
        isAuthenticated: !!token && !!user,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
