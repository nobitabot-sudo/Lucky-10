const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current round timer
router.get('/timer', authenticateToken, async (req, res) => {
  try {
    const { data: currentRound, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'active')
      .single();

    if (error || !currentRound) {
      // Create new round if none exists
      const endTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      
      const { data: newRound, error: createError } = await supabase
        .from('rounds')
        .insert([
          {
            status: 'active',
            end_time: endTime.toISOString(),
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: 'Failed to create round' });
      }

      const timeLeft = Math.max(0, Math.floor((new Date(newRound.end_time) - new Date()) / 1000));
      return res.json({ timeLeft, roundId: newRound.id });
    }

    const timeLeft = Math.max(0, Math.floor((new Date(currentRound.end_time) - new Date()) / 1000));
    res.json({ timeLeft, roundId: currentRound.id });
  } catch (error) {
    console.error('Timer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
