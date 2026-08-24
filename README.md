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

Deploy the **`dist/`** folder as a static site (build command `npm run build`, output directory `dist`). `vite.config.ts` sets `base: "./"` so asset paths work on project or subdirectory deploys.

#### Automated deployment via GitHub Actions

This repo includes a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that automatically deploys to Cloudflare Pages on every push to `main`.

**Setup steps:**

1. **Create a Cloudflare API token**
   - Go to [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use the "Edit Cloudflare Workers" template or create a custom token with:
     - **Account → Cloudflare Pages → Edit** permissions
     - **Account Settings → Read** permissions (if needed)
   - Copy the generated token

2. **Add GitHub repository secrets**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add two secrets:
     - `CLOUDFLARE_API_TOKEN`: your API token from step 1
     - `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID (found in the URL or dashboard sidebar)

3. **Deploy**
   - Push to `main` branch, or
   - Manually trigger via Actions → Deploy to Cloudflare Pages → Run workflow

4. **Custom domain (optional)**
   - Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/) → qr-art project → Custom domains
   - Add `qr.xzyqrn.com`
   - Cloudflare will automatically configure DNS if the domain is managed in your account

## Features

- Link / URL only as the encoded payload (no image/video hosting)
- Fifteen art presets: **Base** (classic default), house styles **void**, **newsprint**, **signal**, **static**, pattern styles **mosaic**, **beads**, **lattice**, **pixel** (module shapes only — colors stay with the pickers), then **Neon Glow**, **Pastel Soft**, **Ink Wash**, **Sunset Gradient**, **Mono Elegant**, **Playful Dots** — plus **Surprise me** (or press `S`) to roll a house style
- Live preview while typing or changing styles
- **3D mode** (toggle next to Preview): extrudes the QR matrix with Three.js (orbit, colors, Export 3D PNG). Style shapes/kits stay 2D-only.
- Independent colors for dots, background, outer corners, and inner corners; optional **transparent background** (PNG/SVG alpha; poster kits keep the outer frame); dot, corner square & corner dot shapes; size, margin, and error-correction controls
- Optional center logo via image URL or local file upload, with logo size and hide-dots-under-logo options (logo overlays the QR; data stays the link)
- Export **PNG**, **SVG**, square **poster PNG**, and animated **motion GIF** (subtle scale pulse) with brand **kits** (paper / stamp / ticket / film frames; color pickers stay independent of style & kit)
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
