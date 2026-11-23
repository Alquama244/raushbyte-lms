const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Student registration
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Name, email and password are required."
            });
        }

        if (name.trim().length < 2 || name.trim().length > 80) {
            return res.status(400).json({
                error: "Name must contain between 2 and 80 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                error: "Please enter a valid email address."
            });
        }

        if (typeof password !== "string" || password.length < 8 || password.length > 128) {
            return res.status(400).json({
                error: "Password must contain between 8 and 128 characters."
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                error: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "student"
        });

        return res.status(201).json({
            message: "Student account created successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                error: "An account with this email already exists."
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            error: "Unable to create account."
        });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                error: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            error: "Unable to log in."
        });
    }
});

// Get the currently authenticated user
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || !user.isActive) {
            return res.status(404).json({
                error: "User account not found."
            });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Profile error:", error.message);

        return res.status(500).json({
            error: "Unable to retrieve user profile."
        });
    }
});

module.exports = router;
