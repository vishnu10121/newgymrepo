// routes/auth.js
const express = require('express');
const mongoose = require('mongoose');  // ✅ Add this line
const router = express.Router();

// Import controllers
const { register, login, getMe } = require('../controllers/authController');

// Import auth middleware
const auth = require('../middleware/auth');

// ====================== PUBLIC ROUTES ======================
router.post('/register', register);
router.post('/login', login);

// ====================== PRIVATE ROUTES ======================
router.get('/me', auth, getMe);

// ====================== DEBUG ROUTES ======================
// Debug endpoint to check database status
router.get('/debug/db-status', async (req, res) => {
  try {
    // Check connection state
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Get database info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    // Check users collection
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    const sampleUsers = await usersCollection.find({}).limit(5).toArray();
    
    res.json({
      success: true,
      connection: {
        state: states[dbState],
        databaseName: mongoose.connection.name,
        host: mongoose.connection.host
      },
      collections: collections.map(c => c.name),
      users: {
        count: userCount,
        sample: sampleUsers.map(u => ({ 
          id: u._id, 
          name: u.name, 
          email: u.email,
          createdAt: u.createdAt 
        }))
      }
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;