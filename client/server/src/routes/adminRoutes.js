import express from 'express';
import {
  getDashboardStats,
  getCustomers,
  getProviders,
  reviewVerification,
  toggleUserStatus,
  getAllServices,
  getAllBookings,
  getAllPayments,
  getProviderPayouts,
  initiateAdminPayout,
  getCommissionSettings,
  updateCommissionSettings,
  getFinancialReports,
  exportReportCsv,
  processRefund,
  getAuditLogs,
  getPendingVerifications,
  getAllUsers,
  getCommissions,
  reconcileCommission,
  getDisputes,
  resolveDispute,
} from '../controllers/adminController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// Strict RBAC: All administrative endpoints require admin role
router.use(verifyAuth, requireRole('admin'));

// MODULE 1: Full Marketplace Stats
router.get('/stats', getDashboardStats);

// Customers & Providers
router.get('/customers', getCustomers);
router.get('/providers', getProviders);
router.post('/verifications/:providerId', reviewVerification);
router.patch('/users/:userId/toggle-status', toggleUserStatus);
router.get('/users', getAllUsers);

// Services & Bookings
router.get('/services', getAllServices);
router.get('/bookings', getAllBookings);

// Payments & Transactions (Module 7)
router.get('/payments', getAllPayments);

// Payouts (Module 5)
router.get('/payouts', getProviderPayouts);
router.post('/payouts/initiate', initiateAdminPayout);

// Commission Settings (Module 4)
router.get('/commissions/settings', getCommissionSettings);
router.put('/commissions/settings', updateCommissionSettings);
router.get('/commissions', getCommissions);
router.post('/commissions/:commissionId/reconcile', reconcileCommission);

// Reports & CSV Exports (Module 7)
router.get('/reports', getFinancialReports);
router.get('/reports/export', exportReportCsv);

// Refunds (Module 8)
router.post('/refunds', processRefund);

// Disputes & Audit Logs
router.get('/disputes', getDisputes);
router.post('/disputes/:disputeId/resolve', resolveDispute);
router.get('/audit-logs', getAuditLogs);
router.get('/verifications', getPendingVerifications);

export default router;
