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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

// Import reusable components
import FormInput from "../components/ui/FormInput";
import CustomCheckbox from "../components/ui/CustomCheckbox";
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
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/50">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {CONFIG.systemName}
          </h1>
          <p className="text-gray-400">Welcome Back - Admin Panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded-lg flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="userInput"
                  value={formData.userInput}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  autoComplete="username"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-900 border ${
                    errors.userInput ? "border-red-500" : "border-gray-700"
                  } rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.userInput && (
                <p className="mt-1 text-xs text-red-400">{errors.userInput}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-12 py-3 bg-gray-900 border ${
                    errors.password ? "border-red-500" : "border-gray-700"
                  } rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-2 focus:ring-red-500"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-gray-400"
              >
                Remember me
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-gray-600"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
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
      </div>
    </div>
  );
};

export default Login;
