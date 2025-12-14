import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const MONGO_URI = process.env.NODE_ENV === 'development'
    ? process.env.MONGODB_URI
    : process.env.MONGODB_URI_PROD;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        await seedAdminUser();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const seedAdminUser = async () => {
    try {
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@moviepurchase.com';

        if (!adminPassword) {
            console.warn('ADMIN_PASSWORD not set');
            return;
        }

        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        const adminDoc = new Admin({
            email: adminEmail,
            passwordHash: hashedPassword,
            role: 'admin'
        });

        await adminDoc.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error seeding admin user:', error.message);
    }
};

export default connectDB;
