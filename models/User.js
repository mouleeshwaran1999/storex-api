const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/sequence');

// ================================================================
// USER MODEL
// ================================================================
// _id : auto-incremented integer (Counter "users")
// Unique on: name, username, mobile.
// ================================================================

const userSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['super_admin', 'admin', 'employee'],
    },
    // storeId is mandatory for employees only
    storeId: {
      type: Number,
      ref: 'Store',
      default: null,
      validate: {
        validator: function (value) {
          if (this.role === 'employee') return value != null;
          return true;
        },
        message: 'Employee must have a storeId assigned',
      },
    },
    // adminId is set on employees to track ownership
    // (which admin created this employee). Null for admins / super_admins.
    adminId: {
      type: Number,
      ref: 'User',
      default: null,
    },
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
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.pre('validate', async function () {
  if (this.isNew && this._id == null) {
    this._id = await getNextSequence('users');
  }
});

userSchema.index({ role: 1 });
userSchema.index({ storeId: 1 });
userSchema.index({ adminId: 1 });

module.exports = mongoose.model('User', userSchema);
