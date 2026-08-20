/**
 * Automatic Programming Language Detector
 * Analyzes syntax, keywords, idioms, and tokens to detect language.
 */

export interface DetectedLanguageInfo {
  id: string;
  name: string;
  extension: string;
  tag: string;
  color: string;
}

export const LANGUAGE_REGISTRY: Record<string, DetectedLanguageInfo> = {
  python: {
    id: 'python',
    name: 'Python',
    extension: 'py',
    tag: 'PY',
    color: '#38bdf8',
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    tag: 'JS',
    color: '#facc15',
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extension: 'ts',
    tag: 'TS',
    color: '#60a5fa',
  },
  html: {
    id: 'html',
    name: 'HTML',
    extension: 'html',
    tag: 'HTML',
    color: '#fb923c',
  },
  css: {
    id: 'css',
    name: 'CSS',
    extension: 'css',
    tag: 'CSS',
    color: '#38bdf8',
  },
  json: {
    id: 'json',
    name: 'JSON',
    extension: 'json',
    tag: 'JSON',
    color: '#a3e635',
  },
  sql: {
    id: 'sql',
    name: 'SQL',
    extension: 'sql',
    tag: 'SQL',
    color: '#ec4899',
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    extension: 'rs',
    tag: 'RS',
    color: '#f97316',
  },
  go: {
    id: 'go',
    name: 'Go',
    extension: 'go',
    tag: 'GO',
    color: '#06b6d4',
  },
  bash: {
    id: 'bash',
    name: 'Bash / Shell',
    extension: 'sh',
    tag: 'SH',
    color: '#4ade80',
  },
  cpp: {
    id: 'cpp',
    name: 'C / C++',
    extension: 'cpp',
    tag: 'CPP',
    color: '#818cf8',
  },
  yaml: {
    id: 'yaml',
    name: 'YAML',
    extension: 'yaml',
    tag: 'YAML',
    color: '#c084fc',
  },
};

export function detectCodeLanguage(code: string): string | null {
  if (!code || code.trim().length < 4) return null;

  const text = code.trim();

  // Python patterns
  if (
    /(?:^|\n)\s*(?:def\s+[a-zA-Z_]\w*|import\s+[a-zA-Z_]|from\s+[a-zA-Z_]\w*\s+import|print\(|input\(|elif\s+|if\s+__name__\s*==\s*['"]__main__['"]|class\s+[a-zA-Z_]\w*\(.*?\):|f['"].*?\{.*?\}['"]|#.*?\n\s*(?:def|import|print|class))/m.test(
      text
    )
  ) {
    return 'python';
  }

  // JSON patterns
  if (
    (text.startsWith('{') && text.endsWith('}')) ||
    (text.startsWith('[') && text.endsWith(']'))
  ) {
    try {
      JSON.parse(text);
      return 'json';
    } catch {
      // not strict JSON, continue checks
    }
  }

  // HTML / XML patterns
  if (
    /<!DOCTYPE\s+html|<html[\s>]|<div[\s>]|<script[\s>]|<head[\s>]|<body[\s>]|<p[\s>]|<span[\s>]/i.test(
      text
    )
  ) {
    return 'html';
  }

  // SQL patterns
  if (
    /(?:^|\s)(?:SELECT\s+.*?\s+FROM|INSERT\s+INTO|UPDATE\s+.*?\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|WHERE\s+.*?=|ORDER\s+BY|GROUP\s+BY|INNER\s+JOIN|LEFT\s+JOIN)(?:\s|$)/im.test(
      text
    )
  ) {
    return 'sql';
  }

  // Rust patterns
  if (
    /(?:^|\n)\s*(?:fn\s+main\s*\(|pub\s+fn|let\s+mut\s+|impl\s+|match\s+[a-zA-Z_]|println!|use\s+std::|#\[derive\()/m.test(
      text
    )
  ) {
    return 'rust';
  }

  // Go patterns
  if (
    /(?:^|\n)\s*(?:package\s+[a-zA-Z_]|func\s+[a-zA-Z_]|import\s*\(\s*"fmt"|fmt\.Print|type\s+[a-zA-Z_]\w*\s+struct)/m.test(
      text
    )
  ) {
    return 'go';
  }

  // C / C++ patterns
  if (
    /(?:^|\n)\s*(?:#include\s*<|int\s+main\s*\(|std::cout|std::vector|printf\(|cout\s*<<)/m.test(
      text
    )
  ) {
    return 'cpp';
  }

  // Bash / Shell patterns
  if (
    /(?:^#!\/(?:usr\/)?bin\/(?:bash|sh|zsh)|(?:^|\n)\s*(?:echo\s+['"]|grep\s+|sudo\s+|chmod\s+|curl\s+|export\s+[a-zA-Z_]+=))/m.test(
      text
    )
  ) {
    return 'bash';
  }

  // TypeScript patterns
  if (
    /(?:interface\s+[A-Z]\w*\s*\{|type\s+[A-Z]\w*\s*=|:\s*(?:string|number|boolean|any|void|Promise<.*?>)|import\s+type\s+)/m.test(
      text
    )
  ) {
    return 'typescript';
  }

  // JavaScript patterns
  if (
    /(?:const\s+[a-zA-Z_]\w*\s*=|let\s+[a-zA-Z_]\w*=|function\s+[a-zA-Z_]\w*\(|=>\s*\{|console\.log\(|document\.querySelector|export\s+default)/m.test(
      text
    )
  ) {
    return 'javascript';
  }

  // CSS patterns
  if (
    /(?:[.#][a-zA-Z_][\w-]*\s*\{|@media\s*\(|margin:\s*|padding:\s*|background-color:\s*|display:\s*(?:flex|grid|block);)/m.test(
      text
    )
  ) {
    return 'css';
  }

  // YAML patterns
  if (
    /(?:^---\s*\n|[a-zA-Z0-9_-]+:\s+(?:[a-zA-Z0-9_-]+|true|false|\d+|\[.*\]|\{.*\}))/m.test(
      text
    )
  ) {
    return 'yaml';
  }

  return null;
}
