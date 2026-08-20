import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  Key,
  Users,
  EyeOff,
  Flame,
  Clock,
  FolderLock,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Layers,
  Cpu,
  Server,
  Database,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ShamirHeroSimulator } from '../components/ShamirHeroSimulator';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();

  const coreFeatures = [
    {
      icon: Lock,
      title: t.info_feat1_title || 'Zero-Knowledge End-to-End Encryption',
      tag: 'AES-256-GCM',
      desc: t.info_feat1_desc || 'All plaintext and files are encrypted directly inside the sender’s browser before any network transmission. The decryption key is held exclusively in the URL fragment (#key=...) and is mathematically inaccessible to the server or database.',
    },
    {
      icon: Users,
      title: t.info_feat2_title || "Shamir's Multi-Party Secret Sharing",
      tag: 'K-of-N Quorum',
      desc: t.info_feat2_desc || 'Splits the master decryption key into N independent shares. The secret can only be unlocked when at least K trustees combine their shares, enabling decentralized quorum approval for high-value credentials.',
    },
    {
      icon: EyeOff,
      title: t.info_feat3_title || 'Shoulder-Surfing Privacy Lens & Panic Mask',
      tag: 'Physical OpSec',
      desc: t.info_feat3_desc || 'Protects confidential data in public or screen-sharing settings with an interactive Gaussian hover-blur lens. Pressing the ESC key instantly swaps the screen with a harmless decoy interface.',
    },
    {
      icon: Flame,
      title: t.info_feat4_title || 'Burn-After-Reading & TTL Expiration',
      tag: 'Self-Destruct',
      desc: t.info_feat4_desc || 'Configurable life cycles ranging from single-view atomic destruction (Burn on Read) to custom view counts (3, 5, 10) and time-based TTL expiration (5 minutes to Forever) backed by MongoDB TTL workers.',
    },
    {
      icon: Clock,
      title: t.info_feat5_title || 'Dynamic Post-Open Vanishing Timer',
      tag: 'Ephemeral Memory',
      desc: t.info_feat5_desc || 'Starts a visual live countdown (30s, 60s, 2m, 5m) upon first decryption. When the timer hits zero, plaintext and encryption keys are scrubbed and zeroized from browser RAM.',
    },
    {
      icon: FolderLock,
      title: t.info_feat6_title || 'Encrypted File Vault & Media Previews',
      tag: 'Rich Previews',
      desc: t.info_feat6_desc || 'Encrypt and attach multiple files, documents, images, and PDFs up to 50MB. Features in-browser secure previews for decrypted images and embedded PDF viewers.',
    },
    {
      icon: MessageSquare,
      title: t.info_feat7_title || 'E2EE Discussions with Vizhash Identicons',
      tag: 'Anonymous Threads',
      desc: t.info_feat7_desc || 'Allows sender and recipients to exchange zero-knowledge encrypted comments. Each participant is assigned a deterministic geometric SVG avatar (Vizhash) derived from their session/nickname.',
    },
    {
      icon: Key,
      title: t.info_feat8_title || 'Sender Telemetry & Remote Revocation Portal',
      tag: 'Emergency Kill-Switch',
      desc: t.info_feat8_desc || 'Senders receive a private management token to monitor real-time read counts and view status, with the ability to instantly destroy and revoke the secret anytime before expiration.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-mono animate-fadeIn">
      {/* 1. HERO BANNER */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.info_hero_badge || 'Next-Generation Zero-Knowledge Ephemeral Platform'}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {t.info_hero_title || 'Modern, Zero-Knowledge Information Exchange'}
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans max-w-2xl mx-auto">
          {t.info_hero_desc ||
            'An advanced interpretation of PrivateBin. End-to-end encrypted in your browser with AES-256-GCM, Shamir threshold sharing, and automated self-destruction.'}
        </p>

        <div className="flex items-center justify-center space-x-4 pt-4 flex-wrap gap-3">
          <Link
            to="/create"
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <span>{t.info_btn_create || 'Create Encrypted Secret'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/manage"
            className="flex items-center space-x-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>{t.info_btn_manage || 'Manage'}</span>
          </Link>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 text-left">
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>AES-256-GCM</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">{t.info_badge_webcrypto || 'Hardware WebCrypto'}</p>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold">
              <Zap className="w-4 h-4" />
              <span>Zero-Knowledge</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">{t.info_badge_zero || 'Keys never touch server'}</p>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-purple-400 text-xs font-semibold">
              <Users className="w-4 h-4" />
              <span>Shamir (K-of-N)</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">{t.info_badge_quorum || 'Threshold Quorum'}</p>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold">
              <Flame className="w-4 h-4" />
              <span>Burn on Read</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">{t.info_badge_burn || 'Atomic Server Purge'}</p>
          </div>
        </div>
      </div>

      {/* FLAGSHIP HERO COMPONENT: Shamir's Secret Sharing Interactive Quorum */}
      <div className="mb-20">
        <ShamirHeroSimulator />
      </div>

      {/* 2. SIMPLE 3-TIER SYSTEM ARCHITECTURE */}
      <div className="vault-card p-6 sm:p-8 mb-20 bg-zinc-950/80 border border-zinc-800/90 space-y-6">
        <div className="flex items-center space-x-2 text-blue-400">
          <Layers className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">
            {t.info_arch_title || 'Simple 3-Tier System Architecture'}
          </h2>
        </div>
        <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
          {t.info_arch_desc ||
            'How JigsawBin delivers uncompromising zero-knowledge privacy without placing trust in any server, database, or network channel.'}
        </p>

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Tier 1 */}
          <div className="p-5 bg-zinc-900/90 border border-blue-500/30 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Tier 1</span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {t.info_tier1_name || 'Client Edge (Browser)'}
              </h3>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t.info_tier1_desc ||
                'All plaintext and file data is encrypted locally using hardware WebCrypto (AES-256-GCM) or split into Shamir puzzle pieces over GF(2^8). The decryption key is attached solely to the URL hash (#key=...) and is mathematically hidden from the server.'}
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] text-blue-300 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side Cryptography</span>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="p-5 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Tier 2</span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {t.info_tier2_name || 'Blind API Bridge (Node.js)'}
              </h3>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t.info_tier2_desc ||
                'A blind microservice layer that stores scrambled ciphertexts, manages burn-on-read decrement counts, and processes cryptographic comment attachments without ever having the ability to inspect content.'}
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] text-emerald-300 font-semibold flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Relay</span>
            </div>
          </div>

          {/* Tier 3 */}
          <div className="p-5 bg-zinc-900/90 border border-purple-500/30 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Tier 3</span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {t.info_tier3_name || 'Ephemeral Vault (MongoDB)'}
              </h3>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t.info_tier3_desc ||
                'High-speed encrypted document storage backed by native background TTL worker indexes that permanently and automatically expunge expired secrets from disk.'}
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] text-purple-300 font-semibold flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Automatic TTL Expunge</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ZERO-KNOWLEDGE CRYPTOGRAPHIC DATA FLOW */}
      <div className="vault-card p-6 sm:p-8 mb-20 bg-zinc-950/80 border border-blue-500/30 cyber-glow space-y-6">
        <div className="flex items-center space-x-2 text-blue-400">
          <Shield className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">{t.info_flow_title || 'How Zero-Knowledge Works (Data Flow)'}</h2>
        </div>
        <p className="text-xs text-zinc-400">
          {t.info_flow_desc ||
            'JigsawBin adheres to a strict Zero-Knowledge security contract: the server functions as a blind encrypted blob store.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-blue-400 font-bold">
              <span>{t.info_step1_title || 'Step 1: Sender'}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px]">Client</span>
            </div>
            <p className="text-zinc-300 font-semibold">{t.info_step1_sub || 'In-Browser Encryption'}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t.info_step1_desc ||
                'Browser generates a 256-bit cryptographic key via WebCrypto. The plaintext payload is encrypted with AES-256-GCM.'}
            </p>
          </div>

          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>{t.info_step2_title || 'Step 2: Server'}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px]">Cloud Store</span>
            </div>
            <p className="text-zinc-300 font-semibold">{t.info_step2_sub || 'Blind Ciphertext Storage'}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t.info_step2_desc ||
                'Only scrambled ciphertext, IV, and TTL expiration are uploaded. The encryption key is NEVER transmitted over the wire.'}
            </p>
          </div>

          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-purple-400 font-bold">
              <span>{t.info_step3_title || 'Step 3: Recipient'}</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[10px]">Client</span>
            </div>
            <p className="text-zinc-300 font-semibold">{t.info_step3_sub || 'In-Browser Decryption'}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {t.info_step3_desc ||
                'The recipient reads the key from the URL hash fragment (#key=...) and decrypts the ciphertext directly in local memory.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. CORE FEATURES MATRIX */}
      <div className="mb-20 space-y-6">
        <div className="flex items-center space-x-2 text-zinc-200">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t.info_innovations_title || 'Key Capabilities & Innovation Features'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coreFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3 flex flex-col justify-between hover:border-zinc-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white pt-1">{feat.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. COMPARISON TABLE */}
      <div className="vault-card p-6 sm:p-8 mb-16 overflow-x-auto">
        <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{t.info_matrix_title || 'Security & Architectural Comparison'}</span>
        </h2>
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
              <th className="py-2.5 pr-4">{t.info_col_feature || 'Feature / Capability'}</th>
              <th className="py-2.5 px-3">{t.info_col_pastebin || 'Traditional Pastebins'}</th>
              <th className="py-2.5 px-3">{t.info_col_privatebin || 'PrivateBin'}</th>
              <th className="py-2.5 pl-3 text-blue-400">{t.info_col_jigsaw || 'JigsawBin (v2.0)'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300 text-[11px]">
            <tr>
              <td className="py-2.5 pr-4 font-semibold">Zero-Knowledge E2EE</td>
              <td className="py-2.5 px-3 text-red-400">Plaintext on server</td>
              <td className="py-2.5 px-3 text-emerald-400">WebCrypto / SJCL</td>
              <td className="py-2.5 pl-3 text-emerald-400 font-bold">WebCrypto AES-256-GCM</td>
            </tr>
            <tr>
              <td className="py-2.5 pr-4 font-semibold">Shamir Key Splitting (K-of-N)</td>
              <td className="py-2.5 px-3 text-red-400">None</td>
              <td className="py-2.5 px-3 text-red-400">None</td>
              <td className="py-2.5 pl-3 text-emerald-400 font-bold">SSS over GF(2^8)</td>
            </tr>
            <tr>
              <td className="py-2.5 pr-4 font-semibold">Post-Open Vanishing Timer</td>
              <td className="py-2.5 px-3 text-red-400">None</td>
              <td className="py-2.5 px-3 text-red-400">None</td>
              <td className="py-2.5 pl-3 text-emerald-400 font-bold">In-Memory Scrubbing</td>
            </tr>
            <tr>
              <td className="py-2.5 pr-4 font-semibold">Sender Telemetry & Kill-Switch</td>
              <td className="py-2.5 px-3 text-red-400">Lost on creation</td>
              <td className="py-2.5 px-3 text-amber-400">Basic delete token</td>
              <td className="py-2.5 pl-3 text-emerald-400 font-bold">Live Audit + Revocation</td>
            </tr>
            <tr>
              <td className="py-2.5 pr-4 font-semibold">Shoulder-Surfing Privacy Lens</td>
              <td className="py-2.5 px-3 text-red-400">None</td>
              <td className="py-2.5 px-3 text-red-400">None</td>
              <td className="py-2.5 pl-3 text-emerald-400 font-bold">Hover-Blur Filter</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. BOTTOM CALL TO ACTION */}
      <div className="text-center space-y-4 py-8 border-t border-zinc-800">
        <h2 className="text-xl font-bold text-white">{t.info_cta_title || 'Ready to Share Sensitive Information Securely?'}</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          {t.info_cta_desc ||
            'Create an end-to-end encrypted secret in seconds with custom expiration policies and zero server-side trust.'}
        </p>
        <Link
          to="/create"
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 active:scale-95"
        >
          <span>{t.info_cta_btn || 'Launch JigsawBin Vault'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
export default HomePage;
