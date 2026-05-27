const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequence');

// ================================================================
// BILL MODEL
// ================================================================
// _id : auto-incremented integer (Counter "bills").
//
// Each bill snapshots the store details at the moment of sale,
// so historical bills remain readable even if the store info
// changes later.
// ================================================================

const billItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0.001 },
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
    gstAmount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    storeId: { type: Number, ref: 'Store', required: true },

    // Snapshot of store details at sale time
    storeName: { type: String, default: '' },
    storeAddress: { type: String, default: '' },
    storeGst: { type: String, default: '' },
    storePhone: { type: String, default: '' },
    storeFooterNote: { type: String, default: '' },
    storeLogo: { type: String, default: null },

    customerName: { type: String, required: true, trim: true },
    customerMobile: { type: String, default: '', trim: true },

    items: { type: [billItemSchema], required: true, validate: v => v.length > 0 },

    subtotal: { type: Number, required: true, min: 0 },
    gstTotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    paymentMode: {
      type: String,
      enum: ['cash', 'card', 'upi', 'other'],
      default: 'cash',
    },
    createdBy: { type: Number, ref: 'User', required: true },
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

billSchema.pre('validate', async function () {
  if (this.isNew && this._id == null) {
    this._id = await getNextSequence('bills');
  }
});

billSchema.index({ storeId: 1, createdAt: -1 });
billSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Bill', billSchema);
