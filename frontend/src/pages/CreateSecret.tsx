import React, { useState, useRef } from 'react';
import {
  Lock,
  Key,
  Shield,
  Clock,
  Flame,
  FileText,
  Code2,
  FolderLock,
  Users,
  Copy,
  Check,
  QrCode,
  Eye,
  EyeOff,
  AlertTriangle,
  Upload,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  generateRandomKeyHex,
  encryptPayload,
  encryptFile,
} from '../utils/crypto';
import { splitSecret } from '../utils/shamir';
import { createSecretApi } from '../api/client';
import { copySecureToClipboard } from '../utils/clipboard';
import { QrModal } from '../components/QrModal';
import { ShamirDistributorModal } from '../components/ShamirDistributorModal';
import { CodeIdeEditor } from '../components/CodeIdeEditor';
import { useLanguage } from '../context/LanguageContext';

export const CreateSecret: React.FC = () => {
  const { t } = useLanguage();

  const TTL_OPTIONS = [
    { label: t.ttl_5m || '5 Minutes', value: 300 },
    { label: t.ttl_15m || '15 Minutes', value: 900 },
    { label: t.ttl_1h || '1 Hour', value: 3600 },
    { label: t.ttl_24h || '24 Hours (1 Day)', value: 86400 },
    { label: t.ttl_7d || '7 Days', value: 604800 },
    { label: t.ttl_30d || '30 Days', value: 2592000 },
    { label: t.ttl_1y || '1 Year', value: 31536000 },
    { label: t.ttl_forever || 'Forever (Never Expire)', value: 315360000 },
  ];

  const BURN_OPTIONS = [
    { label: t.burn_1_view || '1 View (Burn immediately after reading)', value: 1 },
    { label: t.burn_3_views || '3 Views', value: 3 },
    { label: t.burn_5_views || '5 Views', value: 5 },
    { label: t.burn_10_views || '10 Views', value: 10 },
    { label: t.burn_unlimited || 'Unlimited reads (until TTL expires)', value: 0 },
  ];

  const EPHEMERAL_OPTIONS = [
    { label: 'Disabled (No live timer)', value: 0 },
    { label: '30 Seconds after opening', value: 30 },
    { label: '60 Seconds after opening', value: 60 },
    { label: '2 Minutes after opening', value: 120 },
    { label: '5 Minutes after opening', value: 300 },
  ];

  // Mode: text, code, file, shamir
  const [format, setFormat] = useState<'plaintext' | 'code' | 'file' | 'shamir'>('shamir');
  const [shamirContentType, setShamirContentType] = useState<'text' | 'code'>('text');
  const [textContent, setTextContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [syntaxLanguage, setSyntaxLanguage] = useState('python');
  const [codeTheme] = useState('cyber');

  // Attached files for file vault
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shamir Settings
  const [shamirThreshold, setShamirThreshold] = useState(2);
  const [shamirTotal, setShamirTotal] = useState(3);

  // Security Controls
  const [ttlSeconds, setTtlSeconds] = useState(86400);
  const [burnAfterReads, setBurnAfterReads] = useState(1);
  const [ephemeralCountdownSeconds, setEphemeralCountdownSeconds] = useState(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyLensDefault, setPrivacyLensDefault] = useState(false);

  // Loading & Result states
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdResult, setCreatedResult] = useState<{
    secretId: string;
    keyHex: string;
    fullUrl: string;
    managementToken: string;
    managementUrl: string;
    expiresAt: string;
    burnAfterReads: number;
    shamirShares?: string[];
  } | null>(null);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShamirModal, setShowShamirModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedManageLink, setCopiedManageLink] = useState(false);

  // File drop handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    try {
      setErrorMsg('');

      const currentContent =
        format === 'plaintext'
          ? textContent
          : format === 'code'
          ? codeContent
          : format === 'shamir'
          ? (shamirContentType === 'code' ? codeContent : textContent)
          : '';

      if (format === 'file' && attachedFiles.length === 0) {
        setErrorMsg('Please select at least one file to encrypt.');
        return;
      }

      if (format !== 'file' && !currentContent.trim() && attachedFiles.length === 0) {
        setErrorMsg('Please enter secret content or attach files to encrypt.');
        return;
      }

      setIsEncrypting(true);

      // 1. Generate 256-bit AES-GCM Key in client browser
      const rawKeyHex = generateRandomKeyHex();

      // 2. Prepare payload structure
      let encryptedFilePackages: any[] = [];
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const pkg = await encryptFile(file, rawKeyHex, password || undefined);
          encryptedFilePackages.push(pkg);
        }
      }

      const resolvedFormat = format === 'shamir' ? (shamirContentType === 'code' ? 'code' : 'text') : format;
      const resolvedSyntax =
        format === 'code' || (format === 'shamir' && shamirContentType === 'code')
          ? syntaxLanguage
          : undefined;

      const innerPayload = JSON.stringify({
        content: currentContent.trim(),
        format: resolvedFormat,
        syntaxLanguage: resolvedSyntax,
        codeTheme,
        files: encryptedFilePackages,
        createdAt: new Date().toISOString(),
      });

      // 3. Encrypt payload with WebCrypto AES-256-GCM
      const encrypted = await encryptPayload(innerPayload, rawKeyHex, password || undefined);

      // 4. Handle Shamir Key Splitting if enabled
      let shares: string[] | undefined;
      if (format === 'shamir') {
        shares = splitSecret(rawKeyHex, shamirTotal, shamirThreshold);
      }

      // 5. Send strictly ciphertext to server (zero plaintext, zero keys)
      const res = await createSecretApi({
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        iterations: encrypted.iterations,
        hasPassword: Boolean(password && password.trim().length > 0),
        ttlSeconds,
        burnAfterReads,
        ephemeralCountdownSeconds,
        privacyLensDefault,
        format,
        syntaxLanguage,
      });

      const origin = window.location.origin;
      const fullUrl =
        format === 'shamir'
          ? `${origin}/secret/${res.secretId}#shamir=1`
          : `${origin}/secret/${res.secretId}#key=${rawKeyHex}`;

      const managementUrl = `${origin}/manage/${res.secretId}#token=${res.managementToken}`;

      setCreatedResult({
        secretId: res.secretId,
        keyHex: rawKeyHex,
        fullUrl,
        managementToken: res.managementToken,
        managementUrl,
        expiresAt: res.expiresAt,
        burnAfterReads: res.burnAfterReads,
        shamirShares: shares,
      });
    } catch (err: any) {
      console.error('Creation failed:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to encrypt and store secret.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdResult) return;
    await copySecureToClipboard(createdResult.fullUrl, 30);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyManageLink = async () => {
    if (!createdResult) return;
    await copySecureToClipboard(createdResult.managementUrl, 30);
    setCopiedManageLink(true);
    setTimeout(() => setCopiedManageLink(false), 2000);
  };

  const handleReset = () => {
    setTextContent('');
    setCodeContent('');
    setAttachedFiles([]);
    setPassword('');
    setCreatedResult(null);
  };

  // SUCCESS SCREEN
  if (createdResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn font-mono">
        <div className="vault-card p-6 sm:p-8 border border-emerald-500/30 emerald-glow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Secret Encrypted & Stored</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Zero-Knowledge Active
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                The payload was encrypted in your browser with AES-256-GCM. The decryption key was never sent to the server.
              </p>
            </div>
          </div>

          {/* Direct Secret URL Box */}
          <div className="mb-6 p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Direct Zero-Knowledge URL:</span>
              <span className="text-amber-400 font-medium">
                {createdResult.burnAfterReads === 1
                  ? 'Burns after 1 view'
                  : createdResult.burnAfterReads === 0
                  ? 'Unlimited views'
                  : `${createdResult.burnAfterReads} views max`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={createdResult.fullUrl}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-blue-300 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              The decryption key is attached after the <code className="text-blue-400">#</code> fragment and is processed strictly by the receiver's browser.
            </p>
          </div>

          {/* Critical Loss Prevention Warning Alert */}
          <div className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex items-start space-x-3 shadow-lg shadow-amber-950/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-amber-300 block">
                Warning: Copy and Save Your Link & Keys Immediately
              </span>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                Please copy both the secret URL and the revocation key right now. Due to strict zero-knowledge security, this secret key exists only in your current temporary browser memory and will vanish permanently if you switch tabs, refresh, or leave this page.
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center justify-center space-x-2 p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-200 transition"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Airgap Mobile QR</span>
            </button>

            {createdResult.shamirShares ? (
              <button
                onClick={() => setShowShamirModal(true)}
                className="flex items-center justify-center space-x-2 p-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 rounded-xl text-purple-300 transition"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Distribute Shamir Shares</span>
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="flex items-center justify-center space-x-2 p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-200 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Create Another Secret</span>
              </button>
            )}
          </div>

          {/* Sender Management & Revocation Section */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs text-zinc-300">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">Sender Telemetry & Emergency Revocation Portal:</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Save this private link to check read telemetry or permanently destroy/revoke the secret anytime before expiration:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={createdResult.managementUrl}
                className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 select-all"
              />
              <button
                onClick={handleCopyManageLink}
                className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs transition"
              >
                {copiedManageLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedManageLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <QrModal
          isOpen={showQrModal}
          url={createdResult.fullUrl}
          onClose={() => setShowQrModal(false)}
        />
        {createdResult.shamirShares && (
          <ShamirDistributorModal
            isOpen={showShamirModal}
            shares={createdResult.shamirShares}
            threshold={shamirThreshold}
            totalShares={shamirTotal}
            onClose={() => setShowShamirModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center space-x-2">
          <span>{t.create_title || 'Create Secret'}</span>
        </h1>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor Card */}
      <div className="vault-card p-4 sm:p-6 mb-6">
        {/* Format Selector Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            {[
              { id: 'shamir', label: t.tab_shamir || 'Shamir Split (K-of-N)', icon: Users },
              { id: 'plaintext', label: t.tab_text || 'Text Note', icon: FileText },
              { id: 'code', label: t.tab_code || 'Code Snippet', icon: Code2 },
              { id: 'file', label: t.tab_file || 'Encrypted Files', icon: FolderLock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = format === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFormat(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Editor Inputs */}
        {format === 'shamir' ? (
          <div className="space-y-4 font-mono">
            {/* Shamir Payload Type Selector */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-400 font-semibold">Content Type:</span>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setShamirContentType('text')}
                    className={`px-3 py-1 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${
                      shamirContentType === 'text'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Text Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShamirContentType('code')}
                    className={`px-3 py-1 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${
                      shamirContentType === 'code'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Code IDE Snippet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Shamir Editor Content */}
            {shamirContentType === 'code' ? (
              <CodeIdeEditor
                value={codeContent}
                onChange={setCodeContent}
                language={syntaxLanguage}
                onLanguageChange={setSyntaxLanguage}
                placeholder={t.placeholder_code || '// Paste or write code to split with Shamir...'}
              />
            ) : (
              <div className="relative">
                <textarea
                  rows={8}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={t.placeholder_shamir || 'Enter confidential secret text to split into multi-party Shamir shares...'}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 font-mono-code text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition resize-y leading-relaxed"
                />
              </div>
            )}

            {/* Shamir Integrated File Vault Attachments */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-300 flex items-center space-x-2">
                  <FolderLock className="w-4 h-4 text-purple-400" />
                  <span>Attach Files to Shamir Vault (Images, PDFs, Media, Documents)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>+ Attach Files</span>
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-zinc-950/40 hover:bg-purple-950/10"
              >
                <p className="text-xs text-zinc-400">
                  Click or drag files here to bundle with this Shamir vault
                </p>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FolderLock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-zinc-200 truncate">{file.name}</span>
                        <span className="text-[11px] text-zinc-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-zinc-800 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : format === 'file' ? (
          <div className="space-y-4 font-mono">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-blue-500/60 rounded-xl p-8 text-center cursor-pointer transition bg-zinc-950/40 hover:bg-blue-950/10"
            >
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-300 font-semibold">
                Click or drag files here to encrypt (Images, Media, PDFs, Documents)
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Files are chunked and encrypted client-side using AES-256-GCM before upload (Up to 25MB).
              </p>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-zinc-400 font-semibold">Files to Encrypt:</h4>
                <div className="space-y-1.5">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FolderLock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-zinc-200 truncate">{file.name}</span>
                        <span className="text-[11px] text-zinc-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-zinc-800 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : format === 'code' ? (
          <CodeIdeEditor
            value={codeContent}
            onChange={setCodeContent}
            language={syntaxLanguage}
            onLanguageChange={setSyntaxLanguage}
            placeholder={t.placeholder_code || '// Paste or write code here...'}
          />
        ) : (
          <div className="relative">
            <textarea
              rows={12}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={t.placeholder_text}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 font-mono-code text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition resize-y leading-relaxed"
            />
          </div>
        )}

        {/* Shamir Settings Panel */}
        {format === 'shamir' && (
          <div className="mt-4 p-5 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-purple-300 font-semibold text-sm">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Shamir's Multi-Party Quorum ($K$-of-$N$)</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/30 font-bold">
                Jigsaw Flagship Protocol
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Splits the 256-bit encryption key into $N$ independent cryptographic shares using polynomial interpolation over $GF(2^8)$. No single trustee holds the master key. The secret can only be reconstructed when at least <strong className="text-purple-300">{shamirThreshold}</strong> trustees assemble their shares.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Quorum Architecture Presets:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '2-of-3 Board', k: 2, n: 3 },
                  { label: '3-of-5 Multi-Sig', k: 3, n: 5 },
                  { label: '4-of-7 Recovery', k: 4, n: 7 },
                  { label: '5-of-9 Enterprise', k: 5, n: 9 },
                ].map((preset) => {
                  const isPresetActive = shamirThreshold === preset.k && shamirTotal === preset.n;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setShamirThreshold(preset.k);
                        setShamirTotal(preset.n);
                      }}
                      className={`p-2 rounded-xl border text-center transition active:scale-95 ${
                        isPresetActive
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold shadow-md shadow-purple-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="block text-xs font-bold text-white">{preset.label}</span>
                      <span className="text-[10px] text-purple-400">{preset.k} of {preset.n} Trustees</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Sliders / Number Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-purple-900/40">
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">
                  Required Threshold ($K$ shares to unlock):
                </label>
                <input
                  type="number"
                  min={2}
                  max={shamirTotal}
                  value={shamirThreshold}
                  onChange={(e) => setShamirThreshold(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">
                  Total Trustee Shares ($N$ shares generated):
                </label>
                <input
                  type="number"
                  min={shamirThreshold}
                  max={10}
                  value={shamirTotal}
                  onChange={(e) => setShamirTotal(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Visual Trustee Representation */}
            <div className="pt-2">
              <span className="text-[10px] text-zinc-400 block mb-1.5 font-bold">Trustee Share Preview:</span>
              <div className="flex items-center flex-wrap gap-1.5">
                {Array.from({ length: shamirTotal }).map((_, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-purple-800/50 text-purple-300 text-[10px] flex items-center space-x-1"
                  >
                    <span>Trustee #{idx + 1}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Access Controls */}
      <div className="vault-card p-4 sm:p-6 mb-6">
        <h3 className="text-sm font-bold text-white font-mono mb-4 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Security & Destruction Policies</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Expiration TTL */}
          <div>
            <label className="block text-zinc-400 text-[11px] mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.expires_in || 'Expires In (TTL):'}</span>
            </label>
            <select
              value={ttlSeconds}
              onChange={(e) => setTtlSeconds(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none"
            >
              {TTL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Burn After Reads */}
          <div>
            <label className="block text-zinc-400 text-[11px] mb-1.5 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.burn_after_reading || 'Burn After Reading:'}</span>
            </label>
            <select
              value={burnAfterReads}
              onChange={(e) => setBurnAfterReads(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none"
            >
              {BURN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Post-Open Ephemeral Countdown */}
          <div>
            <label className="block text-zinc-400 text-[11px] mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.vanishing_timer || 'Vanishing Timer (Post-Open):'}</span>
            </label>
            <select
              value={ephemeralCountdownSeconds}
              onChange={(e) => setEphemeralCountdownSeconds(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none"
            >
              {EPHEMERAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Layered Password Protection */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 font-mono text-xs">
          <label className="block text-zinc-400 text-[11px] mb-1.5 flex items-center space-x-1">
            <Key className="w-3.5 h-3.5 text-purple-400" />
            <span>{t.password_protect || 'Optional Password (PBKDF2 600k iter):'}</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank for URL-only key or enter passphrase for double-layer protection..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 pr-9 text-zinc-200 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-200"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2.5 font-mono text-xs text-zinc-400">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyLensDefault}
                onChange={(e) => setPrivacyLensDefault(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"
              />
              <span>{t.privacy_lens_default || 'Enable Shoulder-Surfing Privacy Blur by Default'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleCreate}
          disabled={isEncrypting}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-mono text-xs font-semibold tracking-wide shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition active:scale-[0.98]"
        >
          <Lock className="w-4 h-4" />
          <span>{isEncrypting ? 'Encrypting with WebCrypto...' : (t.encrypt_btn || 'Encrypt & Generate Secure Link')}</span>
        </button>
      </div>
    </div>
  );
};
