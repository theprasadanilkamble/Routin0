const mongoose = require('mongoose');

const subRoutineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentRoutine', required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: 'General' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubRoutine', subRoutineSchema);


