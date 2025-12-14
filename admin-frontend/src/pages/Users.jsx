// pages/Users.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Users as UsersIcon,
  Search,
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Eye,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  Smartphone,
  ShoppingBag,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Users = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPurchases, setUserPurchases] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.users);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) =>
        statusFilter === "active" ? u.isActive : !u.isActive
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user.userId}/toggle-status`);
      setSuccess(
        `User ${user.isActive ? "deactivated" : "activated"} successfully`
      );
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update user status");
    }
  };

  const viewUserDetails = async (user) => {
    try {
      const response = await api.get(`/admin/users/${user.userId}/details`);
      setSelectedUser(response.data.user);
      setUserPurchases(response.data.purchases || []);
      setShowDetailModal(true);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load user details");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-gray-400 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Users - Admin</title>
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
                <UsersIcon className="w-8 h-8 text-purple-500" />
                Users
              </h1>
              <p className="text-gray-400 mt-2">
                Manage registered users and their accounts
              </p>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-purple-400">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-400">Active Users</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {users.filter((u) => u.isActive).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-red-400">Inactive Users</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {users.filter((u) => !u.isActive).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Search by ID, name, email..."
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
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Joined
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
                          <UsersIcon className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No users found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((user) => (
                    <tr
                      key={user.userId}
                      className="border-b border-gray-700/50 hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-white">
                          {user.userId}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-900/40 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-purple-400" />
                          </div>
                          <p className="text-sm font-medium text-white">
                            {user.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            user.isActive
                              ? "bg-green-900/30 border-green-500 text-green-400"
                              : "bg-red-900/30 border-red-500 text-red-400"
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-400">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => viewUserDetails(user)}
                            className="p-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive
                                ? "bg-red-900/40 hover:bg-red-900/60 text-red-400"
                                : "bg-green-900/40 hover:bg-green-900/60 text-green-400"
                            }`}
                            title={user.isActive ? "Deactivate" : "Activate"}
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
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
                {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
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

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="relative flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-900/40 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">User Details</h2>
                  <p className="text-xs text-gray-400">
                    Complete user information
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* User Info */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">User ID</p>
                    <p className="text-sm font-mono text-white">
                      {selectedUser.userId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm text-white">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm text-white">
                      {selectedUser.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.isActive
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Joined</p>
                    <p className="text-sm text-white">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Device IDs */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Registered Devices
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.deviceIds?.length > 0 ? (
                      selectedUser.deviceIds.map((deviceId, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400"
                        >
                          <Smartphone className="w-3 h-3" />
                          {deviceId.substring(0, 12)}...
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No devices</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-bold text-white">
                    Purchase History
                  </h3>
                  <span className="ml-auto text-sm text-gray-400">
                    {userPurchases.length} purchases
                  </span>
                </div>

                {userPurchases.length > 0 ? (
                  <div className="space-y-3">
                    {userPurchases.map((purchase) => (
                      <div
                        key={purchase.paymentId}
                        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white">
                            {purchase.movie?.title || "Movie"}
                          </p>
                          <p className="text-sm font-bold text-green-400">
                            {formatPrice(purchase.amount)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(purchase.createdAt)}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              purchase.status === "success"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No purchases yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;
