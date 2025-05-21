// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_development_secret';


// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Create JWT
    const token = jwt.sign(
  { id: user._id },
  JWT_SECRET,  // Use the variable instead of process.env directly
  { expiresIn: '1d' }
);
    
    // Set cookie
    res.cookie('token', token, {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: '/',        // Important: Make cookie available on all paths
  sameSite: 'lax'   // Helps with security while still allowing redirects
});
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        currency: user.currency
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT
    const token = jwt.sign(
  { id: user._id },
  JWT_SECRET,  // Use the same variable here too
  { expiresIn: '1d' }
);
    
    // Set cookie
    res.cookie('token', token, {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: '/',        // Important: Make cookie available on all paths
  sameSite: 'lax'   // Helps with security while still allowing redirects
});
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        currency: user.currency
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', auth, (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    currency: req.user.currency
  });
});

module.exports = router;