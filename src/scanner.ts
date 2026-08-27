import jsQR from "jsqr";

function decodeImageData(image: ImageData): string | null {
  const result = jsQR(image.data, image.width, image.height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data?.trim() || null;
}

function rasterize(source: CanvasImageSource, width: number, height: number): ImageData {
  const max = 720;
  const scale = Math.max(width, height) > max ? max / Math.max(width, height) : 1;
  const dw = Math.max(1, Math.round(width * scale));
  const dh = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not read image for scan");
  ctx.drawImage(source, 0, 0, dw, dh);
  return ctx.getImageData(0, 0, dw, dh);
}

export async function detectFromImageFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    return decodeImageData(rasterize(bitmap, bitmap.width, bitmap.height));
  } finally {
    bitmap.close();
  }
}

export class CameraScanner {
  private videoEl: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private active = false;
  private raf = 0;
  private onResultCallback: ((text: string) => void) | null = null;

  async start(
    container: HTMLElement,
    onResult: (text: string) => void,
  ): Promise<{ supported: boolean; error?: string }> {
    this.stop();
    this.onResultCallback = onResult;

    if (!navigator.mediaDevices?.getUserMedia) {
      return { supported: false, error: "Camera API not available in this browser." };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      this.videoEl = document.createElement("video");
      this.videoEl.setAttribute("playsinline", "true");
      this.videoEl.setAttribute("autoplay", "true");
      this.videoEl.muted = true;
      this.videoEl.style.width = "100%";
      this.videoEl.style.height = "100%";
      this.videoEl.style.objectFit = "cover";
      this.videoEl.style.borderRadius = "6px";
      this.videoEl.srcObject = this.stream;

      container.replaceChildren(this.videoEl);
      await this.videoEl.play();
      this.active = true;
      this.scanLoop();
      return { supported: true };
    } catch (err) {
      this.stop();
      const msg = err instanceof Error ? err.message : "Camera access denied";
      return { supported: false, error: msg };
    }
  }

  private scanLoop(): void {
    const tick = () => {
      if (!this.active || !this.videoEl) return;
      const video = this.videoEl;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth) {
        try {
          const code = decodeImageData(
            rasterize(video, video.videoWidth, video.videoHeight),
          );
          if (code && this.onResultCallback) {
            this.onResultCallback(code);
            this.stop();
            return;
          }
        } catch {
          // Ignore a bad frame and keep scanning.
        }
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.active = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl.remove();
      this.videoEl = null;
    }
    this.onResultCallback = null;
  }
}
