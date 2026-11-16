import express from 'express';
import { getConversation, sendMessage } from '../controllers/chatController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:bookingId', verifyAuth, getConversation);
router.post('/:bookingId', verifyAuth, sendMessage);

export default router;
