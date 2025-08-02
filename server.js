const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();

// ✅ CORS Fix
app.use(cors({
    origin: "*", // yaha apna frontend ka URL dal sakte ho for security
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Middleware
app.use(express.json());

// ✅ Routes
app.use("/api/users", userRoutes);

// ✅ Test Route
app.get("/", (req, res) => {
    res.send("Lucky-10 Backend Running 🚀");
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
