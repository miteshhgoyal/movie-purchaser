// routes/admin.routes.js - COMPLETE FILE
import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import Admin from '../models/Admin.js';
import Movie from '../models/Movie.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Access from '../models/Access.js';

const router = express.Router();

// Admin check middleware
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

// ============ DASHBOARD ============
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get counts
        const totalMovies = await Movie.countDocuments();
        const publishedMovies = await Movie.countDocuments({ status: 'published' });
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });

        // Get revenue
        const payments = await Payment.find({ status: 'success' });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalPayments = payments.length;

        // Get access stats
        const now = new Date();
        const activeAccess = await Access.countDocuments({
            expiryTime: { $gt: now },
            paymentStatus: 'success'
        });
        const expiredAccess = await Access.countDocuments({
            expiryTime: { $lte: now }
        });

        // Recent payments
        const recentPayments = await Payment.find({ status: 'success' })
            .populate('movie', 'title')
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Top movies by revenue
        const topMovies = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: '$movie',
                    purchases: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'movies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'movieInfo'
                }
            },
            { $unwind: '$movieInfo' },
            {
                $project: {
                    title: '$movieInfo.title',
                    purchases: 1,
                    revenue: 1
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalMovies,
                publishedMovies,
                totalUsers,
                activeUsers,
                totalRevenue,
                totalPayments,
                activeAccess,
                expiredAccess,
                recentPayments,
                topMovies
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Failed to load dashboard data' });
    }
});

// ============ PAYMENTS ============
router.get('/payments', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('user', 'name email userId')
            .populate('movie', 'title movieId')
            .populate('access')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, payments });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ message: 'Failed to load payments' });
    }
});

// ============ USERS ============
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to load users' });
    }
});

// Get user details with purchases
router.get('/users/:userId/details', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId })
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's purchases
        const purchases = await Payment.find({ user: user._id, status: 'success' })
            .populate('movie', 'title')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, user, purchases });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ message: 'Failed to load user details' });
    }
});

// Toggle user status
router.put('/users/:userId/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                userId: user.userId,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ message: 'Failed to update user status' });
    }
});

// ============ ACCESS MANAGEMENT ============
router.get('/access', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const accessList = await Access.find()
            .populate('user', 'name email userId')
            .populate('movie', 'title movieId')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, accessList });
    } catch (error) {
        console.error('Get access error:', error);
        res.status(500).json({ message: 'Failed to load access records' });
    }
});

// Revoke access
router.delete('/access/:accessId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const access = await Access.findOne({ accessId: req.params.accessId });

        if (!access) {
            return res.status(404).json({ message: 'Access not found' });
        }

        // Set expiry to now (effectively revoking access)
        access.expiryTime = new Date();
        await access.save();

        res.json({
            success: true,
            message: 'Access revoked successfully'
        });
    } catch (error) {
        console.error('Revoke access error:', error);
        res.status(500).json({ message: 'Failed to revoke access' });
    }
});

export default router;
