import { dataStore } from '../models/dataStore.js';

/**
 * MODULE 1: Full Marketplace Admin Statistics (12 Required KPIs)
 */
export const getDashboardStats = (req, res) => {
  try {
    const stats = dataStore.getAdminMarketplaceStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compute admin statistics.' });
  }
};

/**
 * Customers Directory
 */
export const getCustomers = (req, res) => {
  try {
    const customers = dataStore.users
      .filter((u) => u.role === 'customer')
      .map((u) => {
        const userBookings = dataStore.getBookings({ customerId: u._id });
        const userPayments = dataStore.getPayments({ customerId: u._id });
        const totalSpent = userPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          locality: u.address?.locality || 'Bandra',
          isActive: u.isActive !== false,
          totalBookings: userBookings.length,
          totalSpent,
          createdAt: u.createdAt,
        };
      });

    res.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve customers.' });
  }
};

/**
 * Service Providers Directory & Management
 */
export const getProviders = (req, res) => {
  try {
    const providers = dataStore.providerProfiles.map((p) => {
      const bookings = dataStore.getBookings({ providerId: p._id });
      const payments = dataStore.getPayments({ providerId: p._id });
      const payouts = dataStore.getPayouts({ providerId: p._id });

      return {
        id: p._id,
        businessName: p.businessName,
        category: p.category,
        hourlyRate: p.hourlyRate,
        verificationStatus: p.verificationStatus,
        verificationDocuments: p.verificationDocuments,
        rating: p.rating,
        reviewCount: p.reviewCount,
        completedBookingsCount: p.completedBookingsCount,
        bankAccount: p.bankAccount || { payoutStatus: 'not_submitted' },
        totalEarnings: p.totalEarnings || 0,
        availableBalance: p.availableBalance || 0,
        pendingBalance: p.pendingBalance || 0,
        paidAmount: p.paidAmount || 0,
        totalBookings: bookings.length,
        totalPayouts: payouts.length,
        user: p.user || null,
        createdAt: p.createdAt,
      };
    });

    res.json({
      success: true,
      count: providers.length,
      providers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve providers.' });
  }
};

/**
 * Provider Verification Review (Approve/Reject)
 */
export const reviewVerification = (req, res) => {
  try {
    const { providerId } = req.params;
    const { action, feedback } = req.body; // 'approve' | 'reject'

    const provider = dataStore.getProviderById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'." });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updated = dataStore.updateProviderProfile(providerId, {
      verificationStatus: newStatus,
      verificationFeedback: feedback || '',
    });

    dataStore.addAuditLog({
      action: `PROVIDER_VERIFICATION_${action.toUpperCase()}D`,
      performedBy: req.user.id,
      targetType: 'ProviderProfile',
      targetId: providerId,
      details: { action, feedback },
    });

    dataStore.addNotification({
      userId: provider.userId,
      title: `Verification ${action === 'approve' ? 'Approved' : 'Action Required'}`,
      message: action === 'approve'
        ? 'Congratulations! Your identity credentials have been verified. You now have the Verified Provider badge on NEXORA.'
        : `Your verification submission was not approved: ${feedback || 'Please update your document details.'}`,
      type: 'verification',
      link: '/provider/dashboard',
    });

    res.json({
      success: true,
      message: `Provider verification ${action}d successfully.`,
      provider: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review verification.' });
  }
};

/**
 * Toggle User Suspension / Activation
 */
export const toggleUserStatus = (req, res) => {
  try {
    const { userId } = req.params;
    const user = dataStore.getUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate platform administrator accounts.' });
    }

    const newActiveState = !user.isActive;
    dataStore.updateUser(userId, { isActive: newActiveState });

    dataStore.addAuditLog({
      action: newActiveState ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      performedBy: req.user.id,
      targetType: 'User',
      targetId: userId,
      details: { email: user.email },
    });

    res.json({
      success: true,
      message: `User ${user.email} is now ${newActiveState ? 'Active' : 'Suspended'}.`,
      isActive: newActiveState,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
  }
};

/**
 * All Services View & Moderation
 */
export const getAllServices = (req, res) => {
  try {
    const services = dataStore.getServices();
    res.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve services.' });
  }
};

/**
 * All Bookings Oversight
 */
export const getAllBookings = (req, res) => {
  try {
    const { status } = req.query;
    const bookings = dataStore.getBookings({ status });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

/**
 * MODULE 7: Admin Financial Management — Payments & Transactions
 */
export const getAllPayments = (req, res) => {
  try {
    const { status, providerId, customerId } = req.query;
    const payments = dataStore.getPayments({ status, providerId, customerId });

    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
  }
};

/**
 * MODULE 5: Provider Payouts Oversight & Manual Trigger
 */
export const getProviderPayouts = (req, res) => {
  try {
    const { status, providerId } = req.query;
    const payouts = dataStore.getPayouts({ status, providerId });

    res.json({
      success: true,
      count: payouts.length,
      payouts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payouts.' });
  }
};

export const initiateAdminPayout = async (req, res) => {
  try {
    const { providerId, amount, notes } = req.body;

    if (!providerId || !amount) {
      return res.status(400).json({ success: false, message: 'Provider ID and amount are required.' });
    }

    const payout = await dataStore.initiateProviderPayout({
      providerId,
      amount: Number(amount),
      adminId: req.user.id,
      notes: notes || 'Admin initiated marketplace settlement disbursement',
    });

    res.status(201).json({
      success: true,
      message: `Payout of ₹${payout.amount} initiated to ${payout.providerName}. Transfer UTR: ${payout.utr}`,
      payout,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Payout disbursement failed.' });
  }
};

/**
 * MODULE 4: Commission Settings Management
 */
export const getCommissionSettings = (req, res) => {
  try {
    const rules = dataStore.getCommissionRules();
    res.json({
      success: true,
      rules,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commission settings.' });
  }
};

export const updateCommissionSettings = (req, res) => {
  try {
    const updates = req.body;
    const updatedRules = dataStore.updateCommissionRules(updates);

    dataStore.addAuditLog({
      action: 'COMMISSION_SETTINGS_UPDATED',
      performedBy: req.user.id,
      targetType: 'CommissionRule',
      details: updates,
    });

    res.json({
      success: true,
      message: 'Commission settings updated successfully. Historical transactions will remain preserved.',
      rules: updatedRules,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update commission settings.' });
  }
};

/**
 * MODULE 7: Financial Reports & Revenue Breakdown
 */
export const getFinancialReports = (req, res) => {
  try {
    const payments = dataStore.payments.filter((p) => p.status === 'paid');
    const payouts = dataStore.payouts.filter((po) => po.status === 'successful');
    const refunds = dataStore.refunds.filter((r) => r.status === 'successful');

    // Category breakdown
    const categoryBreakdown = {};
    payments.forEach((p) => {
      const b = dataStore.getBookingById(p.bookingId);
      const cat = b?.service?.category || 'General';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { category: cat, totalGMV: 0, platformCommission: 0, providerEarnings: 0, count: 0 };
      }
      categoryBreakdown[cat].totalGMV += p.amount;
      categoryBreakdown[cat].platformCommission += p.platformCommission;
      categoryBreakdown[cat].providerEarnings += p.providerEarnings;
      categoryBreakdown[cat].count += 1;
    });

    // Provider breakdown
    const providerBreakdown = dataStore.providerProfiles.map((p) => {
      const provPayments = payments.filter((pay) => pay.providerId?.toString() === p._id.toString());
      const gmv = provPayments.reduce((s, pay) => s + pay.amount, 0);
      const comm = provPayments.reduce((s, pay) => s + pay.platformCommission, 0);
      const net = provPayments.reduce((s, pay) => s + pay.providerEarnings, 0);

      return {
        providerId: p._id,
        businessName: p.businessName,
        category: p.category,
        totalGMV: gmv,
        platformCommissionPaid: comm,
        netEarnings: net,
        availableBalance: p.availableBalance || 0,
        pendingBalance: p.pendingBalance || 0,
        paidOut: p.paidAmount || 0,
      };
    });

    // Summary totals
    const totalGMV = payments.reduce((s, p) => s + p.amount, 0);
    const totalCommission = payments.reduce((s, p) => s + p.platformCommission, 0);
    const totalProviderEarnings = payments.reduce((s, p) => s + p.providerEarnings, 0);
    const totalPayoutsDisbursed = payouts.reduce((s, po) => s + po.amount, 0);
    const totalRefundsProcessed = refunds.reduce((s, r) => s + r.amount, 0);

    res.json({
      success: true,
      report: {
        summary: {
          totalGMV,
          totalCommission,
          totalProviderEarnings,
          totalPayoutsDisbursed,
          totalRefundsProcessed,
          netPlatformRevenue: totalCommission - totalRefundsProcessed,
        },
        categoryBreakdown: Object.values(categoryBreakdown),
        providerBreakdown,
        refunds,
        ledgerEntries: dataStore.getFinancialLedger().slice(0, 20),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate financial reports.' });
  }
};

/**
 * CSV Exports
 */
export const exportReportCsv = (req, res) => {
  try {
    const { type } = req.query; // 'transactions' | 'payouts' | 'ledger'

    if (type === 'payouts') {
      const payouts = dataStore.getPayouts();
      const header = 'Payout ID,Provider,Amount (INR),Beneficiary,Bank,Account Masked,IFSC,Status,UTR,Date\n';
      const rows = payouts.map((po) =>
        `"${po.payoutId}","${po.providerName}",${po.amount},"${po.beneficiaryName}","${po.bankName}","${po.accountNumberMasked}","${po.ifsc}","${po.status}","${po.utr || ''}","${po.completedAt || po.initiatedAt}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=nexora_payouts_export.csv');
      return res.send(header + rows);
    }

    if (type === 'ledger') {
      const ledger = dataStore.getFinancialLedger();
      const header = 'Entry ID,Type,Debit,Credit,Reference,Description,Timestamp\n';
      const rows = ledger.map((l) =>
        `"${l.entryId}","${l.entryType}",${l.debit},${l.credit},"${l.referenceId}","${l.description}","${l.timestamp}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=nexora_financial_ledger_export.csv');
      return res.send(header + rows);
    }

    // Default: Transactions
    const payments = dataStore.getPayments();
    const header = 'Order ID,Receipt No,Booking Ref,Customer,Provider,Amount (INR),Commission (INR),Provider Share (INR),Method,Status,Date\n';
    const rows = payments.map((p) =>
      `"${p.orderId}","${p.receiptNumber}","${p.bookingRef}","${p.customerName}","${p.providerName}",${p.amount},${p.platformCommission},${p.providerEarnings},"${p.paymentMethod}","${p.status}","${p.paidAt || p.createdAt}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=nexora_marketplace_transactions.csv');
    res.send(header + rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
};

/**
 * MODULE 8: Refund Handling
 */
export const processRefund = async (req, res) => {
  try {
    const { bookingId, reason, amount } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const refund = await dataStore.processRefund({
      bookingId,
      reason: reason || 'Admin approved refund',
      amount,
      adminId: req.user.id,
    });

    dataStore.addAuditLog({
      action: 'ADMIN_REFUND_PROCESSED',
      performedBy: req.user.id,
      targetType: 'Refund',
      targetId: refund.refundId,
      details: { bookingId, amount: refund.amount },
    });

    res.json({
      success: true,
      message: `Refund of ₹${refund.amount} completed successfully. Refund ID: ${refund.refundId}`,
      refund,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Refund processing failed.' });
  }
};

/**
 * Audit Trail Logs
 */
export const getAuditLogs = (req, res) => {
  try {
    const logs = dataStore.getAuditLogs();
    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
};

/**
 * Backwards compatibility for existing routes
 */
export const getPendingVerifications = (req, res) => {
  try {
    const pending = dataStore.providerProfiles.filter((p) => p.verificationStatus === 'pending');
    res.json({ success: true, count: pending.length, providers: pending });
  } catch {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

export const getAllUsers = (req, res) => {
  try {
    const users = dataStore.users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isVerified: u.isVerified,
      isActive: u.isActive !== false,
      createdAt: u.createdAt,
    }));
    res.json({ success: true, count: users.length, users });
  } catch {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

export const getCommissions = (req, res) => {
  try {
    const payments = dataStore.payments.filter((p) => p.status === 'paid');
    const commissions = payments.map((p) => ({
      _id: p._id,
      bookingId: p.bookingRef || p.bookingId,
      providerId: p.providerId,
      grossAmount: p.amount,
      commissionRate: p.commissionRate,
      commissionAmount: p.platformCommission,
      settlementStatus: 'reconciled',
      createdAt: p.paidAt || p.createdAt,
    }));
    res.json({ success: true, count: commissions.length, commissions });
  } catch {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

export const reconcileCommission = (req, res) => {
  res.json({ success: true, message: 'Commission auto-reconciled.' });
};

export const getDisputes = (req, res) => {
  res.json({ success: true, count: dataStore.disputes.length, disputes: dataStore.disputes });
};

export const resolveDispute = (req, res) => {
  try {
    const { disputeId } = req.params;
    const { resolutionNote } = req.body;
    const resolved = dataStore.resolveDispute(disputeId, req.user.id, resolutionNote);
    res.json({ success: true, message: 'Dispute resolved.', dispute: resolved });
  } catch {
    res.status(500).json({ success: false, message: 'Error' });
  }
};
