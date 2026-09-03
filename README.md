# xzyqrn qr

Print-studio style QR generator from **xzyqrn qr**. Paste a URL, pick a preset, tweak colors, optionally add a center logo, and export PNG or SVG.

Built with **Vite + TypeScript**, [`qr-code-styling`](https://www.npmjs.com/package/qr-code-styling) (2D), [`qrcode`](https://www.npmjs.com/package/qrcode) + [`three`](https://www.npmjs.com/package/three) (3D). No backend, no env secrets — static and Cloudflare Pages–ready.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
npm run build
```

Output lands in `dist/`. Preview locally:

```bash
npm run preview
```

### Cloudflare Pages

Pushes to `main` deploy via [`.github/workflows/cloudflare-pages.yml`](.github/workflows/cloudflare-pages.yml) (`npm run build` → `dist/`, project `qr-art`). The workflow needs repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. `vite.config.ts` sets `base: "./"` so asset paths work on project or subdirectory deploys.

## Features

- Encoded payloads: **link**, **Wi-Fi**, **vCard**, **WhatsApp**, **SMS**, **email**, **phone**, **text**, **crypto**, and **calendar event**, plus **Scan QR** (camera or photo)
- Fifteen art presets: **Base** (classic default), house styles **void**, **newsprint**, **signal**, **static**, pattern styles **mosaic**, **beads**, **lattice**, **pixel** (module shapes only — colors stay with the pickers), then **Neon Glow**, **Pastel Soft**, **Ink Wash**, **Sunset Gradient**, **Mono Elegant**, **Playful Dots** — plus **Surprise me** (or press `S`) to roll a house style
- Live preview while typing or changing styles
- **3D mode** (toggle next to Preview): extrudes the QR matrix with Three.js (orbit, colors, Export 3D PNG). Style shapes/kits stay 2D-only.
- Independent colors for dots, background, outer corners, and inner corners; optional **transparent background** (PNG/SVG alpha; poster kits keep the outer frame); live **contrast** check; dot, corner square & corner dot shapes; size, margin, and error-correction controls
- Optional center logo via preset icons, image URL, or local file upload, with logo size and hide-dots-under-logo options
- **Frames** (badge, banner, bubble, phone, ribbon) on PNG/copy; **kits** (paper / stamp / ticket / film) on square poster export
- Export **PNG**, **SVG**, square **poster PNG**, and animated **motion GIF**; copy to clipboard; save designs to a local library
- Mobile-friendly layout, labeled controls, Base style default on first paint

## Zip / source distribution

If you received `qr-art.zip`, it excludes `node_modules/` and `dist/` to stay small. After unzipping:

```bash
npm install
npm run build
```

## Limitations

- Very long URLs can produce denser (harder to scan) codes -- keep links short when possible.
- Remote logo URLs must allow CORS for canvas export; local file upload avoids that.
- Scanning reliability depends on contrast, logo size, and printer/screen quality. Error correction is set to **H**.
- Artistic styles are decorative; always test-scan before printing or sharing widely.

## License

MIT — use freely.
