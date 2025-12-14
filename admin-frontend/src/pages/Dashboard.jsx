// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Home,
  Film,
  DollarSign,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  Eye,
  Loader,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import api from "../services/api";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/dashboard");
      setStats(response.data.stats);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Home className="w-8 h-8 text-red-500" />
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Overview of your OTT platform analytics
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Movies */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                12%
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Movies</p>
            <p className="text-3xl font-bold text-white">
              {stats?.totalMovies || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.publishedMovies || 0} Published
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                23%
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-white">
              {formatPrice(stats?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.totalPayments || 0} Payments
            </p>
          </div>

          {/* Total Users */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                8%
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">
              {stats?.totalUsers || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.activeUsers || 0} Active
            </p>
          </div>

          {/* Active Access */}
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 border border-orange-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-red-400 flex items-center gap-1">
                <ArrowDown className="w-3 h-3" />
                5%
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Active Access</p>
            <p className="text-3xl font-bold text-white">
              {stats?.activeAccess || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.expiredAccess || 0} Expired
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Recent Payments</h2>
            </div>
            <div className="space-y-4">
              {stats?.recentPayments?.slice(0, 5).map((payment) => (
                <div
                  key={payment.paymentId}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {payment.movie?.title || "Movie"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.user?.name || "Guest"} •{" "}
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-green-400">
                    {formatPrice(payment.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Movies */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Top Movies</h2>
            </div>
            <div className="space-y-4">
              {stats?.topMovies?.slice(0, 5).map((movie) => (
                <div
                  key={movie._id}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-900/40 rounded-lg flex items-center justify-center">
                      <Film className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {movie.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movie.revenue} revenue
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {movie.purchases}
                    </p>
                    <p className="text-xs text-gray-500">purchases</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
