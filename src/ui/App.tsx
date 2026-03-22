import { useEffect, useMemo, useState } from "react";
import type { CardKind, DemoSpecBundle, PageSpec, TabKey } from "../core/types";
import { wallpaperCatalog } from "../core/wallpaperCatalog";
import { makeInitialBundle, setBlocks, setCardKind, setCardLine, setPageStyle } from "../core/store";
import { Tabs } from "./components/Tabs";
import { AccordionCardEditor } from "./components/AccordionCardEditor";
import { PreviewPane } from "./components/PreviewPane";
import { AssistantPromoCard } from "./components/AssistantPromoCard";
import { MobilePreviewPane } from "../mobile/components/MobilePreviewPane";
import { LayoutButtons } from "./components/LayoutButtons";
import { ScraperPanel } from "./panels/ScraperPanel";

const tabItems = [
  { key: "gate", label: "Gate" },
  { key: "vip", label: "VIP" },
  { key: "perks", label: "Perks" },
  { key: "account", label: "Account" },
  { key: "socials", label: "Socials" },
  { key: "scraper", label: "Scraper" }
] as const;

function pageFromTab(tab: TabKey, bundle: DemoSpecBundle): PageSpec | null {
  if (tab === "scraper" || tab === "prototype") return null;
  return bundle.pages[tab as PageSpec["page"]];
}

function sanitizeSlug(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s.length ? s : "demo";
}

