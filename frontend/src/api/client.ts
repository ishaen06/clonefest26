import axios from 'axios';

let rawApiBase = (import.meta.env.VITE_API_URL || '/api').trim();
if (rawApiBase.endsWith('/')) {
  rawApiBase = rawApiBase.slice(0, -1);
}
if (rawApiBase.startsWith('http') && !rawApiBase.endsWith('/api')) {
  rawApiBase = `${rawApiBase}/api`;
}
const API_BASE = rawApiBase;

export const getDeviceFingerprint = (): string => {
  try {
    let fp = localStorage.getItem('jigsaw_device_fp');
    if (!fp) {
      fp = `${navigator.userAgent}-${window.screen?.width || 0}x${window.screen?.height || 0}-${navigator.language || 'en'}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('jigsaw_device_fp', fp);
    }
    return fp;
  } catch {
    return 'browser-client-anonymous';
  }
};

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s timeout for cloud server cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
  return config;
});

// Silent background pre-warm function on app load
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const healthUrl = API_BASE.replace(/\/api$/, '') + '/health';
    await fetch(healthUrl, { method: 'GET', mode: 'cors' });
    return true;
  } catch {
    return false;
  }
};

export interface SecretCreationData {
  ciphertext: string;
  iv: string;
  salt?: string;
  iterations?: number;
  hasPassword?: boolean;
  hasDuress?: boolean;
  duressPin?: string;
  ttlSeconds?: number;
  burnAfterReads?: number;
  ephemeralCountdownSeconds?: number;
  enableComments?: boolean;
  privacyLensDefault?: boolean;
  format?: 'plaintext' | 'code' | 'markdown' | 'file' | 'shamir';
  syntaxLanguage?: string;
  singleDeviceLock?: boolean;
}

export interface SecretCreationResponse {
  success: boolean;
  secretId: string;
  managementToken: string;
  expiresAt: string;
  burnAfterReads: number;
  ephemeralCountdownSeconds: number;
}

export interface SecretData {
  secretId: string;
  ciphertext: string;
  iv: string;
  salt?: string;
  iterations?: number;
  hasPassword: boolean;
  hasDuress: boolean;
  burnAfterReads: number;
  readCount: number;
  isBurned: boolean;
  ephemeralCountdownSeconds: number;
  privacyLensDefault: boolean;
  format: 'plaintext' | 'code' | 'markdown' | 'file' | 'shamir';
  syntaxLanguage: string;
  expiresAt: string;
  createdAt: string;
}

export interface SecretMeta {
  exists: boolean;
  secretId: string;
  hasPassword: boolean;
  hasDuress: boolean;
  burnAfterReads: number;
  readCount: number;
  ephemeralCountdownSeconds: number;
  privacyLensDefault: boolean;
  format: 'plaintext' | 'code' | 'markdown' | 'file' | 'shamir';
  syntaxLanguage: string;
  expiresAt: string;
  createdAt: string;
  isBurned?: boolean;
}

export interface TelemetryData {
  secretId: string;
  status: 'ACTIVE' | 'BURNED' | 'EXPIRED';
  readCount: number;
  burnAfterReads: number;
  isBurned: boolean;
  burnedAt?: string;
  createdAt: string;
  expiresAt: string;
  hasPassword: boolean;
  hasDuress: boolean;
  format: string;
  ephemeralCountdownSeconds: number;
}

export const createSecretApi = async (data: SecretCreationData): Promise<SecretCreationResponse> => {
  const res = await apiClient.post<SecretCreationResponse>('/secrets', data);
  return res.data;
};

export const getSecretApi = async (id: string): Promise<SecretData> => {
  const res = await apiClient.get<SecretData>(`/secrets/${id}`, {
    headers: {
      'X-Device-Fingerprint': getDeviceFingerprint(),
    },
  });
  return res.data;
};

export const getSecretMetaApi = async (id: string): Promise<SecretMeta> => {
  const res = await apiClient.get<SecretMeta>(`/secrets/${id}/meta`);
  return res.data;
};

export const verifyDuressApi = async (id: string, duressPin: string) => {
  const res = await apiClient.post(`/secrets/${id}/verify-duress`, { duressPin });
  return res.data;
};

export const getManagementApi = async (id: string, token: string): Promise<TelemetryData> => {
  const res = await apiClient.get<TelemetryData>(`/secrets/${id}/management`, {
    headers: { 'X-Management-Token': token },
  });
  return res.data;
};

export const revokeSecretApi = async (id: string, token: string) => {
  const res = await apiClient.delete(`/secrets/${id}`, {
    headers: { 'X-Management-Token': token },
  });
  return res.data;
};

export const getStatsApi = async () => {
  const res = await apiClient.get('/stats');
  return res.data;
};
