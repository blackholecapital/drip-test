import { toMobileRuntimePageSpec } from "./deploy-mobile.js";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "content-type": "application/json" }
  });

const bad = (msg, status = 400) => json({ ok: false, error: msg }, status);

const sanitize = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

function normalizeImageCode(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.includes(".") ? raw : `${raw}.png`;
}

function toRuntimePageSpec(runtimePage, studioPage) {
  const blocks = Array.isArray(studioPage?.blocks) ? studioPage.blocks : [];
  const content = studioPage?.content && typeof studioPage.content === "object" ? studioPage.content : {};
  const kinds = studioPage?.cardKinds && typeof studioPage.cardKinds === "object" ? studioPage.cardKinds : {};
  const style = studioPage?.style && typeof studioPage.style === "object" ? studioPage.style : {};

  const outBlocks = [];

  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;

    const kind = kinds[b.id] || "text";
    const lines = Array.isArray(content[b.id]) ? content[b.id] : [];
    const first = String(lines[0] ?? "").trim();
    const title = kind === "text" ? (first || `${runtimePage.toUpperCase()} / ${b.id}`) : "";
    const bodyLines = kind === "text" ? lines.slice(1, 10).map((x) => String(x ?? "")) : [];

    outBlocks.push({
      id: String(b.id),
      kind,
      x: Number(b.x ?? 0),
      y: Number(b.y ?? 0),
      w: Number(b.w ?? 0),
      h: Number(b.h ?? 0),
      title,
      lines: bodyLines,
      image: kind === "image" ? normalizeImageCode(first) : "",
      mediaUrl: kind === "video" || kind === "social" ? first : ""
    });
  }

  return {
    version: 1,
    page: runtimePage,
    wallpaperUrl: style.wallpaperUrl || "",
    style,
    blocks: outBlocks
  };
}

async function putJson(env, key, value) {
  await env.TENANTS_BUCKET.put(key, JSON.stringify(value), {
    httpMetadata: { contentType: "application/json" }
  });
}

async function writePlatformSpecs(env, slug, platform, specs) {
  await putJson(env, `tenants/${slug}/${platform}/home.json`, specs.home);
  await putJson(env, `tenants/${slug}/${platform}/members.json`, specs.members);
  await putJson(env, `tenants/${slug}/${platform}/access.json`, specs.access);
}

export async function onRequestPost({ request, env }) {
  if (!env?.TENANTS_BUCKET) return bad("Missing TENANTS_BUCKET binding", 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid body");
  }

  const slug = sanitize(body?.slug);
  const tenant = body?.tenant;

  if (!slug) return bad("Missing slug");
  if (!tenant || typeof tenant !== "object") return bad("Missing tenant payload");

  const legacyKey = `${slug}.json`;
  await putJson(env, legacyKey, tenant);

  const studioPages = tenant?.pages && typeof tenant.pages === "object" ? tenant.pages : {};
  const gatePage = studioPages.gate;
  const vipPage = studioPages.vip;
  const perksPage = studioPages.perks;

  const desktopSpecs = {
    home: toRuntimePageSpec("home", gatePage),
    members: toRuntimePageSpec("members", vipPage),
    access: toRuntimePageSpec("access", perksPage)
  };

  const mobileSpecs = {
    home: toMobileRuntimePageSpec("home", gatePage),
    members: toMobileRuntimePageSpec("members", vipPage),
    access: toMobileRuntimePageSpec("access", perksPage)
  };

  await putJson(env, `tenants/${slug}/home.json`, desktopSpecs.home);
  await putJson(env, `tenants/${slug}/members.json`, desktopSpecs.members);
  await putJson(env, `tenants/${slug}/access.json`, desktopSpecs.access);

  await writePlatformSpecs(env, slug, "desktop", desktopSpecs);
  await writePlatformSpecs(env, slug, "mobile", mobileSpecs);

  const base = String(env.DEMO_BASE_URL || "https://gateway.xyz-labs.xyz").replace(/\/$/, "");
  const urls = Array.from({ length: 6 }).map((_, i) => `${base}/d${i + 1}/${slug}/gate`);

  return json({
    ok: true,
    slug,
    objectKey: legacyKey,
    urls,
    outputs: {
      desktop: `tenants/${slug}/desktop`,
      mobile: `tenants/${slug}/mobile`
    }
  });
}
