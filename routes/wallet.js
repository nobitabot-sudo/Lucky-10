const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      console.error('Wallet fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch wallet' });
    }

    res.json({ balance: wallet ? wallet.balance : 0 });
  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
