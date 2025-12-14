// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const { Schema, model } = mongoose;

const UserSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: null },
    deviceIds: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default model('User', UserSchema);
