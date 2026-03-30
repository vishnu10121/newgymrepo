const express = require('express');
const router = express.Router();

const {
  addWorkout,
  getWorkouts,
  deleteWorkout,
  getWorkoutStats
} = require('../controllers/workoutController');

const auth = require('../middleware/auth');

// add workout
router.post('/', auth, addWorkout);

// get workouts of logged in user
router.get('/:userId', auth, getWorkouts);

// delete workout
router.delete('/:id', auth, deleteWorkout);

// stats
router.get('/stats/:userId', auth, getWorkoutStats);

module.exports = router;