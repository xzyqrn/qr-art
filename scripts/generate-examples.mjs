
import { JSDOM } from "jsdom";
import * as nodeCanvas from "canvas";
import QRCodeStyling from "qr-code-styling";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import fs from "fs";
import path from "path";

const OUT = "/workspace/qr-art/examples";
const URL = "https://xzyqrn.example";
const { createCanvas } = nodeCanvas;

fs.mkdirSync(OUT, { recursive: true });

const PATTERNS = {
  mosaic: {
    backgroundOptions: { color: "#f7f5f0" },
    dotsOptions: { type: "extra-rounded", color: "#2a2825" },
    cornersSquareOptions: { type: "extra-rounded", color: "#2a2825" },
    cornersDotOptions: { type: "classy-rounded", color: "#2a2825" },
  },
  beads: {
    backgroundOptions: { color: "#efece4" },
    dotsOptions: { type: "dots", color: "#1a1917" },
    cornersSquareOptions: { type: "dot", color: "#1a1917" },
    cornersDotOptions: { type: "dot", color: "#1a1917" },
  },
  lattice: {
    backgroundOptions: { color: "#f4efe6" },
    dotsOptions: { type: "classy", color: "#171513" },
    cornersSquareOptions: { type: "classy-rounded", color: "#171513" },
    cornersDotOptions: { type: "classy", color: "#171513" },
  },
  pixel: {
    backgroundOptions: { color: "#ffffff" },
    dotsOptions: { type: "square", color: "#111111" },
    cornersSquareOptions: { type: "square", color: "#111111" },
    cornersDotOptions: { type: "square", color: "#111111" },
  },
};

async function makeQr(size, styleOpts) {
  const qr = new QRCodeStyling({
    jsdom: JSDOM,
    nodeCanvas,
    width: size,
    height: size,
    type: "canvas",
    data: URL,
    margin: 8,
    qrOptions: { errorCorrectionLevel: "H" },
    ...styleOpts,
  });
  const buf = await qr.getRawData("png");
  if (!buf) throw new Error("QR PNG failed");
  // Load into node canvas image for poster compositing
  const img = await nodeCanvas.loadImage(buf);
  return { buf, img, size };
}

async function writePattern(name, opts) {
  const { buf } = await makeQr(512, opts);
  const file = path.join(OUT, `pattern-${name}.png`);
  fs.writeFileSync(file, buf);
  console.log("wrote", file, buf.length);
}

function truncateUrl(raw) {
  const max = 42;
  if (raw.length <= max) return raw;
  return raw.slice(0, max - 1) + "…";
}

function drawQrCard(ctx, qrImg, qrSize, qrX, qrY, pad, cardColor, withShadow) {
  ctx.save();
  if (withShadow) {
    ctx.shadowColor = "rgba(26, 25, 23, 0.1)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
  }
  ctx.fillStyle = cardColor;
  const cardX = qrX - pad;
  const cardY = qrY - pad;
  const cardW = qrSize + pad * 2;
  const cardH = qrSize + pad * 2;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 6);
    ctx.fill();
  } else {
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }
  ctx.restore();
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
}

function drawPerforations(ctx, POSTER, side, ink) {
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
}

