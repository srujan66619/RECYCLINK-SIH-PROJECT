import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const DEFAULT_PROFILES = {
  COLLECTOR: {
    user_id: 2,
    full_name: "Ramesh Kabadiwala",
    email: "collector@recyclink.in",
    phone: "9876543210",
    role: "COLLECTOR",
    profile_id: 1,
    city: "Hyderabad"
  },
  RECYCLER: {
    user_id: 22,
    full_name: "Director (GreenCycle E-Waste)",
    email: "recycler@recyclink.in",
    phone: "9876500001",
    role: "RECYCLER",
    profile_id: 1,
    city: "Hyderabad"
  },
  ADMIN: {
    user_id: 1,
    full_name: "Dr. Sunita Sharma (CPCB Officer)",
    email: "admin@recyclink.in",
    phone: "9876599999",
    role: "ADMIN",
    profile_id: null,
    city: "Central Command"
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('recyclink_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_PROFILES.COLLECTOR;
  });

  const [token, setToken] = useState(() => localStorage.getItem('recyclink_token') || null);
  const [loading, setLoading] = useState(false);

  // Validate session on load if token exists
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data) {
            setUser((prev) => ({
              ...prev,
              user_id: res.data.id,
              full_name: res.data.full_name,
              email: res.data.email,
              phone: res.data.phone,
              role: res.data.role
            }));
          }
        } catch (err) {
          // Token expired or invalid
          console.warn("Session verification warning:", err.message);
        }
      }
    };
    verifyUser();
  }, [token]);

  const login = async (username_or_phone, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', {
        username_or_phone,
        password
      });
      const data = res.data;
      const userData = {
        user_id: data.user_id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        profile_id: data.profile_id,
        city: data.city || "Hyderabad"
      };
      setUser(userData);
      setToken(data.access_token);
      localStorage.setItem('recyclink_user', JSON.stringify(userData));
      localStorage.setItem('recyclink_token', data.access_token);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || "Invalid phone/email or password";
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', userData);
      const data = res.data;
      const newUser = {
        user_id: data.user_id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        profile_id: data.profile_id,
        city: data.city || userData.city || "Hyderabad"
      };
      setUser(newUser);
      setToken(data.access_token);
      localStorage.setItem('recyclink_user', JSON.stringify(newUser));
      localStorage.setItem('recyclink_token', data.access_token);
      setLoading(false);
      return { success: true, user: newUser };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || "Registration failed";
      return { success: false, error: msg };
    }
  };

  const quickSwitchRole = async (roleKey) => {
    const creds = {
      COLLECTOR: { username: "collector@recyclink.in", password: "collector123" },
      RECYCLER: { username: "recycler@recyclink.in", password: "recycler123" },
      ADMIN: { username: "admin@recyclink.in", password: "admin123" }
    };
    const c = creds[roleKey];
    if (c) {
      const res = await login(c.username, c.password);
      if (res.success) return res;
    }
    const target = DEFAULT_PROFILES[roleKey] || DEFAULT_PROFILES.COLLECTOR;
    setUser(target);
    localStorage.setItem('recyclink_user', JSON.stringify(target));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('recyclink_user');
    localStorage.removeItem('recyclink_token');
  };

  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      loginWithCredentials: login,
      register,
      quickSwitchRole,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
