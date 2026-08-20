import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createSecret,
  getSecret,
  getSecretMeta,
  verifyDuress,
  getManagementTelemetry,
  revokeSecret,
  getStats,
} from '../controllers/secretController.js';

const router = Router();

// Rate limiting middleware
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many secrets created from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const duressLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Too many PIN verification attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
router.post('/secrets', createLimiter, createSecret);
router.get('/secrets/:id', readLimiter, getSecret);
router.get('/secrets/:id/meta', readLimiter, getSecretMeta);
router.post('/secrets/:id/verify-duress', duressLimiter, verifyDuress);

// Management & Revocation
router.get('/secrets/:id/management', readLimiter, getManagementTelemetry);
router.delete('/secrets/:id', readLimiter, revokeSecret);

// Stats & Health
router.get('/stats', getStats);

export default router;
