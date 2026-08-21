import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
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
  const location = useLocation();
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

  const navItems = [
    { path: '/create', label: t.new_secret || 'Create Secret', icon: PlusCircle },
  ];

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

          {/* Desktop Nav items */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
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

            {/* Zero Knowledge Security Status Indicator */}
            <div className="nav-zk hidden lg:flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge</span>
            </div>

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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    isActive ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
