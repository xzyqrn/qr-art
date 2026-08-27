export type FrameStyle =
  | "none"
  | "bottom-badge"
  | "top-banner"
  | "speech-bubble"
  | "phone-frame"
  | "ticket-ribbon";

export interface FrameOptions {
  style: FrameStyle;
  text: string;
  textColor: string;
  bgColor: string;
  accentColor?: string;
  fontSize?: number;
}

export function drawFramedQr(
  qrCanvas: HTMLCanvasElement,
  options: FrameOptions,
  targetSize?: number
): HTMLCanvasElement {
  const qrSize = qrCanvas.width;
  const { style, text, textColor, bgColor, accentColor } = options;

  if (style === "none" || !text.trim()) {
    if (targetSize && targetSize !== qrSize) {
      const resized = document.createElement("canvas");
      resized.width = targetSize;
      resized.height = targetSize;
      const ctx = resized.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(qrCanvas, 0, 0, targetSize, targetSize);
      return resized;
    }
    return qrCanvas;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  let width = qrSize;
  let height = qrSize;
  let qrX = 0;
  let qrY = 0;

  const pad = Math.round(qrSize * 0.08);
  const bannerH = Math.round(qrSize * 0.18);

  if (style === "bottom-badge") {
    width = qrSize + pad * 2;
    height = qrSize + pad * 2 + bannerH;
    qrX = pad;
    qrY = pad;

    canvas.width = width;
    canvas.height = height;

    // Background container
    ctx.fillStyle = bgColor;
    roundRect(ctx, 0, 0, width, height, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = accentColor || "#1a1917";
    ctx.lineWidth = Math.max(2, Math.round(qrSize * 0.008));
    roundRect(ctx, 0, 0, width, height, 16);
    ctx.stroke();

    // Draw QR
    ctx.drawImage(qrCanvas, qrX, qrY);

    // Draw CTA Banner Button
    const btnW = width - pad * 2;
    const btnH = bannerH * 0.8;
    const btnX = pad;
    const btnY = qrY + qrSize + (bannerH - btnH) / 2;

    ctx.fillStyle = accentColor || "#1a1917";
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(btnH * 0.45)}px "IBM Plex Sans", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.toUpperCase(), btnX + btnW / 2, btnY + btnH / 2, btnW - 16);
  } else if (style === "top-banner") {
    width = qrSize + pad * 2;
    height = qrSize + pad * 2 + bannerH;
    qrX = pad;
    qrY = pad + bannerH;

    canvas.width = width;
    canvas.height = height;

    // Background container
    ctx.fillStyle = bgColor;
    roundRect(ctx, 0, 0, width, height, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = accentColor || "#1a1917";
    ctx.lineWidth = Math.max(2, Math.round(qrSize * 0.008));
    roundRect(ctx, 0, 0, width, height, 16);
    ctx.stroke();

    // Banner
    const btnW = width - pad * 2;
    const btnH = bannerH * 0.8;
    const btnX = pad;
    const btnY = pad + (bannerH - btnH) / 2;

    ctx.fillStyle = accentColor || "#1a1917";
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(btnH * 0.45)}px "IBM Plex Sans", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.toUpperCase(), btnX + btnW / 2, btnY + btnH / 2, btnW - 16);

    // Draw QR
    ctx.drawImage(qrCanvas, qrX, qrY);
  } else if (style === "speech-bubble") {
    width = qrSize + pad * 2;
    height = qrSize + pad * 2 + bannerH + 12;
    qrX = pad;
    qrY = pad + bannerH + 12;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = bgColor;
    roundRect(ctx, 0, 0, width, height, 14);
    ctx.fill();

    // Bubble
    const bW = width - pad * 2;
    const bH = bannerH * 0.85;
    const bX = pad;
    const bY = pad;

    ctx.fillStyle = accentColor || "#1a1917";
    roundRect(ctx, bX, bY, bW, bH, 10);
    ctx.fill();

    // Pointer
    ctx.beginPath();
    ctx.moveTo(width / 2 - 8, bY + bH);
    ctx.lineTo(width / 2, bY + bH + 8);
    ctx.lineTo(width / 2 + 8, bY + bH);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(bH * 0.45)}px "IBM Plex Sans", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.toUpperCase(), bX + bW / 2, bY + bH / 2, bW - 16);

    // Draw QR
    ctx.drawImage(qrCanvas, qrX, qrY);
  } else if (style === "phone-frame") {
    const phonePadTop = Math.round(qrSize * 0.14);
    const phonePadBot = Math.round(qrSize * 0.16);
    width = qrSize + pad * 2;
    height = qrSize + phonePadTop + phonePadBot;
    qrX = pad;
    qrY = phonePadTop;

    canvas.width = width;
    canvas.height = height;

    // Phone body
    ctx.fillStyle = bgColor;
    roundRect(ctx, 0, 0, width, height, 28);
    ctx.fill();

    ctx.strokeStyle = accentColor || "#1a1917";
    ctx.lineWidth = Math.max(3, Math.round(qrSize * 0.012));
    roundRect(ctx, 0, 0, width, height, 28);
    ctx.stroke();

    // Notch
    const notchW = Math.round(width * 0.35);
    const notchH = Math.round(phonePadTop * 0.28);
    ctx.fillStyle = accentColor || "#1a1917";
    roundRect(ctx, (width - notchW) / 2, Math.round(phonePadTop * 0.25), notchW, notchH, 4);
    ctx.fill();

    // Draw QR
    ctx.drawImage(qrCanvas, qrX, qrY);

    // Home bar & text
    ctx.fillStyle = accentColor || "#1a1917";
    ctx.font = `bold ${Math.round(phonePadBot * 0.3)}px "IBM Plex Sans", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.toUpperCase(), width / 2, qrY + qrSize + phonePadBot * 0.45, width - pad * 2);
  } else if (style === "ticket-ribbon") {
    width = qrSize + pad * 2;
    height = qrSize + pad * 2 + bannerH;
    qrX = pad;
    qrY = pad;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = accentColor || "#1a1917";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Perforation line
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(4, qrY + qrSize + 8);
    ctx.lineTo(width - 4, qrY + qrSize + 8);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.drawImage(qrCanvas, qrX, qrY);

    ctx.fillStyle = accentColor || "#1a1917";
    ctx.font = `600 ${Math.round(bannerH * 0.38)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`★ ${text.toUpperCase()} ★`, width / 2, qrY + qrSize + bannerH * 0.6, width - pad * 2);
  }

  if (targetSize && targetSize !== canvas.width) {
    const resized = document.createElement("canvas");
    const aspect = canvas.height / canvas.width;
    resized.width = targetSize;
    resized.height = Math.round(targetSize * aspect);
    const rctx = resized.getContext("2d")!;
    rctx.drawImage(canvas, 0, 0, resized.width, resized.height);
    return resized;
  }

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
