export type KitId = "paper" | "stamp" | "ticket" | "film";

export interface BrandKit {
  id: KitId;
  name: string;
  description: string;
  /** Mini swatch for the picker card. */
  swatch: string;
}

export const BRAND_KITS: BrandKit[] = [
  {
    id: "paper",
    name: "Paper",
    description: "Warm stock · quiet wordmark",
    swatch: "linear-gradient(135deg, #f3efe6 0%, #f3efe6 70%, #6f6a62 70%, #6f6a62 100%)",
  },
  {
    id: "stamp",
    name: "Stamp",
    description: "Ink border · rubber mark",
    swatch: "linear-gradient(135deg, #f3efe6 0%, #f3efe6 55%, #1a1917 55%, #1a1917 100%)",
  },
  {
    id: "ticket",
    name: "Ticket",
    description: "Perforations · bold strip",
    swatch: "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #1a1917 50%, #1a1917 100%)",
  },
  {
    id: "film",
    name: "Film",
    description: "Matte frame · rebate type",
    swatch: "linear-gradient(135deg, #111111 0%, #111111 72%, #ffffff 72%, #ffffff 100%)",
  },
];

export function getKit(id: KitId): BrandKit {
  return BRAND_KITS.find((k) => k.id === id) ?? BRAND_KITS[0];
}
