import express from 'express';
import { createReview, getProviderReviews } from '../controllers/reviewController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/provider/:providerId', getProviderReviews);
router.post('/', verifyAuth, createReview);

export default router;
