const mongoose = require('mongoose');

// ================================================================
// COUNTER MODEL
// ================================================================
// Atomic per-collection sequence generator used to assign
// incremental numeric IDs (1, 2, 3, ...) to new documents.
//
//   _id : sequence name (e.g. "users", "stores", "products")
//   seq : current value of the sequence
// ================================================================

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
