const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");
const betRoutes = require("./routes/betRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("LUCKY 10 Backend Running 🚀"));

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));