async function writeKit(kitId, qrImg) {
  // Approximate exportPoster at ~800px (scale from 1200)
  const POSTER = 800;
  const scale = POSTER / 1200;
  const canvas = createCanvas(POSTER, POSTER);
  const ctx = canvas.getContext("2d");
  const urlLine = truncateUrl(URL);
  const fontSans = "sans-serif";

  // Helper to scale layout numbers from 1200-based design
  const S = (n) => Math.round(n * scale);

  if (kitId === "stamp") {
    const paper = "#f3efe6";
    const card = "#fffdf8";
    const ink = "#1a1917";
    const muted = "#6f6a62";
    const margin = S(72);
    const qrSize = Math.round(POSTER - margin * 2 - S(48));
    const pad = S(22);
    const qrX = Math.round((POSTER - qrSize) / 2);
    const qrY = Math.round((POSTER - qrSize) / 2) - S(20);

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, POSTER, POSTER);
    ctx.strokeStyle = ink;
    ctx.lineWidth = S(14);
    ctx.strokeRect(S(36), S(36), POSTER - S(72), POSTER - S(72));
    ctx.lineWidth = S(3);
    ctx.strokeRect(S(52), S(52), POSTER - S(104), POSTER - S(104));
    drawQrCard(ctx, qrImg, qrSize, qrX, qrY, pad, card, true);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = muted;
    ctx.font = `400 ${S(16)}px ${fontSans}`;
    ctx.fillText(urlLine, POSTER / 2, qrY + qrSize + pad + S(28));
    ctx.save();
    ctx.translate(POSTER - S(150), POSTER - S(110));
    ctx.rotate((-12 * Math.PI) / 180);
    ctx.strokeStyle = ink;
    ctx.lineWidth = S(3);
    ctx.globalAlpha = 0.85;
    const stampW = S(168);
    const stampH = S(52);
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
    ctx.font = `700 ${S(18)}px ${fontSans}`;
    ctx.fillText("xzyqrn qr", 0, 1);
    ctx.restore();
  } else if (kitId === "ticket") {
    const paper = "#ffffff";
    const card = "#ffffff";
    const ink = "#111111";
    const stripH = S(96);
    const sidePad = S(64);
    const qrSize = Math.round(POSTER * 0.62);
    const pad = S(14);
    const qrX = Math.round((POSTER - qrSize) / 2);
    const qrY = Math.round((POSTER - stripH - qrSize) / 2) - S(10);

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, POSTER, POSTER);
    ctx.strokeStyle = ink;
    ctx.lineWidth = S(4);
    ctx.strokeRect(S(18), S(18), POSTER - S(36), POSTER - S(36));
    drawPerforations(ctx, POSTER, "left", ink);
    drawPerforations(ctx, POSTER, "right", ink);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.moveTo(sidePad, S(40));
    ctx.lineTo(sidePad, POSTER - stripH - S(24));
    ctx.moveTo(POSTER - sidePad, S(40));
    ctx.lineTo(POSTER - sidePad, POSTER - stripH - S(24));
    ctx.stroke();
    ctx.setLineDash([]);
    drawQrCard(ctx, qrImg, qrSize, qrX, qrY, pad, card, false);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2);
    ctx.fillStyle = ink;
    ctx.fillRect(0, POSTER - stripH, POSTER, stripH);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${S(28)}px ${fontSans}`;
    ctx.fillText(urlLine, POSTER / 2, POSTER - stripH / 2 - S(10));
    ctx.font = `600 ${S(14)}px ${fontSans}`;
    ctx.fillText("XZYQRN QR", POSTER / 2, POSTER - stripH / 2 + S(22));
  } else if (kitId === "film") {
    const matte = "#111111";
    const inset = "rgba(255,255,255,0.92)";
    const rebate = "rgba(255,255,255,0.78)";
    const frame = S(78);
    const qrSize = Math.round(POSTER - frame * 2 - S(36));
    const pad = S(10);
    const qrX = Math.round((POSTER - qrSize) / 2);
    const qrY = Math.round((POSTER - qrSize) / 2) - S(8);

    ctx.fillStyle = matte;
    ctx.fillRect(0, 0, POSTER, POSTER);
    ctx.strokeStyle = inset;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frame, frame, POSTER - frame * 2, POSTER - frame * 2);
    ctx.fillStyle = "#0a0a0a";
    const wellPad = S(16);
    ctx.fillRect(frame + wellPad, frame + wellPad, POSTER - (frame + wellPad) * 2, POSTER - (frame + wellPad) * 2);
    drawQrCard(ctx, qrImg, qrSize, qrX, qrY, pad, "#0a0a0a", false);
    ctx.fillStyle = rebate;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${S(13)}px ${fontSans}`;
    ctx.fillText("XZYQRN QR", POSTER / 2, S(42));
    ctx.font = `400 ${S(12)}px ${fontSans}`;
    ctx.fillText(urlLine.toUpperCase(), POSTER / 2, POSTER - S(42));
    const sprocketY = [frame + S(28), POSTER / 2, POSTER - frame - S(28)];
    ctx.fillStyle = "#1c1c1c";
    for (const y of sprocketY) {
      for (const x of [S(28), POSTER - S(28)]) {
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(x - S(10), y - S(14), S(20), S(28), 3);
          ctx.fill();
        } else {
          ctx.fillRect(x - S(10), y - S(14), S(20), S(28));
        }
      }
    }
  } else {
    // paper
    const paper = "#f3efe6";
    const card = "#fffdf8";
    const muted = "#6f6a62";
    const QR_RATIO = 0.7;
    const qrSize = Math.round(POSTER * QR_RATIO);
    const pad = S(18);
    const qrX = Math.round((POSTER - qrSize) / 2);
    const qrY = Math.round((POSTER - qrSize) / 2) - S(36);

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, POSTER, POSTER);
    drawQrCard(ctx, qrImg, qrSize, qrX, qrY, pad, card, true);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = muted;
    ctx.font = `400 ${S(17)}px ${fontSans}`;
    ctx.fillText(urlLine, POSTER / 2, qrY + qrSize + pad + S(22));
    ctx.font = `500 ${S(15)}px ${fontSans}`;
    ctx.fillStyle = muted;
    ctx.fillText("xzyqrn qr", POSTER / 2, POSTER - S(52));
  }

  const file = path.join(OUT, `kit-${kitId}.png`);
  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(file, buf);
  console.log("wrote", file, buf.length);
}

