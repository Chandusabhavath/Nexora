import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { generateSecret, generateSync } from 'otplib';
import app from '../app.js';
import { dataStore } from '../models/dataStore.js';
import {
  encryptSecret,
  decryptSecret,
  generate2FASecret,
  generateTOTPCode,
  verifyTOTPCode,
  generateRecoveryCodes,
  verifyRecoveryCode,
} from '../services/twoFactorService.js';

test('▶ NEXORA Google Authenticator (TOTP Two-Factor Authentication) Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  t.after(() => {
    server.close();
  });

  // --------------------------------------------------------------------------
  // Unit Tests: Crypto, TOTP, QR Provisioning, Recovery Codes
  // --------------------------------------------------------------------------

  await t.test('1. Secret Generation & Google Authenticator Provisioning URI', async () => {
    const testEmail = 'totp.tester@nexora.in';
    const result = await generate2FASecret(testEmail);

    assert.ok(result.secret, 'Must generate a Base32 secret');
    assert.equal(typeof result.secret, 'string');
    assert.ok(/^[A-Z2-7]{16,32}$/.test(result.secret), 'Secret must be valid RFC 3548 Base32');

    assert.ok(result.otpauthUrl, 'Must produce otpauth URL');
    assert.ok(result.otpauthUrl.startsWith('otpauth://totp/NEXORA:'), 'Must follow otpauth standard');
    assert.ok(result.otpauthUrl.includes(`secret=${result.secret}`), 'Must embed secret in URL');
    assert.ok(result.otpauthUrl.includes('issuer=NEXORA'), 'Must embed NEXORA issuer in URL');

    assert.ok(result.qrCodeDataUrl, 'Must generate QR Code Data URL');
    assert.ok(result.qrCodeDataUrl.startsWith('data:image/png;base64,'), 'QR code must be a valid PNG Data URL');
  });

  await t.test('2. AES-256-GCM Secret Encryption & Decryption', async () => {
    const plainSecret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(plainSecret);

    assert.ok(encrypted, 'Must produce encrypted payload');
    assert.notEqual(encrypted, plainSecret, 'Encrypted secret must not match plain secret');

    const parts = encrypted.split(':');
    assert.equal(parts.length, 3, 'Payload must contain iv, authTag, and ciphertext separated by colons');

    const decrypted = decryptSecret(encrypted);
    assert.equal(decrypted, plainSecret, 'Decrypted secret must match original Base32 secret');

    // Tampered payload verification
    const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}aa`;
    assert.throws(
      () => decryptSecret(tamperedPayload),
      /Unsupported state or unable to authenticate data/,
      'Tampered encrypted secret must fail GCM authentication check'
    );
  });

  await t.test('3. TOTP Six-Digit Code Verification', async () => {
    const plainSecret = generateSecret();
    const encryptedSecret = encryptSecret(plainSecret);

    // Generate live valid 6-digit TOTP code
    const validCode = generateTOTPCode(plainSecret);
    assert.equal(validCode.length, 6, 'Generated code must be 6 digits');

    // Verification succeeds with valid code
    const isValid = verifyTOTPCode(validCode, encryptedSecret);
    assert.equal(isValid, true, 'Valid 6-digit TOTP code must verify successfully');

    // Rejects incorrect codes
    assert.equal(verifyTOTPCode('000000', encryptedSecret), false, 'Incorrect 6-digit code must be rejected');
    assert.equal(verifyTOTPCode('12345', encryptedSecret), false, 'Short code must be rejected');
    assert.equal(verifyTOTPCode('abcdef', encryptedSecret), false, 'Non-numeric code must be rejected');
    assert.equal(verifyTOTPCode('', encryptedSecret), false, 'Empty code must be rejected');
  });

  await t.test('4. Anti-Replay Protection: Prevent code reuse within same window', async () => {
    const plainSecret = generateSecret();
    const encryptedSecret = encryptSecret(plainSecret);
    const validCode = generateTOTPCode(plainSecret);

    // First attempt with no lastUsedToken -> valid
    const firstCheck = verifyTOTPCode(validCode, encryptedSecret, null);
    assert.equal(firstCheck, true, 'First attempt must pass');

    // Second attempt with lastUsedToken matching validCode -> rejected
    const replayCheck = verifyTOTPCode(validCode, encryptedSecret, validCode);
    assert.equal(replayCheck, false, 'Replaying the same token must be rejected');
  });

  await t.test('5. Clock Drift Tolerance (+/- 30s step window)', async () => {
    const plainSecret = generateSecret();
    const encryptedSecret = encryptSecret(plainSecret);

    // Past 30-second epoch
    const pastEpoch = Math.floor(Date.now() / 1000) - 30;
    const pastCode = generateTOTPCode(plainSecret, pastEpoch);

    // Future 30-second epoch
    const futureEpoch = Math.floor(Date.now() / 1000) + 30;
    const futureCode = generateTOTPCode(plainSecret, futureEpoch);

    // Far past 90-second epoch
    const farPastEpoch = Math.floor(Date.now() / 1000) - 90;
    const farPastCode = generateTOTPCode(plainSecret, farPastEpoch);

    assert.equal(verifyTOTPCode(pastCode, encryptedSecret), true, 'Past step code must be accepted');
    assert.equal(verifyTOTPCode(futureCode, encryptedSecret), true, 'Future step code must be accepted');
    assert.equal(verifyTOTPCode(farPastCode, encryptedSecret), false, 'Far expired code must be rejected');
  });

  await t.test('6. Backup Recovery Codes Generation & Single-Use Verification', async () => {
    const { plainCodes, hashedCodes } = generateRecoveryCodes();

    assert.equal(plainCodes.length, 8, 'Must generate exactly 8 recovery codes');
    assert.equal(hashedCodes.length, 8, 'Must generate exactly 8 hashed recovery codes');

    for (const code of plainCodes) {
      assert.ok(/^[0-9a-f]{4}-[0-9a-f]{4}$/.test(code), 'Format must be xxxx-xxxx');
    }

    // Verify first code
    const firstCode = plainCodes[0];
    const matchIndex = verifyRecoveryCode(firstCode, hashedCodes);
    assert.equal(matchIndex, 0, 'First recovery code must match index 0');

    // Mark as used
    hashedCodes[0].used = true;
    const retestIndex = verifyRecoveryCode(firstCode, hashedCodes);
    assert.equal(retestIndex, -1, 'Used recovery code must return -1 (cannot be reused)');

    // Invalid code
    assert.equal(verifyRecoveryCode('invalid-code', hashedCodes), -1, 'Bogus code returns -1');
  });

  // --------------------------------------------------------------------------
  // Integration Tests: Full HTTP Login and 2FA Challenge Flow
  // --------------------------------------------------------------------------

  await t.test('7. End-to-End 2FA Setup, 2FA-Enforced Login, and Session Completion', async () => {
    const userEmail = 'twofactor.customer@nexora.in';
    const userPassword = 'Password@123';

    // 7.1 Register fresh customer
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Two Factor Customer',
        email: userEmail,
        password: userPassword,
        role: 'customer',
        phone: '9888877771',
      }),
    });
    const regData = await regRes.json();
    assert.equal(regRes.status, 201, 'Customer registered');
    const userAuthToken = regData.token;

    // 7.2 Initiate 2FA Setup
    const setupRes = await fetch(`${baseUrl}/auth/2fa/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAuthToken}`,
      },
    });
    const setupData = await setupRes.json();
    assert.equal(setupRes.status, 200, '2FA setup initiated');
    assert.ok(setupData.qrCode, 'Must return QR code Data URL');
    assert.ok(setupData.manualKey, 'Must return manual key');

    // Extract secret from temporary secret stored in dataStore
    const userInStore = dataStore.getUserByEmail(userEmail);
    assert.ok(userInStore.twoFactorTempSecret, 'Temp secret must be stored');
    const plainSecret = decryptSecret(userInStore.twoFactorTempSecret);

    // 7.3 Attempt verification with INVALID code (must reject)
    const badVerifyRes = await fetch(`${baseUrl}/auth/2fa/verify-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAuthToken}`,
      },
      body: JSON.stringify({ code: '999999' }),
    });
    const badVerifyData = await badVerifyRes.json();
    assert.equal(badVerifyRes.status, 400, 'Invalid code rejected on setup');
    assert.equal(badVerifyData.success, false);

    // 7.4 Verify setup with VALID 6-digit TOTP code
    const validSetupCode = generateTOTPCode(plainSecret);
    const goodVerifyRes = await fetch(`${baseUrl}/auth/2fa/verify-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAuthToken}`,
      },
      body: JSON.stringify({ code: validSetupCode }),
    });
    const goodVerifyData = await goodVerifyRes.json();
    assert.equal(goodVerifyRes.status, 200, '2FA setup completed');
    assert.equal(goodVerifyData.twoFactorEnabled, true);
    assert.equal(goodVerifyData.recoveryCodes.length, 8, '8 recovery codes issued');
    const customerRecoveryCodes = goodVerifyData.recoveryCodes;

    // Check user state in store
    const updatedUser = dataStore.getUserByEmail(userEmail);
    assert.equal(updatedUser.twoFactorEnabled, true, 'User marked twoFactorEnabled');
    assert.ok(updatedUser.twoFactorSecret, 'User has permanent encrypted twoFactorSecret');
    assert.equal(updatedUser.twoFactorTempSecret, null, 'Temp secret cleared');

    // 7.5 Attempt Login: Must NOT return full JWT, must return 2FA Challenge Token
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200, 'Login credentials accepted');
    assert.equal(loginData.twoFactorRequired, true, 'Must require 2FA challenge');
    assert.ok(loginData.twoFactorToken, 'Must provide twoFactorToken');
    assert.equal(loginData.token, undefined, 'Must NOT issue regular auth token yet');

    const challengeToken = loginData.twoFactorToken;

    // 7.6 Verify 2FA Login with INVALID code
    const badLoginVerify = await fetch(`${baseUrl}/auth/2fa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twoFactorToken: challengeToken, code: '000000' }),
    });
    const badLoginData = await badLoginVerify.json();
    assert.equal(badLoginVerify.status, 400, 'Invalid code fails 2FA login');
    assert.equal(badLoginData.success, false);

    // 7.7 Verify 2FA Login with VALID code
    const activeSecret = decryptSecret(updatedUser.twoFactorSecret);
    const validLoginCode = generateTOTPCode(activeSecret);

    const goodLoginVerify = await fetch(`${baseUrl}/auth/2fa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twoFactorToken: challengeToken, code: validLoginCode }),
    });
    const goodLoginData = await goodLoginVerify.json();
    assert.equal(goodLoginVerify.status, 200, '2FA login succeeded');
    assert.equal(goodLoginData.success, true);
    assert.ok(goodLoginData.token, 'Fully authenticated JWT session token issued');
    assert.equal(goodLoginData.user.email, userEmail);

    // 7.8 Verify Anti-Replay: Attempt reusing the same validLoginCode on another challenge
    const loginRes2 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const loginData2 = await loginRes2.json();
    const replayVerify = await fetch(`${baseUrl}/auth/2fa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twoFactorToken: loginData2.twoFactorToken, code: validLoginCode }),
    });
    assert.equal(replayVerify.status, 400, 'Replayed code rejected');

    // 7.9 Login with Backup Recovery Code
    const recoveryLoginVerify = await fetch(`${baseUrl}/auth/2fa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        twoFactorToken: loginData2.twoFactorToken,
        code: customerRecoveryCodes[0],
        isRecoveryCode: true,
      }),
    });
    const recoveryLoginData = await recoveryLoginVerify.json();
    assert.equal(recoveryLoginVerify.status, 200, 'Backup recovery code login succeeded');
    assert.ok(recoveryLoginData.token, 'JWT session token issued via recovery code');

    // Attempt reusing same recovery code -> should fail
    const loginRes3 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const loginData3 = await loginRes3.json();
    const reuseRecoveryVerify = await fetch(`${baseUrl}/auth/2fa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        twoFactorToken: loginData3.twoFactorToken,
        code: customerRecoveryCodes[0],
        isRecoveryCode: true,
      }),
    });
    assert.equal(reuseRecoveryVerify.status, 400, 'Already used recovery code rejected');

    // 7.10 Disable 2FA
    const disableRes = await fetch(`${baseUrl}/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${goodLoginData.token}`,
      },
      body: JSON.stringify({ password: userPassword }),
    });
    const disableData = await disableRes.json();
    assert.equal(disableRes.status, 200, '2FA disabled');
    assert.equal(disableData.twoFactorEnabled, false);

    // Verify login now proceeds directly without 2FA
    const directLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const directLoginData = await directLoginRes.json();
    assert.equal(directLoginRes.status, 200);
    assert.equal(directLoginData.twoFactorRequired, undefined, 'No 2FA required');
    assert.ok(directLoginData.token, 'Direct JWT token issued');
  });

  await t.test('8. Role Verification: Admin, Service Provider, and Customer with 2FA', async () => {
    const testAccounts = [
      { role: 'admin', email: 'admin@nexora.com', password: 'NexoraAdmin2026!' },
      { role: 'provider', email: 'rajesh.electric@example.com', password: 'ProviderPass123!' },
      { role: 'customer', email: 'aarav@example.com', password: 'CustomerPass123!' },
    ];

    for (const acc of testAccounts) {
      // 1. Initial Login
      const initialLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const initialData = await initialLogin.json();
      assert.equal(initialLogin.status, 200, `${acc.role} initial login successful`);
      assert.ok(initialData.token, `${acc.role} has initial auth token`);

      // 2. Setup 2FA
      const setup = await fetch(`${baseUrl}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initialData.token}`,
        },
      });
      assert.equal(setup.status, 200, `${acc.role} 2FA setup initiated`);

      const user = dataStore.getUserByEmail(acc.email);
      const secret = decryptSecret(user.twoFactorTempSecret);
      const code = generateTOTPCode(secret);

      // 3. Verify setup
      const verifySetup = await fetch(`${baseUrl}/auth/2fa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initialData.token}`,
        },
        body: JSON.stringify({ code }),
      });
      assert.equal(verifySetup.status, 200, `${acc.role} 2FA setup confirmed`);

      // 4. Login with 2FA active -> challenge token
      const login = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const loginData = await login.json();
      assert.equal(loginData.twoFactorRequired, true, `${acc.role} requires 2FA`);
      assert.ok(loginData.twoFactorToken, `${acc.role} receives 2FA challenge token`);

      // 5. Complete login via 2FA
      const activeCode = generateTOTPCode(secret);
      const verifyLogin = await fetch(`${baseUrl}/auth/2fa/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twoFactorToken: loginData.twoFactorToken,
          code: activeCode,
        }),
      });
      const verifyLoginData = await verifyLogin.json();
      assert.equal(verifyLogin.status, 200, `${acc.role} 2FA login verified`);
      assert.equal(verifyLoginData.user.role, acc.role, `${acc.role} authenticated with proper role`);
    }
  });
});
