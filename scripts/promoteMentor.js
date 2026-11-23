
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function promoteMentor() {
    const email = process.argv[2]?.trim().toLowerCase();

    if (!email) {
        console.error("Please provide a registered email address.");
        process.exitCode = 1;
        return;
    }

    try {
        await connectDB();

        const user = await User.findOne({ email });

        if (!user) {
            console.error("No registered account found with this email.");
            process.exitCode = 1;
            return;
        }

        if (!user.isActive) {
            console.error("This account is inactive.");
            process.exitCode = 1;
            return;
        }

        user.role = "mentor";
        await user.save();

        console.log("Mentor authorization successful!");
        console.log("Name:", user.name);
        console.log("Email:", user.email);
        console.log("Role:", user.role);

    } catch (error) {
        console.error("Error:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

promoteMentor();
