import React from 'react';
import {
  X,
  Settings,
  Shield,
  Palette,
  Globe,
  Check,
} from 'lucide-react';
import { LANGUAGES, type LanguageCode } from '../utils/i18n';

interface ConfigSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onSelectTheme: (theme: string) => void;
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
}

export const ConfigSettingsModal: React.FC<ConfigSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  currentLang,
  onSelectLang,
}) => {
  if (!isOpen) return null;

  const themes = [
    {
      id: 'theme-cyber',
      label: 'Cyber Midnight (Default)',
      desc: 'Obsidian Zinc & Electric Neon Blue',
      dot: 'bg-blue-500',
    },
    {
      id: 'theme-matrix',
      label: 'Matrix CRT Terminal',
      desc: 'Retro Hacker Phosphor Green Glow',
      dot: 'bg-emerald-500',
    },
    {
      id: 'theme-synthwave',
      label: 'Synthwave / Cyberpunk',
      desc: 'Neon Sunset Fuchsia & Electric Cyan',
      dot: 'bg-pink-500',
    },
    {
      id: 'theme-dracula',
      label: 'Dracula Vampire',
      desc: 'Deep Twilight Slate & Amethyst Violet',
      dot: 'bg-purple-500',
    },
    {
      id: 'theme-nordic',
      label: 'Nordic Aurora',
      desc: 'Arctic Polar Night & Glacier Teal',
      dot: 'bg-cyan-400',
    },
    {
      id: 'theme-solarized',
      label: 'Solarized Amber Gold',
      desc: 'Deep Space Navy & Warm Brass Amber',
      dot: 'bg-amber-500',
    },
    {
      id: 'theme-bootstrap',
      label: 'Modern Studio Light',
      desc: 'Crisp White Cards & Royal Blue Light Mode',
      dot: 'bg-blue-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn font-mono text-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-blue-400 mb-2 text-sm font-semibold">
          <Settings className="w-5 h-5" />
          <span>Platform & Theme Customizer</span>
        </div>
        <p className="text-zinc-400 mb-5">
          Select your visual aesthetic, interface language, and cryptographic parameters.
        </p>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* 1. UI Templates & Themes */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-zinc-200 font-semibold">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>UI Themes & Visual Palettes (7 Premier Styles)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => onSelectTheme(th.id)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition ${
                    currentTheme === th.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-bold shadow-md shadow-purple-500/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${th.dot}`} />
                      <span>{th.label}</span>
                    </div>
                    {currentTheme === th.id && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-normal mt-1 pl-4.5">{th.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Language & Translations */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-zinc-200 font-semibold">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Language & Translation System (with Auto-Detection)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Select interface language or let Jigsaw auto-detect your browser locale:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onSelectLang(lang.code)}
                  className={`flex items-center space-x-2 p-2 rounded-lg border transition ${
                    currentLang === lang.code
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono">
                    {lang.flag}
                  </span>
                  <span className="truncate">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Active Cryptographic Modules Status */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-zinc-200 font-semibold">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Security & Cryptographic Capabilities Status</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Password Protection (PBKDF2 600k)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Shamir Threshold ($K$-of-$N$) Key Split</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Identicon / Vizhash Avatars</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>PDF, Image & Media Decryption Preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>QR Code URL Generator for Mobile</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>"Forever" & "Burn After Reading" TTLs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfigSettingsModal;
