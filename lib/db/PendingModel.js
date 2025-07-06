import mongoose from "mongoose";
import User from "./User";

const pendingModelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorEmail: { type: String },
    tags: [String],
    description: String,
    features: String,
    useCases: String,
    setup: { type: String, required: true },
    imgUrl: String,
    // File storage information
    fileStorage: {
        type: { type: String, enum: ['zip', 'drive'], required: true },
        url: { type: String }, // not required
        fileName: { type: String },
        fileSize: { type: Number }, // in bytes
        mimeType: { type: String },
        folderPath: { type: String }, // for organizing files in storage
        uploadedAt: { type: Date, default: Date.now },
        supabasePath: { type: String }, // add this line
    },
    // AI Analysis and Validation
    aiAnalysis: { type: String },
    validationStatus: {
        isValid: { type: Boolean },
        message: { type: String },
        has_requirements: { type: Boolean }
    },
    price: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    rejectionReason: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.PendingModel || mongoose.model("PendingModel", pendingModelSchema); 