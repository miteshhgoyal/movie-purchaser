// App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import {
  Home,
  User as NavUser,
  Film,
  DollarSign,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import { CONFIG } from "./constants";
import "./App.css";

// Import pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Movies from "./pages/Movies";
import Payments from "./pages/Payments";
import Users from "./pages/Users";
import AccessManagement from "./pages/AccessManagement";

// Navigation configuration
const navbarLinks = [
  // { name: "My Profile", href: "/profile", icon: NavUser }
];

const sidebarLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Movies",
    href: "/movies",
    icon: Film,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: DollarSign,
  },
  {
    name: "Users",
    href: "/users",
    icon: UsersIcon,
  },
  {
    name: "Access Management",
    href: "/access-management",
    icon: ShieldCheck,
  },
];

// Default Route Component
const DefaultRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-red-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

// Layout Wrapper Component
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const noLayoutRoutes = ["/login"];
  const showLayout = !noLayoutRoutes.includes(location.pathname);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);

      if (isMobileNow) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.toggleSidebar = toggleSidebar;

    return () => {
      window.removeEventListener("resize", checkMobile);
      delete window.toggleSidebar;
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!showLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-x-hidden">
      <Navbar
        toggleSidebar={toggleSidebar}
        navigationLinks={navbarLinks}
        config={CONFIG}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        navigationLinks={sidebarLinks}
        config={CONFIG}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="bg-gray-900">
        <main
          className={`transition-all duration-300 ease-in-out ${
            isMobile
              ? "pt-16 px-4 sm:px-6"
              : `pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 ${
                  sidebarOpen ? "ml-64" : "ml-16"
                }`
          }`}
        >
          <div
            className={`pb-6 pt-3 md:pb-8 md:pt-2 max-w-full ${
              !isMobile && sidebarOpen ? "max-w-[calc(100vw-16rem)]" : ""
            }`}
          >
            <div className="rounded-xl overflow-hidden border border-gray-800">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <LayoutWrapper>
          <Routes>
            {/* Login Route */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Movies - Add, Edit, Delete, Publish */}
            <Route
              path="/movies"
              element={
                <ProtectedRoute>
                  <Movies />
                </ProtectedRoute>
              }
            />

            {/* Payments - View all transactions */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />

            {/* Users - View all registered users */}
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Access Management - View active/expired access */}
            <Route
              path="/access-management"
              element={
                <ProtectedRoute>
                  <AccessManagement />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<DefaultRoute />} />

            {/* 404 fallback */}
            <Route path="*" element={<DefaultRoute />} />
          </Routes>
        </LayoutWrapper>
      </AuthProvider>
    </Router>
  );
}

export default App;
