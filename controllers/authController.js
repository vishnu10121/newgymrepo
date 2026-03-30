// ============================================================
// RAJGym — controllers/authController.js
// Handles user registration and login
// ============================================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { sendWelcomeEmail } = require('../config/email');
// ── HELPER: Generate JWT token ────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'rajgym_secret_key_2024',  // Default fallback
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── HELPER: Send user response (without password) ────────────
const sendUserResponse = (user, token, res, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone,
      age:        user.age,
      gender:     user.gender,
      membership: user.membership,
      goal:       user.goal,
      experience: user.experience,
    },
  });
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/register
// @desc    Register a new user
// @access  Public
// ──────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, phone, age, gender, membership, goal, experience } = req.body;

    console.log('📝 Registration attempt for:', email);

    // ── Validation ────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    // ── Check if email already exists ─────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please login.',
      });
    }

    // ── Hash the password ─────────────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Create new user in database ───────────────────────────
    const newUser = await User.create({
      name:       name.trim(),
      email:      email.toLowerCase().trim(),
      password:   hashedPassword,
      phone:      phone || '',
      age:        age || null,
      gender:     gender || '',
      membership: membership || 'basic',
      goal:       goal || '',
      experience: experience || '',
    });

    console.log('✅ User registered successfully:', email);
    // ✅ Send welcome email (don't await - let it run in background)
    sendWelcomeEmail(newUser.email, newUser.name).catch(err => {
      console.error('⚠️ Email send failed:', err.message);
    });

    // ── Generate token ────────────────────────────────────────
    const token = generateToken(newUser._id);

    // ── Send response ─────────────────────────────────────────
    sendUserResponse(newUser, token, res, 201);

  } catch (error) {
    console.error('❌ Register error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join('. ') 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/login
// @desc    Login with email + password
// @access  Public
// ──────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Login attempt for:', email);

    // ── Validation ────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // ── Find user by email - FIXED: Added .select('+password') ──
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // ── Compare passwords ─────────────────────────────────────
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // ── Check if account is active ────────────────────────────
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact support.',
      });
    }

    console.log('✅ User logged in successfully:', email);

    // ── Generate token and send response ──────────────────────
    const token = generateToken(user._id);
    sendUserResponse(user, token, res, 200);

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   GET /api/me
// @desc    Get current logged-in user's profile
// @access  Private (requires JWT)
// ──────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user.id is set by the auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        membership: user.membership,
        goal: user.goal,
        experience: user.experience,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ GetMe error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error.' 
    });
  }
};

module.exports = { register, login, getMe };