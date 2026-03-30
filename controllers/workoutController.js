// ============================================================
// RAJGym — controllers/workoutController.js
// Handles workout log CRUD operations
// ============================================================

const Workout = require('../models/Workout');

// ──────────────────────────────────────────────────────────────
// @route   POST /api/workout
// @desc    Add a new workout entry
// @access  Private (requires JWT)
// ──────────────────────────────────────────────────────────────
const addWorkout = async (req, res) => {
  try {
    const { exercise, sets, reps, weight, date, notes } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!exercise || !sets || !reps) {
      return res.status(400).json({
        success: false,
        message: 'Exercise, sets, and reps are required.',
      });
    }

    // ── Create workout linked to the logged-in user ───────────
    const workout = await Workout.create({
      userId:   req.user.id,     // From JWT middleware
      exercise: exercise.trim(),
      sets:     Number(sets),
      reps:     Number(reps),
      weight:   Number(weight) || 0,
      date:     date   || new Date().toISOString().split('T')[0],
      notes:    notes  || '',
    });

    res.status(201).json({
      success: true,
      message: 'Workout logged successfully! 💪',
      data:    workout,
    });

  } catch (error) {
    console.error('Add workout error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }

    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   GET /api/workout/:userId
// @desc    Get all workouts for a specific user
// @access  Private (requires JWT)
// ──────────────────────────────────────────────────────────────
const getWorkouts = async (req, res) => {
  try {
    const { userId } = req.params;

    // ── Security: users can only see their own workouts ───────
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own workouts.',
      });
    }

    // ── Fetch workouts sorted by date (newest first) ──────────
    const workouts = await Workout.find({ userId })
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success:  true,
      count:    workouts.length,
      workouts,
    });

  } catch (error) {
    console.error('Get workouts error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   DELETE /api/workout/:id
// @desc    Delete a single workout entry
// @access  Private (requires JWT)
// ──────────────────────────────────────────────────────────────
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }

    // Only the owner can delete their workout
    if (workout.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await workout.deleteOne();

    res.status(200).json({ success: true, message: 'Workout deleted.' });

  } catch (error) {
    console.error('Delete workout error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   GET /api/workout/stats/:userId
// @desc    Get workout statistics for a user (total sets, reps, etc.)
// @access  Private
// ──────────────────────────────────────────────────────────────
const getWorkoutStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const workouts = await Workout.find({ userId });

    const stats = {
      totalWorkouts: workouts.length,
      totalSets:     workouts.reduce((acc, w) => acc + w.sets, 0),
      totalReps:     workouts.reduce((acc, w) => acc + (w.sets * w.reps), 0),
      totalWeight:   workouts.reduce((acc, w) => acc + (w.weight * w.sets), 0),
    };

    res.status(200).json({ success: true, stats });

  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { addWorkout, getWorkouts, deleteWorkout, getWorkoutStats };