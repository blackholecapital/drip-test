export type WallpaperItem = {
  name: string;
  file: string;
  code: string;
  url: string;
};

function hash5(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return String(h % 100000).padStart(5, "0");
}

const BASE: Array<{ name: string; file: string }> = [
  { name: "D10", file: "D10.png" },
  { name: "D11", file: "D11.png" },
  { name: "D12", file: "D12.png" },
  { name: "D13", file: "D13.png" },
  { name: "D14", file: "D14.png" },
  { name: "D15", file: "D15.png" },
  { name: "D16", file: "D16.png" },
  { name: "D17", file: "D17.png" },
  { name: "D18", file: "D18.png" },
  { name: "D19", file: "D19.png" },
  { name: "D20", file: "D20.png" },
  { name: "D21", file: "D21.png" },
  { name: "D7", file: "D7.png" },
  { name: "D8", file: "D8.png" },
  { name: "D9", file: "D9.png" },
  { name: "Wallpaper1", file: "Wallpaper1.jpg" },
  { name: "Wallpaper2", file: "Wallpaper2.jpg" },
  { name: "Wallpaper3", file: "Wallpaper3.jpg" },
  { name: "d5", file: "d5.jpg" },
  { name: "wp-001-holographic-cosmos", file: "wp-001-holographic-cosmos.png" },
];

export const wallpaperCatalog: WallpaperItem[] = BASE.map((w) => ({
  ...w,
  code: hash5(w.name),
  url: `/wallpapers/${w.file}`
}));
