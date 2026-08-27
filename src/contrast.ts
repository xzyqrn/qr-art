export interface ContrastResult {
  ratio: number;
  rating: "excellent" | "good" | "poor";
  message: string;
  isDarkOnLight: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function checkContrast(fgHex: string, bgHex: string, isTransparentBg = false): ContrastResult {
  if (isTransparentBg) {
    return {
      ratio: 10,
      rating: "good",
      message: "Transparent BG (Contrast depends on export background)",
      isDarkOnLight: true,
    };
  }

  const fg = hexToRgb(fgHex) || { r: 0, g: 0, b: 0 };
  const bg = hexToRgb(bgHex) || { r: 255, g: 255, b: 255 };

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (brighter + 0.05) / (darker + 0.05);

  const isDarkOnLight = l2 > l1;

  if (ratio >= 7.0) {
    return {
      ratio: Number(ratio.toFixed(1)),
      rating: "excellent",
      message: `Excellent contrast (${ratio.toFixed(1)}:1) — Highly scannable`,
      isDarkOnLight,
    };
  } else if (ratio >= 4.0) {
    return {
      ratio: Number(ratio.toFixed(1)),
      rating: "good",
      message: `Good contrast (${ratio.toFixed(1)}:1) — Scannable`,
      isDarkOnLight,
    };
  } else {
    return {
      ratio: Number(ratio.toFixed(1)),
      rating: "poor",
      message: `⚠️ Low contrast (${ratio.toFixed(1)}:1) — May fail to scan`,
      isDarkOnLight,
    };
  }
}
