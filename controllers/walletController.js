const { supabase, supabaseAdmin } = require("../config/db");

exports.getBalance = async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

exports.addBalance = async (req, res) => {
  const { userId, amount } = req.body;
  const { error } = await supabaseAdmin.rpc("increment_wallet", { uid: userId, amt: amount });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Amount added successfully" });
};