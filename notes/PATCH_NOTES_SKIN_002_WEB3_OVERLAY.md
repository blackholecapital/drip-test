# PATCH NOTES — Skin 002 Web3 Overlay

Files changed:
- `src/ui/styles.css`
- `public/theme-packs/skin-002/manifest.json`

Files created:
- `src/ui/styles/skin-002-web3-overlay.css`
- `public/theme-packs/skin-002/overlays/nav-frame.svg`
- `public/theme-packs/skin-002/overlays/center-brand.svg`
- `public/theme-packs/skin-002/overlays/panel-frame.svg`
- `public/theme-packs/skin-002/overlays/canvas-header-frame.svg`
- `public/theme-packs/skin-002/overlays/promo-frame.svg`
- `public/theme-packs/skin-002/overlays/button-pill.svg`

What this patch does:
- Adds aggressive Web3 / neon sticker-style overlay assets to:
  - top nav
  - center XYZ Labs banner
  - left GATE panel frame
  - Canvas header chrome
  - promo card frame
  - visible chrome buttons/chips
- Does NOT change layout, grid, flex, spacing, wallpaper selection, or workspace card content.

Safety constraints:
- No `width`, `height`, `display`, `grid-template`, `flex`, `left`, `top`, or DOM changes.
- Overlays are attached with `::before` / `::after` and `pointer-events: none`.
- Workspace preview cards are intentionally not styled here.

If something looks too intense:
- Open `src/ui/styles/skin-002-web3-overlay.css`
- Reduce these values first:
  - glow `box-shadow`
  - overlay gradient opacities
  - `background` alpha on `.topBar`, `.leftPane > .panel`, `.canvasStrip > .panelHeader`, `.assistantPromoCard`

Fast rollback:
- Remove the last line from `src/ui/styles.css`:
  - `@import "./styles/skin-002-web3-overlay.css";`
