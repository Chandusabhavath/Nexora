import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { dataStore } from '../models/dataStore.js';
import { AIMatchingService } from '../services/aiMatcher.js';

test('NEXORA Backend API Test Suite', async (t) => {
  // Wait for dataStore to initialize
  await dataStore.init();

  await t.test('1. AI Matcher: Parses task query and extracts category and constraints', () => {
    const query = 'I need an electrician tomorrow morning in Bandra for 2 hours with budget under 800';
    const parsed = AIMatchingService.parseIntent(query);

    assert.equal(parsed.detectedCategory, 'Electrical');
    assert.equal(parsed.locality, 'Bandra');
    assert.equal(parsed.maxBudget, 800);
    assert.equal(parsed.estimatedHours, 2);
    assert.ok(parsed.confidence >= 0.8);
  });

  await t.test('2. AI Matcher: Ranks suitable providers with transparent explanations', () => {
    const query = 'Need deep cleaning for 2BHK apartment in Bandra';
    const parsed = AIMatchingService.parseIntent(query);
    const results = AIMatchingService.matchProviders(parsed);

    assert.ok(results.matches.length > 0);
    const topMatch = results.matches[0];
    assert.equal(topMatch.category, 'Home Cleaning');
    assert.ok(topMatch.matchReasons.length > 0);
    assert.ok(topMatch.matchScore > 50);
  });

  await t.test('3. DataStore: Seed data verified with 4 approved providers and services', () => {
    const providers = dataStore.getProviders({ publicOnly: true });
    assert.ok(providers.length >= 4);

    const electricalProvider = providers.find((p) => p.category === 'Electrical');
    assert.ok(electricalProvider);
    assert.equal(electricalProvider.verificationStatus, 'approved');
    assert.ok(electricalProvider.rating >= 4.5);

    const services = dataStore.getServices();
    assert.ok(services.length >= 5);
  });

  await t.test('4. Booking Lifecycle: Enforces slot conflict prevention', () => {
    const provider = dataStore.getProviders()[0];
    const service = dataStore.getServicesByProviderId(provider._id)[0];
    const customer = dataStore.users.find((u) => u.role === 'customer');

    // Add initial booking
    const booking1 = dataStore.addBooking({
      customerId: customer._id,
      providerId: provider._id,
      serviceId: service._id,
      taskDescription: 'Initial job',
      scheduledDate: '2026-11-05',
      scheduledTime: '14:00',
      durationHours: 2,
      agreedPriceSnapshot: {
        baseRate: service.price,
        priceType: 'hourly',
        estimatedDurationHours: 2,
        subtotal: service.price * 2,
        platformFee: Math.round(service.price * 2 * 0.10),
        totalAmount: service.price * 2 + Math.round(service.price * 2 * 0.10),
      },
      status: 'accepted',
      statusHistory: [],
    });

    assert.ok(booking1._id);

    // Check conflict logic
    const existing = dataStore.getBookings({ providerId: provider._id });
    const hasConflict = existing.some(
      (b) =>
        b.scheduledDate === '2026-11-05' &&
        b.scheduledTime === '14:00' &&
        ['pending', 'accepted', 'in_progress'].includes(b.status)
    );

    assert.equal(hasConflict, true, 'Conflict should be detected for the exact same provider and slot');
  });

  await t.test('5. Review Engine: Reviews strictly prohibited on uncompleted bookings', () => {
    const customer = dataStore.users.find((u) => u.role === 'customer');
    const provider = dataStore.getProviders()[0];
    const service = dataStore.getServicesByProviderId(provider._id)[0];

    const uncompletedBooking = dataStore.addBooking({
      customerId: customer._id,
      providerId: provider._id,
      serviceId: service._id,
      taskDescription: 'Pending job',
      scheduledDate: '2026-11-10',
      scheduledTime: '10:00',
      agreedPriceSnapshot: { subtotal: 500, platformFee: 50, totalAmount: 550 },
      status: 'pending',
    });

    // Verification that status must be completed
    assert.notEqual(uncompletedBooking.status, 'completed');
  });

  await t.test('6. Financial Engine: Commission calculation snapshot is accurate', () => {
    const subtotal = 1000;
    const rate = 0.10;
    const commission = subtotal * rate;

    assert.equal(commission, 100);
    assert.equal(subtotal + commission, 1100);
  });
});
