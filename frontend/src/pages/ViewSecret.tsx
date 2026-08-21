import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Unlock,
  Flame,
  FolderLock,
  Users,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import {
  decryptPayload,
  decryptFile,
  computeSha256Checksum,
} from '../utils/crypto';
import { combineShares } from '../utils/shamir';
import { generateVizhashSvg } from '../utils/identicon';
import {
  getSecretApi,
  type SecretData,
} from '../api/client';
import { copySecureToClipboard } from '../utils/clipboard';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-css';
import { CountdownTimer } from '../components/CountdownTimer';
import { ColdStartModal } from '../components/ColdStartModal';

const CODE_THEMES: Record<string, { bg: string; text: string; border: string; themeClass: string }> = {
  cyber: { bg: 'bg-[#090d16]', text: 'text-blue-300', border: 'border-zinc-800', themeClass: 'ide-theme-cyber' },
  monokai: { bg: 'bg-[#272822]', text: 'text-[#f8f8f2]', border: 'border-[#3e3d32]', themeClass: 'ide-theme-monokai' },
  matrix: { bg: 'bg-[#020c04]', text: 'text-[#4ade80]', border: 'border-[#031808]', themeClass: 'ide-theme-matrix' },
  dracula: { bg: 'bg-[#1e1a29]', text: 'text-[#f8f8f2]', border: 'border-[#282237]', themeClass: 'ide-theme-dracula' },
  solarized: { bg: 'bg-[#001f27]', text: 'text-[#fef3c7]', border: 'border-[#002833]', themeClass: 'ide-theme-solarized' },
  'github-dark': { bg: 'bg-[#0d1117]', text: 'text-[#c9d1d9]', border: 'border-[#161b22]', themeClass: 'ide-theme-github-dark' },
};

