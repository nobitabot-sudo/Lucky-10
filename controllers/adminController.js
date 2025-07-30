const { supabase, supabaseAdmin } = require("../config/db");

exports.setResult = async (req, res) => {
  const { roundId, winningNum } = req.body;

  await supabase.from("results").insert([{ round_id: roundId, winning_num: winningNum }]);

  const { data: winners } = await supabase.from("bets").select("*").eq("round_id", roundId).eq("number", winningNum);

  for (let w of winners) {
    const winAmount = w.amount * 5;
    await supabaseAdmin.rpc("increment_wallet", { uid: w.user_id, amt: winAmount });
  }

  res.json({ message: "Result set & winners paid" });
};

exports.leaderboard = async (req, res) => {
  const { data, error } = await supabase.from("wallets").select("user_id,balance").order("balance", { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};