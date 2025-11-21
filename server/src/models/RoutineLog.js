const mongoose = require('mongoose');

const routineLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentRoutine', required: true },
    subRoutine: { type: mongoose.Schema.Types.ObjectId, ref: 'SubRoutine', required: true },
    routine: { type: mongoose.Schema.Types.ObjectId, ref: 'Routine', required: true },
    action: {
      type: String,
      enum: ['not_done', 'skip', 'pass', 'done'],
      required: true,
    },
    value: mongoose.Schema.Types.Mixed,
    dateKey: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('RoutineLog', routineLogSchema);


