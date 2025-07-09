import mongoose from "mongoose";

const archivedModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  authorEmail: { type: String, required: true },
  fileStorage: {
    type: {
      type: String,
      enum: ['zip', 'drive'],
      required: true
    },
    url: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    folderPath: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    supabasePath: { type: String },
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ArchivedModel || mongoose.model("ArchivedModel", archivedModelSchema); 