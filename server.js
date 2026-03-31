// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');  // ✅ Add this

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5500', 'https://newgymrepo.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== SERVE STATIC FILES ====================
app.use(express.static(path.join(__dirname, '/')));

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rajgym';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ==================== ROUTES ====================
app.use('/api', authRoutes);
app.use('/api/contact', contactRoutes);  // ✅ Add contact routes

// ==================== FRONTEND ROUTES ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API root endpoint (optional)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'RAJGym API is running',
    endpoints: {
      auth: {
        register: 'POST /api/register',
        login: 'POST /api/login',
        profile: 'GET /api/me'
      },
      contact: {
        submit: 'POST /api/contact',
        getAll: 'GET /api/contact (admin)'
      }
    }
  });
});

// ==================== ERROR HANDLERS ====================
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ 
      success: false, 
      message: `API route ${req.originalUrl} not found`
    });
  } else {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Something went wrong! Please try again later.'
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n=================================');
  console.log(`🚀 RAJGym Server is running!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Frontend: https://newgymrepo.onrender.com`);
  console.log(`🔗 API: https://newgymrepo.onrender.com/api`);
  console.log(`📧 Contact API: https://newgymrepo.onrender.com/api/contact`);
  console.log('=================================\n');
});