import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  EyeOff,
  Zap,
  Globe,
  Settings,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { PanicOverlay } from './PanicOverlay';
import { ConfigSettingsModal } from './ConfigSettingsModal';
import { WhyUsModal } from './WhyUsModal';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const [panicActive, setPanicActive] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showWhyUsModal, setShowWhyUsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { currentLang, setLanguage, t } = useLanguage();

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('jigsaw_theme') || 'theme-cyber';
  });

  useEffect(() => {
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


  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo with Thunderbolt Icon */}
          <Link to="/" className="flex items-center space-x-3 group" title="JigsawBin Home" aria-label="JigsawBin Home">
            <div className="w-10 h-10 rounded-xl jigsaw-logo-badge flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Zap className="w-5 h-5 jigsaw-logo-icon" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white font-mono">
                Jigsaw<span className="text-blue-500">Bin</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav: Highlighted Create Secret CTA */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            <Link
              to="/create"
              aria-label="Create New Secret"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 border border-blue-400/40 hover:border-blue-400/80 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>{t.new_secret || 'Create Secret'}</span>
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Why Us Button */}
            <button
              onClick={() => setShowWhyUsModal(true)}
              aria-label="Why JigsawBin vs PrivateBin comparison"
              className="nav-why-us flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-400 text-xs font-mono transition font-bold"
              title="Why JigsawBin vs PrivateBin"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline font-bold">Why Us?</span>
            </button>

            {/* Language & Settings / Theme Button */}
            <button
              onClick={() => setShowConfigModal(true)}
              aria-label="Open settings, themes and languages"
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
              aria-label="Activate panic mask emergency decoy"
              title="Activate Panic Mask (Esc)"
              className="nav-panic flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-mono transition font-semibold"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.panic_mask || 'Panic'}</span>
              <kbd className="hidden sm:inline text-[10px] px-1 py-0.2 rounded bg-red-900/60 text-red-300">
                Esc
              </kbd>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="md:hidden p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-zinc-800 bg-zinc-950/95 font-mono text-xs space-y-2">
            <Link
              to="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-blue-600 text-white font-bold transition shadow-md shadow-blue-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.new_secret || 'Create Secret'}</span>
            </Link>
            <button
              onClick={() => { setShowWhyUsModal(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-950/30 text-blue-300 text-left"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Why JigsawBin vs PrivateBin?</span>
            </button>
          </div>
        )}
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

      {/* Why Us Comparison Modal */}
      <WhyUsModal
        isOpen={showWhyUsModal}
        onClose={() => setShowWhyUsModal(false)}
      />
    </>
  );
};
export default Navbar;
