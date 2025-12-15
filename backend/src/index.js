import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cors from 'cors';
import connectDB from "./config/db.js";
import connectCloudinary from './config/cloudinary.js';
import moviesRoutes from "./routes/movies.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://movie-purchaser.vercel.app',
            'https://movie-purchaser.com',
            'https://movie-api.ott-tube.in'
        ];

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'Content-Type']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '2048mb' }));
app.use(express.urlencoded({ extended: true, limit: '2048mb' }));

app.use("/movies", moviesRoutes);
app.use("/payments", paymentsRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.use('*path', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    if (err.message === 'File too large') {
        return res.status(413).json({
            message: 'File size too large. Maximum size is 2 GB',
            error: 'PAYLOAD_TOO_LARGE'
        });
    }

    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API URL: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("DB connection failed:", err);
        process.exit(1);
    });

connectCloudinary();

export default app;
