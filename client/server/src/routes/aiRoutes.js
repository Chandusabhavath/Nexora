import express from 'express';
import { smartMatch } from '../controllers/aiController.js';

const router = express.Router();

router.post('/match', smartMatch);

export default router;
