// models/Payment.js (UPDATED)
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const PaymentSchema = new Schema({
    paymentId: { type: String, required: true, unique: true, index: true },
    user: { type: Types.ObjectId, ref: 'User', default: null }, // NEW
    gateway: { type: String, required: true },
    gatewayPaymentId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'initiated', 'success', 'failed', 'refunded'], default: 'created' },
    deviceId: { type: String, default: null },
    movie: { type: Types.ObjectId, ref: 'Movie', required: true },
    access: { type: Types.ObjectId, ref: 'Access', default: null },
    meta: { type: Schema.Types.Mixed, default: null }
}, { timestamps: true });

export default model('Payment', PaymentSchema);
