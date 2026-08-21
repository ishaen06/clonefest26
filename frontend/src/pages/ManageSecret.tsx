import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Key,
  Flame,
  Clock,
  Eye,
  CheckCircle,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { getManagementApi, revokeSecretApi, type TelemetryData } from '../api/client';

export const ManageSecret: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [secretId, setSecretId] = useState(paramId || '');
  const [token, setToken] = useState(() => {
    const hash = window.location.hash;
    const match = hash.match(/#token=([0-9a-fA-F]+)/);
    return match ? match[1] : '';
  });

  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [revokedSuccess, setRevokedSuccess] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  
  // Check for recently created secret in current session
  const [recentSecret, setRecentSecret] = useState<{ secretId: string; managementToken: string } | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('jigsaw_last_secret');
      if (stored) {
        setRecentSecret(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  const fetchTelemetry = async (sid: string, tok: string) => {
    if (!sid || !tok) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getManagementApi(sid, tok);
      setTelemetry(data);
    } catch (err: any) {
      console.error('Failed to load telemetry:', err);
      setErrorMsg(
        err.response?.data?.error || 'Invalid management token or secret already wiped.'
      );
      setTelemetry(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (secretId && token) {
      fetchTelemetry(secretId, token);
    }
  }, [secretId, token]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTelemetry(secretId.trim(), token.trim());
  };

  const handleQuickFill = () => {
    if (!recentSecret) return;
    setSecretId(recentSecret.secretId);
    setToken(recentSecret.managementToken);
    fetchTelemetry(recentSecret.secretId, recentSecret.managementToken);
  };

  const handleRevoke = async () => {
    if (!secretId || !token) return;
    const confirmed = window.confirm(
      'Are you sure you want to permanently REVOKE and DELETE this secret from the database? This action is immediate and irreversible.'
    );
    if (!confirmed) return;

    try {
      setIsRevoking(true);
      await revokeSecretApi(secretId, token);
      setRevokedSuccess(true);
      setTelemetry(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to revoke secret.');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn font-mono">
      {/* 1. Header Banner */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <Key className="w-6 h-6 text-amber-400" />
          <span>Sender Telemetry & Emergency Revocation</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Monitor your secret's access metrics in real-time or remotely obliterate it on demand without exposing decryption keys.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {revokedSuccess && (
        <div className="mb-6 p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Secret Successfully Eradicated</span>
          </div>
          <p className="text-zinc-400">
            The ciphertext, metadata, and cryptographic records for secret <code className="text-white bg-zinc-900 px-1.5 py-0.5 rounded">{secretId}</code> have been permanently purged from MongoDB storage.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs transition"
          >
            Create New Secret
          </button>
        </div>
      )}

      {/* 3. Quick-Fill Recent Secret Helper (If available) */}
      {recentSecret && !telemetry && !revokedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <span className="text-zinc-200 font-semibold">Recent Secret Found in this Session: </span>
              <code className="text-blue-300 bg-zinc-900 px-1.5 py-0.5 rounded ml-1 font-bold">
                {recentSecret.secretId}
              </code>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-blue-600/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Fill & Inspect</span>
          </button>
        </div>
      )}

      {/* 4. Manual Input Form */}
      {(!secretId || !token) && !telemetry && !revokedSuccess && (
        <div className="vault-card p-6 sm:p-8 mb-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Enter Secret Credentials to Manage:</span>
          </h2>
          <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 text-[11px] mb-1 font-semibold">
                Secret ID:
              </label>
              <input
                type="text"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                placeholder="e.g. tI1QYfRFbQPM"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-[11px] mb-1 font-semibold">
                Management Revocation Token:
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the 48-character management hex token..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={loading || !secretId || !token}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold transition flex items-center space-x-2"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{loading ? 'Checking Telemetry...' : 'Load Telemetry & Controls'}</span>
              </button>

              <Link
                to="/create"
                className="text-xs text-zinc-400 hover:text-blue-400 flex items-center space-x-1"
              >
                <span>Don't have a token? Create a secret</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* 5. Live Telemetry Dashboard */}
      {telemetry && (
        <div className="space-y-6">
          <div className="vault-card p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5 flex-wrap gap-2">
              <div>
                <span className="text-xs text-zinc-400">Target Secret:</span>
                <h3 className="text-base font-bold text-white">{telemetry.secretId}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                    telemetry.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : telemetry.status === 'BURNED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>STATUS: {telemetry.status}</span>
                </span>
                <button
                  onClick={() => fetchTelemetry(secretId, token)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                  title="Refresh Telemetry"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs mb-6">
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center space-x-1.5 text-zinc-400 mb-1">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Views Consumed</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {telemetry.readCount} / {telemetry.burnAfterReads === 0 ? '∞' : telemetry.burnAfterReads}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {telemetry.burnAfterReads > 0
                    ? `${Math.max(0, telemetry.burnAfterReads - telemetry.readCount)} reads remaining`
                    : 'Unlimited within TTL'}
                </p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center space-x-1.5 text-zinc-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expires At</span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  {new Date(telemetry.expiresAt).toLocaleTimeString()}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {new Date(telemetry.expiresAt).toLocaleDateString()}
                </p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center space-x-1.5 text-zinc-400 mb-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Post-Open Timer</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {telemetry.ephemeralCountdownSeconds > 0
                    ? `${telemetry.ephemeralCountdownSeconds}s vanishing`
                    : 'Disabled'}
                </p>
                <p className="text-[10px] text-zinc-500">RAM auto-zeroize</p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center space-x-1.5 text-zinc-400 mb-1">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Security Layers</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {telemetry.hasPassword ? 'Password' : 'URL Key'}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {telemetry.hasDuress ? '+ Duress Canary' : 'Standard'}
                </p>
              </div>
            </div>

            {/* Emergency Revocation Box */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-bold text-red-400 flex items-center space-x-1.5">
                  <Trash2 className="w-4 h-4" />
                  <span>Emergency Remote Revocation</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Instantly and permanently erase this secret and its ciphertext from the database.
                </p>
              </div>
              <button
                onClick={handleRevoke}
                disabled={isRevoking}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-red-600/30 active:scale-95"
              >
                {isRevoking ? 'Revoking...' : 'Destroy Secret Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSecret;
