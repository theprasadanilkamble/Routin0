const mongoose = require('mongoose');

let isConnected = false;

const connectDb = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
  return mongoose.connection;
};

module.exports = { connectDb };


