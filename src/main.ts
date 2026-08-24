import QRCodeStyling, {
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
  type Options,
} from "qr-code-styling";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { ART_STYLES, getStyle, type ArtStyleId } from "./styles";
import { BRAND_KITS, type KitId } from "./kits";
import { Qr3dViewer } from "./qr3d";
import "./styles.css";

const DEFAULT_URL = "https://example.com";
const DEFAULT_STYLE: ArtStyleId = "base";
const DEFAULT_KIT: KitId = "paper";
const HOUSE_SURPRISE_IDS: ArtStyleId[] = ["void", "newsprint", "signal", "static"];

const urlInput = document.querySelector<HTMLInputElement>("#url")!;
const dotsInput = document.querySelector<HTMLInputElement>("#dots")!;
const bgInput = document.querySelector<HTMLInputElement>("#bg")!;
const bgWrap = document.querySelector<HTMLElement>("#bg-wrap")!;
const bgTransparentInput = document.querySelector<HTMLInputElement>("#bg-transparent")!;
const cornerSqInput = document.querySelector<HTMLInputElement>("#corner-sq")!;
const cornerDotInput = document.querySelector<HTMLInputElement>("#corner-dot")!;
const dotsHex = document.querySelector<HTMLElement>("#dots-hex")!;
const bgHex = document.querySelector<HTMLElement>("#bg-hex")!;
const cornerSqHex = document.querySelector<HTMLElement>("#corner-sq-hex")!;
const cornerDotHex = document.querySelector<HTMLElement>("#corner-dot-hex")!;
const dotType = document.querySelector<HTMLSelectElement>("#dot-type")!;
const cornerType = document.querySelector<HTMLSelectElement>("#corner-type")!;
const cornerDotType = document.querySelector<HTMLSelectElement>("#corner-dot-type")!;
const marginInput = document.querySelector<HTMLInputElement>("#margin")!;
const marginLabel = document.querySelector<HTMLElement>("#margin-label")!;
const errorLevel = document.querySelector<HTMLSelectElement>("#error-level")!;
const sizeInput = document.querySelector<HTMLInputElement>("#size")!;
const sizeLabel = document.querySelector<HTMLElement>("#size-label")!;
const logoUrlInput = document.querySelector<HTMLInputElement>("#logo-url")!;
const logoFileInput = document.querySelector<HTMLInputElement>("#logo-file")!;
const logoSizeInput = document.querySelector<HTMLInputElement>("#logo-size")!;
const logoSizeLabel = document.querySelector<HTMLElement>("#logo-size-label")!;
const hideDotsInput = document.querySelector<HTMLInputElement>("#hide-dots")!;
const clearLogoBtn = document.querySelector<HTMLButtonElement>("#clear-logo")!;
const styleGrid = document.querySelector<HTMLElement>("#style-grid")!;
const kitGrid = document.querySelector<HTMLElement>("#kit-grid")!;
const surpriseBtn = document.querySelector<HTMLButtonElement>("#surprise")!;
const previewStage = document.querySelector<HTMLElement>("#preview-stage")!;
const qrHost = document.querySelector<HTMLElement>("#qr")!;
const qr3dHost = document.querySelector<HTMLElement>("#qr3d")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const mode2dBtn = document.querySelector<HTMLButtonElement>("#mode-2d")!;
const mode3dBtn = document.querySelector<HTMLButtonElement>("#mode-3d")!;
const exportPngBtn = document.querySelector<HTMLButtonElement>("#export-png")!;
const exportSvgBtn = document.querySelector<HTMLButtonElement>("#export-svg")!;
const exportPosterBtn = document.querySelector<HTMLButtonElement>("#export-poster")!;
const exportMotionBtn = document.querySelector<HTMLButtonElement>("#export-motion")!;
const export3dPngBtn = document.querySelector<HTMLButtonElement>("#export-3d-png")!;

let selectedStyle: ArtStyleId = DEFAULT_STYLE;
let selectedKit: KitId = DEFAULT_KIT;
let logoDataUrl: string | null = null;
let debounceTimer = 0;
let previewMode: "2d" | "3d" = "2d";
const qr3d = new Qr3dViewer();

