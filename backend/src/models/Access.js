// models/Access.js (UPDATED)
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const AccessSchema = new Schema({
    accessId: { type: String, required: true, unique: true, index: true },
    user: { type: Types.ObjectId, ref: 'User', default: null }, // NEW
    movie: { type: Types.ObjectId, ref: 'Movie', required: true },
    deviceId: { type: String, default: null },
    token: { type: String, required: true, unique: true },
    startTime: { type: Date, default: null },
    expiryTime: { type: Date, required: true, index: true },
    playbackStarted: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' }
}, { timestamps: true });

export default model('Access', AccessSchema);