function randomSuffix(len = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** --- Templates (auto-generated) --- */
type Template = { id: string; blocks: PageSpec["blocks"]; count: number };

function genTemplates(): Record<number, Template[]> {
  // 10 templates each for counts 1..6
  const out: Record<number, Template[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  const mk = (count: number, idx: number): Template => {
    const id = `T${count}-${String(idx + 1).padStart(2, "0")}`;

    // base canvas size (rough)
    const W = 1400;
    const H = 780;

    const pad = 90;
    const gx = 80 + (idx % 5) * 10;
    const gy = 70 + (Math.floor(idx / 5) % 2) * 14;

    const blocks: PageSpec["blocks"] = [];

    const place = (idc: string, x: number, y: number, w: number, h: number) =>
      blocks.push({ id: idc, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });

    if (count === 1) {
      place("card1", pad + gx, pad + gy, W - pad * 2 - gx, 360 + (idx % 3) * 30);
    } else if (count === 2) {
      const w = (W - pad * 2 - 40) / 2;
      place("card1", pad + gx, pad + gy, w, 300 + (idx % 3) * 20);
      place("card2", pad + gx + w + 40, pad + gy, w, 300 + (idx % 3) * 20);
    } else if (count === 3) {
      // two top + one wide bottom
      const w = (W - pad * 2 - 40) / 2;
      place("card1", pad + gx, pad + gy, w, 240);
      place("card2", pad + gx + w + 40, pad + gy, w, 240);
      place("card3", pad + gx, pad + gy + 270, W - pad * 2, 260 + (idx % 2) * 30);
    } else if (count === 4) {
      // 2x2 grid
      const w = (W - pad * 2 - 40) / 2;
      const h = (H - pad * 2 - 40) / 2;
      place("card1", pad + gx, pad + gy, w, h);
      place("card2", pad + gx + w + 40, pad + gy, w, h);
      place("card3", pad + gx, pad + gy + h + 40, w, h);
      place("card4", pad + gx + w + 40, pad + gy + h + 40, w, h);
    } else if (count === 5) {
      // top row 2 + bottom row 3
      const w2 = (W - pad * 2 - 40) / 2;
      place("card1", pad + gx, pad + gy, w2, 210);
      place("card2", pad + gx + w2 + 40, pad + gy, w2, 210);
      const w3 = (W - pad * 2 - 80) / 3;
      place("card3", pad + gx, pad + gy + 250, w3, 220);
      place("card4", pad + gx + w3 + 40, pad + gy + 250, w3, 220);
      place("card5", pad + gx + (w3 + 40) * 2, pad + gy + 250, w3, 220);
    } else {
      // 6: 3x2 grid
      const w3 = (W - pad * 2 - 80) / 3;
      const h2 = (H - pad * 2 - 40) / 2;
      place("card1", pad + gx, pad + gy, w3, h2);
      place("card2", pad + gx + w3 + 40, pad + gy, w3, h2);
      place("card3", pad + gx + (w3 + 40) * 2, pad + gy, w3, h2);
      place("card4", pad + gx, pad + gy + h2 + 40, w3, h2);
      place("card5", pad + gx + w3 + 40, pad + gy + h2 + 40, w3, h2);
      place("card6", pad + gx + (w3 + 40) * 2, pad + gy + h2 + 40, w3, h2);
    }

    return { id, blocks, count };
  };

  for (let c = 1; c <= 6; c++) {
    out[c] = Array.from({ length: 10 }).map((_, i) => mk(c, i));
  }
  return out;
}

const templateGroups = genTemplates();
const imageCodes = ["A1", "A2", "A3", "ali-ai1"];

function scaleStyle(blocks: PageSpec["blocks"], w = 220, h = 140) {
  // Rough scale preview based on assumed W/H above
  const W = 1400;
  const H = 780;
  const sx = w / W;
  const sy = h / H;
  return blocks.map((b) => ({
    ...b,
    x: b.x * sx,
    y: b.y * sy,
    w: b.w * sx,
    h: b.h * sy
  }));
}

export function App() {
  const [slugInput, setSlugInput] = useState("my-demo");
  const [activeTab, setActiveTab] = useState<TabKey>("gate");
  const [bundle, setBundle] = useState<DemoSpecBundle>(() => makeInitialBundle("my-demo"));

  const [saved, setSaved] = useState<boolean>(() => localStorage.getItem("ds_saved") === "1");
  const [savedAt, setSavedAt] = useState<string>(() => localStorage.getItem("ds_saved_at") ?? "");
  const [effectiveSlug, setEffectiveSlug] = useState<string | null>(() => localStorage.getItem("ds_eff_slug"));
  const [demoLinks, setDemoLinks] = useState<string[]>([]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  const [activeCardId, setActiveCardId] = useState<string | null>("card1");

  const [showTemplates, setShowTemplates] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [templateCount, setTemplateCount] = useState<1 | 2 | 3 | 4 | 5 | 6>(2);
  const [templatesTab, setTemplatesTab] = useState<"templates" | "themes" | "blocks">("templates");

  const [showImages, setShowImages] = useState(false);
  const [showFonts, setShowFonts] = useState(false);
  const [fontTargetCardId, setFontTargetCardId] = useState<string>("all");

  useEffect(() => {
    if (showFonts) setFontTargetCardId(activeCardId ?? "all");
  }, [showFonts, activeCardId]);
  const [showScraper, setShowScraper] = useState(false);
  const [showCardBg, setShowCardBg] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPrototype, setShowPrototype] = useState(false);

  const activePage = useMemo(() => pageFromTab(activeTab, bundle), [activeTab, bundle]);

  const activeWallpaper = activePage?.style?.wallpaperUrl ?? "/wallpapers/wp-001-holographic-cosmos.png";

  function updatePage(next: PageSpec) {
    setBundle((b) => ({ ...b, slug: slugInput, pages: { ...b.pages, [next.page]: next } }));
  }

  function ensureEffectiveSlug(): string {
    const base = sanitizeSlug(slugInput);
    const next = `${base}-${randomSuffix(5)}`;
    setEffectiveSlug(next);
    localStorage.setItem("ds_eff_slug", next);
    return next;
  }

  function doSave(): DemoSpecBundle {
    const slug = effectiveSlug ?? ensureEffectiveSlug();
    const out = { ...bundle, slug };
    setSaved(true);
    localStorage.setItem("ds_saved", "1");
    const ts = new Date().toISOString();
    setSavedAt(ts);
    localStorage.setItem("ds_saved_at", ts);
    return out;
  }

  async function onSave() {
    doSave();
  }

  async function onDeploy() {
    // auto-save on deploy (idiot-proof)
    const tenant = doSave();
    const slug = tenant.slug;

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, tenant })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "Deploy failed.");
        return;
      }

      const urls: string[] = Array.isArray(data?.urls) ? data.urls : [];
      setDemoLinks(urls);
    } catch {
      alert("Deploy failed (network error).");
    }
  }

  function resetSaveState() {
    setSaved(false);
    setSavedAt("");
    localStorage.removeItem("ds_saved");
    localStorage.removeItem("ds_saved_at");
    setDemoLinks([]);
  }

  function hardReset() {
    // Clears save/deploy state so the next Save/Deploy generates a fresh effective slug.
    setEffectiveSlug(null);
    localStorage.removeItem("ds_eff_slug");
    resetSaveState();
  }


  function onSlugChange(v: string) {
    setSlugInput(v);
    setEffectiveSlug(null);
    localStorage.removeItem("ds_eff_slug");
    resetSaveState();
  }

  function applyTemplate(t: Template) {
    if (!activePage) return;

    // apply blocks, and make sure cardKinds exist for referenced cards
    let next = setBlocks(activePage, t.blocks, t.id);

    // If template includes card6 etc, keep content slots stable by auto-creating kinds/content entries if missing.
    for (const b of t.blocks) {
      if (!next.content[b.id]) next = setCardLine(next, b.id, 0, `${activeTab.toUpperCase()} / ${b.id}`);
      if (!next.cardKinds?.[b.id]) next = setCardKind(next, b.id, "text");
    }

    updatePage(next);
    setShowTemplates(false);
  }

  function applyImageCode(code: string) {
    if (!activePage || !activeCardId) return;
    let next = activePage;
    next = setCardKind(next, activeCardId, "image");
    next = setCardLine(next, activeCardId, 0, code);
    updatePage(next);
    setShowImages(false);
  }

  function setFont(fontId: string) {
    if (!activePage) return;
    updatePage(setPageStyle(activePage, { fontId }));
    setShowFonts(false);
  }
  function updateTextStyleForTarget(target: string, patch: any) {
    if (!activePage) return;
    const anyStyle: any = activePage.style ?? {};
    if (target === "all") {
      updatePage(setPageStyle(activePage, patch as any));
      return;
    }
    const map = { ...(anyStyle.cardTextStyle ?? {}) };
    map[target] = { ...(map[target] ?? {}), ...patch };
    updatePage(setPageStyle(activePage, { cardTextStyle: map } as any));
  }

  function getTextStyleForTarget(target: string) {
    const anyStyle: any = activePage?.style ?? {};
    const per = target === "all" ? {} : ((anyStyle.cardTextStyle ?? {})[target] ?? {});
    const fontSize = (per.fontSize ?? anyStyle.fontSize ?? 14) as number;
    const fontWeight = (per.fontWeight ?? anyStyle.fontWeight ?? 400) as number;
    const fontStyle = (per.fontStyle ?? anyStyle.fontStyle ?? "normal") as string;
    const textDecoration = (per.textDecoration ?? anyStyle.textDecoration ?? "none") as string;
    return { fontSize, fontWeight, fontStyle, textDecoration };
  }

  function setFontSize(nextSize: number) {
    const target = fontTargetCardId || "all";
    const next = Math.max(10, Math.min(32, Number(nextSize) || 14));
    updateTextStyleForTarget(target, { fontSize: next });
  }

  function adjustFontSize(delta: number) {
    const target = fontTargetCardId || "all";
    const cur = getTextStyleForTarget(target).fontSize;
    setFontSize(cur + delta);
  }

  function toggleBold() {
    const target = fontTargetCardId || "all";
    const cur = getTextStyleForTarget(target).fontWeight;
    updateTextStyleForTarget(target, { fontWeight: cur >= 600 ? 400 : 700 });
  }

  function toggleItalic() {
    const target = fontTargetCardId || "all";
    const cur = getTextStyleForTarget(target).fontStyle;
    updateTextStyleForTarget(target, { fontStyle: cur === "italic" ? "normal" : "italic" });
  }

  function toggleUnderline() {
    const target = fontTargetCardId || "all";
    const cur = getTextStyleForTarget(target).textDecoration;
    updateTextStyleForTarget(target, { textDecoration: cur === "underline" ? "none" : "underline" });
  }

  function setBg(cardBgId: string) {
    if (!activePage) return;
    updatePage(setPageStyle(activePage, { cardBgId }));
    setShowCardBg(false);
  }

  const fontTarget = fontTargetCardId || "all";
  const fontStyleNow = getTextStyleForTarget(fontTarget);

  const deployEnabled = saved;

  return (
    <div
      className="appRoot"
      style={
        activeWallpaper
          ? { backgroundImage: `url(${activeWallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      <header className="topBar">
        <div className="brand">
          <img className="brandIcon" src="/drip.png" alt="Drip icon" />
          <div className="brandName">Drip Studio</div>
          <div className="brandVer">v2.1</div>
        </div>

        <div className="topFields">
          <label className="topField">
            <span className="topLabel">Slug</span>
            <input className="topInput" value={slugInput} onChange={(e) => onSlugChange(e.target.value)} />
          </label>

          <div className="topCenterBrand" aria-label="XYZ Labs brand banner">
            <div className="topCenterBrandInner">
              <img className="topCenterBrandIcon" src="/drip.png" alt="XYZ Labs drip icon" />
              <span className="topCenterBrandText">XYZ Labs</span>
            </div>
          </div>
        </div>

        <div className="topActions">
          {saved ? (
            <button type="button" className="savedPill" onClick={hardReset} title="Reset save state (next Save/Deploy uses a fresh slug)">
              Saved ✓
            </button>
          ) : (
            <span className="savedPill off">Not Saved</span>
          )}

          <button type="button" className="btnReset" onClick={hardReset} title="Reset save state (next Save/Deploy uses a fresh slug)">
            Reset
          </button>

          <button type="button" className="btnSave" onClick={onSave}>
            Save
          </button>

          <button
            type="button"
            className={deployEnabled ? "btnDeploy" : "btnDeploy disabled"}
            onClick={onDeploy}
            disabled={!deployEnabled}
            title={!deployEnabled ? "Save first" : "Deploy demo"}
          >
            Deploy Demo
          </button>
        </div>
      </header>

      <div className="body">
        <div className={leftCollapsed ? "contentGrid collapsed" : "contentGrid"}>
          <aside className={leftCollapsed ? "leftPane collapsed" : "leftPane"}>
            <div className="panel">
              <div className="panelHeader panelHeaderTight">
                <div className="leftHeaderRow">
                  <div className="panelTitle panelTitleSkin"><span className="panelEyebrow">Studio Section</span><span className="panelTitleMain">GATE</span></div>
                </div>
                {demoLinks.length ? (
                  <div className="demoLinksBox">
                    <div className="demoLinksTitle">Demo Links</div>
                    <div className="demoLinksList">
                      {demoLinks.map((u) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer" className="demoLink">
                          {u}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {!leftCollapsed ? (
                <>
                  {activePage ? (
                    <AccordionCardEditor
                      page={activePage}
                      onChange={updatePage}
                      onActiveCardChange={setActiveCardId}
                      onPageSelect={(t) => {
                        if (t === "scraper") {
                          setShowScraper(true);
                          return;
                        }
                        setActiveTab(t);
                      }}
                    />
                  ) : null}
                </>
              ) : (
                <div className="collapsedHint">Expand «</div>
              )}
            </div>
            {!leftCollapsed ? <AssistantPromoCard /> : null}
          </aside>

          <main className="rightPane">
            {activePage ? (
              <>
                <div className="canvasStrip">
                  <div className="panelHeader canvasHeader">
                    <div>
                      <div className="panelTitle panelTitleSkin"><span className="panelEyebrow">XYZ Labs</span><span className="panelTitleMain">Canvas</span></div>
                      <div className="panelSub panelSubSkin">Wallpaper + overlays.</div>
                    </div>

                    <div className="canvasHeaderRight">
                      <button type="button" className="btnSecondary" onClick={() => setShowWallpaper(true)}>
                        Wallpaper
                      </button>
                      <button type="button" className="btnSecondary" onClick={() => setShowTemplates(true)}>
                        Templates
                      </button>
                      <button type="button" className="btnSecondary" onClick={() => setShowImages(true)}>
                        Images
                      </button>
                      <button type="button" className="btnSecondary" onClick={() => setShowFonts(true)}>
                        Font
                      </button>
                      <button type="button" className="btnSecondary" onClick={() => setShowCardBg(true)}>
                        Card BG
                      </button>
                      <button type="button" className="btnSecondary" onClick={() => setShowPrototype(true)}>
                        Prototype
                      </button>
                      <button type="button" className="btnSecondary" onClick={() => setShowPreview(true)}>
                        Preview
                      </button>

                      <LayoutButtons page={activePage} onChange={updatePage} />
                    </div>
                                   </div>
                </div>

                <PreviewPane page={activePage} mode="floating" renderWallpaper={false} />
              </>
            ) : null}
          </main>
        </div>

        {/* Templates modal */}
        {showTemplates ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard modalCardWide">
              <div className="modalHeader">
                <div className="modalTitle">Templates</div>
                <div className="templateTabsInline">
                  {([
                    { key: "templates" as const, label: "Templates" },
                    { key: "themes" as const, label: "Themes" },
                    { key: "blocks" as const, label: "Blocks" }
                  ]).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={templatesTab === t.key ? "segBtn active" : "segBtn"}
                      onClick={() => setTemplatesTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="modalClose" onClick={() => setShowTemplates(false)}>
                  ✕
                </button>
              </div>
              <div className="modalBody">                {templatesTab === "templates" ? (
                  <>
                    <div className="segRow">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={templateCount === n ? "segBtn active" : "segBtn"}
                          onClick={() => setTemplateCount(n as any)}
                        >
                          {n} block{n === 1 ? "" : "s"}
                        </button>
                      ))}
                    </div>

                    <div className="templateGridV21">
                      {templateGroups[templateCount].map((t) => {
                        const mini = scaleStyle(t.blocks);
                        return (
                          <button key={t.id} type="button" className="templateTileV21" onClick={() => applyTemplate(t)}>
                            <div className="templateThumb">
                              {mini.map((b) => (
                                <div
                                  key={b.id}
                                  className="thumbBlock"
                                  style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
                                />
                              ))}
                            </div>
                            <div className="templateMetaRow">
                              <div className="templateName">{t.id}</div>
                              <div className="templateMeta">{t.count} blocks</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : templatesTab === "themes" ? (
                  <div className="optionGrid">
                    {[
                      { id: "Theme 1", fontId: "F1", cardBgId: "BG1" },
                      { id: "Theme 2", fontId: "F2", cardBgId: "BG3" },
                      { id: "Theme 3", fontId: "F4", cardBgId: "BG2" }
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        className="optionTile"
                        onClick={() => { if (activePage) updatePage(setPageStyle(activePage, { fontId: th.fontId, cardBgId: th.cardBgId })); }}
                      >
                        <div className="optionTitle">{th.id}</div>
                        <div className="optionSub">Apply to current page</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="segRow">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={templateCount === n ? "segBtn active" : "segBtn"}
                          onClick={() => setTemplateCount(n as any)}
                        >
                          {n} block{n === 1 ? "" : "s"}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="segBtn"
                        onClick={() => {
                          const group = templateGroups[templateCount];
                          const t = group[Math.floor(Math.random() * group.length)];
                          applyTemplate(t);
                        }}
                        title="Pick a random block layout"
                      >
                        Randomize
                      </button>
                    </div>

                    <div className="templateGridV21 blocksOnly">
                      {templateGroups[templateCount].map((t) => {
                        const mini = scaleStyle(t.blocks);
                        return (
                          <button key={t.id} type="button" className="templateTileV21 blocksOnly" onClick={() => applyTemplate(t)}>
                            <div className="templateThumb">
                              {mini.map((b) => (
                                <div key={b.id} className="thumbBlock" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                </div>
              </div>
            </div>
        ) : null}


        {/* Wallpaper modal */}
        {showWallpaper ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard modalCardSide">
              <div className="modalHeader">
                <div className="modalTitle">Wallpaper</div>
                <button type="button" className="modalClose" onClick={() => setShowWallpaper(false)}>
                  ✕
                </button>
              </div>
              <div className="modalBody">
                <div className="optionGrid">
                  {wallpaperCatalog.map((w) => (
                    <button
                      key={w.code}
                      type="button"
                      className="optionTile optionTileWallpaper"
                      onClick={() => {
                        if (!activePage) return;
                        updatePage(setPageStyle(activePage, { wallpaperUrl: w.url, wallpaperCode: w.code }));
                        setShowWallpaper(false);
                      }}
                    >
                      <div className="wallpaperThumb" style={{ backgroundImage: `url(${w.url})` }} />
                      <div className="optionTitle">{w.name}</div>
                      <div className="optionSub">Code {w.code} — Apply to page wallpaper</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Images modal */}
        {showImages ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard">
              <div className="modalHeader">
                <div className="modalTitle">Images</div>
                <button type="button" className="modalClose" onClick={() => setShowImages(false)}>
                  ✕
                </button>
              </div>

              <div className="modalBody">
                <div className="imageGridV21">
                  {imageCodes.map((code) => (
                    <button key={code} type="button" className="imageTileV21" onClick={() => applyImageCode(code)}>
                      <div className={`imageThumbV21 img-${code}`} />
                      <div className="imageCode">{code}</div>
                    </button>
                  ))}
                </div>
                <div className="muted" style={{ marginTop: 10 }}>
                  Clicking an image auto-fills the active card’s Image Code.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Fonts modal */}
        {showFonts ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard">
              <div className="modalHeader">
                <div className="modalTitle">Font</div>
                <button type="button" className="modalClose" onClick={() => setShowFonts(false)}>
                  ✕
                </button>
              </div>
              <div className="modalBody">
                <div className="segRow">
                  {[
                    { id: "F1", label: "Default" },
                    { id: "F2", label: "Sans" },
                    { id: "F3", label: "Alt" },
                    { id: "F4", label: "Mono" },
                    { id: "F5", label: "Serif" }
                  ].map((f) => (
                    <button key={f.id} type="button" className="segBtn" onClick={() => setFont(f.id)}>
                      {f.id} — {f.label}
                    </button>
                  ))}
                </div>
                <div className="fontToolsRow" style={{ marginTop: 10 }}>
                  <button type="button" className="segBtn" onClick={() => adjustFontSize(-1)} title="Font size down">
                    A−
                  </button>
                  <button type="button" className="segBtn" onClick={() => adjustFontSize(1)} title="Font size up">
                    A+
                  </button>

                  <div className="fontSizeBox">
                    <div className="muted">Size</div>
                    <input
                      className="fontSizeInput"
                      type="number"
                      value={fontStyleNow.fontSize}
                      min={10}
                      max={32}
                      onChange={(e) => setFontSize(Number(e.currentTarget.value))}
                    />
                  </div>

                  <input
                    className="fontSizeRange"
                    type="range"
                    min={10}
                    max={32}
                    value={fontStyleNow.fontSize}
                    onChange={(e) => setFontSize(Number(e.currentTarget.value))}
                    aria-label="Font size slider"
                  />

                  <div className="fontTargetBox">
                    <div className="muted">Card</div>
                    <select
                      className="fontTargetSelect"
                      value={fontTarget}
                      onChange={(e) => setFontTargetCardId(e.currentTarget.value)}
                    >
                      <option value="all">All</option>
                      {activePage?.blocks.map((b, i) => (
                        <option key={b.id} value={b.id}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fontDecorBtns" aria-label="Text style">
                    <button type="button" className={fontStyleNow.fontWeight >= 600 ? "segBtn active" : "segBtn"} onClick={toggleBold} title="Bold">
                      B
                    </button>
                    <button type="button" className={fontStyleNow.fontStyle === "italic" ? "segBtn active" : "segBtn"} onClick={toggleItalic} title="Italic">
                      I
                    </button>
                    <button type="button" className={fontStyleNow.textDecoration === "underline" ? "segBtn active" : "segBtn"} onClick={toggleUnderline} title="Underline">
                      U
                    </button>
                  </div>
                </div>

                <div className="fontPreviewSentence" style={{ fontSize: fontStyleNow.fontSize, fontWeight: fontStyleNow.fontWeight, fontStyle: fontStyleNow.fontStyle as any, textDecoration: fontStyleNow.textDecoration as any }}>
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Card BG modal */}
        {showCardBg ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard">
              <div className="modalHeader">
                <div className="modalTitle">Card Background</div>
                <button type="button" className="modalClose" onClick={() => setShowCardBg(false)}>
                  ✕
                </button>
              </div>
              <div className="modalBody">
                <div className="segRow">
                  {[
                    { id: "BG1", label: "Glass" },
                    { id: "BG2", label: "Dark" },
                    { id: "BG3", label: "Light" },
                    { id: "BG4", label: "Midnight" }
                  ].map((b) => (
                    <button key={b.id} type="button" className="segBtn" onClick={() => setBg(b.id)}>
                      {b.id} — {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Prototype placeholder */}
        {showPrototype ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard">
              <div className="modalHeader">
                <div className="modalTitle">Prototype</div>
                <button type="button" className="modalClose" onClick={() => setShowPrototype(false)}>
                  ✕
                </button>
              </div>
              <div className="modalBody prototypeModalBody">
                {activePage ? <MobilePreviewPane page={activePage} /> : null}
                <div className="muted prototypeModalNote">
                  Path 3 prototype shell: desktop and mobile renderers are now separated so mobile can be edited independently later.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Scraper modal */}
        {showScraper ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard modalCardWide">
              <div className="modalHeader">
                <div className="modalTitle">Scraper</div>
                <button type="button" className="modalClose" onClick={() => setShowScraper(false)}>
                  ✕
                </button>
              </div>
              <div className="modalBody">
                <ScraperPanel />
              </div>
            </div>
          </div>
        ) : null}

        {/* Fullscreen preview */}
        {showPreview && activePage ? (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard modalCardFull">
              <div className="modalHeader">
                <div className="modalTitle">Preview</div>
                <button type="button" className="modalClose" onClick={() => setShowPreview(false)}>
                  ✕
                </button>
              </div>
              <div className="modalBody previewModalBody">
                <div className="previewModalInner">
                  <PreviewPane page={activePage} mode="floating" />
                  <div className="previewDeviceDivider" />
                  <MobilePreviewPane page={activePage} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
