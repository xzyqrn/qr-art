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
import { PRESET_ICONS, iconToDataUrl, rasterizeToPngDataUrl } from "./icons";
import { checkContrast } from "./contrast";
import {
  type PayloadType,
  formatUrl,
  formatWifi,
  formatVCard,
  formatWhatsApp,
  formatSms,
  formatEmail,
  formatPhone,
  formatCrypto,
  formatEvent,
  parseWifi,
  parseVCard,
  parseWhatsApp,
  parseSms,
  parseEmail,
  parseCrypto,
  parseEvent,
  detectPayloadType,
} from "./payloads";
import { drawFramedQr, type FrameStyle } from "./frames";
import {
  type SavedDesign,
  loadHistory,
  saveToHistory,
  removeFromHistory,
  loadFavorites,
  isFavorite,
  toggleFavorite,
} from "./history";
import { CameraScanner, detectFromImageFile } from "./scanner";
import "./styles.css";

const DEFAULT_URL = "https://example.com";
const DEFAULT_STYLE: ArtStyleId = "base";
const DEFAULT_KIT: KitId = "paper";
const HOUSE_SURPRISE_IDS: ArtStyleId[] = ["void", "newsprint", "signal", "static"];
const MOTION_FRAME_COUNT = 18;
const MOTION_DELAY_MS = 70;
const MOTION_PULSE = 0.04;
const MOTION_SHEEN = 0.14;
const MOTION_DURATION_MS = MOTION_FRAME_COUNT * MOTION_DELAY_MS;

type PreviewMode = "2d" | "motion" | "3d";
const FRAME_PRESETS: { id: FrameStyle; name: string; description: string }[] = [
  { id: "none", name: "None", description: "Bare code" },
  { id: "bottom-badge", name: "Badge", description: "CTA under the code" },
  { id: "top-banner", name: "Banner", description: "Label on top" },
  { id: "speech-bubble", name: "Bubble", description: "Spoken callout" },
  { id: "phone-frame", name: "Phone", description: "Device bezel" },
  { id: "ticket-ribbon", name: "Ribbon", description: "Tear-off stub" },
];

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const urlInput = $<HTMLInputElement>("#url");
const wifiSsid = $<HTMLInputElement>("#wifi-ssid");
const wifiPass = $<HTMLInputElement>("#wifi-pass");
const wifiPassWrap = $<HTMLElement>("#wifi-pass-wrap");
const wifiAuth = $<HTMLSelectElement>("#wifi-auth");
const wifiHidden = $<HTMLInputElement>("#wifi-hidden");
const vcardFirst = $<HTMLInputElement>("#vcard-first");
const vcardLast = $<HTMLInputElement>("#vcard-last");
const vcardPhone = $<HTMLInputElement>("#vcard-phone");
const vcardEmail = $<HTMLInputElement>("#vcard-email");
const vcardCompany = $<HTMLInputElement>("#vcard-company");
const vcardTitle = $<HTMLInputElement>("#vcard-title");
const vcardUrl = $<HTMLInputElement>("#vcard-url");
const vcardAddress = $<HTMLInputElement>("#vcard-address");
const waPhone = $<HTMLInputElement>("#wa-phone");
const waMessage = $<HTMLTextAreaElement>("#wa-message");
const smsPhone = $<HTMLInputElement>("#sms-phone");
const smsMessage = $<HTMLTextAreaElement>("#sms-message");
const emailTo = $<HTMLInputElement>("#email-to");
const emailSubject = $<HTMLInputElement>("#email-subject");
const emailBody = $<HTMLTextAreaElement>("#email-body");
const phoneNumber = $<HTMLInputElement>("#phone-number");
const plainText = $<HTMLTextAreaElement>("#plain-text");
const cryptoCoin = $<HTMLSelectElement>("#crypto-coin");
const cryptoAddress = $<HTMLInputElement>("#crypto-address");
const cryptoAmount = $<HTMLInputElement>("#crypto-amount");
const eventTitle = $<HTMLInputElement>("#event-title");
const eventLocation = $<HTMLInputElement>("#event-location");
const eventStart = $<HTMLInputElement>("#event-start");
const eventEnd = $<HTMLInputElement>("#event-end");
const eventDesc = $<HTMLTextAreaElement>("#event-desc");

const dotsInput = $<HTMLInputElement>("#dots");
const bgInput = $<HTMLInputElement>("#bg");
const bgWrap = $<HTMLElement>("#bg-wrap");
const bgTransparentInput = $<HTMLInputElement>("#bg-transparent");
const cornerSqInput = $<HTMLInputElement>("#corner-sq");
const cornerDotInput = $<HTMLInputElement>("#corner-dot");
const dotsHex = $<HTMLElement>("#dots-hex");
const bgHex = $<HTMLElement>("#bg-hex");
const cornerSqHex = $<HTMLElement>("#corner-sq-hex");
const cornerDotHex = $<HTMLElement>("#corner-dot-hex");
const contrastMeter = $<HTMLElement>("#contrast-meter");
const contrastText = $<HTMLElement>("#contrast-text");
const dotType = $<HTMLSelectElement>("#dot-type");
const cornerType = $<HTMLSelectElement>("#corner-type");
const cornerDotType = $<HTMLSelectElement>("#corner-dot-type");
const marginInput = $<HTMLInputElement>("#margin");
const marginLabel = $<HTMLElement>("#margin-label");
const errorLevel = $<HTMLSelectElement>("#error-level");
const sizeInput = $<HTMLInputElement>("#size");
const sizeLabel = $<HTMLElement>("#size-label");
const frameTextInput = $<HTMLInputElement>("#frame-text");
const frameTextWrap = $<HTMLElement>("#frame-text-wrap");

