import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  Key,
  EyeOff,
  Zap,
  Globe,
  Settings,
} from 'lucide-react';
import { PanicOverlay } from './PanicOverlay';
import { ConfigSettingsModal } from './ConfigSettingsModal';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [panicActive, setPanicActive] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Global Language Context
  const { currentLang, setLanguage, t } = useLanguage();

  // Active Theme / Template
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('jigsaw_theme') || 'theme-cyber';
  });

  useEffect(() => {
    // Remove all theme classes and apply selected
    document.body.className = '';
    document.body.classList.add(currentTheme);
    localStorage.setItem('jigsaw_theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanicActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { path: '/create', label: t.new_secret || 'Create Secret', icon: PlusCircle },
    { path: '/manage', label: t.manage || 'Manage', icon: Key },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo with Thunderbolt Icon */}
          <Link to="/" className="flex items-center space-x-3 group" title="JigsawBin Home">
            <div className="w-10 h-10 rounded-xl jigsaw-logo-badge flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Zap className="w-5 h-5 jigsaw-logo-icon" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white font-mono">
                Jigsaw<span className="text-blue-500">Bin</span>
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono transition ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Language & Settings / Theme Button */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono transition"
              title="Settings, Themes & Languages"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="uppercase text-[11px] font-bold">{currentLang}</span>
              <Settings className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
            </button>

            {/* Panic Decoy Button */}
            <button
              onClick={() => setPanicActive(true)}
              title="Activate Panic Mask (Esc)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 text-xs font-mono transition"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.panic_mask || 'Panic'}</span>
              <kbd className="hidden sm:inline text-[10px] px-1 py-0.2 rounded bg-red-900/60 text-red-300">
                Esc
              </kbd>
            </button>

            {/* Zero Knowledge Security Status Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge</span>
            </div>
          </div>
        </div>
      </header>

      {/* Panic Decoy Screen */}
      <PanicOverlay active={panicActive} onDismiss={() => setPanicActive(false)} />

      {/* Settings / Templates / Languages Modal */}
      <ConfigSettingsModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        currentLang={currentLang}
        onSelectLang={setLanguage}
      />
    </>
  );
};
export default Navbar;
