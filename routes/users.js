const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, age } = req.body;

    // Validation
    if (!fullName || !email || !password || !age) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (age < 18) {
      return res.status(400).json({ error: 'Must be 18 or older to register' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          full_name: fullName,
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          age: parseInt(age),
          role: 'user',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create wallet for new user
    const { error: walletError } = await supabase
      .from('wallets')
      .insert([
        {
          user_id: newUser.id,
          balance: 100.00, // Starting balance
          created_at: new Date().toISOString()
        }
      ]);

    if (walletError) {
      console.error('Wallet creation error:', walletError);
      // Don't fail registration if wallet creation fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        role: newUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: newUser.id,
      fullName: newUser.full_name,
      email: newUser.email,
      role: newUser.role
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userData = {
      id: req.user.id,
      fullName: req.user.full_name,
      email: req.user.email,
      role: req.user.role
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get referral link
router.get('/referral', authenticateToken, async (req, res) => {
  try {
    const referralLink = `https://lucky-10-frontend.netlify.app/?ref=${req.user.id}`;
    res.json({ referralLink });
  } catch (error) {
    console.error('Referral error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
