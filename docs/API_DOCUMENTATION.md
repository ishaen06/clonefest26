# 📡 JigsawBin REST API Documentation

## Base URLs
* **Production:** `https://jigsawbin.onrender.com/api`
* **Local Development:** `http://localhost:5000/api`

---

## Standard Response Format

### Success Response (200 OK / 201 Created)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (4xx / 5xx)
```json
{
  "error": "Detailed error explanation"
}
```

---

## 📌 Endpoints Reference

### 1. Create Secret
Stores an encrypted payload in the zero-knowledge vault.

* **Method:** `POST`
* **Endpoint:** `/secrets`
* **Rate Limit:** 60 requests / 15 minutes per IP
* **Headers:**
  * `Content-Type: application/json`
  * `X-Device-Fingerprint: <string>` (Optional)

#### Request Body
```json
{
  "ciphertext": "U2FsdGVkX1+...base64-or-hex-ciphertext...",
  "iv": "0123456789abcdef0123456789abcdef",
  "salt": "fedcba9876543210fedcba9876543210",
  "iterations": 600000,
  "hasPassword": false,
  "hasDuress": true,
  "duressPin": "9999",
  "ttlSeconds": 86400,
  "burnAfterReads": 1,
  "ephemeralCountdownSeconds": 60,
  "privacyLensDefault": true,
  "format": "code",
  "syntaxLanguage": "typescript"
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "secretId": "4Q9hUSmG9VFq",
  "managementToken": "dc87d014b1175ad8f3e58eeaefc307d6f47f1de82932179a",
  "expiresAt": "2026-08-22T05:28:30.376Z",
  "burnAfterReads": 1,
  "ephemeralCountdownSeconds": 60
}
```

---

### 2. Retrieve Secret (Atomic Read)
Fetches the encrypted payload and increments the atomic read counter. If the read limit is reached, marks the secret as burned.

* **Method:** `GET`
* **Endpoint:** `/secrets/:id`
* **Rate Limit:** 120 requests / 1 minute per IP

#### Response (`200 OK`)
```json
{
  "secretId": "4Q9hUSmG9VFq",
  "ciphertext": "U2FsdGVkX1+...",
  "iv": "0123456789abcdef0123456789abcdef",
  "salt": "fedcba9876543210fedcba9876543210",
  "iterations": 600000,
  "hasPassword": false,
  "hasDuress": true,
  "burnAfterReads": 1,
  "readCount": 1,
  "isBurned": true,
  "ephemeralCountdownSeconds": 60,
  "privacyLensDefault": true,
  "format": "code",
  "syntaxLanguage": "typescript",
  "expiresAt": "2026-08-22T05:28:30.376Z",
  "createdAt": "2026-08-21T05:28:30.376Z"
}
```

#### Response (`410 Gone` - Expired or Burned)
```json
{
  "error": "This secret link was already consumed and permanently destroyed.",
  "isBurned": true,
  "burnedAt": "2026-08-21T05:30:00.000Z"
}
```

---

### 3. Get Secret Metadata (Safe Preview)
Checks whether a secret exists and retrieves operational metadata **without** consuming a read from the burn quota.

* **Method:** `GET`
* **Endpoint:** `/secrets/:id/meta`
* **Rate Limit:** 120 requests / 1 minute per IP

#### Response (`200 OK`)
```json
{
  "exists": true,
  "secretId": "4Q9hUSmG9VFq",
  "hasPassword": false,
  "hasDuress": true,
  "burnAfterReads": 1,
  "readCount": 0,
  "isBurned": false,
  "ephemeralCountdownSeconds": 60,
  "privacyLensDefault": true,
  "format": "code",
  "syntaxLanguage": "typescript",
  "expiresAt": "2026-08-22T05:28:30.376Z",
  "createdAt": "2026-08-21T05:28:30.376Z"
}
```

---

### 4. Verify Duress Canary PIN (Emergency Purge)
Verifies if the submitted PIN matches the duress canary. If matched, triggers an **immediate, unrecoverable eradication** of the record.

* **Method:** `POST`
* **Endpoint:** `/secrets/:id/verify-duress`
* **Rate Limit:** 10 requests / 1 minute per IP

#### Request Body
```json
{
  "duressPin": "9999"
}
```

#### Response (Duress Triggered - `400 Bad Request`)
```json
{
  "duressTriggered": true,
  "error": "Decryption failed: Invalid passphrase or corrupted payload."
}
```

---

### 5. Management Telemetry & Status
Allows the secret creator to inspect real-time read metrics using their cryptographic management token.

* **Method:** `GET`
* **Endpoint:** `/secrets/:id/management`
* **Headers:**
  * `X-Management-Token: <token>` (or query param `?token=<token>`)

#### Response (`200 OK`)
```json
{
  "secretId": "4Q9hUSmG9VFq",
  "status": "ACTIVE",
  "readCount": 2,
  "burnAfterReads": 5,
  "isBurned": false,
  "burnedAt": null,
  "createdAt": "2026-08-21T05:28:30.376Z",
  "expiresAt": "2026-08-22T05:28:30.376Z",
  "hasPassword": false,
  "hasDuress": true,
  "format": "code",
  "ephemeralCountdownSeconds": 60
}
```

---

### 6. Remote Revocation & Eradication
Allows the secret creator to immediately destroy the secret from the database before expiration or recipient views.

* **Method:** `DELETE`
* **Endpoint:** `/secrets/:id`
* **Headers:**
  * `X-Management-Token: <token>`

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Secret permanently eradicated."
}
```

---

### 7. Platform Statistics
Returns global anonymous usage statistics.

* **Method:** `GET`
* **Endpoint:** `/stats`

#### Response (`200 OK`)
```json
{
  "activeSecrets": 14,
  "burnedSecrets": 89,
  "timestamp": "2026-08-21T16:25:00.000Z"
}
```

---

### 8. System Health Probe
Returns service health for uptime monitoring and container orchestration.

* **Method:** `GET`
* **Endpoint:** `/health`

#### Response (`200 OK`)
```json
{
  "status": "healthy",
  "timestamp": "2026-08-21T16:25:00.000Z",
  "service": "JigsawBin Zero-Knowledge Backend"
}
```
