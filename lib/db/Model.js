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
  price: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  purchasedBy: [{ type: String }], // emails of users who purchased the model
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false } // Add this line
});

export default mongoose.models.Model || mongoose.model("Model", modelSchema);