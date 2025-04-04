const mongoose = require('mongoose');
const dotenv = require("dotenv")
dotenv.config();
const connectDB = async () => {
    console.log('process.env.MONGO_URI', process.env.MONGO_URI)
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = connectDB;