const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequence');

// ================================================================
// CUSTOMER MODEL
// ================================================================
// _id : auto-incremented integer (Counter "customers")
// Customers belong to a store and are created by employees.
// ================================================================

const customerSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, default: '', trim: true },
    storeId: { type: Number, ref: 'Store', required: true },
    adminId: { type: Number, ref: 'User', required: true },
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

customerSchema.pre('validate', async function () {
  if (this.isNew && this._id == null) {
    this._id = await getNextSequence('customers');
  }
});

customerSchema.index({ storeId: 1, name: 1 });

module.exports = mongoose.model('Customer', customerSchema);
