const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!cachedConnection) {
    cachedConnection = mongoose
      .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibely')
      .then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((error) => {
        cachedConnection = null;
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
      });
  }

  return cachedConnection;
};

module.exports = connectDB;
