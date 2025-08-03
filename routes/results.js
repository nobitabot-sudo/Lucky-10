const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get latest results
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Results fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch results' });
    }

    const formattedResults = results.map(result => ({
      id: result.id,
      winningNumber: result.winning_number,
      roundId: result.round_id,
      createdAt: result.created_at
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
