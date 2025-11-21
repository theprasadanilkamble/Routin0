const mongoose = require('mongoose');

const inputConfigSchema = new mongoose.Schema(
  {
    target: Number,
    unit: String,
    min: Number,
    max: Number,
  },
  { _id: false }
);

const routineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentRoutine', required: true, index: true },
    subRoutine: { type: mongoose.Schema.Types.ObjectId, ref: 'SubRoutine', required: true, index: true },
    title: { type: String, required: true },
    description: String,
    category: { type: String, default: 'General' },
    type: { type: String, enum: ['yes_no', 'quantity', 'slider'], default: 'yes_no' },
    inputConfig: inputConfigSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Routine', routineSchema);