async function writeMotion(qrImg, bg) {
  const FRAME_COUNT = 18;
  const DELAY_MS = 70;
  const outSize = 480;
  const frameCanvas = createCanvas(outSize, outSize);
  const ctx = frameCanvas.getContext("2d");
  const gif = GIFEncoder();
  let globalPalette = null;

  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = i / FRAME_COUNT;
    const scale = 1 + 0.025 * Math.sin(t * Math.PI * 2);
    const angle = t * Math.PI * 2;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, outSize, outSize);

    ctx.save();
    ctx.translate(outSize / 2, outSize / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(qrImg, -outSize / 2, -outSize / 2, outSize, outSize);
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
    if (!globalPalette) {
      globalPalette = quantize(data, 256);
    }
    const index = applyPalette(data, globalPalette);
    gif.writeFrame(index, outSize, outSize, {
      palette: i === 0 ? globalPalette : undefined,
      delay: DELAY_MS,
      ...(i === 0 ? { repeat: 0 } : {}),
    });
  }

  gif.finish();
  const bytes = Buffer.from(gif.bytes());
  const file = path.join(OUT, "motion-sample.gif");
  fs.writeFileSync(file, bytes);
  console.log("wrote", file, bytes.length);
}

async function main() {
  for (const [name, opts] of Object.entries(PATTERNS)) {
    await writePattern(name, opts);
  }

  // Kits use a clear base/pixel QR for readability inside posters
  const kitQr = await makeQr(720, PATTERNS.pixel);
  for (const kit of ["paper", "stamp", "ticket", "film"]) {
    await writeKit(kit, kitQr.img);
  }

  // Motion: mosaic-style soft pulse
  const motionQr = await makeQr(480, PATTERNS.mosaic);
  await writeMotion(motionQr.img, PATTERNS.mosaic.backgroundOptions.color);

  const readme = `# xzyqrn qr — example exports

Generated sample images for chat / docs. URL encoded: \`${URL}\`.

## Pattern styles (QR only, ~512px)

| File | Style | Module shapes |
|------|-------|---------------|
| \`pattern-mosaic.png\` | mosaic | extra-rounded tiles |
| \`pattern-beads.png\` | beads | dots / bead curtain |
| \`pattern-lattice.png\` | lattice | classy lattice |
| \`pattern-pixel.png\` | pixel | hard square pixels |

## Brand kits (poster ~800px)

| File | Kit | Treatment |
|------|-----|-----------|
| \`kit-paper.png\` | Paper | Warm stock · quiet wordmark |
| \`kit-stamp.png\` | Stamp | Ink border · rubber mark |
| \`kit-ticket.png\` | Ticket | Perforations · bold strip |
| \`kit-film.png\` | Film | Matte frame · rebate type |

## Motion

| File | Notes |
|------|-------|
| \`motion-sample.gif\` | Soft pulse + sheen (same idea as Export motion) |

Regenerate with: \`node scripts/generate-examples.mjs\`
`;
  fs.writeFileSync(path.join(OUT, "README.md"), readme);
  console.log("wrote README.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