export const ViewSecret: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // URL fragment analysis (#key=... or #shamir=1)
  const [rawKeyHex, setRawKeyHex] = useState<string>(() => {
    const hash = window.location.hash;
    const match = hash.match(/#key=([0-9a-fA-F]+)/);
    return match ? match[1] : '';
  });

  const isShamirFromUrl = window.location.hash.includes('shamir=1');

  // Secret payload from server
  const [secretData, setSecretData] = useState<SecretData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isBurnedStatus, setIsBurnedStatus] = useState(false);
  const isFetchedRef = useRef(false);

  // Decryption state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptedFiles, setDecryptedFiles] = useState<
    { name: string; type: string; blobUrl: string; size?: number; checksum: string }[]
  >([]);
  const [contentChecksum, setContentChecksum] = useState('');
  const [decryptedFormat, setDecryptedFormat] = useState<string>('');
  const [decryptedLanguage, setDecryptedLanguage] = useState<string>('');
  const activeCodeTheme = 'cyber';

  // Shamir Assembler
  const [shamirSharesInput, setShamirSharesInput] = useState<string[]>(['', '']);
  const [shamirError, setShamirError] = useState('');

  // UI Modes
  const [privacyBlur, setPrivacyBlur] = useState(false);
  const [isRawView, setIsRawView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoClearedAlert, setAutoClearedAlert] = useState(false);

  // Ephemeral Vanishing Timer
  const [isDestroyedLocally, setIsDestroyedLocally] = useState(false);

  // 1. Fetch secret payload from server upon mount
  useEffect(() => {
    if (!id || isFetchedRef.current) return;
    isFetchedRef.current = true;

    const fetchPayload = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const data = await getSecretApi(id);
        setSecretData(data);
        setPrivacyBlur(data.privacyLensDefault);

        if (data.hasPassword || data.hasDuress) {
          setPasswordRequired(true);
        } else if (rawKeyHex && !isShamirFromUrl) {
          // Attempt automatic zero-knowledge decryption
          performDecryption(data, rawKeyHex);
        }
      } catch (err: any) {
        console.error('Failed to load secret:', err);
        if (err.response?.status === 403) {
          setIsBurnedStatus(true);
          setErrorMsg(
            'Single-Device Lockout Active: This secret link has already been opened on another device/session and cannot be reopened with this link.'
          );
        } else if (err.response?.status === 410) {
          setIsBurnedStatus(true);
          setErrorMsg('This secret link was already consumed and permanently destroyed.');
        } else if (err.response?.status === 404) {
          setErrorMsg('Secret not found or expired.');
        } else {
          setErrorMsg(err.response?.data?.error || 'Failed to retrieve secret.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayload();
  }, [id]);

  // Decryption executor
  const performDecryption = async (
    data: SecretData,
    keyHex: string,
    pass?: string
  ) => {
    try {
      setIsDecrypting(true);
      setErrorMsg('');

      // Decrypt main payload
      const decryptedString = await decryptPayload(
        {
          ciphertext: data.ciphertext,
          iv: data.iv,
          salt: data.salt,
          iterations: data.iterations,
        },
        keyHex,
        pass
      );

      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(decryptedString);
      } catch {
        parsedPayload = { content: decryptedString, format: data.format };
      }

      setDecryptedContent(parsedPayload.content || '');
      setDecryptedFormat(parsedPayload.format || data.format || 'text');
      setDecryptedLanguage(parsedPayload.syntaxLanguage || data.syntaxLanguage || '');
      const checksum = await computeSha256Checksum(parsedPayload.content || '');
      setContentChecksum(checksum);

      // Decrypt any attached files
      if (parsedPayload.files && Array.isArray(parsedPayload.files)) {
        const decryptedFileList = [];
        for (const f of parsedPayload.files) {
          const res = await decryptFile(f, keyHex, pass);
          decryptedFileList.push({
            name: f.name,
            type: f.type,
            size: f.size,
            blobUrl: res.blobUrl,
            checksum: res.checksum,
          });
        }
        setDecryptedFiles(decryptedFileList);
      }

      setPasswordRequired(false);
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setErrorMsg('Decryption failed! Please check your password or key.');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Password Form Submit
  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretData) return;
    performDecryption(secretData, rawKeyHex, password);
  };

  // Shamir Share Assembler Submit
  const handleShamirCombine = () => {
    try {
      setShamirError('');
      const validShares = shamirSharesInput.filter((s) => s.trim().length > 0);
      if (validShares.length < 2) {
        setShamirError('Please provide at least 2 valid shares.');
        return;
      }

      const reconstructedKey = combineShares(validShares);
      setRawKeyHex(reconstructedKey);

      if (secretData) {
        if (secretData.hasPassword || secretData.hasDuress) {
          setPasswordRequired(true);
        } else {
          performDecryption(secretData, reconstructedKey);
        }
      }
    } catch (err: any) {
      setShamirError(err.message || 'Failed to reconstruct key from provided shares.');
    }
  };

  // Copy Content Handler with Auto-Wipe
  const handleCopyContent = async () => {
    if (!decryptedContent) return;
    await copySecureToClipboard(decryptedContent, 30, () => {
      setAutoClearedAlert(true);
      setTimeout(() => setAutoClearedAlert(false), 5000);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Decrypted Text File
  const handleDownloadText = () => {
    if (!decryptedContent) return;
    const blob = new Blob([decryptedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jigsaw-secret-${id}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center font-mono animate-fadeIn">
        <ColdStartModal isLoading={true} message="Retrieving encrypted payload from zero-knowledge enclave..." />
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Fetching zero-knowledge encrypted payload...</p>
      </div>
    );
  }

  // BURNED / EXPIRED SCREEN (Only shown when secret could not be loaded at all)
  if (!secretData && !decryptedContent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-fadeIn">
        <div className="vault-card p-8 text-center border-rose-500/30 rose-glow">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
            <Flame className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-mono mb-2">
            {isBurnedStatus ? 'Secret Burned & Destroyed' : 'Secret Unavailable'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
            {errorMsg ||
              'This secret was configured to burn immediately upon reading or reached its expiration date. It is permanently wiped from the database.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-mono text-xs transition"
          >
            Create New Secret
          </button>
        </div>
      </div>
    );
  }

  // SHAMIR ASSEMBLE PROMPT
  if (!rawKeyHex && (isShamirFromUrl || secretData?.format === 'shamir') && !decryptedContent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fadeIn font-mono">
        <div className="vault-card p-6 sm:p-8 border-purple-500/40 purple-glow space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Jigsaw Quorum Key Assembler</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Shamir $K$-of-$N$
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  This secret is protected by Shamir's Multi-Party Secret Sharing. Paste trustee puzzle pieces to reconstruct the master key.
                </p>
              </div>
            </div>
          </div>

          {shamirError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{shamirError}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-purple-300">Trustee Shares Entered: ({shamirSharesInput.filter(Boolean).length})</span>
              <button
                type="button"
                onClick={() => setShamirSharesInput((prev) => [...prev, ''])}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                + Add Trustee Slot
              </button>
            </div>

            {shamirSharesInput.map((shareVal, idx) => {
              const hasVal = shareVal.trim().length > 0;
              return (
                <div key={idx} className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5 focus-within:border-purple-500/60 transition">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-300 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Trustee Share Piece #{idx + 1}</span>
                    </span>
                    {hasVal && (
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Share Loaded</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={shareVal}
                    onChange={(e) => {
                      const next = [...shamirSharesInput];
                      next[idx] = e.target.value;
                      setShamirSharesInput(next);
                    }}
                    placeholder="Paste share string (e.g. SSS-2-1-a7b3...)"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-mono text-purple-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              );
            })}
          </div>

          <button
            onClick={handleShamirCombine}
            disabled={shamirSharesInput.filter(Boolean).length < 2}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Reconstruct Master Key & Unlock Secret</span>
          </button>
        </div>
      </div>
    );
  }

  // PASSWORD PROMPT SCREEN
  if (passwordRequired && !decryptedContent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fadeIn">
        <div className="vault-card p-6 sm:p-8 border-blue-500/30 cyber-glow">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white font-mono text-center mb-1">
            Password Protected Secret
          </h2>
          <p className="text-xs text-zinc-400 text-center mb-5">
            This payload is layered with PBKDF2-SHA256 (600,000 iterations). Enter the decryption passphrase below:
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUnlockWithPassword} className="space-y-4 font-mono text-xs">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 pr-10 text-zinc-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isDecrypting || !password}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold tracking-wide transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{isDecrypting ? 'Deriving Keys...' : 'Decrypt Secret'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // LOCAL MEMORY PURGE (After Ephemeral Countdown expires)
  if (isDestroyedLocally) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-fadeIn">
        <div className="vault-card p-8 text-center border-rose-500/40 rose-glow">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-mono mb-2">Ephemeral Timer Expired</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
            The post-open vanishing timer has reached zero. The plaintext and encryption keys have been completely zeroized and scrubbed from browser memory.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-mono text-xs transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentCodeStyle = CODE_THEMES[activeCodeTheme] || CODE_THEMES.cyber;

  // MAIN DECRYPTED VIEWER
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Top Banner with Burn status, Vizhash Avatar and Ephemeral Timer */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          {/* Deterministic Identicon / Vizhash Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-700 overflow-hidden shadow"
            dangerouslySetInnerHTML={{ __html: generateVizhashSvg(id || 'secret', 40) }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white font-mono tracking-tight">
                Decrypted Secret
              </h1>
              {secretData?.burnAfterReads === 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-semibold flex items-center space-x-1">
                  <Flame className="w-3 h-3" />
                  <span>BURNED (Server Copy Eradicated)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Checksum: <code className="text-blue-400">{contentChecksum.slice(0, 16)}...</code></span>
            </p>
          </div>
        </div>

        {/* Dynamic Vanishing Timer */}
        {secretData?.ephemeralCountdownSeconds && secretData.ephemeralCountdownSeconds > 0 ? (
          <CountdownTimer
            initialSeconds={secretData.ephemeralCountdownSeconds}
            onExpire={() => {
              setDecryptedContent(null);
              setDecryptedFiles([]);
              setIsDestroyedLocally(true);
            }}
          />
        ) : null}
      </div>

      {autoClearedAlert && (
        <div className="mb-3 p-2.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-mono">
          🔒 Clipboard automatically cleared for your privacy.
        </div>
      )}

      {/* Main Secret Content Container */}
      <div className="vault-card p-4 sm:p-6 mb-6">
        {/* Controls Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 flex-wrap gap-2 font-mono text-xs">
          <div className="flex items-center space-x-2 text-zinc-400">
            <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {secretData?.format === 'shamir' ? 'Shamir Vault' : (decryptedFormat || secretData?.format || 'Text')}
            </span>
            {(decryptedLanguage || (secretData?.syntaxLanguage && secretData.syntaxLanguage !== 'plaintext')) && (
              <span className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40">
                {decryptedLanguage || secretData?.syntaxLanguage}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Privacy Lens Hover Toggle */}
            <button
              onClick={() => setPrivacyBlur(!privacyBlur)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                privacyBlur
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
              title="Toggle Shoulder-Surfing Blur Filter"
            >
              {privacyBlur ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Privacy Lens {privacyBlur ? 'ON' : 'OFF'}</span>
            </button>

            {/* Raw Toggle for code */}
            {(decryptedFormat === 'code' || secretData?.format === 'code' || decryptedLanguage) && (
              <button
                onClick={() => setIsRawView(!isRawView)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition"
              >
                {isRawView ? 'Formatted' : 'Raw'}
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopyContent}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download Text */}
            <button
              onClick={handleDownloadText}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition"
              title="Download text file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Display with Privacy Blur */}
        {decryptedContent && decryptedContent.trim().length > 0 && (
          <div className={`relative transition-all duration-300 ${privacyBlur ? 'privacy-blur' : ''}`}>
            <div className={`${currentCodeStyle.bg} rounded-xl p-4 border ${currentCodeStyle.border} overflow-x-auto ${currentCodeStyle.themeClass || 'ide-theme-cyber'}`}>
              {(decryptedFormat === 'code' || secretData?.format === 'code' || decryptedLanguage) && !isRawView ? (
                <pre className="font-mono-code text-xs whitespace-pre select-all leading-relaxed bg-transparent m-0 p-0">
                  <code
                    className={`language-${decryptedLanguage || secretData?.syntaxLanguage || 'plaintext'}`}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const text = decryptedContent || '';
                        const lang = decryptedLanguage || secretData?.syntaxLanguage || 'javascript';
                        const prismLang = Prism.languages[lang] || Prism.languages.javascript || Prism.languages.plaintext;
                        try {
                          return Prism.highlight(text, prismLang, lang);
                        } catch {
                          return text;
                        }
                      })(),
                    }}
                  />
                </pre>
              ) : (
                <pre className={`font-mono-code text-xs ${currentCodeStyle.text} whitespace-pre-wrap select-all leading-relaxed m-0 p-0`}>
                  {decryptedContent}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Attached Decrypted Files with Image & PDF Previews */}
        {decryptedFiles.length > 0 && (
          <div className={`mt-6 pt-4 border-t border-zinc-800 space-y-4 font-mono text-xs transition-all duration-300 ${privacyBlur ? 'privacy-blur' : ''}`}>
            <h4 className="text-zinc-300 font-semibold flex items-center space-x-2">
              <FolderLock className="w-4 h-4 text-blue-400" />
              <span>Decrypted Vault Attachments ({decryptedFiles.length}):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {decryptedFiles.map((f, idx) => {
                const isImage = f.type.startsWith('image/');
                const isPdf = f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        {isImage ? (
                          <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                        <span className="text-zinc-200 font-medium truncate">{f.name}</span>
                      </div>
                      <a
                        href={f.blobUrl}
                        download={f.name}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] transition flex-shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>

                    {/* Image In-Browser Preview */}
                    {isImage && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-zinc-800 max-h-48 flex items-center justify-center bg-black/40">
                        <img src={f.blobUrl} alt={f.name} className="max-h-48 object-contain" />
                      </div>
                    )}

                    {/* PDF In-Browser Preview */}
                    {isPdf && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-zinc-800 h-48 bg-zinc-900">
                        <iframe
                          src={f.blobUrl}
                          title={f.name}
                          className="w-full h-full border-none rounded"
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-900">
                      SHA-256: {f.checksum.slice(0, 16)}...
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
