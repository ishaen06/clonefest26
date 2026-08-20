/**
 * Client-Side Vizhash / Identicon Generator (Inspired by PrivateBin & GitHub identicons)
 * Deterministically generates a symmetric 5x5 pixel/block geometric SVG avatar from a string hash.
 */

// Simple deterministic hash function
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const PALETTES = [
  { fg: '#3b82f6', bg: '#1e293b' }, // Blue
  { fg: '#10b981', bg: '#064e3b' }, // Emerald
  { fg: '#a855f7', bg: '#4c1d95' }, // Purple
  { fg: '#f59e0b', bg: '#78350f' }, // Amber
  { fg: '#f43f5e', bg: '#881337' }, // Rose
  { fg: '#06b6d4', bg: '#164e63' }, // Cyan
  { fg: '#ec4899', bg: '#831843' }, // Pink
  { fg: '#14b8a6', bg: '#134e4a' }, // Teal
];

export function generateVizhashSvg(input: string, size = 28): string {
  const hash = stringToHash(input || 'anonymous');
  const palette = PALETTES[hash % PALETTES.length];

  // 5x5 grid with horizontal symmetry (column 0==4, column 1==3, column 2 center)
  const grid: boolean[][] = [];
  for (let row = 0; row < 5; row++) {
    grid[row] = [];
    const rHash = (hash >> (row * 3)) & 0x7;
    const c0 = (rHash & 1) !== 0;
    const c1 = (rHash & 2) !== 0;
    const c2 = (rHash & 4) !== 0;

    grid[row][0] = c0;
    grid[row][1] = c1;
    grid[row][2] = c2;
    grid[row][3] = c1; // symmetrical
    grid[row][4] = c0; // symmetrical
  }

  const cellSize = size / 5;
  let rects = '';

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${palette.fg}" />`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background-color: ${palette.bg}; border-radius: 6px; overflow: hidden;">${rects}</svg>`;
}
