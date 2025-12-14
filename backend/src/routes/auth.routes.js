// routes/auth.routes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// Generate User ID
const generateUserId = async () => {
    const lastUser = await User.findOne().sort({ userId: -1 }).select('userId').lean();
    if (!lastUser || !lastUser.userId) {
        return 'U10001';
    }
    const lastNum = parseInt(lastUser.userId.replace('U', ''));
    return `U${lastNum + 1}`;
};

// Generate JWT tokens
const generateTokens = (userId, isAdmin = false) => {
    const accessToken = jwt.sign(
        { userId, isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId, isAdmin },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, deviceId } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Prevent admin email signup
        if (email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({
                success: false,
                message: 'This email is reserved. Please use a different email.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate user ID
        const userId = await generateUserId();

        // Create new user
        const user = new User({
            userId,
            name,
            email,
            password,
            deviceIds: deviceId ? [deviceId] : []
        });

        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.userId, false);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Signup failed. Please try again.'
        });
    }
});

// Login (Admin or User)
router.post('/login', async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if admin email
        const isAdminEmail = email === process.env.ADMIN_EMAIL;

        if (isAdminEmail) {
            // ADMIN LOGIN
            const admin = await Admin.findOne({ email });

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Verify password (bcrypt hash comparison)
            const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate tokens for admin
            const { accessToken, refreshToken } = generateTokens(admin._id.toString(), true);

            res.json({
                success: true,
                message: 'Admin login successful',
                user: {
                    userId: admin._id.toString(),
                    name: 'Admin',
                    email: admin.email,
                    role: admin.role,
                    isAdmin: true
                },
                accessToken,
                refreshToken
            });

        } else {
            // REGULAR USER LOGIN
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if account is active
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is disabled. Contact support.'
                });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Add device ID if provided
            if (deviceId && !user.deviceIds.includes(deviceId)) {
                user.deviceIds.push(deviceId);
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens for user
            const { accessToken, refreshToken } = generateTokens(user.userId, false);

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    isAdmin: false
                },
                accessToken,
                refreshToken
            });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        if (decoded.isAdmin) {
            // Admin refresh token
            const admin = await Admin.findById(decoded.userId);

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            const tokens = generateTokens(admin._id.toString(), true);

            res.json({
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        } else {
            // User refresh token
            const user = await User.findOne({ userId: decoded.userId });

            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            const tokens = generateTokens(user.userId, false);

            res.json({
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        }

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
});

// Get Profile
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token required'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.isAdmin) {
            // Admin profile
            const admin = await Admin.findById(decoded.userId).select('-passwordHash');

            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
            }

            res.json({
                success: true,
                user: {
                    userId: admin._id.toString(),
                    name: 'Admin',
                    email: admin.email,
                    role: admin.role,
                    isAdmin: true,
                    createdAt: admin.createdAt
                }
            });
        } else {
            // User profile
            const user = await User.findOne({ userId: decoded.userId }).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user: {
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isAdmin: false,
                    createdAt: user.createdAt
                }
            });
        }

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});

export default router;
