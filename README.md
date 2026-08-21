# 🧩 JigsawBin - Zero-Knowledge Ephemeral Information Exchange

> Modern, zero-knowledge encrypted pastebin, code IDE, and multi-vault file sharing platform with Shamir Key Splitting ($K$-of-$N$ Quorum), ephemeral countdown timers, and physical OpSec privacy filters.

---

## 🚀 Key Features

* **Zero-Knowledge WebCrypto E2EE:** Everything is encrypted client-side in the browser using hardware WebCrypto (AES-256-GCM). Encryption keys live exclusively in the URL hash fragment (`#key=...`) and are mathematically hidden from the server and database.
* **Unified Shamir Multi-Vault ($K$-of-$N$ Quorum):** Split master decryption keys across $N$ independent shares using polynomial interpolation over $GF(2^8)$. Requires at least $K$ trustees to reconstruct. Bundles text notes, Code IDE snippets, and encrypted file attachments together!
* **Code IDE Snippet Editor:** Integrated code editor with automatic language detection, syntax highlighting, and line numbers.
* **Physical OpSec (Privacy Lens & Panic Mask):** Interactive Gaussian hover-blur lens protecting sensitive data from shoulder surfers. Pressing `ESC` instantly triggers a decoy interface.
* **Ephemeral Memory Scrubbing:** Post-open vanishing countdown timers (30s, 60s, 2m, 5m) that purge and zeroize decrypted secrets from browser RAM upon expiration.
* **Atomic Burn-on-Read:** Configurable view quotas (1, 3, 5, 10 views) and MongoDB TTL auto-expunging workers.
* **Audit & Remote Revocation:** Management tokens for senders to inspect live access status and permanently eradicate secrets at any time.

---

## 🛠️ Tech Stack (MERN)

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, PrismJS.
* **Backend:** Node.js, Express, Helmet, CORS, Rate-Limiting.
* **Database:** MongoDB with native TTL expiration indexes.
* **Cryptography:** Client-side WebCrypto API (AES-GCM, PBKDF2 with 600k iterations, Shamir's Secret Sharing over $GF(2^8)$).

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
node src/server.js
```
The backend will run on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 📜 License
MIT License
