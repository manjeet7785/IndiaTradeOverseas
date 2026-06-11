const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDb Connected");
  } catch (error) {
    console.error("Database connection or seeding failure:", error.message);
  }
};

module.exports = {
  connectDB
};