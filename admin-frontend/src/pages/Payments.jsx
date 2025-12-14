// pages/Payments.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  DollarSign,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  AlertCircle,
  ArrowLeft,
  Eye,
  Calendar,
  User,
  Film,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Payments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, dateFilter]);

  const loadPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/payments");
      setPayments(response.data.payments);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === "today") {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        filterDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter((p) => new Date(p.createdAt) >= filterDate);
    }

    setFilteredPayments(filtered);
    setCurrentPage(1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      success: {
        bg: "bg-green-900/30",
        border: "border-green-500",
        text: "text-green-400",
        icon: CheckCircle,
      },
      failed: {
        bg: "bg-red-900/30",
        border: "border-red-500",
        text: "text-red-400",
        icon: XCircle,
      },
      created: {
        bg: "bg-blue-900/30",
        border: "border-blue-500",
        text: "text-blue-400",
        icon: Clock,
      },
      initiated: {
        bg: "bg-yellow-900/30",
        border: "border-yellow-500",
        text: "text-yellow-400",
        icon: Clock,
      },
    };

    const config = statusConfig[status] || statusConfig.created;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.border} ${config.text}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const exportToCSV = () => {
    const csv = [
      [
        "Payment ID",
        "User",
        "Movie",
        "Amount",
        "Status",
        "Date",
        "Gateway Payment ID",
      ],
      ...filteredPayments.map((p) => [
        p.paymentId,
        p.user?.name || "Guest",
        p.movie?.title || "N/A",
        p.amount,
        p.status,
        formatDate(p.createdAt),
        p.gatewayPaymentId || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalRevenue = filteredPayments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-gray-400 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Payments - Admin</title>
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
                <DollarSign className="w-8 h-8 text-green-500" />
                Payments
              </h1>
              <p className="text-gray-400 mt-2">
                View and manage all payment transactions
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-400">
                Total Revenue
              </p>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatPrice(totalRevenue)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-400">
                Total Payments
              </p>
            </div>
            <p className="text-2xl font-bold text-white">
              {filteredPayments.length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border border-emerald-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-emerald-400">Successful</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {payments.filter((p) => p.status === "success").length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-red-400">Failed</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {payments.filter((p) => p.status === "failed").length}
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
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="created">Created</option>
                <option value="initiated">Initiated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Payment ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Movie
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                          <DollarSign className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No payments found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((payment) => (
                    <tr
                      key={payment.paymentId}
                      className="border-b border-gray-700/50 hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <p className="text-sm font-mono text-white">
                            {payment.paymentId}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-white">
                              {payment.user?.name || "Guest"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.user?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-white">
                            {payment.movie?.title || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-green-400">
                          {formatPrice(payment.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-400">
                            {formatDate(payment.createdAt)}
                          </p>
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
                {Math.min(indexOfLastItem, filteredPayments.length)} of{" "}
                {filteredPayments.length} payments
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

export default Payments;
