import express from 'express';
import { getServices, getServiceById, createService, updateService, deleteService } from '../controllers/serviceController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', verifyAuth, requireRole('provider', 'admin'), createService);
router.put('/:id', verifyAuth, requireRole('provider', 'admin'), updateService);
router.delete('/:id', verifyAuth, requireRole('provider', 'admin'), deleteService);

export default router;
