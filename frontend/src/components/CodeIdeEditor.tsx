import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import {
  Sparkles,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Terminal,
} from 'lucide-react';
import {
  detectCodeLanguage,
  LANGUAGE_REGISTRY,
} from '../utils/languageDetector';

interface CodeIdeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  placeholder?: string;
}

export const IDE_THEMES = [
  { id: 'cyber', label: 'Cyber Dark', bg: '#090d16', gutter: '#111827', text: '#e2e8f0', caret: '#38bdf8', themeClass: 'ide-theme-cyber' },
  { id: 'monokai', label: 'Monokai Pro', bg: '#272822', gutter: '#1e1f1c', text: '#f8f8f2', caret: '#f92672', themeClass: 'ide-theme-monokai' },
  { id: 'github-dark', label: 'GitHub Dark', bg: '#0d1117', gutter: '#161b22', text: '#c9d1d9', caret: '#79c0ff', themeClass: 'ide-theme-github-dark' },
  { id: 'matrix', label: 'Matrix Hacker', bg: '#020c04', gutter: '#031808', text: '#4ade80', caret: '#4ade80', themeClass: 'ide-theme-matrix' },
  { id: 'dracula', label: 'Dracula Twilight', bg: '#1e1a29', gutter: '#282237', text: '#f8f8f2', caret: '#ff79c6', themeClass: 'ide-theme-dracula' },
  { id: 'solarized', label: 'Solarized Amber', bg: '#001f27', gutter: '#002833', text: '#fef3c7', caret: '#f59e0b', themeClass: 'ide-theme-solarized' },
];

