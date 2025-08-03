const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get active bets
router.get('/bets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: bets, error } = await supabase
      .from('bets')
      .select(`
        *,
        users!inner(full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Bets fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch bets' });
    }

    const formattedBets = bets.map(bet => ({
      id: bet.id,
      userId: bet.users.email,
      number: bet.number,
      amount: bet.amount,
      status: bet.status,
      createdAt: bet.created_at
    }));

    res.json(formattedBets);
  } catch (error) {
    console.error('Admin bets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set result manually
router.post('/result', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { winningNumber } = req.body;

    if (!winningNumber || winningNumber < 1 || winningNumber > 10) {
      return res.status(400).json({ error: 'Invalid winning number' });
    }

    // Get current active round
    const { data: currentRound, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'active')
      .single();

    if (roundError || !currentRound) {
      return res.status(400).json({ error: 'No active round found' });
    }

    // Create result
    const { error: resultError } = await supabase
      .from('results')
      .insert([
        {
          round_id: currentRound.id,
          winning_number: winningNumber,
          created_at: new Date().toISOString()
        }
      ]);

    if (resultError) {
      return res.status(500).json({ error: 'Failed to create result' });
    }

    // Process bets and update wallets
    await processBetsForRound(currentRound.id, winningNumber);

    // Close the round
    await supabase
      .from('rounds')
      .update({ status: 'completed' })
      .eq('id', currentRound.id);

    res.json({ success: true, message: 'Result set successfully' });
  } catch (error) {
    console.error('Set result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate auto result
router.post('/result/auto', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const winningNumber = Math.floor(Math.random() * 10) + 1;

    // Get current active round
    const { data: currentRound, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'active')
      .single();

    if (roundError || !currentRound) {
      return res.status(400).json({ error: 'No active round found' });
    }

    // Create result
    const { error: resultError } = await supabase
      .from('results')
      .insert([
        {
          round_id: currentRound.id,
          winning_number: winningNumber,
          created_at: new Date().toISOString()
        }
      ]);

    if (resultError) {
      return res.status(500).json({ error: 'Failed to create result' });
    }

    // Process bets and update wallets
    await processBetsForRound(currentRound.id, winningNumber);

    // Close the round
    await supabase
      .from('rounds')
      .update({ status: 'completed' })
      .eq('id', currentRound.id);

    res.json({ success: true, message: `Auto result generated: ${winningNumber}` });
  } catch (error) {
    console.error('Auto result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: leaderboard, error } = await supabase
      .from('bets')
      .select(`
        user_id,
        amount,
        status,
        users!inner(full_name, email)
      `)
      .eq('status', 'won');

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    // Calculate total winnings per user
    const userWinnings = {};
    leaderboard.forEach(bet => {
      const userEmail = bet.users.email;
      const winnings = bet.amount * 9; // 9x payout
      userWinnings[userEmail] = (userWinnings[userEmail] || 0) + winnings;
    });

    // Convert to array and sort
    const sortedLeaderboard = Object.entries(userWinnings)
      .map(([user, totalWinnings]) => ({ user, totalWinnings }))
      .sort((a, b) => b.totalWinnings - a.totalWinnings);

    res.json(sortedLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manage wallet
router.post('/wallet', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, type } = req.body;

    if (!userId || !amount || !type || (type !== 'credit' && type !== 'debit')) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const newBalance = type === 'credit' 
      ? wallet.balance + amount 
      : Math.max(0, wallet.balance - amount);

    // Update wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    res.json({ success: true, message: `Wallet ${type}ed successfully` });
  } catch (error) {
    console.error('Wallet management error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to process bets
async function processBetsForRound(roundId, winningNumber) {
  try {
    // Get all bets for this round
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('round_id', roundId)
      .eq('status', 'pending');

    if (error || !bets) return;

    for (const bet of bets) {
      const isWinner = bet.number === winningNumber;
      const newStatus = isWinner ? 'won' : 'lost';

      // Update bet status
      await supabase
        .from('bets')
        .update({ status: newStatus })
        .eq('id', bet.id);

      // If winner, credit wallet with 9x payout
      if (isWinner) {
        const winnings = bet.amount * 9;
        
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', bet.user_id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance + winnings })
            .eq('user_id', bet.user_id);
        }
      }
    }
  } catch (error) {
    console.error('Process bets error:', error);
  }
}

module.exports = router;
