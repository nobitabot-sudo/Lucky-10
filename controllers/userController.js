const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserByEmail, createUser } = require("../models/userModel"); 

// 📌 REGISTER USER
const registerUser = async (req, res) => {
    const { name, email, password, age } = req.body;

    if (!name || !email || !password || !age) {
        return res.status(400).json({ error: "Please fill all fields" });
    }

    try {
        // Check if user exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await createUser({
            name,
            email,
            password: hashedPassword,
            age,
            role: "user", // Default role user
            wallet: 0
        });

        res.status(201).json({ message: "User registered successfully", userId: newUser.id });
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// 📌 LOGIN USER
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please enter email and password" });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            role: user.role,
            fullName: user.fullName,
            wallet: user.wallet
        });
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    registerUser,
    loginUser
};
