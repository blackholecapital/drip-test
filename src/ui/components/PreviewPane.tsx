import type { CardKind, LineAlign, PageSpec } from "../../core/types";

function safeLines(lines: string[] | undefined) {
  return (lines ?? []).map((s) => String(s ?? ""));
}

function kindLabel(kind: CardKind) {
  if (kind === "video") return "VIDEO CARD";
  if (kind === "social") return "SOCIAL CARD";
  if (kind === "image") return "IMAGE CARD";
  return "";
}

function fontFamilyFor(fontId?: string) {
  if (fontId === "F2") return 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial';
  if (fontId === "F3") return '"Trebuchet MS", Arial, sans-serif';
  if (fontId === "F4") return '"Courier New", ui-monospace, monospace';
  if (fontId === "F5") return 'ui-serif, Georgia, "Times New Roman", Times, serif';
  return 'system-ui, -apple-system, "Segoe UI", Arial';
}

function cardBgFor(bgId?: string) {
  if (bgId === "BG0") return "rgba(0,0,0,0)";
  if (bgId === "BG1") return "rgba(0,0,0,.08)"; // Glass (very light)
  if (bgId === "BG2") return "rgba(0,0,0,.16)"; // Smoke
  if (bgId === "BG3") return "rgba(0,0,0,.24)"; // Dim
  if (bgId === "BG4") return "rgba(0,0,0,.30)"; // Dark
  if (bgId === "BG5") return "rgba(10,10,18,.38)"; // Midnight
  if (bgId === "BG6") return "rgba(0,0,0,.46)";
  if (bgId === "BG7") return "rgba(0,0,0,.56)";
  if (bgId === "BG8") return "rgba(0,0,0,.66)";
  if (bgId === "BG9") return "rgba(0,0,0,.76)";
  if (bgId === "BG10") return "rgba(0,0,0,.86)";
  return "rgba(0,0,0,.08)";
}

function getLineAlign(page: PageSpec, cardId: string, lineIndex: number): LineAlign {
  const map = page.style?.lineAlign ?? {};
  const cardMap = map[cardId] ?? {};
  return cardMap[lineIndex] ?? "left";
}

function getCardTextStyle(page: PageSpec, cardId: string) {
  const per = page.style?.cardTextStyle?.[cardId] ?? {};
  const style = page.style ?? {};
  const fontSize = per.fontSize ?? style.fontSize ?? 14;
  const fontWeight = per.fontWeight ?? style.fontWeight ?? 400;
  const fontStyle = per.fontStyle ?? style.fontStyle ?? "normal";
  const textDecoration = per.textDecoration ?? style.textDecoration ?? "none";
  return { fontSize, fontWeight, fontStyle, textDecoration } as const;
}

function imageSourceFor(code: string) {
  if (!code) return "";
  if (/^(https?:)?\/\//i.test(code) || code.startsWith("/")) return code;
  if (code.includes(".")) return `/ads/${code}`;
  return `/ads/${code}.png`;
}

function embedUrlFor(url: string) {
  return String(url ?? "").trim();
}


export function PreviewPane({
  page,
  mode = "framed",
  renderWallpaper = true
}: {
  page: PageSpec;
  mode?: "framed" | "floating" | "mobile";
  renderWallpaper?: boolean;
}) {
  const fontFamily = fontFamilyFor(page.style?.fontId);
  const cardBg = cardBgFor(page.style?.cardBgId);
  const wallpaperUrl = page.style?.wallpaperUrl;

  return (
    <div className={`previewShell ${mode === "floating" ? "floating" : ""} ${mode === "mobile" ? "mobile" : ""}`.trim()}>
      <div
        className={`previewStage ${mode}`}
        style={renderWallpaper && wallpaperUrl ? { backgroundImage: `url(${wallpaperUrl})` } : undefined}
      >
        <div className="previewStageOverlay" />
        {page.blocks.map((b, i) => {
          const kind: CardKind = page.cardKinds?.[b.id] ?? "text";
          const lines = safeLines(page.content[b.id]);
          if (page.content?.[b.id] === undefined && page.cardKinds?.[b.id] === undefined) return null;

          const v1 = lines[0] ?? "";
          const v2 = lines[1] ?? "";

          const title = kind === "text" ? lines[0] ?? "Card" : "";

          const bodyLines: string[] =
            kind === "text" ? lines.slice(1, 10) : [];

          const cardTextStyle = getCardTextStyle(page, b.id);

          return (
            <article
              key={b.id}
              className="previewCard"
              style={{
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                background: cardBg,
                fontFamily,
                fontSize: cardTextStyle.fontSize,
                fontWeight: cardTextStyle.fontWeight,
                fontStyle: cardTextStyle.fontStyle,
                textDecoration: cardTextStyle.textDecoration
              }}
            >
              <div className="previewCardNum">{i + 1}</div>
              <div className="previewCardInner">
                {title ? (
                  <div className="previewCardTitle" style={{ textAlign: getLineAlign(page, b.id, 0) }}>
                    {title}
                  </div>
                ) : null}

                <div className="previewCardBody">
                  {kind === "image" && v1 ? (
                    <img
                      className="previewImage"
                      src={imageSourceFor(v1)}
                      alt={v1}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallbackApplied && target.src.endsWith(".png")) {
                          target.dataset.fallbackApplied = "1";
                          target.src = target.src.replace(/\.png$/i, ".jpg");
                          return;
                        }
                        target.style.display = "none";
                      }}
                    />
                  ) : null}

                  {kind === "video" && v1 ? (
                    <video className="previewImage" src={embedUrlFor(v1)} controls playsInline preload="metadata" />
                  ) : null}

                  {kind === "social" && v1 ? (
                    <iframe className="previewImage" src={embedUrlFor(v1)} title={b.id} loading="lazy" />
                  ) : null}

                  {bodyLines
                    .map((s) => String(s ?? ""))
                    .filter((s) => s.trim().length)
                    .map((ln, idx) => (
                      <div key={idx} className="previewLine" style={{ textAlign: getLineAlign(page, b.id, idx + 1) }}>
                        {ln}
                      </div>
                    ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
