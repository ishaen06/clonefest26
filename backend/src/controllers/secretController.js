import crypto from 'crypto';
import Secret from '../models/Secret.js';

// Helper: Generate secure random alphanumeric ID
const generateId = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

// Helper: SHA-256 Hash
const sha256 = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

export const createSecret = async (req, res) => {
  try {
    const {
      ciphertext,
      iv,
      salt,
      iterations,
      hasPassword = false,
      hasDuress = false,
      duressPin,
      ttlSeconds = 86400,
      burnAfterReads = 1,
      ephemeralCountdownSeconds = 0,
      privacyLensDefault = false,
      format = 'plaintext',
      syntaxLanguage = 'plaintext',
    } = req.body;

    if (!ciphertext || !iv) {
      return res.status(400).json({ error: 'Ciphertext and IV are strictly required.' });
    }

    const secretId = generateId(12);
    const managementToken = crypto.randomBytes(24).toString('hex');
    const managementTokenHash = sha256(secretId + ':' + managementToken);

    let duressPinHash = null;
    if (hasDuress && duressPin) {
      duressPinHash = sha256(secretId + ':' + duressPin);
    }

    const safeTtlSeconds = Math.max(60, Number(ttlSeconds) || 86400);
    const expiresAt = new Date(Date.now() + safeTtlSeconds * 1000);

    const secret = new Secret({
      secretId,
      ciphertext,
      iv,
      salt: salt || null,
      iterations: Number(iterations) || 600000,
      hasPassword: Boolean(hasPassword),
      hasDuress: Boolean(hasDuress),
      duressPinHash,
      managementTokenHash,
      ttlSeconds: safeTtlSeconds,
      expiresAt,
      burnAfterReads: Number(burnAfterReads) || 0,
      ephemeralCountdownSeconds: Number(ephemeralCountdownSeconds) || 0,
      enableComments: Boolean(enableComments),
      privacyLensDefault: Boolean(privacyLensDefault),
      format,
      syntaxLanguage,
      singleDeviceLock: Boolean(singleDeviceLock),
    });

    await secret.save();

    return res.status(201).json({
      success: true,
      secretId,
      managementToken,
      expiresAt,
      burnAfterReads: secret.burnAfterReads,
      ephemeralCountdownSeconds: secret.ephemeralCountdownSeconds,
    });
  } catch (error) {
    console.error('Error creating secret:', error);
    return res.status(500).json({ error: 'Failed to securely store secret.' });
  }
};

export const getSecretMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const secret = await Secret.findOne({ secretId: id });

    if (!secret) {
      return res.status(404).json({ error: 'Secret not found or expired.' });
    }

    if (secret.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'This secret has expired.',
        isBurned: true,
        burnedAt: secret.burnedAt,
      });
    }

    return res.json({
      exists: true,
      secretId: secret.secretId,
      hasPassword: secret.hasPassword,
      hasDuress: secret.hasDuress,
      burnAfterReads: secret.burnAfterReads,
      readCount: secret.readCount,
      isBurned: secret.isBurned,
      ephemeralCountdownSeconds: secret.ephemeralCountdownSeconds,
      enableComments: secret.enableComments,
      privacyLensDefault: secret.privacyLensDefault,
      format: secret.format,
      syntaxLanguage: secret.syntaxLanguage,
      expiresAt: secret.expiresAt,
      createdAt: secret.createdAt,
    });
  } catch (error) {
    console.error('Error fetching secret meta:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getSecret = async (req, res) => {
  try {
    const { id } = req.params;
    const secret = await Secret.findOne({ secretId: id });

    if (!secret) {
      return res.status(404).json({ error: 'Secret not found or expired.' });
    }

    if (secret.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'This secret has expired.',
        isBurned: true,
        burnedAt: secret.burnedAt,
      });
    }

    // Check if secret was already burned by an earlier view
    if (secret.isBurned) {
      return res.status(410).json({
        error: 'This secret link was already consumed and permanently destroyed.',
        isBurned: true,
        burnedAt: secret.burnedAt,
      });
    }

    const currentReadCount = secret.readCount + 1;
    let shouldBurnNow = false;

    if (secret.burnAfterReads > 0 && currentReadCount >= secret.burnAfterReads) {
      shouldBurnNow = true;
    }

    secret.readCount = currentReadCount;
    if (shouldBurnNow) {
      secret.isBurned = true;
      secret.burnedAt = new Date();
    }
    await secret.save();

    return res.json({
      secretId: secret.secretId,
      ciphertext: secret.ciphertext,
      iv: secret.iv,
      salt: secret.salt,
      iterations: secret.iterations,
      hasPassword: secret.hasPassword,
      hasDuress: secret.hasDuress,
      burnAfterReads: secret.burnAfterReads,
      readCount: currentReadCount,
      isBurned: shouldBurnNow,
      ephemeralCountdownSeconds: secret.ephemeralCountdownSeconds,
      privacyLensDefault: secret.privacyLensDefault,
      format: secret.format,
      syntaxLanguage: secret.syntaxLanguage,
      expiresAt: secret.expiresAt,
      createdAt: secret.createdAt,
    });
  } catch (error) {
    console.error('Error retrieving secret:', error);
    return res.status(500).json({ error: 'Failed to retrieve secret.' });
  }
};

