const { supabase } = require("../config/db");

exports.register = async (req, res) => {
  const { email, password, name, age } = req.body;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  await supabase.from("users").insert([{ id: data.user.id, name, age, email }]);
  await supabase.from("wallets").insert([{ user_id: data.user.id, balance: 0 }]);

  res.json({ message: "User registered successfully", userId: data.user.id });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Login successful", user: data.user });
};