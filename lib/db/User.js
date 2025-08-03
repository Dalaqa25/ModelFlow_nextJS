import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  authId: { type: String, required: true, unique: true }, // from Kinde
  name: { type: String },
  email: { type: String, required: true, unique: true },
  profileImageUrl: { type: String },
  aboutMe: { type: String },
  websiteLink: { type: String },
  contactEmail: { type: String },
  purchasedModels: [{
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Model' },
    purchasedAt: { type: Date, default: Date.now },
    price: { type: Number, required: true }
  }],
  // Seller earnings tracking
  totalEarnings: { type: Number, default: 0 }, // Total earnings in cents
  withdrawnAmount: { type: Number, default: 0 }, // Total withdrawn amount in cents
  availableBalance: { type: Number, default: 0 }, // Available balance for withdrawal
  earningsHistory: [{
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Model' },
    modelName: { type: String },
    buyerEmail: { type: String },
    amount: { type: Number, required: true }, // Amount in cents
    lemonSqueezyOrderId: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  subscription: {
    plan: { type: String, enum: ['basic', 'professional', 'enterprise'], default: 'basic' },
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);