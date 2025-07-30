const { supabase, supabaseAdmin } = require("../config/db");

exports.placeBet = async (req, res) => {
  const { userId, number, amount, roundId } = req.body;

  const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
  if (!wallet || wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  await supabaseAdmin.rpc("decrement_wallet", { uid: userId, amt: amount });

  const { error } = await supabase.from("bets").insert([{ user_id: userId, number, amount, round_id: roundId }]);
  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Bet placed successfully" });
};