const logoUrlInput = $<HTMLInputElement>("#logo-url");
const clearLogoUrlBtn = document.querySelector<HTMLButtonElement>("#clear-logo-url");
const logoFileInput = $<HTMLInputElement>("#logo-file");
const logoUploadZone = document.querySelector<HTMLElement>("#logo-upload-zone");
const logoActiveContainer = document.querySelector<HTMLElement>("#logo-active-container");
const logoInfoTrigger = document.querySelector<HTMLElement>("#logo-info-trigger");
const logoPreviewThumb = document.querySelector<HTMLImageElement>("#logo-preview-thumb");
const logoActiveName = document.querySelector<HTMLElement>("#logo-active-name");
const deleteLogoBtn = document.querySelector<HTMLButtonElement>("#delete-logo-btn");
const iconPresetsGrid = document.querySelector<HTMLElement>("#icon-presets-grid");
const logoSizeInput = $<HTMLInputElement>("#logo-size");
const logoSizeLabel = $<HTMLElement>("#logo-size-label");
const hideDotsInput = $<HTMLInputElement>("#hide-dots");

const typePills = document.querySelectorAll<HTMLButtonElement>(".type-pill");
const payloadPanels = document.querySelectorAll<HTMLElement>("[data-payload-panel]");
const styleGrid = $<HTMLElement>("#style-grid");
const kitGrid = $<HTMLElement>("#kit-grid");
const frameGrid = $<HTMLElement>("#frame-grid");
const surpriseBtn = $<HTMLButtonElement>("#surprise");
const previewStage = $<HTMLElement>("#preview-stage");
const qrHost = $<HTMLElement>("#qr");
const qrFrameHost = $<HTMLElement>("#qr-frame");
const qr3dHost = $<HTMLElement>("#qr3d");
const statusEl = $<HTMLElement>("#status");
const mode2dBtn = $<HTMLButtonElement>("#mode-2d");
const modeMotionBtn = $<HTMLButtonElement>("#mode-motion");
const mode3dBtn = $<HTMLButtonElement>("#mode-3d");
const exportPngBtn = $<HTMLButtonElement>("#export-png");
const exportSvgBtn = $<HTMLButtonElement>("#export-svg");
const exportPosterBtn = $<HTMLButtonElement>("#export-poster");
const exportMotionBtn = $<HTMLButtonElement>("#export-motion");
const btnCopyImg = document.querySelector<HTMLButtonElement>("#btn-copy-img");
const saveDesignBtn = $<HTMLButtonElement>("#save-design");
const export3dPngBtn = $<HTMLButtonElement>("#export-3d-png");
const historyRow = $<HTMLElement>("#history-row");
const favoritesRow = $<HTMLElement>("#favorites-row");
const scanQrBtn = $<HTMLButtonElement>("#scan-qr");
const scannerDialog = $<HTMLDialogElement>("#scanner-dialog");
const scannerHost = $<HTMLElement>("#scanner-host");
const scannerStatus = $<HTMLElement>("#scanner-status");
const scannerClose = $<HTMLButtonElement>("#scanner-close");
const scanFileInput = $<HTMLInputElement>("#scan-file");

let selectedStyle: ArtStyleId = DEFAULT_STYLE;
let selectedKit: KitId = DEFAULT_KIT;
let selectedFrame: FrameStyle = "none";
let payloadType: PayloadType = "url";
let logoDataUrl: string | null = null;
let logoFileName: string | null = null;
let activePresetId: string | null = null;
let payloadAutoLogo = false;
let logoApplyGen = 0;
let debounceTimer = 0;
let frameTimer = 0;
let previewMode: PreviewMode = "2d";
const qr3d = new Qr3dViewer();
const cameraScanner = new CameraScanner();

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
    saveAsBlob: false,
  },
});

qr.append(qrHost);

