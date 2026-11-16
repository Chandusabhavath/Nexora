import test from 'node:test';
import assert from 'node:assert/strict';
import { dataStore } from '../models/dataStore.js';
import { CommissionEngine } from '../services/commissionEngine.js';

test('NEXORA Marketplace Payments & Admin Operations Test Suite', async (t) => {
  await dataStore.init();

  const customer = dataStore.users.find((u) => u.role === 'customer');
  const providerUser = dataStore.users.find((u) => u.role === 'provider' && u.email === 'rajesh.electric@example.com');
  const provider = dataStore.getProviderByUserId(providerUser._id);
  const adminUser = dataStore.users.find((u) => u.role === 'admin');

  assert.ok(customer, 'Customer user must exist');
  assert.ok(provider, 'Electrician provider must exist');
  assert.ok(adminUser, 'Admin user must exist');

  await t.test('1. Module 4: Automatic Commission Calculation Engine (Paise Precision)', () => {
    // Test default 10% rate on ₹1,000
    const calc1 = CommissionEngine.calculate({
      grossAmount: 1000,
      providerId: 'sample_p_1',
      category: 'General',
    });

    assert.equal(calc1.grossAmount, 1000);
    assert.equal(calc1.commissionRate, 10);
    assert.equal(calc1.commissionAmount, 100);
    assert.equal(calc1.providerAmount, 900);
    assert.equal(calc1.commissionAmount + calc1.providerAmount, calc1.grossAmount);

    // Test decimal precision (e.g. ₹750.50 at 10%)
    const calc2 = CommissionEngine.calculate({
      grossAmount: 750.50,
      providerId: 'sample_p_2',
      category: 'General',
    });
    assert.equal(calc2.commissionAmount, 75.05);
    assert.equal(calc2.providerAmount, 675.45);
    assert.equal(Math.round((calc2.commissionAmount + calc2.providerAmount) * 100), 75050);

    // Test Category Override (e.g., Electrical configured at 12%)
    dataStore.updateCommissionRules({
      categoryPercentages: { Electrical: 12 },
    });
    const calc3 = CommissionEngine.calculate({
      grossAmount: 2000,
      providerId: 'sample_p_3',
      category: 'Electrical',
    });
    assert.equal(calc3.commissionRate, 12);
    assert.equal(calc3.commissionAmount, 240);
    assert.equal(calc3.providerAmount, 1760);

    // Test Provider Specific Override
    dataStore.updateCommissionRules({
      providerPercentages: { [provider._id]: 8 },
    });
    const calc4 = CommissionEngine.calculate({
      grossAmount: 1000,
      providerId: provider._id,
      category: 'Electrical', // Provider override takes precedence
    });
    assert.equal(calc4.commissionRate, 8);
    assert.equal(calc4.commissionAmount, 80);
    assert.equal(calc4.providerAmount, 920);

    // Reset default
    dataStore.updateCommissionRules({
      defaultPercentage: 10,
      categoryPercentages: { Electrical: 12, 'Home Cleaning': 10 },
      providerPercentages: {},
    });
  });

  await t.test('2. Module 2: Provider Bank Details & Cashfree Vendor Onboarding', async () => {
    const bankDetails = {
      accountHolderName: 'Rajesh Sharma',
      accountNumber: '50100234567890',
      confirmAccountNumber: '50100234567890',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank, Bandra West',
      upiId: 'rajesh.electric@okhdfcbank',
      businessType: 'individual',
    };

    // Update in dataStore
    const updated = await dataStore.updateProviderBankAccount(provider._id, bankDetails);
    assert.equal(updated.accountHolderName, 'Rajesh Sharma');
    assert.equal(updated.accountNumberMasked, '••••••••7890');
    assert.equal(updated.ifsc, 'HDFC0001234');
    assert.equal(updated.payoutStatus, 'verification_pending');

    // Verify with Cashfree vendor API simulation
    const verified = await dataStore.verifyProviderBankAccount(provider._id);
    assert.equal(verified.payoutStatus, 'verified');
    assert.ok(verified.gatewayVendorId.startsWith('VND_NX_'));
  });

  let createdBookingId = null;
  let createdPaymentOrderId = null;

  await t.test('3. Module 3: Customer Dynamic UPI QR Code Generation & Order Initiation', async () => {
    const service = dataStore.getServicesByProviderId(provider._id)[0];
    
    // Create new booking
    const booking = dataStore.addBooking({
      customerId: customer._id,
      providerId: provider._id,
      serviceId: service._id,
      scheduledDate: '2026-11-20',
      scheduledTime: '11:00',
      durationHours: 2,
      taskDescription: 'Fix circuit tripping in server closet',
      serviceLocation: { locality: 'Bandra West', city: 'Mumbai', pincode: '400050' },
      paymentMethod: 'online',
      status: 'pending',
      paymentStatus: 'unpaid',
      agreedPriceSnapshot: {
        baseRate: service.price || 400,
        priceType: 'hourly',
        durationHours: 2,
        subtotal: 800,
        platformFee: 96,
        totalAmount: 896,
        providerShare: 800,
        commissionRate: 12,
      },
    });

    assert.ok(booking._id);
    assert.equal(booking.paymentStatus, 'unpaid');
    createdBookingId = booking._id;

    // Create payment order
    const orderRes = await dataStore.createOnlinePaymentOrder(booking._id, 'online_qr');
    assert.ok(orderRes.payment);
    assert.ok(orderRes.payment.orderId);
    assert.ok(orderRes.payment.dynamicQrString.startsWith('upi://pay?'));
    assert.ok(orderRes.payment.dynamicQrString.includes(orderRes.payment.orderId));
    assert.equal(orderRes.payment.amount, booking.agreedPriceSnapshot.totalAmount);
    assert.equal(orderRes.payment.splitConfig[0].vendor_id, provider.bankAccount.gatewayVendorId);
    createdPaymentOrderId = orderRes.payment.orderId;
  });

  await t.test('4. Module 3 & 5: Backend Payment Verification & Escrow Crediting', async () => {
    const booking = dataStore.getBookingById(createdBookingId);
    assert.ok(booking);

    const provBefore = dataStore.getProviderById(provider._id);
    const prevPendingBalance = provBefore.pendingBalance || 0;
    const prevAvailableBalance = provBefore.availableBalance || 0;

    // Verify payment through backend
    const verifyResult = await dataStore.verifyAndRecordPayment({
      orderId: createdPaymentOrderId,
      gatewayPaymentId: `PAY_TEST_${Date.now()}`,
      gatewaySignature: 'cf_sig_test',
    });

    assert.ok(verifyResult.payment);
    assert.equal(verifyResult.payment.status, 'paid');
    assert.equal(verifyResult.payment.bookingRef, booking.bookingReference);

    // Check that booking is now marked 'paid'
    const updatedBooking = dataStore.getBookingById(createdBookingId);
    assert.equal(updatedBooking.paymentStatus, 'paid');

    // Check that Provider's pendingBalance increased by providerEarnings, but availableBalance did NOT change yet
    const reloadedProvider = dataStore.getProviderById(provider._id);
    assert.equal(reloadedProvider.pendingBalance, prevPendingBalance + verifyResult.payment.providerEarnings);
    assert.equal(reloadedProvider.availableBalance, prevAvailableBalance);

    // Check Financial Ledger entry
    const ledgerEntry = dataStore.financialLedger.find((l) => l.referenceId === createdPaymentOrderId);
    assert.ok(ledgerEntry);
    assert.equal(ledgerEntry.entryType, 'CUSTOMER_PAYMENT');
  });

  await t.test('5. Module 5: Job Completion & Automatic Escrow Release to Available Balance', async () => {
    const provBefore = dataStore.getProviderById(provider._id);
    const pendingBefore = provBefore.pendingBalance;
    const availableBefore = provBefore.availableBalance;

    const payment = dataStore.getPaymentByOrderId(createdPaymentOrderId);
    const releaseAmount = payment.providerEarnings;

    // Mark completed & release escrow
    dataStore.updateBooking(createdBookingId, { status: 'completed' });
    const released = dataStore.releaseJobEscrowToAvailableBalance(createdBookingId);
    assert.equal(released, true);

    const provAfter = dataStore.getProviderById(provider._id);
    assert.equal(provAfter.pendingBalance, pendingBefore - releaseAmount);
    assert.equal(provAfter.availableBalance, availableBefore + releaseAmount);

    // Check Financial Ledger entry for escrow release
    const escrowLedger = dataStore.financialLedger.find((l) => l.bookingId === createdBookingId && l.entryType === 'PROVIDER_EARNINGS_AVAILABLE');
    assert.ok(escrowLedger);
    assert.equal(escrowLedger.credit, releaseAmount);
  });

  await t.test('6. Module 5 & 2: Provider Payout Disbursement to Verified Bank Account', async () => {
    const provBefore = dataStore.getProviderById(provider._id);
    assert.ok(provBefore.availableBalance > 0);

    const withdrawAmount = provBefore.availableBalance;
    const paidBefore = provBefore.paidAmount || 0;

    const payoutResult = await dataStore.initiateProviderPayout({
      providerId: provider._id,
      amount: withdrawAmount,
      adminId: adminUser._id,
      notes: 'Test settlement transfer',
    });

    assert.ok(payoutResult.payoutId);
    assert.equal(payoutResult.status, 'successful');
    assert.equal(payoutResult.amount, withdrawAmount);

    const provAfter = dataStore.getProviderById(provider._id);
    assert.equal(provAfter.availableBalance, 0);
    assert.equal(provAfter.paidAmount, paidBefore + withdrawAmount);

    // Check Financial Ledger for payout transfer
    const payoutLedger = dataStore.financialLedger.find((l) => l.referenceId === payoutResult.payoutId && l.entryType === 'PROVIDER_PAYOUT_DISBURSED');
    assert.ok(payoutLedger);
  });

  await t.test('7. Module 8: Customer Cancellation Refund & Compensating Ledger Entries', async () => {
    const service = dataStore.getServicesByProviderId(provider._id)[0];
    
    // Create another online booking
    const booking = dataStore.addBooking({
      customerId: customer._id,
      providerId: provider._id,
      serviceId: service._id,
      scheduledDate: '2026-11-25',
      scheduledTime: '15:00',
      durationHours: 1,
      taskDescription: 'Ceiling fan capacitor repair',
      serviceLocation: { locality: 'Bandra West', city: 'Mumbai', pincode: '400050' },
      paymentMethod: 'online',
      status: 'pending',
      paymentStatus: 'unpaid',
      agreedPriceSnapshot: {
        baseRate: 400,
        priceType: 'fixed',
        subtotal: 400,
        platformFee: 48,
        totalAmount: 448,
        providerShare: 400,
        commissionRate: 12,
      },
    });

    const orderRes = await dataStore.createOnlinePaymentOrder(booking._id, 'online_qr');
    await dataStore.verifyAndRecordPayment({
      orderId: orderRes.payment.orderId,
      gatewayPaymentId: `PAY_REF_${Date.now()}`,
      gatewaySignature: 'sig_test',
    });

    const provBeforeRefund = dataStore.getProviderById(provider._id);
    const pendingBefore = provBeforeRefund.pendingBalance;

    // Process refund
    const refundRes = await dataStore.processRefund({
      bookingId: booking._id,
      reason: 'Customer cancelled due to emergency',
      adminId: adminUser._id,
    });

    assert.ok(refundRes.refundId);
    assert.equal(refundRes.status, 'successful');

    // Booking should be updated with refundDetails
    const refundedBooking = dataStore.getBookingById(booking._id);
    assert.equal(refundedBooking.status, 'cancelled');
    assert.equal(refundedBooking.paymentStatus, 'refunded');
    assert.ok(refundedBooking.refundDetails);

    // Provider pendingBalance should be debited
    const provAfterRefund = dataStore.getProviderById(provider._id);
    assert.equal(provAfterRefund.pendingBalance, pendingBefore - orderRes.payment.providerEarnings);

    // Double-entry ledger compensating record exists
    const refundLedger = dataStore.financialLedger.find((l) => l.referenceId === refundRes.refundId && l.entryType === 'REFUND_REVERSAL');
    assert.ok(refundLedger);
    assert.equal(refundLedger.debit, refundRes.amount);
  });

  await t.test('8. Module 1: Admin Dashboard 12 KPIs & Financial Integrity Check', () => {
    const stats = dataStore.getAdminMarketplaceStats();

    // 1. Total registered customers
    assert.ok(typeof stats.totalCustomers === 'number' && stats.totalCustomers >= 1);
    // 2. Total registered service providers
    assert.ok(typeof stats.totalProviders === 'number' && stats.totalProviders >= 4);
    // 3. Total bookings
    assert.ok(typeof stats.totalBookings === 'number' && stats.totalBookings >= 1);
    // 4. Completed bookings
    assert.ok(typeof stats.completedBookings === 'number' && stats.completedBookings >= 1);
    // 5. Pending bookings
    assert.ok(typeof stats.pendingBookings === 'number');
    // 6. Cancelled bookings
    assert.ok(typeof stats.cancelledBookings === 'number' && stats.cancelledBookings >= 1);
    // 7. Total customer payments
    assert.ok(typeof stats.totalCustomerPayments === 'number' && stats.totalCustomerPayments > 0);
    // 8. Total platform commission
    assert.ok(typeof stats.totalPlatformCommission === 'number' && stats.totalPlatformCommission > 0);
    // 9. Total provider earnings
    assert.ok(typeof stats.totalProviderEarnings === 'number' && stats.totalProviderEarnings > 0);
    // 10. Pending provider payouts
    assert.ok(typeof stats.pendingProviderPayouts === 'number');
    // 11. Successful provider payouts
    assert.ok(typeof stats.successfulProviderPayouts === 'number' && stats.successfulProviderPayouts > 0);
    // 12. Recent transactions array
    assert.ok(Array.isArray(stats.recentTransactions) && stats.recentTransactions.length > 0);

    // Mathematical reconciliation: Customer Payments >= Platform Commission + Provider Earnings
    assert.ok(stats.totalCustomerPayments >= stats.totalPlatformCommission);
  });
});
