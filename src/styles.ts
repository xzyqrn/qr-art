import type { Options } from "qr-code-styling";

export type ArtStyleId =
  | "base"
  | "void"
  | "newsprint"
  | "signal"
  | "static"
  | "mosaic"
  | "beads"
  | "lattice"
  | "pixel"
  | "neon"
  | "pastel"
  | "ink"
  | "sunset"
  | "mono"
  | "playful";

export interface ArtStyle {
  id: ArtStyleId;
  name: string;
  description: string;
  swatch: string;
  /** Signature xzyqrn house presets (shown with a small house hint). */
  house?: boolean;
  /** Illustrated module-shape patterns (shapes only; colors stay with pickers). */
  pattern?: boolean;
  options: Partial<Options>;
}

/** Artistic looks used as presets — Base, house, pattern shapes, then the rest.
 * Shape types (dots / corner square / corner dot) are applied on style select.
 * Colors in options are descriptive only; the UI color pickers own runtime colors.
 */
export const ART_STYLES: ArtStyle[] = [
  {
    id: "base",
    name: "Base",
    description: "Classic solid black on white",
    swatch: "linear-gradient(135deg, #ffffff 0%, #ffffff 48%, #000000 48%, #000000 100%)",
    options: {
      backgroundOptions: { color: "#ffffff" },
      dotsOptions: {
        type: "square",
        color: "#000000",
      },
      cornersSquareOptions: {
        type: "square",
        color: "#000000",
      },
      cornersDotOptions: {
        type: "square",
        color: "#000000",
      },
    },
  },
  {
    id: "void",
    name: "void",
    description: "Ink on night · house",
    house: true,
    swatch: "linear-gradient(135deg, #0a0a0a 0%, #0a0a0a 72%, #e8e4dc 72%, #e8e4dc 100%)",
    options: {
      backgroundOptions: { color: "#0a0a0a" },
      dotsOptions: {
        type: "classy-rounded",
        color: "#e8e4dc",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#e8e4dc",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#a8a49c",
      },
    },
  },
  {
    id: "newsprint",
    name: "newsprint",
    description: "Press black on paper · house",
    house: true,
    swatch: "linear-gradient(135deg, #f2ead8 0%, #f2ead8 45%, #1c1917 45%, #1c1917 100%)",
    options: {
      backgroundOptions: { color: "#f2ead8" },
      dotsOptions: {
        type: "classy",
        color: "#1c1917",
      },
      cornersSquareOptions: {
        type: "square",
        color: "#1c1917",
      },
      cornersDotOptions: {
        type: "square",
        color: "#44403c",
      },
    },
  },
  {
    id: "signal",
    name: "signal",
    description: "One hard accent · house",
    house: true,
    swatch:
      "linear-gradient(135deg, #f7f5f0 0%, #f7f5f0 38%, #111111 38%, #111111 68%, #ff2e00 68%, #ff2e00 100%)",
    options: {
      backgroundOptions: { color: "#f7f5f0" },
      dotsOptions: {
        type: "square",
        color: "#111111",
      },
      cornersSquareOptions: {
        type: "square",
        color: "#ff2e00",
      },
      cornersDotOptions: {
        type: "square",
        color: "#111111",
      },
    },
  },
  {
    id: "static",
    name: "static",
    description: "Scanline noise · house",
    house: true,
    swatch:
      "linear-gradient(135deg, #0d1210 0%, #0d1210 55%, #7dffa0 55%, #7dffa0 78%, #9ae6b4 78%, #9ae6b4 100%)",
    options: {
      backgroundOptions: { color: "#0d1210" },
      dotsOptions: {
        type: "dots",
        color: "#7dffa0",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#9ae6b4",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#5fd98a",
      },
    },
  },

  {
    id: "mosaic",
    name: "mosaic",
    description: "Tile mosaic · pattern",
    pattern: true,
    swatch:
      "linear-gradient(135deg, #f7f5f0 0%, #f7f5f0 40%, #2a2825 40%, #2a2825 70%, #8a857c 70%, #8a857c 100%)",
    options: {
      backgroundOptions: { color: "#f7f5f0" },
      dotsOptions: {
        type: "extra-rounded",
        color: "#2a2825",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#2a2825",
      },
      cornersDotOptions: {
        type: "classy-rounded",
        color: "#2a2825",
      },
    },
  },
  {
    id: "beads",
    name: "beads",
    description: "Bead curtain · pattern",
    pattern: true,
    swatch:
      "radial-gradient(circle at 30% 40%, #1a1917 0 28%, transparent 29%), radial-gradient(circle at 70% 60%, #1a1917 0 22%, transparent 23%), #efece4",
    options: {
      backgroundOptions: { color: "#efece4" },
      dotsOptions: {
        type: "dots",
        color: "#1a1917",
      },
      cornersSquareOptions: {
        type: "dot",
        color: "#1a1917",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#1a1917",
      },
    },
  },
  {
    id: "lattice",
    name: "lattice",
    description: "Lattice · pattern",
    pattern: true,
    swatch:
      "linear-gradient(135deg, #f4efe6 0%, #f4efe6 35%, #171513 35%, #171513 55%, #f4efe6 55%, #f4efe6 70%, #171513 70%, #171513 100%)",
    options: {
      backgroundOptions: { color: "#f4efe6" },
      dotsOptions: {
        type: "classy",
        color: "#171513",
      },
      cornersSquareOptions: {
        type: "classy-rounded",
        color: "#171513",
      },
      cornersDotOptions: {
        type: "classy",
        color: "#171513",
      },
    },
  },
  {
    id: "pixel",
    name: "pixel",
    description: "Hard pixel · pattern",
    pattern: true,
    swatch:
      "linear-gradient(90deg, #111111 0%, #111111 25%, #ffffff 25%, #ffffff 50%, #111111 50%, #111111 75%, #ffffff 75%, #ffffff 100%)",
    options: {
      backgroundOptions: { color: "#ffffff" },
      dotsOptions: {
        type: "square",
        color: "#111111",
      },
      cornersSquareOptions: {
        type: "square",
        color: "#111111",
      },
      cornersDotOptions: {
        type: "square",
        color: "#111111",
      },
    },
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Electric cyan on deep night",
    swatch: "linear-gradient(135deg, #050816, #00f5ff 55%, #7c6cff)",
    options: {
      backgroundOptions: { color: "#050816" },
      dotsOptions: {
        type: "rounded",
        color: "#00f5ff",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#7c6cff",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#ff4fd8",
      },
    },
  },
  {
    id: "pastel",
    name: "Pastel Soft",
    description: "Lavender dots on cream",
    swatch: "linear-gradient(135deg, #fff7fb, #c4b5fd, #fda4af)",
    options: {
      backgroundOptions: { color: "#fff7fb" },
      dotsOptions: {
        type: "dots",
        color: "#a78bfa",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#f9a8d4",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#67e8f9",
      },
    },
  },
  {
    id: "ink",
    name: "Ink Wash",
    description: "Brushy black on warm paper",
    swatch: "linear-gradient(135deg, #f4efe6, #1c1917 60%, #44403c)",
    options: {
      backgroundOptions: { color: "#f4efe6" },
      dotsOptions: {
        type: "classy",
        color: "#1c1917",
      },
      cornersSquareOptions: {
        type: "square",
        color: "#292524",
      },
      cornersDotOptions: {
        type: "square",
        color: "#57534e",
      },
    },
  },
  {
    id: "sunset",
    name: "Sunset Gradient",
    description: "Coral to amber fade",
    swatch: "linear-gradient(135deg, #1a0b12, #ff6b35, #f7c948)",
    options: {
      backgroundOptions: { color: "#1a0b12" },
      dotsOptions: {
        type: "rounded",
        gradient: {
          type: "linear",
          rotation: Math.PI / 4,
          colorStops: [
            { offset: 0, color: "#ff6b35" },
            { offset: 0.55, color: "#f7c948" },
            { offset: 1, color: "#ff8fab" },
          ],
        },
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#ff8fab",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#f7c948",
      },
    },
  },
  {
    id: "mono",
    name: "Mono Elegant",
    description: "Refined charcoal on white",
    swatch: "linear-gradient(135deg, #f8fafc, #0f172a 55%, #64748b)",
    options: {
      backgroundOptions: { color: "#f8fafc" },
      dotsOptions: {
        type: "classy-rounded",
        color: "#0f172a",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#0f172a",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#334155",
      },
    },
  },
  {
    id: "playful",
    name: "Playful Dots",
    description: "Bubble candy on mint",
    swatch: "linear-gradient(135deg, #ecfdf5, #22d3ee, #f472b6)",
    options: {
      backgroundOptions: { color: "#ecfdf5" },
      dotsOptions: {
        type: "dots",
        color: "#0d9488",
      },
      cornersSquareOptions: {
        type: "dot",
        color: "#db2777",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#0891b2",
      },
    },
  },
];

export function getStyle(id: ArtStyleId): ArtStyle {
  const found = ART_STYLES.find((s) => s.id === id);
  return found ?? ART_STYLES[0];
}
