const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Place a bet
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { number, amount } = req.body;

    if (!number || !amount || number < 1 || number > 10 || amount <= 0) {
      return res.status(400).json({ error: 'Invalid bet parameters' });
    }

    // Check wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', req.user.id)
      .single();

    if (walletError || !wallet || wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get current round
    const { data: currentRound, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'active')
      .single();

    if (roundError || !currentRound) {
      return res.status(400).json({ error: 'No active round available' });
    }

    // Check if user already bet in this round
    const { data: existingBet } = await supabase
      .from('bets')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('round_id', currentRound.id)
      .single();

    if (existingBet) {
      return res.status(400).json({ error: 'You have already placed a bet in this round' });
    }

    // Deduct amount from wallet
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('user_id', req.user.id);

    if (updateWalletError) {
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    // Place bet
    const { error: betError } = await supabase
      .from('bets')
      .insert([
        {
          user_id: req.user.id,
          round_id: currentRound.id,
          number: number,
          amount: amount,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);

    if (betError) {
      console.error('Bet placement error:', betError);
      return res.status(500).json({ error: 'Failed to place bet' });
    }

    res.json({ success: true, message: 'Bet placed successfully' });
  } catch (error) {
    console.error('Bet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
