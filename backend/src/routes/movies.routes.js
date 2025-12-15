// routes/movies.routes.js
import express from 'express';
import Movie from '../models/Movie.js';
import Admin from '../models/Admin.js';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
import { getVideoDurationInSeconds } from 'get-video-duration';

const router = express.Router();

// Helper - Admin Check
const requireAdmin = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.user.userId);
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Authorization failed' });
    }
};

// Helper - Generate unique Movie ID (FIXED - added retry logic)
const generateMovieId = async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // Find the last movie sorted by movieId in descending order
            const lastMovie = await Movie.findOne()
                .sort({ movieId: -1 })
                .select('movieId')
                .lean();

            if (!lastMovie || !lastMovie.movieId) {
                return 'M10001';
            }

            // Extract number from movieId (e.g., "M10001" -> 10001)
            const lastNum = parseInt(lastMovie.movieId.replace('M', ''));

            // Generate next ID
            const nextNum = lastNum + 1;
            const newId = `M${nextNum}`;

            // Check if this ID already exists (race condition prevention)
            const exists = await Movie.findOne({ movieId: newId });
            if (!exists) {
                return newId;
            }

            // If exists, retry with a small delay
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Generate Movie ID attempt ${attempt + 1} failed:`, error);
            if (attempt === retries - 1) {
                // Last attempt failed, use timestamp-based ID
                return `M${Date.now()}`;
            }
        }
    }

    // Fallback to timestamp-based ID
    return `M${Date.now()}`;
};

// Helper - Extract Cloudinary public_id from URL
const getCloudinaryPublicId = (url) => {
    if (!url) return null;
    try {
        // Extract public_id from Cloudinary URL
        // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;

        // Get everything after 'upload/v{version}/'
        const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');

        // Remove file extension
        const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
        return publicId;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};

// Helper - Delete file from Cloudinary
const deleteFromCloudinary = async (url, resourceType = 'image') => {
    try {
        const publicId = getCloudinaryPublicId(url);
        if (!publicId) {
            console.log('Could not extract public_id from URL:', url);
            return false;
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true
        });

        console.log(`Cloudinary deletion result for ${publicId}:`, result);
        return result.result === 'ok' || result.result === 'not found';
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return false;
    }
};

// PUBLIC ROUTES
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query;
        // let query = { status: 'published' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const movies = await Movie.find(query)
            .select('-filePath')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, movies });
    } catch (error) {
        console.error('Get movies error:', error);
        res.status(500).json({ message: 'Failed to fetch movies' });
    }
});

router.get('/:movieId', async (req, res) => {
    try {
        const movie = await Movie.findOne({ movieId: req.params.movieId })
            .select('-filePath')
            .lean();

        console.log(movie);

        // if (!movie || movie.status !== 'published') {
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.json({ success: true, movie });
    } catch (error) {
        console.error('Get movie error:', error);
        res.status(500).json({ message: 'Failed to fetch movie' });
    }
});

// ADMIN ROUTES
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { movieId: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const movies = await Movie.find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, movies });
    } catch (error) {
        console.error('Get all movies error:', error);
        res.status(500).json({ message: 'Failed to fetch movies' });
    }
});

// Get single movie details (admin)
router.get('/:movieId/details', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const movie = await Movie.findOne({ movieId: req.params.movieId }).lean();
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json({ success: true, movie });
    } catch (error) {
        console.error('Get movie details error:', error);
        res.status(500).json({ message: 'Failed to fetch movie details' });
    }
});

router.post('/',
    authenticateToken,
    requireAdmin,
    upload.fields([{ name: 'movieFile', maxCount: 1 }, { name: 'poster', maxCount: 1 }]),
    async (req, res) => {
        let uploadedVideoUrl = null;
        let uploadedPosterUrl = null;

        try {
            const { title, description, price } = req.body;

            // Validation
            if (!title || !price) {
                return res.status(400).json({ message: 'Title and price required' });
            }

            if (!req.files.movieFile) {
                return res.status(400).json({ message: 'Movie file required' });
            }

            // Calculate video duration from file
            const videoPath = req.files.movieFile[0].path;
            let durationSeconds = 0;

            try {
                durationSeconds = Math.round(await getVideoDurationInSeconds(videoPath));
            } catch (err) {
                console.error('Duration calculation error:', err);
                durationSeconds = 0;
            }

            // Upload movie file to Cloudinary
            const movieResult = await cloudinary.uploader.upload(videoPath, {
                resource_type: 'video',
                folder: 'ott/movies',
                chunk_size: 6000000,
                timeout: 120000
            });
            uploadedVideoUrl = movieResult.secure_url;

            // Upload poster if provided
            if (req.files.poster) {
                const posterResult = await cloudinary.uploader.upload(req.files.poster[0].path, {
                    folder: 'ott/posters',
                    width: 400,
                    height: 600,
                    crop: 'fill'
                });
                uploadedPosterUrl = posterResult.secure_url;
            }

            // Generate unique Movie ID with retry logic
            const movieId = await generateMovieId();
            console.log('Generated Movie ID:', movieId);

            // Create movie document
            const movie = new Movie({
                movieId,
                title,
                description,
                durationSeconds,
                price: parseFloat(price),
                filePath: uploadedVideoUrl,
                posterPath: uploadedPosterUrl,
                status: 'draft'
            });

            await movie.save();

            console.log('Movie created successfully:', movieId);

            res.status(201).json({
                success: true,
                message: 'Movie created successfully',
                movie
            });
        } catch (error) {
            console.error('Create movie error:', error);

            // Rollback: Delete uploaded files if movie creation failed
            if (uploadedVideoUrl) {
                await deleteFromCloudinary(uploadedVideoUrl, 'video');
            }
            if (uploadedPosterUrl) {
                await deleteFromCloudinary(uploadedPosterUrl, 'image');
            }

            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(409).json({
                    message: 'Duplicate movie ID detected. Please try again.',
                    error: 'DUPLICATE_KEY'
                });
            }

            res.status(500).json({
                message: error.message || 'Failed to create movie'
            });
        }
    }
);

// Update movie
router.put('/:movieId',
    authenticateToken,
    requireAdmin,
    upload.single('poster'),
    async (req, res) => {
        try {
            const { title, description, price } = req.body;

            const updateData = {
                title,
                description,
                price: price ? parseFloat(price) : undefined
            };

            // Upload new poster if provided
            if (req.file) {
                const posterResult = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'ott/posters',
                    width: 400,
                    height: 600,
                    crop: 'fill'
                });
                updateData.posterPath = posterResult.secure_url;
            }

            const movie = await Movie.findOneAndUpdate(
                { movieId: req.params.movieId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }

            res.json({
                success: true,
                message: 'Movie updated successfully',
                movie
            });
        } catch (error) {
            console.error('Update movie error:', error);
            res.status(500).json({ message: 'Failed to update movie' });
        }
    }
);

// Delete movie (FIXED - now deletes from Cloudinary too)
router.delete('/:movieId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const movie = await Movie.findOne({ movieId: req.params.movieId });
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Delete files from Cloudinary
        const deletionResults = {
            video: false,
            poster: false
        };

        if (movie.filePath) {
            deletionResults.video = await deleteFromCloudinary(movie.filePath, 'video');
        }

        if (movie.posterPath) {
            deletionResults.poster = await deleteFromCloudinary(movie.posterPath, 'image');
        }

        // Delete from database
        await Movie.findOneAndDelete({ movieId: req.params.movieId });

        res.json({
            success: true,
            message: 'Movie deleted successfully',
            cloudinaryDeletion: deletionResults
        });
    } catch (error) {
        console.error('Delete movie error:', error);
        res.status(500).json({ message: 'Failed to delete movie' });
    }
});

// Toggle publish status
router.put('/:movieId/toggle-publish', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const movie = await Movie.findOne({ movieId: req.params.movieId });
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        movie.status = movie.status === 'published' ? 'draft' : 'published';
        await movie.save();

        res.json({
            success: true,
            message: `Movie ${movie.status}`,
            status: movie.status,
            movie
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({ message: 'Failed to toggle publish status' });
    }
});

export default router;
