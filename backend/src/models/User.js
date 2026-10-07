const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    dateOfBirth: {
      type: String,
      required: [true, 'Date of Birth is required']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    healthId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    // ABDM / ABHA Identity Fields
    abhaNumber: {
      type: String,
      default: null,
      trim: true
    },
    abhaAddress: {
      type: String,
      default: null,
      trim: true
    },
    abhaStatus: {
      type: String,
      enum: ['not_linked', 'linking_pending', 'linked', 'verification_required', 'verification_failed'],
      default: 'not_linked'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
