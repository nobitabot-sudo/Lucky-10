const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserByEmail, createUser } = require("../models/userModel"); // apne DB model ke functions import karo

// 📌 REGISTER USER
const registerUser = async (req, res) => {
    const { fullName, email, password, age } = req.body;

    if (!fullName || !email || !password || !age) {
        return res.status(400).json({ error: "Please fill all fields" });
    }

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // By default new user ka role "user" hoga
        const newUser = await createUser({
            fullName,
            email,
            password: hashedPassword,
            age,
            role: "user", // admin ke liye manually DB me change karna
            wallet: 0
        });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// 📌 LOGIN USER (User/Admin both)
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please enter email and password" });
    }

    try {
        const user = await getUserByEmail(email);

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                token,
                role: user.role, // frontend role se dashboard decide karega
                fullName: user.fullName,
                wallet: user.wallet
            });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    registerUser,
    loginUser
};
