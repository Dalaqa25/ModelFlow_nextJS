import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  authId: { type: String, required: true, unique: true }, // from Kinde
  name: { type: String },
  email: { type: String, required: true, unique: true },
  profileImageUrl: { type: String },
  aboutMe: { type: String },
  websiteLink: { type: String },
  contactEmail: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model("User", userSchema);