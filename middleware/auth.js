// ============================================================
// RAJGym — middleware/auth.js
// JWT Authentication Middleware
// ============================================================

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login first.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rajgym_secret_key_2024');
    
    req.user = { id: decoded.id };
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.',
    });
  }
};

module.exports = { protect };  // ✅ Make sure this is correct