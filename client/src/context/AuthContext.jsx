import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import adminService from '../services/adminService';
import userService from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (loginIdentifier, password) => {
    setLoading(true);
    try {
      const data = await authService.login(loginIdentifier, password);
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const data = await adminService.login(email, password);
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true };
      }
      return { success: false, message: data.message || 'Admin login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Admin login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.signup(userData);
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true };
      }
      return { success: false, message: data.message || 'Signup failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Signup failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    if (!user || user.role === 'admin') return;
    try {
      const profile = await userService.getProfile();
      if (profile.success) {
        const updatedUser = { ...user, ...profile.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
