const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    label: String,
    success: Boolean,
  },
  { _id: false }
);

const parentRoutineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: 'General' },
    description: String,
    streak: { type: Number, default: 0 },
    completion: { type: Number, default: 0 },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParentRoutine', parentRoutineSchema);


