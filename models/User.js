// ============================================================
// RAJGym — models/User.js
// MongoDB User Schema & Model
// ============================================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,  // ✅ This automatically creates the email index
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,  // Don't return password by default in queries
    },

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    age: {
      type: Number,
      min: [14, 'Minimum age is 14'],
      max: [99, 'Maximum age is 99'],
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },

    membership: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'basic',
    },

    goal: {
      type: String,
      enum: ['weight-loss', 'muscle-gain', 'endurance', 'flexibility', 'general-fitness', ''],
      default: '',
    },

    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', ''],
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Remove password when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// ✅ Only keep non-email indexes (email index is auto-created by unique: true)
userSchema.index({ isActive: 1 });  // This is fine - no duplicate

module.exports = mongoose.model('User', userSchema);