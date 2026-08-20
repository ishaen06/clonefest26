import mongoose from 'mongoose';

const secretSchema = new mongoose.Schema(
  {
    secretId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ciphertext: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      default: '',
    },
    iterations: {
      type: Number,
      default: 600000,
    },
    hasPassword: {
      type: Boolean,
      default: false,
    },
    hasDuress: {
      type: Boolean,
      default: false,
    },
    duressPinHash: {
      type: String,
      default: '',
    },
    managementTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    ttlSeconds: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    burnAfterReads: {
      type: Number,
      default: 1, // 0 means unlimited within TTL
    },
    readCount: {
      type: Number,
      default: 0,
    },
    isBurned: {
      type: Boolean,
      default: false,
    },
    burnedAt: {
      type: Date,
      default: null,
    },
    ephemeralCountdownSeconds: {
      type: Number,
      default: 0, // 0 = no dynamic countdown
    },
    privacyLensDefault: {
      type: Boolean,
      default: false,
    },
    format: {
      type: String,
      enum: ['plaintext', 'code', 'markdown', 'file', 'shamir'],
      default: 'plaintext',
    },
    syntaxLanguage: {
      type: String,
      default: 'plaintext',
    },
  },
  {
    timestamps: true,
  }
);

// Native MongoDB TTL index: automatically deletes expired documents
secretSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Secret = mongoose.model('Secret', secretSchema);
export default Secret;
