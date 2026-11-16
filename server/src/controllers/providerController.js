import { dataStore } from '../models/dataStore.js';

export const getProviders = (req, res) => {
  try {
    const { category, minRating, maxPrice, locality } = req.query;
    let providers = dataStore.getProviders({ publicOnly: true });

    if (category && category !== 'All') {
      providers = providers.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (minRating) {
      providers = providers.filter((p) => p.rating >= Number(minRating));
    }

    if (maxPrice) {
      providers = providers.filter((p) => p.hourlyRate <= Number(maxPrice));
    }

    if (locality) {
      providers = providers.filter(
        (p) =>
          p.serviceArea.city.toLowerCase() === locality.toLowerCase() ||
          p.serviceArea.localities.some((l) => l.toLowerCase().includes(locality.toLowerCase()))
      );
    }

    res.json({
      success: true,
      count: providers.length,
      providers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve providers.' });
  }
};

export const getProviderById = (req, res) => {
  try {
    const provider = dataStore.getProviderById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const services = dataStore.getServicesByProviderId(provider._id);
    const reviews = dataStore.getReviewsByProvider(provider._id);

    res.json({
      success: true,
      provider,
      services,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch provider details.' });
  }
};

export const getMyProfile = (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found for this user.' });
    }

    const services = dataStore.getServicesByProviderId(provider._id);
    const bookings = dataStore.getBookings({ providerId: provider._id });
    const commissions = dataStore.getCommissionRecords(provider._id);

    const today = new Date().toISOString().split('T')[0];
    const todaysBookings = bookings.filter((b) => b.scheduledDate === today);
    const completedBookings = bookings.filter((b) => b.status === 'completed');

    res.json({
      success: true,
      profile: provider,
      services,
      metrics: {
        todaysBookingsCount: todaysBookings.length,
        totalBookingsCount: bookings.length,
        completedCount: completedBookings.length,
        totalEarnings: provider.totalEarnings || 0,
        availableBalance: provider.availableBalance || 0,
        pendingBalance: provider.pendingBalance || 0,
        paidAmount: provider.paidAmount || 0,
        unpaidCommission: provider.unpaidCommission || 0,
        rating: provider.rating,
        reviewCount: provider.reviewCount,
      },
      commissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve provider profile.' });
  }
};

export const updateProfile = (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    const { businessName, bio, category, skills, hourlyRate, serviceArea, workingHours, isAvailable } = req.body;

    const updates = {};
    if (businessName) updates.businessName = businessName.trim();
    if (bio !== undefined) updates.bio = bio;
    if (category) updates.category = category;
    if (skills) updates.skills = Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim());
    if (hourlyRate) updates.hourlyRate = Number(hourlyRate);
    if (serviceArea) updates.serviceArea = { ...provider.serviceArea, ...serviceArea };
    if (workingHours) updates.workingHours = { ...provider.workingHours, ...workingHours };
    if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);

    const updated = dataStore.updateProviderProfile(provider._id, updates);

    res.json({
      success: true,
      message: 'Provider profile updated successfully.',
      profile: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

export const submitVerification = (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    const { docType, docNumber } = req.body;
    if (!docType || !docNumber) {
      return res.status(400).json({ success: false, message: 'Document type and document number are required.' });
    }

    const doc = {
      docType,
      docNumber,
      submittedAt: new Date().toISOString(),
    };

    const docs = [...(provider.verificationDocuments || []), doc];
    const updated = dataStore.updateProviderProfile(provider._id, {
      verificationDocuments: docs,
      verificationStatus: 'pending',
    });

    dataStore.addAuditLog({
      action: 'PROVIDER_VERIFICATION_SUBMITTED',
      performedBy: req.user.id,
      targetType: 'ProviderProfile',
      targetId: provider._id,
      details: { docType, docNumberMasked: `****${docNumber.slice(-4)}` },
    });

    res.json({
      success: true,
      message: 'Verification documents submitted. Our verification team will review within 24 hours.',
      profile: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit verification.' });
  }
};

// --- MODULE 2: Bank Details & Payout Settings ---

export const getBankDetails = (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    res.json({
      success: true,
      bankAccount: provider.bankAccount || { payoutStatus: 'not_submitted' },
      balances: {
        totalEarnings: provider.totalEarnings || 0,
        availableBalance: provider.availableBalance || 0,
        pendingBalance: provider.pendingBalance || 0,
        paidAmount: provider.paidAmount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve bank details.' });
  }
};

export const updateBankDetails = async (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const { accountHolderName, accountNumber, confirmAccountNumber, ifsc, bankName, upiId, panNumber, businessType } = req.body;

    if (!accountHolderName || !accountNumber || !confirmAccountNumber || !ifsc) {
      return res.status(400).json({ success: false, message: 'Account Holder, Account Number, and IFSC are mandatory.' });
    }

    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Account number and confirmation account number do not match.' });
    }

    const updatedAccount = await dataStore.updateProviderBankAccount(provider._id, {
      accountHolderName,
      accountNumber,
      ifsc,
      bankName,
      upiId,
      panNumber,
      businessType,
    });

    res.json({
      success: true,
      message: 'Bank details saved. Status: Verification Pending.',
      bankAccount: updatedAccount,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update bank details.' });
  }
};

export const verifyBankDetails = async (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const verifiedAccount = await dataStore.verifyProviderBankAccount(provider._id);

    res.json({
      success: true,
      message: 'Bank account verified via Cashfree vendor network! Your account is now active for automatic payouts.',
      bankAccount: verifiedAccount,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Bank verification failed.' });
  }
};

// --- MODULE 6: Provider Financial Dashboard ---

export const getEarningsFinance = (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const payments = dataStore.getPayments({ providerId: provider._id });
    const payouts = dataStore.getPayouts({ providerId: provider._id });

    // Time calculations
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const paidPayments = payments.filter((p) => p.status === 'paid');

    const todayEarnings = paidPayments
      .filter((p) => p.paidAt && p.paidAt.startsWith(todayStr))
      .reduce((sum, p) => sum + p.providerEarnings, 0);

    const weeklyEarnings = paidPayments
      .filter((p) => p.paidAt && new Date(p.paidAt) >= sevenDaysAgo)
      .reduce((sum, p) => sum + p.providerEarnings, 0);

    const monthlyEarnings = paidPayments
      .filter((p) => p.paidAt && new Date(p.paidAt) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.providerEarnings, 0);

    const totalCommissionDeducted = paidPayments.reduce((sum, p) => sum + p.platformCommission, 0);

    const successfulPayouts = payouts.filter((po) => po.status === 'successful');
    const totalPayoutsReceived = successfulPayouts.reduce((sum, po) => sum + po.amount, 0);
    const failedPayoutsCount = payouts.filter((po) => po.status === 'failed').length;

    // Transaction rows for table
    const transactions = payments.map((p) => {
      const b = dataStore.getBookingById(p.bookingId);
      return {
        bookingId: b?.bookingReference || p.bookingRef,
        bookingInternalId: p.bookingId,
        customerName: p.customerName,
        serviceName: b?.service?.title || 'Hyperlocal Service',
        bookingAmount: p.amount,
        platformCommission: p.platformCommission,
        providerEarnings: p.providerEarnings,
        paymentDate: p.paidAt || p.createdAt,
        paymentStatus: p.status,
        payoutStatus: b?.payoutStatus || 'pending',
        receiptNumber: p.receiptNumber,
      };
    });

    res.json({
      success: true,
      financeSummary: {
        totalEarnings: provider.totalEarnings || 0,
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        availableBalance: provider.availableBalance || 0,
        pendingBalance: provider.pendingBalance || 0,
        totalCommissionDeducted,
        totalPayoutsReceived,
        failedPayoutsCount,
      },
      bankAccount: provider.bankAccount || { payoutStatus: 'not_submitted' },
      transactions,
      payouts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compute provider financial summary.' });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const { amount, notes } = req.body;
    const payoutAmount = Number(amount) || provider.availableBalance;

    if (payoutAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No available balance eligible for payout.' });
    }

    const payout = await dataStore.initiateProviderPayout({
      providerId: provider._id,
      amount: payoutAmount,
      adminId: req.user.id,
      notes: notes || 'Provider requested settlement',
    });

    res.json({
      success: true,
      message: `Payout of ₹${payout.amount} initiated successfully. Transfer reference: ${payout.gatewayTransferId}`,
      payout,
      availableBalance: provider.availableBalance,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Payout request failed.' });
  }
};

export const downloadStatement = (req, res) => {
  try {
    const provider = dataStore.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    const payments = dataStore.getPayments({ providerId: provider._id });
    const header = 'Booking Ref,Customer,Gross Amount (INR),Platform Commission (INR),Provider Net Share (INR),Payment Date,Status\n';
    const rows = payments.map((p) => 
      `"${p.bookingRef || p.bookingId}","${p.customerName || 'Customer'}",${p.amount},${p.platformCommission},${p.providerEarnings},"${p.paidAt || p.createdAt}","${p.status}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=nexora_statement_${provider._id}.csv`);
    res.send(header + rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate statement CSV.' });
  }
};
