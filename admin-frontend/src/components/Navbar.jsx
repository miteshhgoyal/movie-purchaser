// Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { tokenService } from "../services/tokenService";

const Navbar = ({ toggleSidebar, navigationLinks, config }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      tokenService.removeToken();
      logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      tokenService.removeToken();
      logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out md:top-4 md:left-4 md:right-4">
        <div className="bg-gray-800/95 backdrop-blur-xl rounded-none md:rounded-2xl border border-gray-700 w-full mx-auto transition-all duration-300 shadow-2xl">
          <div className="relative px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo Section */}
              <div className="flex items-center space-x-3 transition-all duration-300">
                {/* Mobile Sidebar Toggle */}
                <button
                  onClick={toggleSidebar}
                  className="md:hidden text-gray-400 hover:text-red-500 p-2.5 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group"
                >
                  <Menu className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                </button>

                {/* Logo and System Name */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/50 transition-all duration-300 hover:shadow-red-500/70 hover:shadow-xl hover:scale-105">
                    <Shield className="w-6 h-6 text-white transition-transform duration-300" />
                  </div>
                  <div className="hidden sm:block transition-all duration-300">
                    <h1 className="font-bold text-base md:text-lg text-white">
                      {config.systemName || "Admin Panel"}
                    </h1>
                    <p className="text-xs text-gray-400">
                      {user.isAdmin ? "Administrator" : "User"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-3">
                {/* Admin Badge */}
                {user.isAdmin && (
                  <div className="hidden sm:flex items-center gap-2 bg-red-900/30 px-3 md:px-4 py-2 rounded-lg border border-red-500/50 shadow-md transition-all duration-300 hover:bg-red-900/40">
                    <Shield className="w-4 h-4 text-red-400" />
                    <p className="text-red-400 font-semibold text-xs md:text-sm">
                      Admin
                    </p>
                  </div>
                )}

                {/* Profile Dropdown - Desktop */}
                <div
                  className="hidden md:block relative"
                  ref={profileDropdownRef}
                >
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center space-x-3 text-gray-300 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all duration-300 group-hover:shadow-red-500/50 group-hover:shadow-xl group-hover:scale-105">
                      <User className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-sm font-medium hidden lg:block max-w-32 truncate transition-all duration-300">
                      {user.name || "Admin"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-all duration-300 ${
                        isProfileDropdownOpen
                          ? "rotate-180 text-red-500"
                          : "group-hover:text-red-500"
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 py-2 z-50 transition-all duration-300 ease-out animate-in slide-in-from-top-2">
                      <div className="relative">
                        {/* User Info */}
                        <div className="px-5 py-4 border-b border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {user.name || "Admin"}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {user.email}
                              </p>
                              {user.isAdmin && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full text-xs border border-red-500/50">
                                  <Shield className="w-3 h-3" />
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {navigationLinks
                            .filter((item) => !item.subItems)
                            .slice(0, 4)
                            .map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.name}
                                  onClick={() => {
                                    navigate(item.href);
                                    setIsProfileDropdownOpen(false);
                                  }}
                                  className="flex items-center w-full px-5 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-500 transition-all duration-200 ease-out group"
                                >
                                  <Icon className="w-4 h-4 mr-3 transition-all duration-200 group-hover:text-red-500 group-hover:scale-110" />
                                  <span className="transition-all duration-200">
                                    {item.name}
                                  </span>
                                </button>
                              );
                            })}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-700 pt-2">
                          <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center w-full px-5 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            {isLoggingOut ? (
                              <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4 mr-3 transition-all duration-200 group-hover:scale-110" />
                            )}
                            <span className="transition-all duration-200">
                              {isLoggingOut ? "Signing out..." : "Sign out"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden text-gray-400 hover:text-red-500 p-2.5 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 group"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90" />
                  ) : (
                    <Menu className="w-6 h-6 transition-all duration-300 group-hover:scale-110" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 md:top-20 left-0 right-0 md:left-4 md:right-4 z-40 md:hidden transition-all duration-300 ease-out">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-none md:rounded-2xl shadow-2xl border border-gray-700 overflow-hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="relative">
              <div className="px-4 pt-4 pb-3 space-y-2">
                {/* User Info - Mobile */}
                <div className="px-4 py-4 border-b border-gray-700 mb-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {user.name || "Admin"}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {user.email}
                      </p>
                      {user.isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full text-xs border border-red-500/50">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Menu Items - Mobile */}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  {navigationLinks
                    .filter((item) => !item.subItems)
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            navigate(item.href);
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-gray-300 hover:bg-gray-700 hover:text-red-500 w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ease-out flex items-center space-x-4 group"
                        >
                          <Icon className="w-5 h-5 transition-all duration-300 group-hover:text-red-500 group-hover:scale-110" />
                          <span className="transition-all duration-300">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}

                  {/* Logout - Mobile */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ease-out flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                    )}
                    <span className="transition-all duration-300">
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
