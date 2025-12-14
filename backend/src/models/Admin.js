import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const AdminSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'admin' }
}, { timestamps: true });

export default model('Admin', AdminSchema);
