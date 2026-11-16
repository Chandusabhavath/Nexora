import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import http from 'http';

test('NEXORA Complete E2E Integration Suite', async (t) => {
  // Spin up an ephemeral HTTP server on random free port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  let customerToken = '';
  let customerId = '';
  let providerToken = '';
  let providerProfileId = '';
  let createdServiceId = '';
  let createdBookingId = '';
  let adminToken = '';

  t.after(() => {
    server.close();
  });

  await t.test('1. Health check returns 200 and online status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'online');
    assert.equal(data.service, 'NEXORA Hyperlocal Platform API');
  });

  await t.test('2. Customer registration works & issues JWT token', async () => {
    const email = `testcustomer_${Date.now()}@example.com`;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Sharma',
        email,
        password: 'Password123!',
        phone: '+919820099887',
        role: 'customer',
        locality: 'Bandra West',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'customer');
    customerToken = data.token;
    customerId = data.user.id;
  });

  await t.test('3. Authenticated customer can retrieve profile (/api/auth/me)', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.id, customerId);
  });

  await t.test('4. Provider registration initializes draft ProviderProfile', async () => {
    const email = `testprovider_${Date.now()}@example.com`;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deepak Electrician',
        email,
        password: 'Password123!',
        phone: '+919811223344',
        role: 'provider',
        category: 'Electrical',
        hourlyRate: 400,
        locality: 'Khar West',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'provider');
    providerToken = data.token;
    providerProfileId = data.user.providerProfileId;
  });

  await t.test('5. Provider can submit verification documents', async () => {
    const res = await fetch(`${baseUrl}/providers/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        docType: 'Trade License',
        docNumber: 'LIC-MH-2026-8812',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.profile.verificationStatus, 'pending');
  });

  await t.test('6. Provider publishes a service to marketplace', async () => {
    const res = await fetch(`${baseUrl}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        title: 'Tripping Circuit & Fuse Replacement',
        category: 'Electrical',
        description: 'Rapid diagnostic and replacement of blown fuses and tripping MCBs.',
        price: 400,
        priceType: 'hourly',
        durationMinutes: 60,
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.service._id);
    createdServiceId = data.service._id;
  });

  await t.test('7. Customer searches and finds the newly created service', async () => {
    const res = await fetch(`${baseUrl}/services?category=Electrical`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const found = data.services.some((s) => s._id === createdServiceId);
    assert.ok(found, 'Created service should be discoverable via search');
  });

  await t.test('8. Customer creates a booking with price snapshot', async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        providerId: providerProfileId,
        serviceId: createdServiceId,
        taskDescription: 'Living room light circuits tripping whenever the microwave starts.',
        scheduledDate: '2026-11-20',
        scheduledTime: '11:00',
        durationHours: 2,
        paymentMethod: 'upi',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.booking.status, 'pending');
    assert.equal(data.booking.agreedPriceSnapshot.subtotal, 800); // 400 * 2
    assert.equal(data.booking.agreedPriceSnapshot.platformFee, 80); // 10%
    assert.equal(data.booking.agreedPriceSnapshot.totalAmount, 880);
    createdBookingId = data.booking._id;
  });

  await t.test('9. Conflicting booking request on same slot is rejected with 409', async () => {
    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        providerId: providerProfileId,
        serviceId: createdServiceId,
        taskDescription: 'Conflicting job on same provider and date/time',
        scheduledDate: '2026-11-20',
        scheduledTime: '11:00',
        durationHours: 1,
      }),
    });

    assert.equal(res.status, 409, 'Double booking request should be rejected');
  });

  await t.test('10. Provider accepts booking and transitions through lifecycle to completed', async () => {
    // 10.1 Accept
    const acceptRes = await fetch(`${baseUrl}/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({ status: 'accepted' }),
    });
    assert.equal(acceptRes.status, 200);

    // 10.2 In Progress
    const inProgRes = await fetch(`${baseUrl}/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    assert.equal(inProgRes.status, 200);

    // 10.3 Completed
    const compRes = await fetch(`${baseUrl}/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(compRes.status, 200);
    const compData = await compRes.json();
    assert.equal(compData.booking.status, 'completed');
  });

  await t.test('11. Provider reports UPI payment & Customer confirms receipt', async () => {
    // Provider reports
    const reportRes = await fetch(`${baseUrl}/bookings/${createdBookingId}/report-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        amount: 880,
        paymentMethod: 'upi',
        upiTransactionId: 'UPI-TEST-9921',
      }),
    });
    assert.equal(reportRes.status, 200);

    // Customer confirms
    const confirmRes = await fetch(`${baseUrl}/bookings/${createdBookingId}/confirm-payment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    assert.equal(confirmRes.status, 200);
    const confirmData = await confirmRes.json();
    assert.equal(confirmData.booking.paymentStatus, 'customer_confirmed');
  });

  await t.test('12. Customer leaves verified review on completed booking', async () => {
    const res = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId: createdBookingId,
        rating: 5,
        comment: 'Deepak fixed the loose connection rapidly with proper insulation. Very satisfied!',
        punctuality: 5,
        quality: 5,
        politeness: 5,
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.review.rating, 5);
  });

  await t.test('13. Ordinary customer is forbidden from admin endpoints (403)', async () => {
    const res = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(res.status, 403);
  });

  await t.test('14. Admin authentication and verification review', async () => {
    // Login as pre-seeded admin
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nexora.com',
        password: 'NexoraAdmin2026!',
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    adminToken = loginData.token;

    // Approve the pending provider verification
    const reviewRes = await fetch(`${baseUrl}/admin/verifications/${providerProfileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'approve' }),
    });
    assert.equal(reviewRes.status, 200);

    // Fetch Admin Stats
    const statsRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(statsRes.status, 200);
    const statsData = await statsRes.json();
    assert.ok(statsData.stats.totalUsers >= 2);
    assert.ok(statsData.stats.totalPlatformCommission > 0);
  });

  await t.test('15. AI Matching: Natural language query returns ranked results', async () => {
    const res = await fetch(`${baseUrl}/ai/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'I need an electrician tomorrow morning for 2 hours in Bandra',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.data.parsedIntent.detectedCategory, 'Electrical');
    assert.ok(data.data.matches.length > 0);
    assert.ok(data.data.matches[0].matchReasons.length > 0);
  });
});
