// pages/AccessManagement.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  ShieldCheck,
  Search,
  Filter,
  Film,
  User,
  Clock,
  Smartphone,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  Ban,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AccessManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessList, setAccessList] = useState([]);
  const [filteredAccess, setFilteredAccess] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [movieFilter, setMovieFilter] = useState("all");
  const [movies, setMovies] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadAccess();
    loadMovies();
  }, []);

  useEffect(() => {
    filterAccess();
  }, [accessList, searchTerm, statusFilter, movieFilter]);

  const loadAccess = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/access");
      setAccessList(response.data.accessList);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load access records");
    } finally {
      setLoading(false);
    }
  };

  const loadMovies = async () => {
    try {
      const response = await api.get("/movies");
      setMovies(response.data.movies);
    } catch (e) {
      console.error("Failed to load movies", e);
    }
  };

  const filterAccess = () => {
    let filtered = [...accessList];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.accessId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.deviceId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    const now = new Date();
    if (statusFilter === "active") {
      filtered = filtered.filter(
        (a) => new Date(a.expiryTime) > now && a.paymentStatus === "success"
      );
    } else if (statusFilter === "expired") {
      filtered = filtered.filter((a) => new Date(a.expiryTime) <= now);
    }

    // Movie filter
    if (movieFilter !== "all") {
      filtered = filtered.filter((a) => a.movie?._id === movieFilter);
    }

    setFilteredAccess(filtered);
    setCurrentPage(1);
  };

  const revokeAccess = async (access) => {
    if (
      !confirm(`Are you sure you want to revoke access for ${access.accessId}?`)
    ) {
      return;
    }

    try {
      await api.delete(`/admin/access/${access.accessId}`);
      setSuccess("Access revoked successfully");
      loadAccess();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to revoke access");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRemainingTime = (expiryTime) => {
    const now = new Date().getTime();
    const expiry = new Date(expiryTime).getTime();
    const remainingMs = expiry - now;

    if (remainingMs <= 0) return "Expired";

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  };

  const isActive = (expiryTime) => {
    return new Date(expiryTime) > new Date();
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAccess.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAccess.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-gray-400 font-medium">Loading access records...</p>
        </div>
      </div>
    );
  }

  const activeCount = accessList.filter(
    (a) => isActive(a.expiryTime) && a.paymentStatus === "success"
  ).length;
  const expiredCount = accessList.filter((a) => !isActive(a.expiryTime)).length;

  return (
    <>
      <Helmet>
        <title>Access Management - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-blue-500" />
                Access Management
              </h1>
              <p className="text-gray-400 mt-2">
                Monitor and manage movie access tokens
              </p>
            </div>
            <button
              onClick={loadAccess}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button onClick={() => setError("")}>
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-400">{success}</p>
            </div>
            <button onClick={() => setSuccess("")}>
              <X className="w-4 h-4 text-green-500" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-400">Total Access</p>
            </div>
            <p className="text-2xl font-bold text-white">{accessList.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-400">Active</p>
            </div>
            <p className="text-2xl font-bold text-white">{activeCount}</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-red-400">Expired</p>
            </div>
            <p className="text-2xl font-bold text-white">{expiredCount}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-purple-400">
                Playback Started
              </p>
            </div>
            <p className="text-2xl font-bold text-white">
              {accessList.filter((a) => a.playbackStarted).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by ID, user, movie..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Movie
              </label>
              <select
                value={movieFilter}
                onChange={(e) => setMovieFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Movies</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Access Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Access ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Movie
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Expiry
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No access records found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((access) => (
                    <tr
                      key={access.accessId}
                      className="border-b border-gray-700/50 hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-white">
                          {access.accessId}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-white">
                              {access.user?.name || "Guest"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {access.user?.userId || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-white">
                              {access.movie?.title || "N/A"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Smartphone className="w-3 h-3 text-gray-600" />
                              <p className="text-xs text-gray-500 font-mono">
                                {access.deviceId?.substring(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border w-fit ${
                              isActive(access.expiryTime) &&
                              access.paymentStatus === "success"
                                ? "bg-green-900/30 border-green-500 text-green-400"
                                : "bg-red-900/30 border-red-500 text-red-400"
                            }`}
                          >
                            {isActive(access.expiryTime) &&
                            access.paymentStatus === "success" ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Expired
                              </>
                            )}
                          </span>
                          {access.playbackStarted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs w-fit">
                              <Play className="w-3 h-3" />
                              Playing
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-400">
                              {formatDate(access.expiryTime)}
                            </p>
                            <p
                              className={`text-xs ${
                                isActive(access.expiryTime)
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {getRemainingTime(access.expiryTime)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => revokeAccess(access)}
                            className="p-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors"
                            title="Revoke Access"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredAccess.length)} of{" "}
                {filteredAccess.length} records
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccessManagement;
