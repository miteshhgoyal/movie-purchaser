// Login.jsx
import React, { useState } from "react";
import {
  User,
  Lock,
  RotateCcw,
  LogIn,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

import { CONFIG } from "../constants";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state
  const from = location.state?.from?.pathname || "/dashboard";

  const [formData, setFormData] = useState({
    userInput: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userInput.trim()) {
      newErrors.userInput = "Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      // Direct API call to login endpoint
      const response = await api.post("/auth/login", {
        email: formData.userInput,
        password: formData.password,
      });

      // Check if login was successful
      if (response.data.success) {
        setSuccessMessage("Login successful! Redirecting...");

        // Pass data to AuthContext login function
        login({
          token: response.data.accessToken,
          user: response.data.user,
          rememberMe: rememberMe,
        });

        // Redirect after short delay
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } else {
        setErrors({
          submit: response.data.message || "Login failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userInput: "",
      password: "",
    });
    setRememberMe(false);
    setErrors({});
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/50 transform hover:scale-105 transition-transform duration-200">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {CONFIG.systemName}
          </h1>
          <p className="text-gray-400 text-sm">Welcome Back - Admin Panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-xl flex items-center gap-3 text-green-400 animate-fade-in">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{errors.submit}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="email"
                  name="userInput"
                  value={formData.userInput}
                  onChange={handleInputChange}
                  placeholder="admin@example.com"
                  autoComplete="username"
                  className={`w-full pl-11 pr-4 py-3.5 bg-gray-900/50 border ${
                    errors.userInput ? "border-red-500" : "border-gray-700"
                  } rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all focus:bg-gray-900`}
                />
              </div>
              {errors.userInput && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.userInput}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full pl-11 pr-12 py-3.5 bg-gray-900/50 border ${
                    errors.password ? "border-red-500" : "border-gray-700"
                  } rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all focus:bg-gray-900`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-gray-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-gray-400 cursor-pointer select-none hover:text-gray-300 transition-colors"
              >
                Keep me signed in
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-500 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-red-500/50 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © 2025 {CONFIG.systemName}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
