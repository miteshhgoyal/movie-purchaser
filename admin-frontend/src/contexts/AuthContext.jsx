// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; // FIXED: Changed from authAPI to api
import { tokenService } from "../services/tokenService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const checkAuth = async () => {
    try {
      const token = tokenService.getToken();

      if (!token || tokenService.isTokenExpired(token)) {
        tokenService.removeToken();
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // FIXED: Use /auth/profile endpoint to verify token
      const response = await api.get("/auth/profile");

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        tokenService.removeToken();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      tokenService.removeToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    const { token, user, rememberMe } = userData;

    // Store token
    tokenService.setToken(token);

    // Set user data
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    tokenService.removeToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
