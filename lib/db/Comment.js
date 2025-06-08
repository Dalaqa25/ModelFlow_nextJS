import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  requestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Request',
    required: true 
  },
  authorEmail: {
    type: String,
    required: true,
    validate: {
      validator: async function (email) {
        const User = mongoose.model('User');
        return await User.exists({ email });
      },
      message: 'Author email does not exist.',
    },
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: '14d' // Comments will be automatically deleted after 14 days
  }
});

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);
