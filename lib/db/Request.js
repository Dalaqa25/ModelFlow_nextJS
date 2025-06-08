// models/request.js
import mongoose from 'mongoose';
import './User.js';

const requestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now, expires: '14d' }, 
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual populate for comments
requestSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'requestId',
  justOne: false,
});

// Virtual count of comments
requestSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'requestId',
  count: true,
});

export default mongoose.models.Request || mongoose.model('Request', requestSchema);