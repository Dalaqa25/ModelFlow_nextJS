import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['model_rejection', 'model_approval', 'comment', 'purchase'],
        required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedModelId: { type: mongoose.Schema.Types.ObjectId, ref: "Model" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema); 