function setStatus(message: string, isError = false): void {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function isTransparentBg(): boolean {
  return bgTransparentInput.checked;
}

function encodeCurrentPayload(): string {
  switch (payloadType) {
    case "wifi":
      return formatWifi({
        ssid: wifiSsid.value,
        password: wifiPass.value,
        authType: wifiAuth.value as "WPA" | "WEP" | "nopass",
        hidden: wifiHidden.checked,
      });
    case "vcard":
      return formatVCard({
        firstName: vcardFirst.value,
        lastName: vcardLast.value,
        phone: vcardPhone.value,
        email: vcardEmail.value,
        company: vcardCompany.value,
        title: vcardTitle.value,
        url: vcardUrl.value,
        address: vcardAddress.value,
      });
    case "whatsapp":
      return formatWhatsApp({ phone: waPhone.value, message: waMessage.value });
    case "sms":
      return formatSms({ phone: smsPhone.value, message: smsMessage.value });
    case "email":
      return formatEmail({
        email: emailTo.value,
        subject: emailSubject.value,
        body: emailBody.value,
      });
    case "phone":
      return formatPhone(phoneNumber.value || "+15550100");
    case "text":
      return plainText.value.trim() || "Hello from xzyqrn qr";
    case "crypto":
      return formatCrypto({
        coin: cryptoCoin.value as "bitcoin" | "ethereum" | "solana",
        address: cryptoAddress.value,
        amount: cryptoAmount.value,
      });
    case "event":
      return formatEvent({
        title: eventTitle.value,
        location: eventLocation.value,
        startDateTime: eventStart.value,
        endDateTime: eventEnd.value,
        description: eventDesc.value,
      });
    default:
      return formatUrl(urlInput.value || DEFAULT_URL);
  }
}

function payloadLabel(type: PayloadType): string {
  const labels: Record<PayloadType, string> = {
    url: "Link",
    wifi: "Wi-Fi",
    vcard: "vCard",
    whatsapp: "WhatsApp",
    sms: "SMS",
    email: "Email",
    phone: "Phone",
    text: "Text",
    crypto: "Crypto",
    event: "Event",
  };
  return labels[type];
}

function summarizePayload(data: string): string {
  const compact = data.replace(/\s+/g, " ").trim();
  if (compact.length <= 64) return compact;
  return `${compact.slice(0, 40)}…${compact.slice(-12)}`;
}

function syncPayloadUI(): void {
  for (const pill of typePills) {
    const on = pill.dataset.type === payloadType;
    pill.classList.toggle("active", on);
    pill.setAttribute("aria-selected", on ? "true" : "false");
  }
  for (const panel of payloadPanels) {
    panel.hidden = panel.dataset.payloadPanel !== payloadType;
  }
  wifiPassWrap.hidden = wifiAuth.value === "nopass";
}

function setPayloadType(type: PayloadType): void {
  payloadType = type;
  syncPayloadUI();
  maybeApplyPayloadIcon();
}

function fillFormFromRaw(type: PayloadType, raw: string): void {
  if (type === "wifi") {
    const parsed = parseWifi(raw);
    if (parsed) {
      wifiSsid.value = parsed.ssid;
      wifiPass.value = parsed.password || "";
      wifiAuth.value = parsed.authType;
      wifiHidden.checked = Boolean(parsed.hidden);
    }
  } else if (type === "vcard") {
    const parsed = parseVCard(raw);
    if (parsed) {
      vcardFirst.value = parsed.firstName;
      vcardLast.value = parsed.lastName || "";
      vcardPhone.value = parsed.phone || "";
      vcardEmail.value = parsed.email || "";
      vcardCompany.value = parsed.company || "";
      vcardTitle.value = parsed.title || "";
      vcardUrl.value = parsed.url || "";
      vcardAddress.value = parsed.address || "";
    }
  } else if (type === "whatsapp") {
    const parsed = parseWhatsApp(raw);
    if (parsed) {
      waPhone.value = parsed.phone;
      waMessage.value = parsed.message || "";
    }
  } else if (type === "sms") {
    const parsed = parseSms(raw);
    if (parsed) {
      smsPhone.value = parsed.phone;
      smsMessage.value = parsed.message || "";
    }
  } else if (type === "email") {
    const parsed = parseEmail(raw);
    if (parsed) {
      emailTo.value = parsed.email;
      emailSubject.value = parsed.subject || "";
      emailBody.value = parsed.body || "";
    }
  } else if (type === "phone") {
    phoneNumber.value = raw.replace(/^tel:/i, "");
  } else if (type === "text") {
    plainText.value = raw;
  } else if (type === "crypto") {
    const parsed = parseCrypto(raw);
    if (parsed) {
      cryptoCoin.value = parsed.coin;
      cryptoAddress.value = parsed.address;
      cryptoAmount.value = parsed.amount || "";
    }
  } else if (type === "event") {
    const parsed = parseEvent(raw);
    if (parsed) {
      eventTitle.value = parsed.title;
      eventLocation.value = parsed.location || "";
      eventStart.value = parsed.startDateTime || "";
      eventEnd.value = parsed.endDateTime || "";
      eventDesc.value = parsed.description || "";
    }
  } else {
    urlInput.value = raw;
  }
}

function ingestPayload(raw: string, announce = true): void {
  const type = detectPayloadType(raw);
  setPayloadType(type);
  fillFormFromRaw(type, raw);
  if (announce) {
    setStatus(`Loaded ${payloadLabel(type)} content`);
    scheduleRender();
  }
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

function updateContrastMeter(): void {
  const result = checkContrast(dotsInput.value, bgInput.value, isTransparentBg());
  contrastMeter.className = `contrast-meter contrast-${result.rating}`;
  contrastText.textContent = result.message;
}

function isArtStyleId(id: string): id is ArtStyleId {
  return ART_STYLES.some((s) => s.id === id);
}

function isKitId(id: string): id is KitId {
  return BRAND_KITS.some((k) => k.id === id);
}

function isFrameStyle(id: string): id is FrameStyle {
  return FRAME_PRESETS.some((f) => f.id === id);
}

function syncStyleSelectionUI(): void {
  for (const el of styleGrid.querySelectorAll<HTMLElement>(".style-card")) {
    el.setAttribute("aria-selected", el.dataset.styleId === selectedStyle ? "true" : "false");
  }
  previewStage.classList.toggle("preview-stage--static", selectedStyle === "static");
}

function syncKitSelectionUI(): void {
  for (const el of kitGrid.querySelectorAll<HTMLElement>(".kit-card")) {
    el.setAttribute("aria-selected", el.dataset.kitId === selectedKit ? "true" : "false");
  }
  previewStage.dataset.kit = selectedKit;
}

function syncFrameSelectionUI(): void {
  for (const el of frameGrid.querySelectorAll<HTMLElement>(".frame-card")) {
    el.setAttribute("aria-selected", el.dataset.frameId === selectedFrame ? "true" : "false");
  }
  frameTextWrap.hidden = selectedFrame === "none";
}

function applyStyleToControls(id: ArtStyleId): void {
  const preset = getStyle(id);
  selectedStyle = id;
  const o = preset.options;

  if (o.dotsOptions?.type) dotType.value = o.dotsOptions.type;
  if (o.cornersSquareOptions?.type) cornerType.value = o.cornersSquareOptions.type;
  if (o.cornersDotOptions?.type) cornerDotType.value = o.cornersDotOptions.type;

  if (!preset.pattern) {
    if (o.dotsOptions?.color) dotsInput.value = o.dotsOptions.color;
    if (o.backgroundOptions?.color) {
      if (o.backgroundOptions.color === "transparent") {
        bgTransparentInput.checked = true;
      } else {
        bgTransparentInput.checked = false;
        bgInput.value = o.backgroundOptions.color;
      }
      syncTransparentBgUI();
    }
    if (o.cornersSquareOptions?.color) cornerSqInput.value = o.cornersSquareOptions.color;
    if (o.cornersDotOptions?.color) cornerDotInput.value = o.cornersDotOptions.color;
    syncHexLabels();
  }
}

function selectStyle(id: ArtStyleId, note?: string): void {
  applyStyleToControls(id);
  syncStyleSelectionUI();
  render();
  const preset = getStyle(id);
  if (note) {
    setStatus(note);
  } else if (preset.pattern) {
    setStatus(`Applied shape pattern “${preset.name}” (colors preserved)`);
  } else {
    setStatus(`Applied style “${preset.name}”`);
  }
}

function selectKit(id: KitId): void {
  selectedKit = id;
  syncKitSelectionUI();
  const kit = BRAND_KITS.find((k) => k.id === id);
  setStatus(`Applied poster kit “${kit?.name ?? id}”`);
}

function selectFrame(id: FrameStyle): void {
  selectedFrame = id;
  syncFrameSelectionUI();
  scheduleRender();
  const preset = FRAME_PRESETS.find((f) => f.id === id);
  setStatus(id === "none" ? "Frame removed" : `Applied frame “${preset?.name ?? id}”`);
}

function shiftHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
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
  const data = encodeCurrentPayload();
  const logo = logoDataUrl || logoUrlInput.value.trim() || undefined;
  const margin = Number(marginInput.value);
  const imageSize = Number(logoSizeInput.value);
  const remoteLogo = Boolean(logo && /^https?:/i.test(logo));

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
      saveAsBlob: false,
      ...(remoteLogo ? { crossOrigin: "anonymous" } : {}),
    },
    image: logo,
  };
}

