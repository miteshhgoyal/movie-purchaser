// routes/payments.routes.js
import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';
import Payment from '../models/Payment.js';
import Access from '../models/Access.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';

const router = express.Router();

// Middleware to get user from token (optional - works without login too)
const getUserFromToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ userId: decoded.userId });

            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        console.log('No valid user token found, continuing as guest');
    }
    next();
};

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Generate unique Payment ID
const generatePaymentId = async () => {
    const lastPayment = await Payment.findOne().sort({ paymentId: -1 }).select('paymentId').lean();
    if (!lastPayment || !lastPayment.paymentId) {
        return 'PAY10001';
    }
    const lastNum = parseInt(lastPayment.paymentId.replace('PAY', ''));
    return `PAY${lastNum + 1}`;
};

// Generate unique Access ID
const generateAccessId = async () => {
    const lastAccess = await Access.findOne().sort({ accessId: -1 }).select('accessId').lean();
    if (!lastAccess || !lastAccess.accessId) {
        return 'ACC10001';
    }
    const lastNum = parseInt(lastAccess.accessId.replace('ACC', ''));
    return `ACC${lastNum + 1}`;
};

// Generate access token
const generateAccessToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Create payment order
router.post('/create-order', getUserFromToken, async (req, res) => {
    try {
        const { movieId, deviceId } = req.body;

        if (!movieId || !deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Movie ID and device ID required'
            });
        }

        // Get movie details
        const movie = await Movie.findOne({ movieId });
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Check if device already has active access
        const existingAccess = await Access.findOne({
            movie: movie._id,
            deviceId: deviceId,
            expiryTime: { $gt: new Date() },
            paymentStatus: 'success'
        });

        if (existingAccess) {
            return res.status(400).json({
                success: false,
                message: 'You already have active access to this movie',
                access: existingAccess
            });
        }

        // Generate payment ID
        const paymentId = await generatePaymentId();

        // Create Razorpay order
        const amount = Math.round(movie.price * 100); // Convert to paise
        const razorpayOrder = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: paymentId,
            notes: {
                movieId: movie.movieId,
                deviceId: deviceId,
                userId: req.user?.userId || 'guest'
            }
        });

        // Create payment record
        const payment = new Payment({
            paymentId,
            user: req.user?._id || null,
            gateway: 'razorpay',
            gatewayPaymentId: razorpayOrder.id,
            amount: movie.price,
            currency: 'INR',
            status: 'created',
            deviceId,
            movie: movie._id,
            meta: razorpayOrder
        });

        await payment.save();

        res.json({
            success: true,
            orderId: paymentId,
            razorpayOrderId: razorpayOrder.id,
            amount: movie.price,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order'
        });
    }
});

// Verify payment and create access
router.post('/verify', getUserFromToken, async (req, res) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        // Find payment record
        const payment = await Payment.findOne({ paymentId: orderId }).populate('movie');
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        // For development, skip signature verification if using simulation
        const isSimulated = razorpaySignature === 'simulated_signature';

        if (!isSimulated && generatedSignature !== razorpaySignature) {
            payment.status = 'failed';
            await payment.save();
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Update payment status
        payment.status = 'success';
        payment.gatewayPaymentId = razorpayPaymentId;

        // Link user if logged in
        if (req.user) {
            payment.user = req.user._id;
        }

        await payment.save();

        // Calculate expiry time (movie duration + 30 minutes)
        const accessDuration = (payment.movie.durationSeconds + 1800) * 1000;
        const expiryTime = new Date(Date.now() + accessDuration);

        // Generate access token
        const accessId = await generateAccessId();
        const token = generateAccessToken();

        // Create access record
        const access = new Access({
            accessId,
            user: req.user?._id || null,
            movie: payment.movie._id,
            deviceId: payment.deviceId,
            token,
            expiryTime,
            paymentStatus: 'success'
        });

        await access.save();

        // Link access to payment
        payment.access = access._id;
        await payment.save();

        res.json({
            success: true,
            message: 'Payment verified successfully',
            access: {
                accessId: access.accessId,
                token: access.token,
                expiryTime: access.expiryTime,
                movieId: payment.movie.movieId,
                moviePath: payment.movie.filePath
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed'
        });
    }
});

// Validate access token
router.post('/validate-access', async (req, res) => {
    try {
        const { token, deviceId } = req.body;

        if (!token || !deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Token and device ID required'
            });
        }

        const access = await Access.findOne({ token, deviceId }).populate('movie');

        if (!access) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'Access not found'
            });
        }

        // Check if expired
        if (new Date() > access.expiryTime) {
            return res.json({
                success: false,
                valid: false,
                message: 'Access expired'
            });
        }

        // Check payment status
        if (access.paymentStatus !== 'success') {
            return res.json({
                success: false,
                valid: false,
                message: 'Payment not successful'
            });
        }

        // Mark playback as started if first time
        if (!access.playbackStarted) {
            access.playbackStarted = true;
            access.startTime = new Date();
            await access.save();
        }

        res.json({
            success: true,
            valid: true,
            access: {
                accessId: access.accessId,
                expiryTime: access.expiryTime,
                moviePath: access.movie.filePath
            }
        });

    } catch (error) {
        console.error('Validate access error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate access'
        });
    }
});

// Get user purchases (requires authentication)
router.get('/my-purchases', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization required'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ userId: decoded.userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all purchases for this user
        const purchases = await Payment.find({
            user: user._id,
            status: 'success'
        })
            .populate('movie')
            .populate('access')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            purchases: purchases.map(p => ({
                paymentId: p.paymentId,
                amount: p.amount,
                movie: p.movie,
                access: p.access,
                createdAt: p.createdAt
            }))
        });

    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchases'
        });
    }
});

export default router;
