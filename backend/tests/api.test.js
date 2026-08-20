import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';

const BASE_URL = 'http://localhost:5000/api';

test('Backend Integration Tests Suite', async (t) => {
  // Wait a moment for server to listen
  await new Promise((r) => setTimeout(r, 500));

  let createdSecretId = '';
  let managementToken = '';

  await t.test('1. Create Secret endpoint returns secretId and managementToken', async () => {
    const res = await fetch(`${BASE_URL}/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: 'ENCRYPTED_BASE64_CIPHERTEXT_SAMPLE_123',
        iv: 'ENCRYPTED_IV_BASE64',
        salt: 'SALT_BASE64',
        ttlSeconds: 3600,
        burnAfterReads: 2,
        hasPassword: true,
        hasDuress: true,
        duressPin: '9999',
        enableComments: true,
        format: 'code',
        syntaxLanguage: 'typescript',
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.secretId, 'secretId should be returned');
    assert.ok(data.managementToken, 'managementToken should be returned');
    assert.strictEqual(data.burnAfterReads, 2);

    createdSecretId = data.secretId;
    managementToken = data.managementToken;
  });

  await t.test('2. Get Secret Meta endpoint returns metadata without burning view', async () => {
    const res = await fetch(`${BASE_URL}/secrets/${createdSecretId}/meta`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.hasPassword, true);
    assert.strictEqual(data.hasDuress, true);
    assert.strictEqual(data.burnAfterReads, 2);
    assert.strictEqual(data.readCount, 0);
  });

  await t.test('3. Post and Get Encrypted Comments', async () => {
    const postRes = await fetch(`${BASE_URL}/secrets/${createdSecretId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: 'ENCRYPTED_COMMENT_CIPHERTEXT',
        iv: 'COMMENT_IV_BASE64',
        nicknameCiphertext: 'ANON_USER_CIPHERTEXT',
      }),
    });

    assert.strictEqual(postRes.status, 201);
    const postData = await postRes.json();
    assert.ok(postData.commentId);

    const getRes = await fetch(`${BASE_URL}/secrets/${createdSecretId}/comments`);
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(Array.isArray(getData.comments));
    assert.strictEqual(getData.comments.length, 1);
  });

  await t.test('4. Fetch Secret (First Read - readCount: 1)', async () => {
    const res = await fetch(`${BASE_URL}/secrets/${createdSecretId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ciphertext, 'ENCRYPTED_BASE64_CIPHERTEXT_SAMPLE_123');
    assert.strictEqual(data.readCount, 1);
    assert.strictEqual(data.isBurned, false);
  });

  await t.test('5. Fetch Secret (Second Read - Burns after 2 reads)', async () => {
    const res = await fetch(`${BASE_URL}/secrets/${createdSecretId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.readCount, 2);
    assert.strictEqual(data.isBurned, true);
  });

  await t.test('6. Third Read is rejected with 410 Gone (Burned)', async () => {
    const res = await fetch(`${BASE_URL}/secrets/${createdSecretId}`);
    assert.strictEqual(res.status, 410);
    const data = await res.json();
    assert.strictEqual(data.isBurned, true);
  });

  await t.test('7. Duress PIN permanently obliterates secret from DB', async () => {
    // Create new secret with duress
    const createRes = await fetch(`${BASE_URL}/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: 'TOP_SECRET_CIPHERTEXT',
        iv: 'IV_BASE64',
        ttlSeconds: 3600,
        hasDuress: true,
        duressPin: '0000',
      }),
    });
    const { secretId } = await createRes.json();

    // Trigger duress
    const duressRes = await fetch(`${BASE_URL}/secrets/${secretId}/verify-duress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duressPin: '0000' }),
    });

    assert.strictEqual(duressRes.status, 400);
    const duressData = await duressRes.json();
    assert.strictEqual(duressData.duressTriggered, true);

    // Verify secret no longer exists at all
    const checkRes = await fetch(`${BASE_URL}/secrets/${secretId}`);
    assert.strictEqual(checkRes.status, 404);
  });

  await t.test('8. Sender Management Telemetry and Remote Revocation', async () => {
    // Create new secret
    const createRes = await fetch(`${BASE_URL}/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: 'REVOKABLE_CIPHERTEXT',
        iv: 'IV_BASE64',
        ttlSeconds: 3600,
        burnAfterReads: 5,
      }),
    });
    const { secretId, managementToken: mToken } = await createRes.json();

    // Check telemetry
    const telemRes = await fetch(`${BASE_URL}/secrets/${secretId}/management`, {
      headers: { 'X-Management-Token': mToken },
    });
    assert.strictEqual(telemRes.status, 200);
    const telemData = await telemRes.json();
    assert.strictEqual(telemData.status, 'ACTIVE');

    // Revoke
    const revokeRes = await fetch(`${BASE_URL}/secrets/${secretId}`, {
      method: 'DELETE',
      headers: { 'X-Management-Token': mToken },
    });
    assert.strictEqual(revokeRes.status, 200);

    // Verify 404 after revocation
    const verifyRes = await fetch(`${BASE_URL}/secrets/${secretId}`);
    assert.strictEqual(verifyRes.status, 404);
  });

  // Cleanup DB connections
  await mongoose.connection.close();
  process.exit(0);
});
