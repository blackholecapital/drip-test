export const MOBILE_CANVAS = { width: 430, height: 860 };

function normalizeImageCode(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.includes(".") ? raw : `${raw}.png`;
}

export function toMobileRuntimePageSpec(runtimePage, studioPage) {
  const blocks = Array.isArray(studioPage?.blocks) ? studioPage.blocks : [];
  const content = studioPage?.content && typeof studioPage.content === "object" ? studioPage.content : {};
  const kinds = studioPage?.cardKinds && typeof studioPage.cardKinds === "object" ? studioPage.cardKinds : {};
  const style = studioPage?.style && typeof studioPage.style === "object" ? studioPage.style : {};
  const margin = 18;
  const spacing = 18;
  const cardWidth = MOBILE_CANVAS.width - margin * 2;
  let cursorY = margin;

  const outBlocks = [];

  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;

    const kind = kinds[b.id] || "text";
    const lines = Array.isArray(content[b.id]) ? content[b.id] : [];
    const first = String(lines[0] ?? "").trim();
    const title = kind === "text" ? (first || `${runtimePage.toUpperCase()} / ${b.id}`) : "";
    const bodyLines = kind === "text" ? lines.slice(1, 10).map((x) => String(x ?? "")) : [];
    const nextHeight = Math.max(kind === "text" ? Math.round((Number(b.h ?? 220) / 1400) * 980) : 240, 180);

    outBlocks.push({
      id: String(b.id),
      kind,
      x: margin,
      y: cursorY,
      w: cardWidth,
      h: nextHeight,
      title,
      lines: bodyLines,
      image: kind === "image" ? normalizeImageCode(first) : "",
      mediaUrl: kind === "video" || kind === "social" ? first : ""
    });

    cursorY += nextHeight + spacing;
  }

  return {
    version: 1,
    page: runtimePage,
    viewport: MOBILE_CANVAS,
    wallpaperUrl: style.wallpaperUrl || "",
    style,
    blocks: outBlocks
  };
}
