import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const MovieSchema = new Schema({
    movieId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    durationSeconds: { type: Number, required: true },
    price: { type: Number, required: true },
    filePath: { type: String, required: true },
    posterPath: { type: String },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
}, { timestamps: true });

export default model('Movie', MovieSchema);