function getFrameOptions() {
  return {
    style: selectedFrame,
    text: frameTextInput.value.trim() || "SCAN ME",
    textColor: "#faf7f0",
    bgColor: isTransparentBg() ? "#faf7f0" : bgInput.value,
    accentColor: dotsInput.value,
  };
}

function getRawQrCanvas(): HTMLCanvasElement | null {
  return qrHost.querySelector("canvas");
}

function maybeFrame(src: HTMLCanvasElement): HTMLCanvasElement {
  if (selectedFrame === "none") return src;
  return drawFramedQr(src, getFrameOptions());
}

function refreshFramePreview(): void {
  const src = getRawQrCanvas();
  if (!src || previewMode === "3d" || previewMode === "motion") {
    qrFrameHost.hidden = true;
    qrHost.classList.remove("is-framed-away");
    return;
  }
  if (selectedFrame === "none") {
    qrFrameHost.hidden = true;
    qrFrameHost.replaceChildren();
    qrHost.classList.remove("is-framed-away");
    return;
  }
  const framed = maybeFrame(src);
  qrFrameHost.replaceChildren(framed);
  qrFrameHost.hidden = false;
  qrHost.classList.add("is-framed-away");
}

function getVisibleQrCanvas(): HTMLCanvasElement | null {
  if (selectedFrame !== "none") {
    return qrFrameHost.querySelector("canvas") || getRawQrCanvas();
  }
  return getRawQrCanvas();
}

function syncModeUI(): void {
  const is3d = previewMode === "3d";
  const isMotion = previewMode === "motion";
  mode2dBtn.setAttribute("aria-pressed", previewMode === "2d" ? "true" : "false");
  modeMotionBtn.setAttribute("aria-pressed", isMotion ? "true" : "false");
  mode3dBtn.setAttribute("aria-pressed", is3d ? "true" : "false");
  previewStage.classList.toggle("is-3d", is3d);
  previewStage.classList.toggle("is-motion", isMotion);
  previewStage.style.setProperty("--qr-motion-duration", `${MOTION_DURATION_MS}ms`);
  qrHost.hidden = is3d;
  qrFrameHost.hidden = is3d || isMotion || selectedFrame === "none";
  qr3dHost.hidden = !is3d;
  if (is3d || isMotion) qrHost.classList.remove("is-framed-away");
  exportPngBtn.hidden = is3d;
  exportSvgBtn.hidden = is3d;
  exportPosterBtn.hidden = is3d;
  exportMotionBtn.hidden = is3d;
  btnCopyImg && (btnCopyImg.hidden = is3d);
  saveDesignBtn.hidden = is3d;
  export3dPngBtn.hidden = !is3d;
  exportPngBtn.classList.toggle("primary", !isMotion);
  exportPngBtn.classList.toggle("secondary", isMotion);
  exportMotionBtn.classList.toggle("primary", isMotion);
  exportMotionBtn.classList.toggle("secondary", !isMotion);
  if (!is3d) qrHost.style.transform = "";
}

