export interface SavedDesign {
  id: string;
  name: string;
  createdAt: number;
  payloadType: string;
  previewDataUrl: string;
  config: {
    url: string;
    dotsColor: string;
    dotsColor2?: string;
    dotsGradientType: string;
    dotsRotation: number;
    bgColor: string;
    bgColor2?: string;
    bgGradientType: string;
    bgRotation?: number;
    bgTransparent: boolean;
    cornerSqColor: string;
    cornerDotColor: string;
    dotType: string;
    cornerType: string;
    cornerDotType: string;
    errorLevel: string;
    margin?: number;
    size?: number;
    frameStyle?: string;
    frameText?: string;
    selectedStyle: string;
    selectedKit: string;
  };
}

const STORAGE_KEY = "xzyqrn_qr_history_v1";
const FAVORITES_KEY = "xzyqrn_qr_favorites_v1";

export function loadHistory(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(item: Omit<SavedDesign, "id" | "createdAt">): SavedDesign[] {
  try {
    const history = loadHistory();
    const newItem: SavedDesign = {
      ...item,
      id: "hist_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 12);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return loadHistory();
  }
}

export function removeFromHistory(id: string): SavedDesign[] {
  try {
    const updated = loadHistory().filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return loadHistory();
  }
}

export function loadFavorites(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(item: SavedDesign): boolean {
  return loadFavorites().some(
    (f) => f.id === item.id || (f.config.url === item.config.url && f.name === item.name),
  );
}

export function toggleFavorite(item: SavedDesign): { favorites: SavedDesign[]; isFav: boolean } {
  try {
    const favs = loadFavorites();
    const exists = favs.some(
      (f) => f.id === item.id || (f.config.url === item.config.url && f.name === item.name),
    );
    const updated = exists
      ? favs.filter((f) => f.id !== item.id && !(f.config.url === item.config.url && f.name === item.name))
      : [item, ...favs].slice(0, 12);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return { favorites: updated, isFav: !exists };
  } catch {
    return { favorites: [], isFav: false };
  }
}