const qr = new QRCodeStyling({
  width: 320,
  height: 320,
  type: "canvas",
  data: DEFAULT_URL,
  margin: 8,
  qrOptions: { errorCorrectionLevel: "H" },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.28,
    margin: 6,
    crossOrigin: "anonymous",
  },
});

qr.append(qrHost);

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_URL;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function setStatus(message: string, isError = false): void {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function isTransparentBg(): boolean {
  return bgTransparentInput.checked;
}

function syncTransparentBgUI(): void {
  const on = isTransparentBg();
  bgInput.disabled = on;
  bgWrap.classList.toggle("is-dimmed", on);
  bgHex.textContent = on ? "transparent" : bgInput.value;
}

function syncHexLabels(): void {
  dotsHex.textContent = dotsInput.value;
  bgHex.textContent = isTransparentBg() ? "transparent" : bgInput.value;
  cornerSqHex.textContent = cornerSqInput.value;
  cornerDotHex.textContent = cornerDotInput.value;
}

function syncStyleSelectionUI(): void {
  for (const el of styleGrid.querySelectorAll<HTMLElement>(".style-card")) {
    el.setAttribute(
      "aria-selected",
      el.dataset.styleId === selectedStyle ? "true" : "false",
    );
  }
  previewStage.classList.toggle("preview-stage--static", selectedStyle === "static");
}

function syncKitSelectionUI(): void {
  for (const el of kitGrid.querySelectorAll<HTMLElement>(".kit-card")) {
    el.setAttribute(
      "aria-selected",
      el.dataset.kitId === selectedKit ? "true" : "false",
    );
  }
  previewStage.dataset.kit = selectedKit;
}

function selectKit(id: KitId): void {
  selectedKit = id;
  syncKitSelectionUI();
  setStatus(`Kit: ${id}`);
}

/** Apply style shapes only — never overwrite the 4 color pickers. */
function applyStyleToControls(id: ArtStyleId): void {
  const style = getStyle(id);
  const dots = style.options.dotsOptions;
  const cornerSq = style.options.cornersSquareOptions;
  const cornerDot = style.options.cornersDotOptions;

  if (dots?.type) {
    dotType.value = dots.type;
  }
  const corner = cornerSq?.type;
  if (corner) {
    cornerType.value = corner;
  }
  const cornerDotShape = cornerDot?.type;
  if (cornerDotShape) {
    cornerDotType.value = cornerDotShape;
  }
}

function selectStyle(id: ArtStyleId, statusMessage?: string): void {
  selectedStyle = id;
  syncStyleSelectionUI();
  applyStyleToControls(selectedStyle);
  render();
  if (statusMessage) {
    setStatus(statusMessage);
  }
}


/** Shift a #rrggbb hex toward white (positive) or black (negative). */
function shiftHex(hex: string, amount: number): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const num = parseInt(full, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((num >> 16) & 255) + amount);
  const g = clamp(((num >> 8) & 255) + amount);
  const b = clamp((num & 255) + amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function buildOptions(): Options {
  const size = Number(sizeInput.value) || 320;
  const data = normalizeUrl(urlInput.value);
  const logo = logoDataUrl || logoUrlInput.value.trim() || undefined;
  const margin = Number(marginInput.value);
  const imageSize = Number(logoSizeInput.value);

  // Colors always come from the 4 pickers — never style preset colors/gradients.
  return {
    width: size,
    height: size,
    type: "canvas",
    data,
    margin: Number.isFinite(margin) ? margin : 8,
    qrOptions: {
      errorCorrectionLevel: errorLevel.value as ErrorCorrectionLevel,
    },
    backgroundOptions: { color: isTransparentBg() ? "transparent" : bgInput.value },
    dotsOptions:
      selectedStyle === "mosaic"
        ? {
            type: dotType.value as DotType,
            // Gradient structure only — stops derived from current dots picker (never writes pickers).
            gradient: {
              type: "linear",
              rotation: Math.PI / 4,
              colorStops: [
                { offset: 0, color: dotsInput.value },
                { offset: 1, color: shiftHex(dotsInput.value, 48) },
              ],
            },
          }
        : {
            type: dotType.value as DotType,
            color: dotsInput.value,
          },
    cornersSquareOptions: {
      type: cornerType.value as CornerSquareType,
      color: cornerSqInput.value,
    },
    cornersDotOptions: {
      type: cornerDotType.value as CornerDotType,
      color: cornerDotInput.value,
    },
    imageOptions: {
      hideBackgroundDots: hideDotsInput.checked,
      imageSize: Number.isFinite(imageSize) ? imageSize : 0.28,
      margin: 6,
      crossOrigin: "anonymous",
    },
    image: logo,
  };
}

function syncModeUI(): void {
  const is3d = previewMode === "3d";
  mode2dBtn.setAttribute("aria-pressed", is3d ? "false" : "true");
  mode3dBtn.setAttribute("aria-pressed", is3d ? "true" : "false");
  previewStage.classList.toggle("is-3d", is3d);
  qrHost.hidden = is3d;
  qr3dHost.hidden = !is3d;
  exportPngBtn.hidden = is3d;
  exportSvgBtn.hidden = is3d;
  exportPosterBtn.hidden = is3d;
  exportMotionBtn.hidden = is3d;
  export3dPngBtn.hidden = !is3d;
  if (!is3d) {
    qrHost.style.transform = "";
  }
}

function render3d(): void {
  try {
    const data = normalizeUrl(urlInput.value);
    qr3d.mount(qr3dHost);
    qr3d.update({
      data,
      dotsColor: dotsInput.value,
      bgColor: bgInput.value,
      transparent: isTransparentBg(),
      errorCorrectionLevel: "H",
    });
    setStatus(`3D mode: shapes/kits apply to 2D exports · ${data}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not render 3D QR";
    setStatus(message, true);
  }
}

function render(): void {
  if (previewMode === "3d") {
    render3d();
    return;
  }
  try {
    const options = buildOptions();
    qr.update(options);
    setStatus(`Encoding: ${options.data ?? DEFAULT_URL}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not render QR";
    setStatus(message, true);
  }
}

function scheduleRender(): void {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(render, 120);
}

function setPreviewMode(mode: "2d" | "3d"): void {
  if (previewMode === mode) return;
  previewMode = mode;
  syncModeUI();
  render();
}

function export3dPng(): void {
  try {
    render3d();
    qr3d.exportPng("xzyqrn-qr-3d.png");
    setStatus("Downloaded xzyqrn-qr-3d.png");
  } catch (err) {
    const message = err instanceof Error ? err.message : "3D export failed";
    setStatus(message, true);
  }
}

function surpriseMe(): void {
  const pool = HOUSE_SURPRISE_IDS;
  let pick = pool[Math.floor(Math.random() * pool.length)];
  // Prefer a different house style when possible
  if (pool.length > 1 && pick === selectedStyle) {
    const others = pool.filter((id) => id !== selectedStyle);
    pick = others[Math.floor(Math.random() * others.length)];
  }
  selectStyle(pick, `rolled: ${pick}`);
}

function renderStyleCards(): void {
  styleGrid.replaceChildren();
  for (const style of ART_STYLES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = style.house
      ? "style-card style-card--house"
      : style.pattern
        ? "style-card style-card--pattern"
        : "style-card";
    btn.role = "option";
    btn.dataset.styleId = style.id;
    btn.setAttribute(
      "aria-selected",
      style.id === selectedStyle ? "true" : "false",
    );
    btn.innerHTML = `
      <span class="style-swatch" style="background:${style.swatch}" aria-hidden="true"></span>
      <span class="style-name">${style.name}</span>
      <span class="style-desc">${style.description}</span>
    `;
    btn.addEventListener("click", () => {
      selectStyle(style.id);
    });
    styleGrid.append(btn);
  }
}

function renderKitCards(): void {
  kitGrid.replaceChildren();
  for (const kit of BRAND_KITS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kit-card";
    btn.role = "option";
    btn.dataset.kitId = kit.id;
    btn.setAttribute(
      "aria-selected",
      kit.id === selectedKit ? "true" : "false",
    );
    btn.innerHTML = `
      <span class="kit-swatch" style="background:${kit.swatch}" aria-hidden="true"></span>
      <span class="kit-name">${kit.name}</span>
      <span class="kit-desc">${kit.description}</span>
    `;
    btn.addEventListener("click", () => {
      selectKit(kit.id);
    });
    kitGrid.append(btn);
  }
}

function updateLogoClearVisibility(): void {
  clearLogoBtn.hidden = !Boolean(logoDataUrl || logoUrlInput.value.trim());
}

function clearLogo(): void {
  logoDataUrl = null;
  logoUrlInput.value = "";
  logoFileInput.value = "";
  updateLogoClearVisibility();
  render();
}

async function exportFile(ext: "png" | "svg"): Promise<void> {
  try {
    render();
    await qr.download({ name: `xzyqrn-qr-${selectedStyle}`, extension: ext });
    setStatus(`Downloaded xzyqrn-qr-${selectedStyle}.${ext}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    setStatus(message, true);
  }
}

function truncateUrl(url: string, max = 42): string {
  const trimmed = url.trim();
  if (trimmed.length <= max) return trimmed;
  const head = Math.ceil((max - 1) * 0.65);
  const tail = max - 1 - head;
  return `${trimmed.slice(0, head)}…${trimmed.slice(-tail)}`;
}

function waitFrames(n = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}

async function exportPoster(): Promise<void> {
  try {
    render();
    await waitFrames(2);
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const qrCanvas = qrHost.querySelector("canvas");
    if (!qrCanvas) {
      setStatus("QR canvas not ready for poster export", true);
      return;
    }

    const POSTER = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = POSTER;
    canvas.height = POSTER;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("Could not create poster canvas", true);
      return;
    }

    const urlLine = truncateUrl(normalizeUrl(urlInput.value));
    const fontSans = '"IBM Plex Sans", system-ui, -apple-system, sans-serif';

    const paintQrPlate = !isTransparentBg();
    const drawQrCard = (
      qrSize: number,
      qrX: number,
      qrY: number,
      pad: number,
      cardColor: string,
      withShadow: boolean,
    ) => {
      const cardX = qrX - pad;
      const cardY = qrY - pad;
      const cardW = qrSize + pad * 2;
      const cardH = qrSize + pad * 2;
      if (paintQrPlate) {
        ctx.save();
        if (withShadow) {
          ctx.shadowColor = "rgba(26, 25, 23, 0.1)";
          ctx.shadowBlur = 28;
          ctx.shadowOffsetY = 10;
        }
        ctx.fillStyle = cardColor;
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 6);
          ctx.fill();
        } else {
          ctx.fillRect(cardX, cardY, cardW, cardH);
        }
        ctx.restore();
      }
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    };

    const drawPerforations = (side: "left" | "right", ink: string) => {
      const x = side === "left" ? 28 : POSTER - 28;
      const dashH = 14;
      const gap = 10;
      const startY = 48;
      const endY = POSTER - 48;
      ctx.fillStyle = ink;
      for (let y = startY; y < endY; y += dashH + gap) {
        ctx.beginPath();
        ctx.ellipse(x, y + dashH / 2, 3.5, dashH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (selectedKit === "stamp") {
      const paper = "#f3efe6";
      const card = "#fffdf8";
      const ink = "#1a1917";
      const muted = "#6f6a62";
      const margin = 72;
      const qrSize = Math.round(POSTER - margin * 2 - 48);
      const pad = 22;
      const qrX = Math.round((POSTER - qrSize) / 2);
      const qrY = Math.round((POSTER - qrSize) / 2) - 20;

      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, POSTER, POSTER);

      // Thick ink border
      ctx.strokeStyle = ink;
      ctx.lineWidth = 14;
      ctx.strokeRect(36, 36, POSTER - 72, POSTER - 72);
      ctx.lineWidth = 3;
      ctx.strokeRect(52, 52, POSTER - 104, POSTER - 104);

      drawQrCard(qrSize, qrX, qrY, pad, card, true);

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = muted;
      ctx.font = `400 16px ${fontSans}`;
      ctx.fillText(urlLine, POSTER / 2, qrY + qrSize + pad + 28);

      // Rubber-stamp wordmark, rotated slightly in a corner
      ctx.save();
      ctx.translate(POSTER - 150, POSTER - 110);
      ctx.rotate((-12 * Math.PI) / 180);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      const stampW = 168;
      const stampH = 52;
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(-stampW / 2, -stampH / 2, stampW, stampH, 4);
        ctx.stroke();
      } else {
        ctx.strokeRect(-stampW / 2, -stampH / 2, stampW, stampH);
      }
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 18px ${fontSans}`;
      ctx.fillText("xzyqrn qr", 0, 1);
      ctx.restore();
    } else if (selectedKit === "ticket") {
      const paper = "#ffffff";
      const card = "#ffffff";
      const ink = "#111111";
      const stripH = 96;
      const sidePad = 64;
      const qrSize = Math.round(POSTER * 0.62);
      const pad = 14;
      const qrX = Math.round((POSTER - qrSize) / 2);
      const qrY = Math.round((POSTER - stripH - qrSize) / 2) - 10;

      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, POSTER, POSTER);

      // Outer high-contrast frame
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, POSTER - 36, POSTER - 36);

      drawPerforations("left", ink);
      drawPerforations("right", ink);

      // Side gutters hint
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(sidePad, 40);
      ctx.lineTo(sidePad, POSTER - stripH - 24);
      ctx.moveTo(POSTER - sidePad, 40);
      ctx.lineTo(POSTER - sidePad, POSTER - stripH - 24);
      ctx.stroke();
      ctx.setLineDash([]);

      drawQrCard(qrSize, qrX, qrY, pad, card, false);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2);

      // Bold URL strip at bottom
      ctx.fillStyle = ink;
      ctx.fillRect(0, POSTER - stripH, POSTER, stripH);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 28px ${fontSans}`;
      ctx.fillText(urlLine, POSTER / 2, POSTER - stripH / 2 - 10);
      ctx.font = `600 14px ${fontSans}`;
      ctx.letterSpacing = "0.12em";
      ctx.fillText("XZYQRN QR", POSTER / 2, POSTER - stripH / 2 + 22);
      ctx.letterSpacing = "0px";
    } else if (selectedKit === "film") {
      const matte = "#111111";
      const inset = "rgba(255,255,255,0.92)";
      const rebate = "rgba(255,255,255,0.78)";
      const frame = 78;
      const qrSize = Math.round(POSTER - frame * 2 - 36);
      const pad = 10;
      const qrX = Math.round((POSTER - qrSize) / 2);
      const qrY = Math.round((POSTER - qrSize) / 2) - 8;

      ctx.fillStyle = matte;
      ctx.fillRect(0, 0, POSTER, POSTER);

      // Thin white inset line
      ctx.strokeStyle = inset;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(frame, frame, POSTER - frame * 2, POSTER - frame * 2);

      // Inner matte well
      ctx.fillStyle = "#0a0a0a";
      const wellPad = 16;
      ctx.fillRect(
        frame + wellPad,
        frame + wellPad,
        POSTER - (frame + wellPad) * 2,
        POSTER - (frame + wellPad) * 2,
      );

      drawQrCard(qrSize, qrX, qrY, pad, "#0a0a0a", false);

      // Film rebate wordmark (small caps)
      ctx.fillStyle = rebate;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `500 13px ${fontSans}`;
      ctx.letterSpacing = "0.28em";
      ctx.fillText("XZYQRN QR", POSTER / 2, 42);
      ctx.letterSpacing = "0.08em";
      ctx.font = `400 12px ${fontSans}`;
      ctx.fillText(urlLine.toUpperCase(), POSTER / 2, POSTER - 42);
      ctx.letterSpacing = "0px";

      // Sprocket hints
      const sprocketY = [frame + 28, POSTER / 2, POSTER - frame - 28];
      ctx.fillStyle = "#1c1c1c";
      for (const y of sprocketY) {
        for (const x of [28, POSTER - 28]) {
          if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(x - 10, y - 14, 20, 28, 3);
            ctx.fill();
          } else {
            ctx.fillRect(x - 10, y - 14, 20, 28);
          }
        }
      }
    } else {
      // paper (default) — current poster
      const paper = "#f3efe6";
      const card = "#fffdf8";
      const muted = "#6f6a62";
      const QR_RATIO = 0.7;
      const qrSize = Math.round(POSTER * QR_RATIO);
      const pad = 18;
      const qrX = Math.round((POSTER - qrSize) / 2);
      const qrY = Math.round((POSTER - qrSize) / 2) - 36;

      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, POSTER, POSTER);

      drawQrCard(qrSize, qrX, qrY, pad, card, true);

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = muted;
      ctx.font = `400 17px ${fontSans}`;
      ctx.fillText(urlLine, POSTER / 2, qrY + qrSize + pad + 22);

      ctx.font = `500 15px ${fontSans}`;
      ctx.fillStyle = muted;
      ctx.fillText("xzyqrn qr", POSTER / 2, POSTER - 52);
    }

    const filename = `xzyqrn-qr-${selectedStyle}-${selectedKit}-poster.png`;
    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Poster export failed"));
          return;
        }
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(href);
        resolve();
      }, "image/png");
    });

    setStatus(`Downloaded ${filename}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poster export failed";
    setStatus(message, true);
  }
}

async function exportMotion(): Promise<void> {
  const prevLabel = exportMotionBtn.textContent;
  try {
    exportMotionBtn.disabled = true;
    render();
    await waitFrames(2);
    setStatus("Encoding motion…");

    const qrCanvas = qrHost.querySelector("canvas");
    if (!qrCanvas) {
      setStatus("QR canvas not ready for motion export", true);
      return;
    }

    const FRAME_COUNT = 18;
    const DELAY_MS = 70;
    const outSize = Math.min(Math.max(qrCanvas.width, 200), 480);

    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = outSize;
    frameCanvas.height = outSize;
    const ctx = frameCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setStatus("Could not create motion canvas", true);
      return;
    }

    const bg = bgInput.value;
    const useAlpha = isTransparentBg();
    const gif = GIFEncoder();
    let globalPalette: number[][] | null = null;
    let transparentIndex = 0;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const t = i / FRAME_COUNT;
      // Soft print-studio pulse (±2.5%) + faint rotating sheen
      const scale = 1 + 0.025 * Math.sin(t * Math.PI * 2);
      const angle = t * Math.PI * 2;

      if (useAlpha) {
        ctx.clearRect(0, 0, outSize, outSize);
      } else {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, outSize, outSize);
      }

      ctx.save();
      ctx.translate(outSize / 2, outSize / 2);
      ctx.scale(scale, scale);
      ctx.drawImage(qrCanvas, -outSize / 2, -outSize / 2, outSize, outSize);
      ctx.restore();

      ctx.save();
      ctx.translate(outSize / 2, outSize / 2);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(-outSize / 2, 0, outSize / 2, 0);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.45, "rgba(255,255,255,0.07)");
      grad.addColorStop(0.55, "rgba(255,255,255,0.07)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(-outSize / 2, -outSize / 2, outSize, outSize);
      ctx.restore();

      const { data } = ctx.getImageData(0, 0, outSize, outSize);
      const format = useAlpha ? "rgba4444" : "rgb565";
      if (!globalPalette) {
        globalPalette = quantize(data, 256, { format });
        if (useAlpha) {
          const found = globalPalette.findIndex((c) => (c[3] ?? 255) < 16);
          if (found >= 0) {
            transparentIndex = found;
          } else if (globalPalette.length < 256) {
            globalPalette.push([0, 0, 0, 0]);
            transparentIndex = globalPalette.length - 1;
          }
        }
      }
      const index = applyPalette(data, globalPalette, format);
      gif.writeFrame(index, outSize, outSize, {
        palette: i === 0 ? globalPalette : undefined,
        delay: DELAY_MS,
        transparent: useAlpha,
        transparentIndex: useAlpha ? transparentIndex : undefined,
        ...(i === 0 ? { repeat: 0 } : {}),
      });

      if (i % 3 === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }

    gif.finish();
    const bytes = gif.bytes();
    const payload = new Uint8Array(bytes);
    const blob = new Blob([payload], { type: "image/gif" });
    const filename = `xzyqrn-qr-${selectedStyle}-motion.gif`;
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
    setStatus(`Downloaded ${filename}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Motion export failed";
    setStatus(message, true);
  } finally {
    exportMotionBtn.disabled = false;
    exportMotionBtn.textContent = prevLabel;
  }
}

function onColorInput(): void {
  syncHexLabels();
  scheduleRender();
}

function setupPreviewTilt(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const maxDeg = 6;

  const resetTilt = () => {
    qrHost.style.transform = "";
  };

  const onMove = (e: MouseEvent) => {
    if (previewMode === "3d" || reduceMotion.matches) {
      resetTilt();
      return;
    }
    const rect = previewStage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * 2 * maxDeg;
    const rotX = (0.5 - y) * 2 * maxDeg;
    qrHost.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  };

  previewStage.addEventListener("mousemove", onMove);
  previewStage.addEventListener("mouseleave", resetTilt);
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) resetTilt();
  });
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

urlInput.addEventListener("input", scheduleRender);
dotsInput.addEventListener("input", onColorInput);
bgInput.addEventListener("input", onColorInput);
bgTransparentInput.addEventListener("change", () => {
  syncTransparentBgUI();
  scheduleRender();
});
cornerSqInput.addEventListener("input", onColorInput);
cornerDotInput.addEventListener("input", onColorInput);
dotType.addEventListener("change", scheduleRender);
cornerType.addEventListener("change", scheduleRender);
cornerDotType.addEventListener("change", scheduleRender);
errorLevel.addEventListener("change", scheduleRender);
marginInput.addEventListener("input", () => {
  marginLabel.textContent = `${marginInput.value} px`;
  scheduleRender();
});
sizeInput.addEventListener("input", () => {
  sizeLabel.textContent = `${sizeInput.value} px`;
  scheduleRender();
});
logoSizeInput.addEventListener("input", () => {
  logoSizeLabel.textContent = Number(logoSizeInput.value).toFixed(2);
  scheduleRender();
});
hideDotsInput.addEventListener("change", scheduleRender);
logoUrlInput.addEventListener("input", () => {
  if (logoUrlInput.value.trim()) {
    logoDataUrl = null;
    logoFileInput.value = "";
  }
  updateLogoClearVisibility();
  scheduleRender();
});
logoFileInput.addEventListener("change", () => {
  const file = logoFileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    logoDataUrl = typeof reader.result === "string" ? reader.result : null;
    logoUrlInput.value = "";
    updateLogoClearVisibility();
    render();
  };
  reader.onerror = () => setStatus("Could not read logo file", true);
  reader.readAsDataURL(file);
});
clearLogoBtn.addEventListener("click", clearLogo);
surpriseBtn.addEventListener("click", surpriseMe);
mode2dBtn.addEventListener("click", () => setPreviewMode("2d"));
mode3dBtn.addEventListener("click", () => setPreviewMode("3d"));
exportPngBtn.addEventListener("click", () => void exportFile("png"));
exportSvgBtn.addEventListener("click", () => void exportFile("svg"));
exportPosterBtn.addEventListener("click", () => void exportPoster());
exportMotionBtn.addEventListener("click", () => void exportMotion());
export3dPngBtn.addEventListener("click", () => export3dPng());

document.addEventListener("keydown", (e) => {
  if (e.key !== "s" && e.key !== "S") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (isTypingTarget(e.target)) return;
  e.preventDefault();
  surpriseMe();
});

renderStyleCards();
renderKitCards();
applyStyleToControls(DEFAULT_STYLE);
syncStyleSelectionUI();
syncKitSelectionUI();
marginLabel.textContent = `${marginInput.value} px`;
sizeLabel.textContent = `${sizeInput.value} px`;
logoSizeLabel.textContent = Number(logoSizeInput.value).toFixed(2);
syncHexLabels();
syncTransparentBgUI();
updateLogoClearVisibility();
syncModeUI();
setupPreviewTilt();
render();