function render3d(): void {
  try {
    const data = encodeCurrentPayload();
    qr3d.mount(qr3dHost);
    qr3d.update({
      data,
      dotsColor: dotsInput.value,
      bgColor: bgInput.value,
      transparent: isTransparentBg(),
      errorCorrectionLevel: errorLevel.value as "L" | "M" | "Q" | "H",
    });
    setStatus(`3D mode: shapes, kits, and frames apply to 2D exports · ${summarizePayload(data)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not render 3D QR";
    setStatus(message, true);
  }
}

function render(): void {
  updateContrastMeter();
  if (previewMode === "3d") {
    render3d();
    return;
  }
  try {
    const options = buildOptions();
    qr.update(options);
    window.clearTimeout(frameTimer);
    frameTimer = window.setTimeout(refreshFramePreview, 40);
    const encoded = `Encoded: ${summarizePayload(String(options.data ?? DEFAULT_URL))}`;
    if (previewMode === "motion") {
      const paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setStatus(
        paused
          ? `${encoded} · motion preview paused (reduced motion)`
          : `${encoded} · motion loop — Export motion saves this as a GIF`,
      );
    } else {
      setStatus(encoded);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not render QR";
    setStatus(message, true);
  }
}

function scheduleRender(): void {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(render, 120);
}

function setPreviewMode(mode: PreviewMode): void {
  if (previewMode === mode) return;
  previewMode = mode;
  syncModeUI();
  render();
}

function surpriseMe(): void {
  const pool = HOUSE_SURPRISE_IDS;
  let pick = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && pick === selectedStyle) {
    const others = pool.filter((id) => id !== selectedStyle);
    pick = others[Math.floor(Math.random() * others.length)];
  }
  selectStyle(pick, `Rolled surprise: ${pick}`);
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
    btn.setAttribute("aria-selected", style.id === selectedStyle ? "true" : "false");
    btn.innerHTML = `
      <span class="style-swatch" style="background:${style.swatch}" aria-hidden="true"></span>
      <span class="style-name">${style.name}</span>
      <span class="style-desc">${style.description}</span>
    `;
    btn.addEventListener("click", () => selectStyle(style.id));
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
    btn.setAttribute("aria-selected", kit.id === selectedKit ? "true" : "false");
    btn.innerHTML = `
      <span class="kit-swatch" style="background:${kit.swatch}" aria-hidden="true"></span>
      <span class="kit-name">${kit.name}</span>
      <span class="kit-desc">${kit.description}</span>
    `;
    btn.addEventListener("click", () => selectKit(kit.id));
    kitGrid.append(btn);
  }
}

function renderFrameCards(): void {
  frameGrid.replaceChildren();
  for (const frame of FRAME_PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "frame-card";
    btn.role = "option";
    btn.dataset.frameId = frame.id;
    btn.setAttribute("aria-selected", frame.id === selectedFrame ? "true" : "false");
    btn.innerHTML = `
      <span class="frame-name">${frame.name}</span>
      <span class="frame-desc">${frame.description}</span>
    `;
    btn.addEventListener("click", () => selectFrame(frame.id));
    frameGrid.append(btn);
  }
}

function renderBrandIcons(): void {
  if (!iconPresetsGrid) return;
  iconPresetsGrid.replaceChildren();
  for (const icon of PRESET_ICONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-preset-btn";
    btn.dataset.iconId = icon.id;
    btn.title = `Use ${icon.name} logo`;
    btn.setAttribute("aria-pressed", icon.id === activePresetId ? "true" : "false");
    btn.innerHTML = icon.svg;
    btn.addEventListener("click", () => applyPreset(icon.id));
    iconPresetsGrid.append(btn);
  }
}

function syncPresetIconUI(): void {
  if (!iconPresetsGrid) return;
  for (const btn of iconPresetsGrid.querySelectorAll<HTMLButtonElement>(".icon-preset-btn")) {
    const on = btn.dataset.iconId === activePresetId;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }
}

const PAYLOAD_PRESET: Partial<Record<PayloadType, string>> = {
  whatsapp: "whatsapp",
  wifi: "wifi",
  phone: "phone",
};

function applyPreset(id: string, fromPayload = false): void {
  const icon = PRESET_ICONS.find((item) => item.id === id);
  if (!icon) return;
  if (fromPayload) payloadAutoLogo = true;
  void applyLogoSource(iconToDataUrl(icon.svg), `${icon.name} logo`, id, fromPayload);
}

function maybeApplyPayloadIcon(): void {
  const id = PAYLOAD_PRESET[payloadType];
  const hasUserLogo = Boolean(logoDataUrl || logoUrlInput.value.trim()) && !payloadAutoLogo;
  if (hasUserLogo) return;

  if (!id) {
    if (payloadAutoLogo) resetLogoState();
    return;
  }

  if (activePresetId === id && logoDataUrl) return;
  applyPreset(id, true);
}

function updateLogoClearVisibility(): void {
  const hasFile = Boolean(logoDataUrl);
  const urlVal = logoUrlInput.value.trim();
  const hasUrl = Boolean(urlVal);
  const hasLogo = hasFile || hasUrl;

  if (clearLogoUrlBtn) clearLogoUrlBtn.hidden = !hasUrl;
  if (logoUploadZone) logoUploadZone.hidden = hasLogo;

  if (logoActiveContainer && logoPreviewThumb && logoActiveName) {
    if (hasLogo) {
      logoActiveContainer.hidden = false;
      if (hasFile && logoDataUrl) {
        logoPreviewThumb.src = logoDataUrl;
        logoActiveName.textContent = logoFileName || "Attached image";
      } else {
        logoPreviewThumb.src = urlVal;
        logoActiveName.textContent = urlVal.replace(/^https?:\/\//, "");
      }
    } else {
      logoActiveContainer.hidden = true;
      logoPreviewThumb.src = "";
      logoActiveName.textContent = "";
    }
  }
}

async function applyLogoSource(
  src: string,
  name: string,
  presetId: string | null = null,
  fromPayload = false,
): Promise<void> {
  const gen = ++logoApplyGen;
  try {
    const prepared = src.trim().startsWith("<svg") ? iconToDataUrl(src) : src;
    const next = prepared.startsWith("data:image/png")
      ? prepared
      : await rasterizeToPngDataUrl(prepared);
    if (gen !== logoApplyGen) return;
    logoDataUrl = next;
    logoFileName = name;
    logoUrlInput.value = "";
    activePresetId = presetId;
    payloadAutoLogo = fromPayload;
    updateLogoClearVisibility();
    syncPresetIconUI();
    setStatus(`Applied ${name}`);
    render();
  } catch (err) {
    if (gen !== logoApplyGen) return;
    const message = err instanceof Error ? err.message : "Could not apply logo";
    setStatus(message, true);
  }
}

function processLogoFile(file: File): void {
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file (PNG, JPG, SVG, WebP)", true);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    if (!result) {
      setStatus("Could not read logo file", true);
      return;
    }
    void applyLogoSource(result, file.name);
  };
  reader.onerror = () => setStatus("Could not read logo file", true);
  if (file.type === "image/svg+xml") reader.readAsText(file);
  else reader.readAsDataURL(file);
}

function resetLogoState(): void {
  logoApplyGen += 1;
  logoDataUrl = null;
  logoFileName = null;
  activePresetId = null;
  payloadAutoLogo = false;
  logoUrlInput.value = "";
  logoFileInput.value = "";
  updateLogoClearVisibility();
  syncPresetIconUI();
}

function clearLogo(): void {
  resetLogoState();
  setStatus("Logo removed");
  render();
}

function clearLogoUrl(): void {
  logoUrlInput.value = "";
  updateLogoClearVisibility();
  setStatus("Logo URL cleared");
  scheduleRender();
}

function downloadBlob(blob: Blob, filename: string): void {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Could not encode image"));
      else resolve(blob);
    }, type);
  });
}

async function exportFile(ext: "png" | "svg"): Promise<void> {
  try {
    render();
    await waitFrames(2);
    refreshFramePreview();
    const name = `xzyqrn-qr-${selectedStyle}`;
    if (ext === "png") {
      const canvas = getVisibleQrCanvas();
      if (!canvas) {
        setStatus("QR canvas not ready for export", true);
        return;
      }
      downloadBlob(await canvasToBlob(canvas), `${name}.png`);
      setStatus(`Downloaded ${name}.png`);
      return;
    }
    await qr.download({ name, extension: ext });
    setStatus(
      selectedFrame === "none"
        ? `Downloaded ${name}.svg`
        : `Downloaded ${name}.svg (frames apply to PNG)`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    setStatus(message, true);
  }
}

function truncateUrl(url: string, max = 42): string {
  const trimmed = url.replace(/\s+/g, " ").trim();
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

    const qrCanvas = getRawQrCanvas();
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

    const urlLine = truncateUrl(encodeCurrentPayload());
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

      ctx.strokeStyle = ink;
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, POSTER - 36, POSTER - 36);

      drawPerforations("left", ink);
      drawPerforations("right", ink);

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

      ctx.strokeStyle = inset;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(frame, frame, POSTER - frame * 2, POSTER - frame * 2);

      ctx.fillStyle = "#0a0a0a";
      const wellPad = 16;
      ctx.fillRect(
        frame + wellPad,
        frame + wellPad,
        POSTER - (frame + wellPad) * 2,
        POSTER - (frame + wellPad) * 2,
      );

      drawQrCard(qrSize, qrX, qrY, pad, "#0a0a0a", false);

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
    downloadBlob(await canvasToBlob(canvas), filename);
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

    const qrCanvas = getRawQrCanvas();
    if (!qrCanvas) {
      setStatus("QR canvas not ready for motion export", true);
      return;
    }

    const FRAME_COUNT = MOTION_FRAME_COUNT;
    const DELAY_MS = MOTION_DELAY_MS;
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
      const scale = 1 + MOTION_PULSE * Math.sin(t * Math.PI * 2);
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
      grad.addColorStop(0.45, `rgba(255,255,255,${MOTION_SHEEN})`);
      grad.addColorStop(0.55, `rgba(255,255,255,${MOTION_SHEEN})`);
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
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: "image/gif" });
    const filename = `xzyqrn-qr-${selectedStyle}-motion.gif`;
    downloadBlob(blob, filename);
    setStatus(`Downloaded ${filename}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Motion export failed";
    setStatus(message, true);
  } finally {
    exportMotionBtn.disabled = false;
    exportMotionBtn.textContent = prevLabel;
  }
}

async function copyQrToClipboard(): Promise<void> {
  try {
    render();
    await waitFrames(2);
    refreshFramePreview();
    const qrCanvas = getVisibleQrCanvas();
    if (!qrCanvas) throw new Error("No canvas");
    const blob = await canvasToBlob(qrCanvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Copied QR code to clipboard");
  } catch {
    setStatus("Clipboard access not available", true);
  }
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

function snapshotPreview(): string {
  const canvas = getVisibleQrCanvas();
  if (!canvas) return "";
  const thumb = document.createElement("canvas");
  const size = 96;
  thumb.width = size;
  thumb.height = size;
  const ctx = thumb.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#f3efe6";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / canvas.width, size / canvas.height);
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  ctx.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h);
  return thumb.toDataURL("image/jpeg", 0.72);
}

function currentDesignName(): string {
  const data = encodeCurrentPayload();
  return `${payloadLabel(payloadType)} · ${truncateUrl(data, 22)}`;
}

function captureDesign(): Omit<SavedDesign, "id" | "createdAt"> {
  return {
    name: currentDesignName(),
    payloadType,
    previewDataUrl: snapshotPreview(),
    config: {
      url: encodeCurrentPayload(),
      dotsColor: dotsInput.value,
      dotsGradientType: "none",
      dotsRotation: 0,
      bgColor: bgInput.value,
      bgGradientType: "none",
      bgTransparent: isTransparentBg(),
      cornerSqColor: cornerSqInput.value,
      cornerDotColor: cornerDotInput.value,
      dotType: dotType.value,
      cornerType: cornerType.value,
      cornerDotType: cornerDotType.value,
      errorLevel: errorLevel.value,
      margin: Number(marginInput.value),
      size: Number(sizeInput.value),
      frameStyle: selectedFrame,
      frameText: frameTextInput.value,
      selectedStyle,
      selectedKit,
    },
  };
}

function applyDesign(item: SavedDesign): void {
  ingestPayload(item.config.url, false);
  if (item.payloadType) {
    const type = item.payloadType as PayloadType;
    setPayloadType(type);
  }
  dotsInput.value = item.config.dotsColor;
  bgInput.value = item.config.bgColor;
  bgTransparentInput.checked = item.config.bgTransparent;
  cornerSqInput.value = item.config.cornerSqColor;
  cornerDotInput.value = item.config.cornerDotColor;
  dotType.value = item.config.dotType;
  cornerType.value = item.config.cornerType;
  cornerDotType.value = item.config.cornerDotType;
  errorLevel.value = item.config.errorLevel;
  if (typeof item.config.margin === "number") {
    marginInput.value = String(item.config.margin);
    marginLabel.textContent = `${item.config.margin} px`;
  }
  if (typeof item.config.size === "number") {
    sizeInput.value = String(item.config.size);
    sizeLabel.textContent = `${item.config.size} px`;
  }
  if (item.config.frameStyle && isFrameStyle(item.config.frameStyle)) {
    selectedFrame = item.config.frameStyle;
  }
  if (item.config.frameText) frameTextInput.value = item.config.frameText;
  if (isArtStyleId(item.config.selectedStyle)) selectedStyle = item.config.selectedStyle;
  if (isKitId(item.config.selectedKit)) selectedKit = item.config.selectedKit;
  syncHexLabels();
  syncTransparentBgUI();
  syncStyleSelectionUI();
  syncKitSelectionUI();
  syncFrameSelectionUI();
  render();
  setStatus(`Restored “${item.name}”`);
}

function libraryCard(item: SavedDesign, kind: "history" | "favorite"): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "library-card";
  wrap.title = item.name;
  const img = document.createElement("img");
  img.src = item.previewDataUrl || "";
  img.alt = "";
  const name = document.createElement("span");
  name.className = "library-card-name";
  name.textContent = item.name;
  const actions = document.createElement("div");
  actions.className = "library-card-actions";
  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "library-mini";
  favBtn.setAttribute("aria-label", isFavorite(item) ? "Remove from favorites" : "Add to favorites");
  favBtn.innerHTML = isFavorite(item)
    ? `<svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M6 1.2 7.4 4l3.1.4-2.3 2.2.6 3.1L6 8.2 3.2 9.7l.6-3.1L1.5 4.4 4.6 4z"/></svg>`
    : `<svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.2" d="M6 1.6 7.3 4.2l2.9.4-2.1 2 .5 2.9L6 8.1 3.4 9.5l.5-2.9-2.1-2 2.9-.4z"/></svg>`;
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(item);
    renderLibrary();
  });
  actions.append(favBtn);
  if (kind === "history") {
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "library-mini";
    delBtn.title = "Remove";
    delBtn.setAttribute("aria-label", "Remove from library");
    delBtn.textContent = "×";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromHistory(item.id);
      renderLibrary();
    });
    actions.append(delBtn);
  }
  wrap.append(img, name, actions);
  wrap.addEventListener("click", () => applyDesign(item));
  wrap.tabIndex = 0;
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      applyDesign(item);
    }
  });
  return wrap;
}

