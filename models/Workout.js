// ============================================================
// RAJGym — models/Workout.js
// MongoDB Workout Schema & Model
// ============================================================

const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    // Which user this workout belongs to
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',   // Reference to User model
      required: [true, 'User ID is required'],
    },

    exercise: {
      type:      String,
      required:  [true, 'Exercise name is required'],
      trim:      true,
      minlength: [2, 'Exercise name too short'],
      maxlength: [80, 'Exercise name too long'],
    },

    sets: {
      type:     Number,
      required: [true, 'Sets is required'],
      min:      [1,  'Minimum 1 set'],
      max:      [99, 'Maximum 99 sets'],
    },

    reps: {
      type:     Number,
      required: [true, 'Reps is required'],
      min:      [1,   'Minimum 1 rep'],
      max:      [999, 'Maximum 999 reps'],
    },

    weight: {
      type:    Number,
      default: 0,
      min:     [0,    'Weight cannot be negative'],
      max:     [1000, 'Weight too high'],
    },

    // Date of the workout session (stored as string for easy comparison)
    date: {
      type:    String,     // "YYYY-MM-DD" format
      default: () => new Date().toISOString().split('T')[0],
    },

    notes: {
      type:     String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default:  '',
      trim:     true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries by userId
workoutSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
// ============================================================
// RAJGym — routes/workout.js
// Workout tracker routes — all require authentication
// ============================================================