export const verifyDuress = async (req, res) => {
  try {
    const { id } = req.params;
    const { duressPin } = req.body;

    if (!duressPin) {
      return res.status(400).json({ error: 'PIN is required for verification.' });
    }

    const secret = await Secret.findOne({ secretId: id });
    if (!secret) {
      return res.status(404).json({ error: 'Secret not found.' });
    }

    if (!secret.hasDuress || !secret.duressPinHash) {
      return res.json({ duressTriggered: false });
    }

    const inputHash = sha256(id + ':' + duressPin);
    if (inputHash === secret.duressPinHash) {
      // DURESS TRIGGERED: Obliterate secret and all comments from database immediately
      await Secret.deleteOne({ secretId: id });
      await Comment.deleteMany({ secretId: id });

      console.warn(`[SECURITY ALERT] Duress Canary PIN triggered for Secret ${id}. Record permanently purged.`);

      return res.status(400).json({
        duressTriggered: true,
        error: 'Decryption failed: Invalid passphrase or corrupted payload.',
      });
    }

    return res.json({ duressTriggered: false });
  } catch (error) {
    console.error('Error in duress verification:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getManagementTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers['x-management-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Management token required.' });
    }

    const secret = await Secret.findOne({ secretId: id });
    if (!secret) {
      return res.status(404).json({
        error: 'Secret does not exist in the database (may have been permanently destroyed or expired).',
        isDestroyed: true,
      });
    }

    const tokenHash = sha256(id + ':' + token);
    if (tokenHash !== secret.managementTokenHash) {
      return res.status(403).json({ error: 'Invalid management token.' });
    }

    return res.json({
      secretId: secret.secretId,
      status: secret.isBurned ? 'BURNED' : secret.expiresAt < new Date() ? 'EXPIRED' : 'ACTIVE',
      readCount: secret.readCount,
      burnAfterReads: secret.burnAfterReads,
      isBurned: secret.isBurned,
      burnedAt: secret.burnedAt,
      createdAt: secret.createdAt,
      expiresAt: secret.expiresAt,
      hasPassword: secret.hasPassword,
      hasDuress: secret.hasDuress,
      format: secret.format,
      enableComments: secret.enableComments,
      ephemeralCountdownSeconds: secret.ephemeralCountdownSeconds,
    });
  } catch (error) {
    console.error('Error retrieving management telemetry:', error);
    return res.status(500).json({ error: 'Failed to load telemetry.' });
  }
};

export const revokeSecret = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers['x-management-token'] || req.body.token;

    if (!token) {
      return res.status(401).json({ error: 'Management token required for revocation.' });
    }

    const secret = await Secret.findOne({ secretId: id });
    if (!secret) {
      return res.status(404).json({ error: 'Secret not found or already destroyed.' });
    }

    const tokenHash = sha256(id + ':' + token);
    if (tokenHash !== secret.managementTokenHash) {
      return res.status(403).json({ error: 'Invalid management authorization.' });
    }

    // Obliterate secret permanently
    await Secret.deleteOne({ secretId: id });

    return res.json({
      success: true,
      message: 'Secret permanently eradicated.',
    });
  } catch (error) {
    console.error('Error revoking secret:', error);
    return res.status(500).json({ error: 'Failed to revoke secret.' });
  }
};

export const getStats = async (req, res) => {
  try {
    const activeCount = await Secret.countDocuments({
      isBurned: false,
      expiresAt: { $gt: new Date() },
    });
    const burnedCount = await Secret.countDocuments({ isBurned: true });

    return res.json({
      activeSecrets: activeCount,
      burnedSecrets: burnedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
};
