import express from 'express';
import { 
  getProviders, 
  getProviderById, 
  getMyProfile, 
  updateProfile, 
  submitVerification,
  getBankDetails,
  updateBankDetails,
  verifyBankDetails,
  getEarningsFinance,
  requestPayout,
  downloadStatement
} from '../controllers/providerController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// Public
router.get('/', getProviders);
router.get('/detail/:id', getProviderById);

// Protected Provider Operations
router.get('/me', verifyAuth, requireRole('provider'), getMyProfile);
router.put('/me', verifyAuth, requireRole('provider'), updateProfile);
router.post('/verify', verifyAuth, requireRole('provider'), submitVerification);

// Bank Details & Payout Settings (Module 2)
router.get('/bank-details', verifyAuth, requireRole('provider'), getBankDetails);
router.post('/bank-details', verifyAuth, requireRole('provider'), updateBankDetails);
router.post('/bank-details/verify', verifyAuth, requireRole('provider'), verifyBankDetails);

// Provider Financials & Statement (Module 6)
router.get('/finance', verifyAuth, requireRole('provider'), getEarningsFinance);
router.post('/request-payout', verifyAuth, requireRole('provider'), requestPayout);
router.get('/statement/download', verifyAuth, requireRole('provider'), downloadStatement);

export default router;
