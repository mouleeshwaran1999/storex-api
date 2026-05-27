const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequence');

// ================================================================
// STOCK LOG MODEL
// ================================================================
// _id : auto-incremented integer (Counter "stocklogs")
// Tracks every stock change with reason and acting user.
// ================================================================

const stockLogSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    productId: { type: Number, ref: 'Product', required: true },
    storeId: { type: Number, ref: 'Store', required: true },
    delta: { type: Number, required: true },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '', trim: true },
    updatedBy: { type: Number, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: false,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

stockLogSchema.pre('validate', async function () {
  if (this.isNew && this._id == null) {
    this._id = await getNextSequence('stocklogs');
  }
});

stockLogSchema.index({ productId: 1, createdAt: -1 });
stockLogSchema.index({ storeId: 1, createdAt: -1 });

module.exports = mongoose.model('StockLog', stockLogSchema);
