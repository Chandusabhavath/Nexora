import express from 'express';
import {
  register,
  login,
  getMe,
  requestOTP,
  verifyOTP,
  requestEmailOTP,
  verifyEmailOTP,
} from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Standard Password & Profile
router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyAuth, getMe);

// Email OTP Endpoints (Prompt 2 & Prompt 3)
router.post('/request-otp', requestEmailOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/resend-otp', requestEmailOTP);

// Universal / Legacy OTP Endpoints (Supports both email & phone)
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTP);

export default router;
