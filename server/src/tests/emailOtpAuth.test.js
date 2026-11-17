import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import { dataStore } from '../models/dataStore.js';
import { generateSecureOTP, hashOTP, verifyCodeHash } from '../controllers/authController.js';

test('▶ NEXORA Email-Based OTP Authentication Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  t.after(() => {
    server.close();
  });

  const testEmail = `test.user.${Date.now()}@example.com`;
  let activeCode = null;
  let issuedToken = null;

  await t.test('1. Cryptographic Security: 6-digit generation and SHA-256 HMAC hashing', () => {
    const code = generateSecureOTP();
    assert.match(code, /^\d{6}$/, 'Code must be exactly 6 digits');
    
    const hash1 = hashOTP(code);
    const hash2 = hashOTP(code);
    assert.equal(hash1, hash2, 'Hash must be deterministic for identical code');
    assert.notEqual(code, hash1, 'Hash must not equal raw code');
    assert.equal(verifyCodeHash(code, hash1), true, 'Timing-safe verify must accept valid code');
    assert.equal(verifyCodeHash('000000', hash1), false, 'Timing-safe verify must reject invalid code');
  });

  await t.test('2. POST /api/auth/request-otp: Validation for missing or invalid email', async () => {
    const res1 = await fetch(`${baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.equal(data1.success, false);

    const res2 = await fetch(`${baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.equal(data2.success, false);
  });

  await t.test('3. POST /api/auth/request-otp: Generates OTP, hashes it, and stores with 5-min expiry', async () => {
    const res = await fetch(`${baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.message.includes(testEmail));
    assert.equal(data.expiresInSeconds, 300);

    // Retrieve active OTP record from dataStore
    const otpRecord = dataStore.getActiveOtpByEmail(testEmail);
    assert.ok(otpRecord, 'Active OTP record must exist in database');
    assert.equal(otpRecord.email, testEmail);
    assert.equal(otpRecord.attempts, 0);
    assert.equal(otpRecord.consumed, false);
    assert.ok(new Date(otpRecord.expiresAt) > new Date(), 'Expires in the future');

    // Extract plain code for testing
    activeCode = otpRecord.plainCode;
    assert.ok(activeCode, 'Plain code available in test store');
    assert.equal(verifyCodeHash(activeCode, otpRecord.codeHash), true, 'Code hash matches generated code');
  });

  await t.test('4. Rate Limiter: Blocks subsequent OTP requests within 60-second cooldown with 429', async () => {
    const res = await fetch(`${baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });

    assert.equal(res.status, 429, 'Must return HTTP 429 Too Many Requests');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Please wait'));
    assert.ok(data.retryAfter > 0);
  });

  await t.test('5. POST /api/auth/verify-otp: Rejects malformed or incorrect codes & counts attempts', async () => {
    // Malformed input
    const res1 = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '12' }),
    });
    assert.equal(res1.status, 400);

    // Incorrect code attempt 1
    const res2 = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' }),
    });
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.equal(data2.remainingAttempts, 2);

    // Incorrect code attempt 2
    const res3 = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000001' }),
    });
    assert.equal(res3.status, 400);
    const data3 = await res3.json();
    assert.equal(data3.remainingAttempts, 1);
  });

  await t.test('6. Attempt Lockout: 3rd failed attempt invalidates OTP and locks further tries', async () => {
    // Incorrect code attempt 3
    const res = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000002' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.remainingAttempts, 0);

    // Subsequent attempt is rejected because code was invalidated
    const resLocked = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: activeCode }),
    });
    assert.equal(resLocked.status, 400);
    const lockedData = await resLocked.json();
    assert.ok(lockedData.message.includes('Invalid or expired'));
  });

  await t.test('7. Expiration Enforcement: Expired OTP is rejected', async () => {
    const expiredEmail = `expired.${Date.now()}@example.com`;
    // Create an expired OTP directly in dataStore
    dataStore.addOtp({
      email: expiredEmail,
      codeHash: hashOTP('999999'),
      expiresAt: new Date(Date.now() - 10000).toISOString(), // 10 seconds ago
      plainCode: '999999',
    });

    const res = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: expiredEmail, otp: '999999' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('expired') || data.message.includes('Invalid'));
  });

  await t.test('8. Successful Verification: Marks user verified, consumes OTP, and issues JWT session', async () => {
    const validEmail = `verified.customer.${Date.now()}@example.com`;
    
    // Request new OTP
    const reqRes = await fetch(`${baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validEmail }),
    });
    assert.equal(reqRes.status, 200);

    const otpRecord = dataStore.getActiveOtpByEmail(validEmail);
    const validCode = otpRecord.plainCode;

    // Submit correct code
    const verifyRes = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validEmail, otp: validCode }),
    });

    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.ok(verifyData.token, 'Must return JWT token');
    assert.equal(verifyData.user.email, validEmail);
    assert.equal(verifyData.user.isVerified, true, 'User must be marked verified');

    issuedToken = verifyData.token;

    // Verify OTP is consumed and cannot be replayed
    const replayRes = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validEmail, otp: validCode }),
    });
    assert.equal(replayRes.status, 400, 'Replay attempt must be rejected');
  });

  await t.test('9. Session Issuance: Authenticates with issued JWT token against /api/auth/me', async () => {
    assert.ok(issuedToken, 'Token must exist from previous step');

    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${issuedToken}`,
      },
    });

    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.success, true);
    assert.ok(meData.user);
    assert.equal(meData.user.role, 'customer');
  });
});
