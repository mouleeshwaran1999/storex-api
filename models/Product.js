const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequence');

// ================================================================
// PRODUCT MODEL
// ================================================================
// _id : auto-incremented integer (Counter "products")
// (storeId, name) must be unique - a store cannot have two products
// with the same name (case-insensitive collation).
// ================================================================

const productSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    storeId: { type: Number, ref: 'Store', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'pcs', trim: true },
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
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

productSchema.pre('validate', async function () {
  if (this.isNew && this._id == null) {
    this._id = await getNextSequence('products');
  }
});

// Unique product name per store (case-insensitive)
productSchema.index(
  { storeId: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Product', productSchema);