function renderLibrary(): void {
  const history = loadHistory();
  const favorites = loadFavorites();
  favoritesRow.replaceChildren();
  historyRow.replaceChildren();
  if (favorites.length) {
    favoritesRow.hidden = false;
    for (const item of favorites) favoritesRow.append(libraryCard(item, "favorite"));
  } else {
    favoritesRow.hidden = true;
  }
  if (!history.length) {
    const empty = document.createElement("p");
    empty.className = "library-empty";
    empty.textContent = "Save a design to reuse it on this device.";
    historyRow.append(empty);
    return;
  }
  for (const item of history) historyRow.append(libraryCard(item, "history"));
}

function saveCurrentDesign(): void {
  render();
  window.setTimeout(() => {
    refreshFramePreview();
    saveToHistory(captureDesign());
    renderLibrary();
    setStatus("Saved to library");
  }, 60);
}

async function openScanner(): Promise<void> {
  scannerStatus.textContent = "Point the camera at a code, or upload a photo.";
  scannerHost.replaceChildren();
  if (typeof scannerDialog.showModal === "function") scannerDialog.showModal();
  else scannerDialog.setAttribute("open", "");
  const result = await cameraScanner.start(scannerHost, (text) => {
    closeScanner();
    ingestPayload(text);
  });
  if (!result.supported) {
    scannerStatus.textContent = result.error
      ? `${result.error} You can still upload a photo.`
      : "Camera unavailable. Upload a photo instead.";
  }
}

