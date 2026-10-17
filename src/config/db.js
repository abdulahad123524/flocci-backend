const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  const connection = await mongoose.connect(uri);

  console.log(`MongoDB connected: ${connection.connection.host}`);
};

module.exports = connectDB;
