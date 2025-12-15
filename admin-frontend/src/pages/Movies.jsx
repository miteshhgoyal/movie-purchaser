import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  CheckCircle,
  Video,
  Eye,
  EyeOff,
  Clock,
  Filter,
  UploadCloud,
  DollarSign,
  Tag,
  RefreshCw,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Movies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [movies, setMovies] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Modal-specific success/error messages
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [movieFile, setMovieFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [editPosterFile, setEditPosterFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMovies();
  }, [searchTerm, statusFilter]);

  const loadMovies = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/movies", {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
      setMovies(response.data.movies);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = async () => {
    setModalError("");
    setModalSuccess("");

    if (!formData.title || !formData.price || !movieFile) {
      setModalError("Please fill all required fields and select movie file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("price", formData.price);
      uploadData.append("movieFile", movieFile);
      if (posterFile) uploadData.append("poster", posterFile);

      await api.post("/movies", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setModalSuccess(
        "Movie uploaded successfully! You can add another or close this window."
      );
      setSuccess("Movie added successfully");

      setFormData({
        title: "",
        description: "",
        price: "",
      });
      setMovieFile(null);
      setPosterFile(null);

      loadMovies();
      setTimeout(() => setModalSuccess(""), 5000);
    } catch (e) {
      setModalError(e.response?.data?.message || "Failed to add movie");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditMovie = async () => {
    setSubmitting(true);
    setModalError("");
    try {
      const updateData = new FormData();
      updateData.append("title", editFormData.title);
      updateData.append("description", editFormData.description);
      updateData.append("price", editFormData.price);
      if (editPosterFile) updateData.append("poster", editPosterFile);

      await api.put(`/movies/${selectedMovie.movieId}`, updateData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Movie updated successfully");
      setShowEditModal(false);
      setSelectedMovie(null);
      setEditPosterFile(null);
      setModalError("");
      loadMovies();
    } catch (e) {
      setModalError(e.response?.data?.message || "Failed to update movie");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ FIXED: Removed /admin/movies prefix
  const handleDeleteMovie = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/movies/${selectedMovie.movieId}`);
      setSuccess("Movie deleted successfully");
      setShowDeleteModal(false);
      setSelectedMovie(null);
      loadMovies();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete movie");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (movie) => {
    try {
      await api.put(`/movies/${movie.movieId}/toggle-publish`);
      setSuccess(
        `Movie ${movie.status === "published" ? "unpublished" : "published"}`
      );
      loadMovies();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status");
    }
  };

  const openDetailModal = async (movie) => {
    try {
      const response = await api.get(`/movies/${movie.movieId}/details`);
      setSelectedMovie(response.data.movie);
      setShowDetailModal(true);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load movie details");
    }
  };

  const openEditModal = (movie) => {
    setSelectedMovie(movie);
    setEditFormData({
      title: movie.title,
      description: movie.description || "",
      price: movie.price,
    });
    setModalError("");
    setShowEditModal(true);
  };

  const openVideoModal = async (movie) => {
    try {
      const response = await api.get(`/movies/${movie.movieId}/details`);
      setSelectedMovie(response.data.movie);
      setShowVideoModal(true);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load movie");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
    });
    setMovieFile(null);
    setPosterFile(null);
    setSelectedMovie(null);
    setModalError("");
    setModalSuccess("");
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading && movies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-red-500 animate-spin" />
          <p className="text-gray-400 font-medium">Loading movies...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Movies - Admin</title>
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
                <PlayCircle className="w-8 h-8 text-red-500" />
                Manage Movies
              </h1>
              <p className="text-gray-400 mt-2">
                Upload, manage and publish your OTT movies
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadMovies}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30"
              >
                <Plus className="w-5 h-5" />
                Add Movie
              </button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-400">Total Movies</p>
            </div>
            <p className="text-2xl font-bold text-white">{movies.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-green-400">Published</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {movies.filter((m) => m.status === "published").length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-purple-400">
                Revenue Potential
              </p>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatPrice(movies.reduce((sum, m) => sum + m.price, 0))}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border border-yellow-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-yellow-400">
                Total Duration
              </p>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatDuration(
                movies.reduce((sum, m) => sum + m.durationSeconds, 0)
              )}
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
                  placeholder="Search by title..."
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
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Movies Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Movie
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {movies.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No movies found
                        </p>
                        <p className="text-sm text-gray-600">
                          Add your first movie to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movies.map((movie) => (
                    <tr
                      key={movie.movieId}
                      className="border-b border-gray-700/50 hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                            <PlayCircle className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {movie.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {movie.movieId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-400">
                            {formatDuration(movie.durationSeconds)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-green-400">
                          {formatPrice(movie.price)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                            movie.status === "published"
                              ? "bg-green-900/30 text-green-400 border-green-500/50"
                              : "bg-gray-900/30 text-gray-400 border-gray-700"
                          }`}
                        >
                          {movie.status === "published" ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Draft
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openVideoModal(movie)}
                            className="p-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 rounded-lg transition-colors"
                            title="Watch Movie"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDetailModal(movie)}
                            className="p-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(movie)}
                            className="p-2 bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 rounded-lg transition-colors"
                            title="Edit Movie"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => togglePublish(movie)}
                            className={`p-2 rounded-lg transition-colors ${
                              movie.status === "published"
                                ? "bg-gray-900/40 hover:bg-gray-900/60 text-gray-400"
                                : "bg-green-900/40 hover:bg-green-900/60 text-green-400"
                            }`}
                            title={
                              movie.status === "published"
                                ? "Unpublish"
                                : "Publish"
                            }
                          >
                            {movie.status === "published" ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMovie(movie);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors"
                            title="Delete Movie"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Movie Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="relative flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Add New Movie
                  </h2>
                  <p className="text-xs text-gray-400">
                    Movie ID & duration will be auto-generated
                  </p>
                </div>
              </div>
              <button
                onClick={closeAddModal}
                disabled={uploading}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Modal Success Message */}
              {modalSuccess && (
                <div className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-400 font-medium">
                      {modalSuccess}
                    </p>
                  </div>
                  <button onClick={() => setModalSuccess("")}>
                    <X className="w-4 h-4 text-green-500" />
                  </button>
                </div>
              )}

              {/* Modal Error Message */}
              {modalError && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-400">{modalError}</p>
                  </div>
                  <button onClick={() => setModalError("")}>
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    disabled={uploading}
                    placeholder="e.g., Avengers: Endgame"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    disabled={uploading}
                    placeholder="Movie description..."
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    disabled={uploading}
                    placeholder="99.00"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Movie File <span className="text-red-500">*</span>
                  </label>
                  <label
                    className={`block w-full border-2 border-dashed rounded-xl p-6 transition-all ${
                      uploading
                        ? "border-gray-700 bg-gray-900/50 cursor-not-allowed"
                        : "border-gray-700 hover:border-red-500 hover:bg-red-900/10 cursor-pointer"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      {movieFile ? (
                        <>
                          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mb-3">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm text-white font-semibold mb-1 truncate max-w-full px-2">
                            {movieFile.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(movieFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                            <UploadCloud className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-300 font-medium mb-1">
                            Click to upload movie file
                          </p>
                          <p className="text-xs text-gray-500">
                            MP4, MOV, MKV (Max 2GB) - Duration will be
                            auto-calculated
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setMovieFile(e.target.files[0])}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poster Image (Optional)
                  </label>
                  <label
                    className={`block w-full border-2 border-dashed rounded-xl p-6 transition-all ${
                      uploading
                        ? "border-gray-700 bg-gray-900/50 cursor-not-allowed"
                        : "border-gray-700 hover:border-blue-500 hover:bg-blue-900/10 cursor-pointer"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      {posterFile ? (
                        <>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mb-3">
                            <Tag className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm text-white font-semibold mb-1 truncate max-w-full px-2">
                            {posterFile.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(posterFile.size / 1024).toFixed(1)} KB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                            <Tag className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-300 font-medium mb-1">
                            Click to upload poster
                          </p>
                          <p className="text-xs text-gray-500">
                            JPG, PNG (Max 2MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPosterFile(e.target.files[0])}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploading && (
                  <div className="bg-red-900/20 border border-red-500 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-red-400 flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Uploading movie...
                      </span>
                      <span className="text-lg font-bold text-red-400">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-600 to-red-700 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-red-400 mt-2">
                      Please wait while we upload and process your movie...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-900/50 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={closeAddModal}
                  disabled={uploading}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : "Close"}
                </button>
                <button
                  onClick={handleAddMovie}
                  disabled={
                    uploading ||
                    !formData.title ||
                    !formData.price ||
                    !movieFile
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      Upload Movie
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="relative flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-900/40 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Movie</h2>
                  <p className="text-xs text-gray-400">Update movie details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMovie(null);
                  setEditPosterFile(null);
                  setModalError("");
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {modalError && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-400">{modalError}</p>
                  </div>
                  <button onClick={() => setModalError("")}>
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="p-3 bg-gray-900/50 rounded-lg mb-4 border border-gray-700">
                  <p className="text-xs text-gray-400">Movie ID</p>
                  <p className="text-sm font-mono text-white">
                    {selectedMovie.movieId}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Duration</p>
                  <p className="text-sm text-white">
                    {formatDuration(selectedMovie.durationSeconds)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Update Poster (Optional)
                  </label>
                  <label className="block w-full border-2 border-dashed border-gray-700 hover:border-yellow-500 hover:bg-yellow-900/10 rounded-xl p-6 cursor-pointer transition-all">
                    <div className="flex flex-col items-center justify-center text-center">
                      {editPosterFile ? (
                        <>
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center mb-3">
                            <Tag className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm text-white font-semibold mb-1">
                            {editPosterFile.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(editPosterFile.size / 1024).toFixed(1)} KB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                            <Tag className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-300 font-medium mb-1">
                            Click to upload new poster
                          </p>
                          <p className="text-xs text-gray-500">
                            JPG, PNG (Max 2MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditPosterFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-900/50 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMovie(null);
                    setEditPosterFile(null);
                    setModalError("");
                  }}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditMovie}
                  disabled={
                    submitting || !editFormData.title || !editFormData.price
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-5 h-5" />
                      Update Movie
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delete Movie</h2>
                  <p className="text-sm text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-bold text-white">
                  {selectedMovie.title}
                </span>
                ?
              </p>
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-400">
                  ⚠️ This will permanently delete the movie and all associated
                  data.
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-900/50 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMovie(null);
                  }}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMovie}
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete Movie
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="relative flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900/40 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Movie Details
                  </h2>
                  <p className="text-xs text-gray-400">Complete information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedMovie(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Movie ID</p>
                    <p className="text-sm font-mono text-white">
                      {selectedMovie.movieId}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                        selectedMovie.status === "published"
                          ? "bg-green-900/30 text-green-400 border-green-500/50"
                          : "bg-gray-900/30 text-gray-400 border-gray-700"
                      }`}
                    >
                      {selectedMovie.status === "published" ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Title</p>
                  <p className="text-lg font-bold text-white">
                    {selectedMovie.title}
                  </p>
                </div>

                {selectedMovie.description && (
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-2">Description</p>
                    <p className="text-sm text-gray-300">
                      {selectedMovie.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Price</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatPrice(selectedMovie.price)}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Duration</p>
                    <p className="text-xl font-bold text-white">
                      {formatDuration(selectedMovie.durationSeconds)}
                    </p>
                  </div>
                </div>

                {selectedMovie.posterPath && (
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-2">Poster</p>
                    <img
                      src={selectedMovie.posterPath}
                      alt={selectedMovie.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-900/50 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedMovie(null);
                }}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedMovie && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="relative flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-900/40 rounded-xl flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedMovie.title}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {formatDuration(selectedMovie.durationSeconds)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedMovie(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {selectedMovie.filePath ? (
                <video
                  controls
                  autoPlay
                  className="w-full rounded-lg bg-black"
                  src={selectedMovie.filePath}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-900/50 rounded-lg">
                  <Video className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">Video not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Movies;
