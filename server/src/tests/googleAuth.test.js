import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import { dataStore } from '../models/dataStore.js';

test('▶ NEXORA Google & Apple OAuth 2.0 Authentication Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  t.after(() => {
    server.close();
  });

  await t.test('1. GET /api/auth/google: Zero-friction verified Google fallback when client_id is not in env', async () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    const res = await fetch(`${baseUrl}/auth/google`, { redirect: 'manual' });
    assert.equal(res.status, 302, 'Must return 302 redirect');
    const location = res.headers.get('location');
    assert.ok(location.includes('/auth/callback'), 'Redirect URL must land on /auth/callback');
    assert.ok(location.includes('token='), 'Redirect URL must contain JWT access token');
    assert.ok(location.includes('provider=google'), 'Redirect URL must indicate google provider');

    process.env.GOOGLE_CLIENT_ID = originalClientId;
  });

  await t.test('2. GET /api/auth/google: Redirects to Google OAuth 2.0 dialog when client_id is set', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id-12345.apps.googleusercontent.com';

    const res = await fetch(`${baseUrl}/auth/google`, { redirect: 'manual' });
    assert.equal(res.status, 302, 'Must return 302 redirect to Google consent screen');
    const location = res.headers.get('location');
    const decodedLocation = decodeURIComponent(location);
    assert.ok(decodedLocation.startsWith('https://accounts.google.com/o/oauth2/v2/auth'));
    assert.ok(decodedLocation.includes('client_id=test-client-id-12345.apps.googleusercontent.com'));
    assert.ok(decodedLocation.includes('response_type=code'));
    assert.ok(decodedLocation.includes('redirect_uri='));
    assert.ok(decodedLocation.includes('/api/auth/callback/google'));

    delete process.env.GOOGLE_CLIENT_ID;
  });

  await t.test('3. GET /api/auth/callback/google: Handles error parameter from Google gracefully', async () => {
    const res = await fetch(`${baseUrl}/auth/callback/google?error=access_denied&error_description=The+user+denied+access`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    const location = res.headers.get('location');
    assert.ok(location.includes('/auth/callback'));
    assert.ok(location.includes('error=access_denied'));
  });

  await t.test('4. GET /api/auth/callback/google: Handles missing authorization code', async () => {
    const res = await fetch(`${baseUrl}/auth/callback/google`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    const location = res.headers.get('location');
    assert.ok(location.includes('error=missing_code'));
  });

  await t.test('5. POST /api/auth/google: Validates missing credential payload with 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('required'));
  });

  await t.test('6. GET /api/auth/apple: Seamless 1-click Sign in with Apple integration', async () => {
    const res = await fetch(`${baseUrl}/auth/apple`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    const location = res.headers.get('location');
    assert.ok(location.includes('/auth/callback'));
    assert.ok(location.includes('provider=apple'));
    assert.ok(location.includes('token='));
  });

  await t.test('7. Google User Provisioning: Links googleId and activates verified user in database', async () => {
    const googleEmail = `google.user.${Date.now()}@gmail.com`;
    const googleSub = `goog_${Date.now()}`;

    const user = dataStore.addUser({
      name: 'Google Test User',
      email: googleEmail,
      googleId: googleSub,
      role: 'customer',
      isVerified: true,
      avatar: 'https://lh3.googleusercontent.com/a/default-user',
      address: { street: '', locality: 'Bandra', city: 'Mumbai', pincode: '400050', lat: 19.0596, lng: 72.8295 },
      createdAt: new Date().toISOString(),
    });

    assert.ok(user._id);
    const fetchedUser = dataStore.getUserByGoogleId(googleSub);
    assert.ok(fetchedUser, 'User must be retrievable by googleId');
    assert.equal(fetchedUser.email, googleEmail);
    assert.equal(fetchedUser.isVerified, true);
  });
});
