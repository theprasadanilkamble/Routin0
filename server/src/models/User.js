const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: String,
    displayName: String,
    photoURL: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


