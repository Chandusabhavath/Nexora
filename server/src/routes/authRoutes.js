import express from 'express';
import {
  register,
  login,
  getMe,
  requestOTP,
  verifyOTP,
  requestEmailOTP,
  verifyEmailOTP,
  initiateGoogleAuth,
  handleGoogleCallback,
  verifyGoogleToken,
  initiateAppleAuth,
} from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Standard Password & Profile
router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyAuth, getMe);

// Email OTP Endpoints
router.post('/request-otp', requestEmailOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/resend-otp', requestEmailOTP);

// Universal / Legacy OTP Endpoints (Supports both email & phone)
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTP);

// Google OAuth 2.0 & Google Identity Services Endpoints
router.get('/google', initiateGoogleAuth);
router.get('/callback/google', handleGoogleCallback);
router.get('/google/callback', handleGoogleCallback);
router.post('/google', verifyGoogleToken);

// Apple Identity Endpoints
router.get('/apple', initiateAppleAuth);

export default router;
