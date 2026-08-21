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
import 'prismjs/components/prism-markup';
import { Sparkles, Copy, Check, Maximize2, Minimize2, Terminal, Code2, Eye } from 'lucide-react';
import { detectCodeLanguage, LANGUAGE_REGISTRY } from '../utils/languageDetector';

interface CodeIdeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  placeholder?: string;
}

export const IDE_THEMES = [
  { id: 'cyber',       label: 'Cyber Dark',      bg: '#090d16', gutter: '#111827', text: '#e2e8f0', caret: '#38bdf8', themeClass: 'ide-theme-cyber' },
  { id: 'monokai',     label: 'Monokai Pro',      bg: '#272822', gutter: '#1e1f1c', text: '#f8f8f2', caret: '#f92672', themeClass: 'ide-theme-monokai' },
  { id: 'github-dark', label: 'GitHub Dark',      bg: '#0d1117', gutter: '#161b22', text: '#c9d1d9', caret: '#79c0ff', themeClass: 'ide-theme-github-dark' },
  { id: 'matrix',      label: 'Matrix Hacker',    bg: '#020c04', gutter: '#031808', text: '#4ade80', caret: '#4ade80', themeClass: 'ide-theme-matrix' },
  { id: 'dracula',     label: 'Dracula Twilight', bg: '#1e1a29', gutter: '#282237', text: '#f8f8f2', caret: '#ff79c6', themeClass: 'ide-theme-dracula' },
  { id: 'solarized',   label: 'Solarized Amber',  bg: '#001f27', gutter: '#002833', text: '#fef3c7', caret: '#f59e0b', themeClass: 'ide-theme-solarized' },
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
  const [activeTab, setActiveTab] = useState<'edit' | 'highlight'>('edit');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedToast, setDetectedToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  // Focus textarea when switching to edit mode
  useEffect(() => {
    if (activeTab === 'edit') setTimeout(() => textareaRef.current?.focus(), 50);
  }, [activeTab]);

  // Auto-detect language
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

  // Syntax highlighting (only used in Highlight tab)
  const highlightedCode = useMemo(() => {
    if (!value) return '';
    const langKey = (language || 'plaintext').toLowerCase();
    const grammar =
      Prism.languages[langKey] ||
      (langKey === 'html' || langKey === 'xml' ? Prism.languages.markup : null) ||
      null;
    if (grammar) {
      try { return Prism.highlight(value, grammar, langKey); }
      catch { return value; }
    }
    return value;
  }, [value, language]);

  const lines = useMemo(() => (value ? value.split('\n') : ['']), [value]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta || e.key !== 'Tab') return;
    e.preventDefault();
    const { selectionStart: ss, selectionEnd: se, value: v } = ta;
    onChange(v.substring(0, ss) + '  ' + v.substring(se));
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = ss + 2;
      updateCursorPos();
    });
  };

  const updateCursorPos = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = ta.value.substring(0, ta.selectionStart).split('\n');
    setCursorPos({ line: before.length, col: before[before.length - 1].length + 1 });
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const theme = IDE_THEMES.find((t) => t.id === activeTheme) || IDE_THEMES[0];
  const langInfo = LANGUAGE_REGISTRY[language] || {
    id: language, name: language.toUpperCase(), extension: language,
    tag: language.toUpperCase().slice(0, 3), color: '#38bdf8',
  };

  return (
    <div
      className={`rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden font-mono flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50' : 'relative w-full'}`}
      style={{ backgroundColor: theme.bg }}
    >
      {/* TITLEBAR */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/90 border-b border-zinc-800/80 flex-wrap gap-2 text-xs select-none">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5 pr-2 border-r border-zinc-800">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 font-bold">
            <span className="text-[10px] px-1 rounded bg-zinc-950 border border-zinc-800" style={{ color: langInfo.color }}>{langInfo.tag}</span>
            <span>{`main.${langInfo.extension}`}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: langInfo.color }} />
          </div>
        </div>
        {detectedToast && (
          <div className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" /><span>{detectedToast}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button type="button" onClick={() => setActiveTab('edit')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 transition ${activeTab === 'edit' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Code2 className="w-3 h-3" /><span>Edit</span>
            </button>
            <button type="button" onClick={() => setActiveTab('highlight')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 transition ${activeTab === 'highlight' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Eye className="w-3 h-3" /><span>Highlight</span>
            </button>
          </div>
          <button type="button" onClick={() => setAutoDetect(!autoDetect)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center space-x-1 ${autoDetect ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
            <Sparkles className="w-3 h-3" /><span>{`Auto: ${autoDetect ? 'ON' : 'OFF'}`}</span>
          </button>
          <select value={language} onChange={(e) => { setAutoDetect(false); onLanguageChange(e.target.value); }}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer">
            {Object.values(LANGUAGE_REGISTRY).map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
          <button type="button" onClick={handleCopy} disabled={!value}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition disabled:opacity-40">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* CANVAS */}
      <div className={`relative flex flex-1 overflow-hidden ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-80'}`}>
        {/* Gutter */}
        <div ref={gutterRef} className="select-none py-3 px-3 text-right text-xs border-r border-zinc-800/80 overflow-hidden flex-shrink-0"
          style={{ backgroundColor: theme.gutter, minWidth: '3.5rem', lineHeight: '1.5rem' }}>
          {lines.map((_, i) => (
            <div key={i} style={{ height: '1.5rem', lineHeight: '1.5rem' }}
              className={cursorPos.line === i + 1 ? 'text-zinc-300 font-bold' : 'text-zinc-600'}>
              {i + 1}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className={`relative flex-1 h-full overflow-hidden ${theme.themeClass}`} style={{ backgroundColor: theme.bg }}>
          {activeTab === 'edit' ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { onChange(e.target.value); updateCursorPos(); }}
              onKeyUp={updateCursorPos}
              onClick={updateCursorPos}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="w-full h-full p-3 focus:outline-none resize-none whitespace-pre overflow-auto placeholder-zinc-600"
              style={{
                backgroundColor: theme.bg,
                color: theme.text,
                caretColor: theme.caret || '#38bdf8',
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                fontSize: '0.75rem',
                lineHeight: '1.5rem',
                tabSize: 2,
                border: 'none',
                outline: 'none',
              }}
            />
          ) : (
            <div className="w-full h-full p-3 overflow-auto cursor-pointer" style={{ lineHeight: '1.5rem' }}
              onClick={() => setActiveTab('edit')} title="Click to return to Edit mode">
              <pre className="m-0 p-0 bg-transparent whitespace-pre">
                <code className={`language-${language}`}
                  style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", fontSize: '0.75rem', lineHeight: '1.5rem' }}
                  dangerouslySetInnerHTML={{ __html: highlightedCode || `<span style="color:#52525b">${placeholder}</span>` }}
                />
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-400 select-none">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-semibold text-zinc-300">
            <Terminal className="w-3 h-3 text-blue-400" /><span>Jigsaw Code IDE</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className={activeTab === 'highlight' ? 'text-purple-400' : ''}>{activeTab === 'edit' ? `Ln ${cursorPos.line}, Col ${cursorPos.col}` : 'Syntax Highlight View'}</span>
          <span className="text-zinc-600">•</span><span>{lines.length} lines</span>
          <span className="text-zinc-600">•</span><span>{value.length} chars</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline">Spaces: 2</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span>UTF-8</span><span className="text-zinc-600">•</span>
          <span className="font-bold px-1.5 rounded bg-zinc-900 border border-zinc-800" style={{ color: langInfo.color }}>{langInfo.name}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeIdeEditor;