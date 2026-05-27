const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequence');

// ================================================================
// STORE MODEL
// ================================================================
// _id : auto-incremented integer (Counter "stores")
// Store name must be unique. Store must belong to an Admin.
// ================================================================

const storeSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    gstNumber: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    footerNote: { type: String, default: '', trim: true },
    logoUrl: { type: String, default: null },
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
        // Expose `gst` alias so the UI (which uses store.gst) gets the value.
        ret.gst = ret.gstNumber;
        // Expose `logo` alias for consistency with the create/update payload shape.
        if (ret.logoUrl !== undefined) ret.logo = ret.logoUrl;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

storeSchema.pre('validate', async function () {
  if (this.isNew && this._id == null) {
    this._id = await getNextSequence('stores');
  }
});

storeSchema.index({ adminId: 1 });
// Store name must be unique within an admin's own list (case-insensitive)
storeSchema.index(
  { adminId: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Store', storeSchema);