export const CodeIdeEditor: React.FC<CodeIdeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  placeholder = '# Write or paste your code here...',
}) => {
  const [autoDetect, setAutoDetect] = useState(true);
  const activeTheme = 'cyber';
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedToast, setDetectedToast] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  // Auto-detect language on text change
  useEffect(() => {
    if (!autoDetect || !value || value.trim().length < 4) return;

    const detected = detectCodeLanguage(value);
    if (detected && detected !== language) {
      onLanguageChange(detected);
      const info = LANGUAGE_REGISTRY[detected];
      if (info) {
        setDetectedToast(`Auto-Detected: ${info.name} [${info.tag}]`);
        const timer = setTimeout(() => setDetectedToast(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [value, autoDetect, language, onLanguageChange]);

  // Syntax highlighting with Prism
  const highlightedCode = useMemo(() => {
    if (!value) return '';
    const prismLang =
      Prism.languages[language] ||
      Prism.languages.javascript ||
      Prism.languages.plaintext;
    try {
      return Prism.highlight(value, prismLang, language);
    } catch {
      return value;
    }
  }, [value, language]);

  // Total lines
  const lines = useMemo(() => {
    return value ? value.split('\n') : [''];
  }, [value]);

  // Synced scrolling between textarea, highlighted pre, and line gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  // Cursor position tracking & Tab indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value: text } = textarea;

    // Tab Key: Indent with 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const before = text.substring(0, selectionStart);
      const after = text.substring(selectionEnd);
      const updated = before + '  ' + after;
      onChange(updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        updateCursorPosition();
      });
    }
  };

  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, value: text } = textarea;
    const textBefore = text.substring(0, selectionStart);
    const lineList = textBefore.split('\n');
    const line = lineList.length;
    const col = lineList[lineList.length - 1].length + 1;
    setCursorPos({ line, col });
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentThemeObj = IDE_THEMES.find((th) => th.id === activeTheme) || IDE_THEMES[0];
  const activeLangInfo = LANGUAGE_REGISTRY[language] || {
    id: language,
    name: language.toUpperCase(),
    extension: language,
    tag: language.toUpperCase().slice(0, 3),
    color: '#38bdf8',
  };

  const fileName = `main.${activeLangInfo.extension}`;

  return (
    <div
      className={`rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden font-mono flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-zinc-950/95 backdrop-blur-xl' : 'relative w-full'
      }`}
      style={{ backgroundColor: currentThemeObj.bg }}
    >
      {/* 1. IDE TOP TITLEBAR */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/90 border-b border-zinc-800/80 flex-wrap gap-2 text-xs select-none">
        {/* Left: Window Dots & File Tab */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 pr-2 border-r border-zinc-800">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block hover:opacity-80 transition" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block hover:opacity-80 transition" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block hover:opacity-80 transition" />
          </div>

          {/* Active File Tab */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 font-bold shadow-sm">
            <span
              className="text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-zinc-950 border border-zinc-800"
              style={{ color: activeLangInfo.color }}
            >
              {activeLangInfo.tag}
            </span>
            <span className="text-xs">{fileName}</span>
            <span
              className="w-1.5 h-1.5 rounded-full ml-1"
              style={{ backgroundColor: activeLangInfo.color }}
            />
          </div>

          {/* Live Highlight Indicator Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Syntax Active</span>
          </div>
        </div>

        {/* Center: Auto-detect badge notification */}
        {detectedToast && (
          <div className="animate-fadeIn px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{detectedToast}</span>
          </div>
        )}

        {/* Right: Controls (Auto-Detect, Language Selector, Copy, Fullscreen) */}
        <div className="flex items-center space-x-2">
          {/* Auto-Detect Toggle */}
          <button
            type="button"
            onClick={() => setAutoDetect(!autoDetect)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center space-x-1 ${
              autoDetect
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Automatic Language Detection"
          >
            <Sparkles className="w-3 h-3" />
            <span>Auto: {autoDetect ? 'ON' : 'OFF'}</span>
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => {
              setAutoDetect(false);
              onLanguageChange(e.target.value);
            }}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
          >
            {Object.values(LANGUAGE_REGISTRY).map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition disabled:opacity-40"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand IDE Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME LIVE SYNTAX HIGHLIGHTED EDITOR CANVAS */}
      <div
        className={`relative flex flex-1 overflow-hidden ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-80'}`}
        onClick={() => textareaRef.current?.focus()}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="select-none py-3 px-3 text-right text-zinc-600 text-xs border-r border-zinc-800/80 overflow-hidden font-mono flex-shrink-0"
          style={{
            backgroundColor: currentThemeObj.gutter,
            minWidth: '3.5rem',
            lineHeight: '1.5rem',
          }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              style={{ height: '1.5rem', lineHeight: '1.5rem' }}
              className={`${
                cursorPos.line === i + 1 ? 'text-zinc-300 font-bold' : 'text-zinc-600'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Real-time Overlay Viewport: Prism Highlighted Layer + Live Editable Transparent Textarea */}
        <div
          className={`relative flex-1 h-full overflow-hidden ${currentThemeObj.themeClass}`}
          style={{ backgroundColor: currentThemeObj.bg }}
        >
          {/* Layer 1 (Underlay): Real-Time Syntax Highlighting */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 p-3 font-mono text-xs overflow-hidden pointer-events-none select-none whitespace-pre"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
              tabSize: 2,
              lineHeight: '1.5rem',
              letterSpacing: '0px',
              border: 'none',
              boxSizing: 'border-box',
            }}
          >
            <code
              className={`language-${language}`}
              style={{
                lineHeight: '1.5rem',
                fontFamily: 'inherit',
              }}
              dangerouslySetInnerHTML={{
                __html: value
                  ? highlightedCode + (value.endsWith('\n') ? ' ' : '')
                  : `<span class="text-zinc-600">${placeholder}</span>`,
              }}
            />
          </pre>

          {/* Layer 2 (Overlay): Live Transparent Interactive Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursorPosition();
            }}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="absolute inset-0 w-full h-full p-3 font-mono text-xs focus:outline-none resize-none whitespace-pre overflow-auto z-10 selection:bg-blue-600/40 selection:text-white"
            style={{
              backgroundColor: 'transparent',
              color: 'transparent',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
              tabSize: 2,
              lineHeight: '1.5rem',
              letterSpacing: '0px',
              caretColor: currentThemeObj.caret || '#38bdf8',
              border: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 3. IDE BOTTOM STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-400 select-none">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-semibold text-zinc-300">
            <Terminal className="w-3 h-3 text-blue-400" />
            <span>Jigsaw Code IDE</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="text-zinc-600">•</span>
          <span>{lines.length} lines</span>
          <span className="text-zinc-600">•</span>
          <span>{value.length} chars</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline">Spaces: 2</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span>UTF-8</span>
          <span className="text-zinc-600">•</span>
          <span
            className="font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800"
            style={{ color: activeLangInfo.color }}
          >
            {activeLangInfo.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodeIdeEditor;