function closeScanner(): void {
  cameraScanner.stop();
  if (scannerDialog.open) scannerDialog.close();
  scannerHost.replaceChildren();
}

async function scanUploadedImage(file: File): Promise<void> {
  scannerStatus.textContent = "Reading image…";
  try {
    const text = await detectFromImageFile(file);
    if (!text) {
      scannerStatus.textContent = "No QR code found in that image.";
      return;
    }
    closeScanner();
    ingestPayload(text);
  } catch (err) {
    scannerStatus.textContent = err instanceof Error ? err.message : "Could not read that image.";
  }
}

function onColorInput(): void {
  syncHexLabels();
  updateContrastMeter();
  scheduleRender();
}

function setupPreviewTilt(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const maxDeg = 6;

  const resetTilt = () => {
    qrHost.style.transform = "";
  };

  const onMove = (e: MouseEvent) => {
    if (previewMode === "3d" || previewMode === "motion" || selectedFrame !== "none" || reduceMotion.matches) {
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

const payloadFields = [
  urlInput,
  wifiSsid,
  wifiPass,
  wifiAuth,
  wifiHidden,
  vcardFirst,
  vcardLast,
  vcardPhone,
  vcardEmail,
  vcardCompany,
  vcardTitle,
  vcardUrl,
  vcardAddress,
  waPhone,
  waMessage,
  smsPhone,
  smsMessage,
  emailTo,
  emailSubject,
  emailBody,
  phoneNumber,
  plainText,
  cryptoCoin,
  cryptoAddress,
  cryptoAmount,
  eventTitle,
  eventLocation,
  eventStart,
  eventEnd,
  eventDesc,
];

typePills.forEach((pill) => {
  pill.addEventListener("click", () => {
    const t = pill.dataset.type as PayloadType | undefined;
    if (!t) return;
    setPayloadType(t);
    scheduleRender();
  });
});

for (const field of payloadFields) {
  field.addEventListener("input", scheduleRender);
  field.addEventListener("change", () => {
    if (field === wifiAuth) syncPayloadUI();
    scheduleRender();
  });
}

dotsInput.addEventListener("input", onColorInput);
bgInput.addEventListener("input", onColorInput);
bgTransparentInput.addEventListener("change", () => {
  syncTransparentBgUI();
  updateContrastMeter();
  scheduleRender();
});
cornerSqInput.addEventListener("input", onColorInput);
cornerDotInput.addEventListener("input", onColorInput);
dotType.addEventListener("change", scheduleRender);
cornerType.addEventListener("change", scheduleRender);
cornerDotType.addEventListener("change", scheduleRender);
errorLevel.addEventListener("change", scheduleRender);
frameTextInput.addEventListener("input", scheduleRender);

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

logoUploadZone?.addEventListener("click", () => logoFileInput.click());
logoUploadZone?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    logoFileInput.click();
  }
});
logoUploadZone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  logoUploadZone.classList.add("is-dragover");
});
logoUploadZone?.addEventListener("dragleave", () => logoUploadZone.classList.remove("is-dragover"));
logoUploadZone?.addEventListener("drop", (e) => {
  e.preventDefault();
  logoUploadZone.classList.remove("is-dragover");
  const file = e.dataTransfer?.files?.[0];
  if (file) processLogoFile(file);
});

