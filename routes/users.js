const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();
const saltRounds = 12;
const STARTING_BALANCE = 100.00;

// Helper function to sanitize user data
const sanitizeUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  age: user.age,
  role: user.role,
  createdAt: user.created_at
});

// Register endpoint
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { fullName, email, password, age } = req.body;

    // Check existing user using Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUserByEmail(email);
    if (authUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Create auth user first
    const { data: { user: newAuthUser }, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName,
          age: parseInt(age)
        }
      }
    });

    if (signUpError) throw signUpError;

    // Create user profile in public.users table
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: newAuthUser.id,
          full_name: fullName,
          email: email.toLowerCase(),
          age: parseInt(age),
          role: 'user'
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // Create wallet (wrap in try-catch to prevent registration failure)
    try {
      await supabase
        .from('wallets')
        .insert([{
          user_id: newUser.id,
          balance: STARTING_BALANCE
        }]);
    } catch (walletError) {
      console.error('Wallet creation failed:', walletError.message);
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

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(newUser)
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Cleanup if Supabase Auth succeeded but DB failed
    if (error.message.includes('users')) {
      await supabase.auth.admin.deleteUser(req.body.email);
    }

    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase Auth
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get additional user data from public.users
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: userProfile?.role || 'user' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser({ ...user, ...userProfile })
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Get fresh data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get referral link
router.get('/referral', authenticateToken, async (req, res) => {
  try {
    const referralCode = Buffer.from(req.user.userId).toString('base64');
    const referralLink = `${process.env.FRONTEND_URL}/register?ref=${referralCode}`;
    
    res.json({ 
      referralLink,
      code: referralCode
    });
  } catch (error) {
    console.error('Referral error:', error);
    res.status(500).json({ error: 'Failed to generate referral' });
  }
});

module.exports = router;
