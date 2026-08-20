/**
 * Shamir's Secret Sharing (SSS) Implementation over Galois Field GF(2^8)
 * Allows splitting any 256-bit cryptographic key into N shares with threshold K (K-of-N).
 */

// GF(2^8) generator table initialization (Standard primitive polynomial: 0x11D)
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    EXP[i + 255] = x;
    LOG[x] = i;
    x = (x << 1);
    if (x & 0x100) x ^= 0x11d;
  }
  LOG[0] = 0;
})();

function gfAdd(a: number, b: number): number {
  return a ^ b;
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(2^8)');
  if (a === 0) return 0;
  return EXP[LOG[a] + 255 - LOG[b]];
}

/**
 * Split a hex secret string into N shares requiring K shares to reconstruct
 */
export function splitSecret(
  secretHex: string,
  totalShares: number,
  threshold: number
): string[] {
  if (threshold < 2) throw new Error('Threshold must be at least 2');
  if (totalShares < threshold) throw new Error('Total shares cannot be less than threshold');
  if (totalShares > 254) throw new Error('Max 254 shares supported in GF(2^8)');

  const cleanHex = secretHex.replace(/[^0-9a-fA-F]/g, '');
  const secretBytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    secretBytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }

  // Create shares: each share has an x-coordinate (1..N) and array of y-values
  const shares: { x: number; y: Uint8Array }[] = [];
  for (let i = 1; i <= totalShares; i++) {
    shares.push({ x: i, y: new Uint8Array(secretBytes.length) });
  }

  // For each byte of the secret, generate random polynomial of degree (threshold - 1)
  for (let byteIdx = 0; byteIdx < secretBytes.length; byteIdx++) {
    const coeff = new Uint8Array(threshold);
    coeff[0] = secretBytes[byteIdx]; // f(0) is the secret byte

    const rand = new Uint8Array(threshold - 1);
    window.crypto.getRandomValues(rand);
    for (let c = 1; c < threshold; c++) {
      coeff[c] = rand[c - 1] === 0 ? 1 : rand[c - 1]; // non-zero
    }

    // Evaluate f(x) for each share x = 1..N
    for (let s = 0; s < totalShares; s++) {
      const x = shares[s].x;
      let y = coeff[0];
      for (let exp = 1; exp < threshold; exp++) {
        let xPow = 1;
        for (let p = 0; p < exp; p++) {
          xPow = gfMul(xPow, x);
        }
        y = gfAdd(y, gfMul(coeff[exp], xPow));
      }
      shares[s].y[byteIdx] = y;
    }
  }

  // Format shares as readable strings: SSS-<threshold>-<x>-<hex_data>
  return shares.map((s) => {
    const yHex = Array.from(s.y)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `SSS-${threshold}-${s.x}-${yHex}`;
  });
}

/**
 * Reconstruct original secret hex from K valid shares using Lagrange Interpolation
 */
export function combineShares(sharesList: string[]): string {
  if (!sharesList || sharesList.length === 0) {
    throw new Error('At least one share required');
  }

  // Parse shares
  const parsedShares: { threshold: number; x: number; y: Uint8Array }[] = [];
  const seenX = new Set<number>();

  for (const rawShare of sharesList) {
    const trimmed = rawShare.trim();
    if (!trimmed) continue;

    const parts = trimmed.split('-');
    if (parts.length < 4 || parts[0] !== 'SSS') {
      throw new Error(`Invalid share format: ${trimmed}`);
    }

    const threshold = parseInt(parts[1], 10);
    const x = parseInt(parts[2], 10);
    const yHex = parts[3];

    if (x <= 0 || x > 254) {
      throw new Error(`Invalid share coordinate x=${x}`);
    }
    if (seenX.has(x)) {
      continue; // Duplicate share, ignore
    }
    seenX.add(x);

    const yBytes = new Uint8Array(yHex.length / 2);
    for (let i = 0; i < yHex.length; i += 2) {
      yBytes[i / 2] = parseInt(yHex.substring(i, i + 2), 16);
    }

    parsedShares.push({ threshold, x, y: yBytes });
  }

  if (parsedShares.length === 0) {
    throw new Error('No valid shares provided');
  }

  const requiredThreshold = parsedShares[0].threshold;
  if (parsedShares.length < requiredThreshold) {
    throw new Error(
      `Insufficient shares: provided ${parsedShares.length}, but ${requiredThreshold} required to reconstruct key.`
    );
  }

  // Use the first `threshold` unique shares
  const kShares = parsedShares.slice(0, requiredThreshold);
  const secretLen = kShares[0].y.length;
  const reconstructedBytes = new Uint8Array(secretLen);

  // Lagrange interpolation at x = 0 for each byte
  for (let byteIdx = 0; byteIdx < secretLen; byteIdx++) {
    let secretByte = 0;

    for (let i = 0; i < kShares.length; i++) {
      const xi = kShares[i].x;
      const yi = kShares[i].y[byteIdx];
      let lagrangeBasis = 1;

      for (let j = 0; j < kShares.length; j++) {
        if (i === j) continue;
        const xj = kShares[j].x;
        // Basis = (0 - xj) / (xi - xj) in GF(2^8) => xj / (xi ^ xj)
        const numerator = xj;
        const denominator = gfAdd(xi, xj);
        lagrangeBasis = gfMul(lagrangeBasis, gfDiv(numerator, denominator));
      }

      secretByte = gfAdd(secretByte, gfMul(yi, lagrangeBasis));
    }

    reconstructedBytes[byteIdx] = secretByte;
  }

  return Array.from(reconstructedBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