logoInfoTrigger?.addEventListener("click", () => logoFileInput.click());
logoInfoTrigger?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    logoFileInput.click();
  }
});

logoFileInput.addEventListener("change", () => {
  const file = logoFileInput.files?.[0];
  if (file) processLogoFile(file);
});

logoUrlInput.addEventListener("input", () => {
  if (logoUrlInput.value.trim()) {
    logoDataUrl = null;
    logoFileInput.value = "";
    activePresetId = null;
    payloadAutoLogo = false;
    syncPresetIconUI();
  }
  updateLogoClearVisibility();
  scheduleRender();
});

deleteLogoBtn?.addEventListener("click", clearLogo);
clearLogoUrlBtn?.addEventListener("click", clearLogoUrl);

surpriseBtn.addEventListener("click", surpriseMe);
mode2dBtn.addEventListener("click", () => setPreviewMode("2d"));
modeMotionBtn.addEventListener("click", () => setPreviewMode("motion"));
mode3dBtn.addEventListener("click", () => setPreviewMode("3d"));
exportPngBtn.addEventListener("click", () => void exportFile("png"));
exportSvgBtn.addEventListener("click", () => void exportFile("svg"));
exportPosterBtn.addEventListener("click", () => void exportPoster());
exportMotionBtn.addEventListener("click", () => void exportMotion());
btnCopyImg?.addEventListener("click", () => void copyQrToClipboard());
saveDesignBtn.addEventListener("click", saveCurrentDesign);
export3dPngBtn.addEventListener("click", () => export3dPng());
scanQrBtn.addEventListener("click", () => void openScanner());
scannerClose.addEventListener("click", closeScanner);
scannerDialog.addEventListener("close", () => cameraScanner.stop());
scanFileInput.addEventListener("change", () => {
  const file = scanFileInput.files?.[0];
  scanFileInput.value = "";
  if (file) void scanUploadedImage(file);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && scannerDialog.open) {
    closeScanner();
    return;
  }
  if (e.key !== "s" && e.key !== "S") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (isTypingTarget(e.target)) return;
  e.preventDefault();
  surpriseMe();
});

renderStyleCards();
renderKitCards();
renderFrameCards();
renderBrandIcons();
applyStyleToControls(DEFAULT_STYLE);
syncStyleSelectionUI();
syncKitSelectionUI();
syncFrameSelectionUI();
syncPayloadUI();
marginLabel.textContent = `${marginInput.value} px`;
sizeLabel.textContent = `${sizeInput.value} px`;
logoSizeLabel.textContent = Number(logoSizeInput.value).toFixed(2);
syncHexLabels();
syncTransparentBgUI();
updateContrastMeter();
updateLogoClearVisibility();
syncModeUI();
setupPreviewTilt();
renderLibrary();
render();
