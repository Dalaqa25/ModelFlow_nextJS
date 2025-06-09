import mongoose from "mongoose";
import User from "./User"; 

const modelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorEmail: { type: String },
  tags: [String],
  description: String,
  features: String,
  useCases: String,
  setup: String,
  imgUrl: String,
  // File storage information
  fileStorage: {
    type: { type: String, enum: ['zip', 'drive'], required: true },
    url: { type: String, required: true },
    fileName: { type: String },
    fileSize: { type: Number }, // in bytes
    mimeType: { type: String },
    folderPath: { type: String }, // for organizing files in storage
    uploadedAt: { type: Date, default: Date.now }
  },
  price: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Model || mongoose.model("Model", modelSchema);