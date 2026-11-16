import express from 'express';
import { register, login, getMe, requestOTP, verifyOTP } from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyAuth, getMe);
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTP);

export default router;
