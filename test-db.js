require("dotenv").config();

const mongoose = require("mongoose");

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("================================");
        console.log("SUCCESS: MongoDB Atlas connected!");
        console.log("Database:", mongoose.connection.name);
        console.log("Host:", mongoose.connection.host);
        console.log("================================");

    } catch (error) {
        console.error("DATABASE CONNECTION FAILED");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
