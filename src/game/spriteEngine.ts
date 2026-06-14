import type { SpriteDef } from "../data/sprites";

/**
 * Sprite sheet loading with a procedural fallback. Every sheet renders a
 * placeholder (drawn in code at the manifest grid) immediately, and silently
 * upgrades to /public/sprites/<file>.png the moment that file exists — so the
 * game works before any pack is placed, and "just works" once it is.
 */

type Img = HTMLCanvasElement | HTMLImageElement;

const placeholderCache = new Map<string, HTMLCanvasElement>();
const realCache = new Map<string, HTMLImageElement>();
const loadStarted = new Set<string>();
const waiters = new Map<string, Set<(img: HTMLImageElement) => void>>();

function ensureLoad(src: string) {
  if (loadStarted.has(src)) return;
  loadStarted.add(src);
  const img = new Image();
  img.onload = () => {
    if (!img.naturalWidth) return;
    realCache.set(src, img);
    waiters.get(src)?.forEach((cb) => cb(img));
    waiters.delete(src);
  };
  img.onerror = () => {
    /* file not placed yet — keep the placeholder, no console noise */
  };
  img.src = src;
}

/**
 * Returns an image to texture immediately (real if cached, else placeholder),
 * and registers `onReal` to fire if/when the real sheet finishes loading.
 */
export function acquireSheet(def: SpriteDef, onReal?: (img: HTMLImageElement) => void): Img {
  ensureLoad(def.src);
  const real = realCache.get(def.src);
  if (real) return real;
  if (onReal) {
    let set = waiters.get(def.src);
    if (!set) waiters.set(def.src, (set = new Set()));
    set.add(onReal);
  }
  let ph = placeholderCache.get(def.src);
  if (!ph) {
    ph = drawPlaceholder(def);
    placeholderCache.set(def.src, ph);
  }
  return ph;
}

/* ----------------------------- placeholder art ---------------------------- */

function drawPlaceholder(def: SpriteDef): HTMLCanvasElement {
  const { frameW: fw, frameH: fh, cols, rows } = def;
  const canvas = document.createElement("canvas");
  canvas.width = cols * fw;
  canvas.height = rows * fh;
  const g = canvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      drawCell(g, def, r, c, c * fw, r * fh);
    }
  }
  return canvas;
}

type Ctx = CanvasRenderingContext2D;
const px = (g: Ctx, ox: number, oy: number, x: number, y: number, w: number, h: number, color: string) => {
  g.fillStyle = color;
  g.fillRect(ox + x, oy + y, w, h);
};

function drawCell(g: Ctx, def: SpriteDef, row: number, col: number, ox: number, oy: number) {
  const p = def.placeholder;
  const dark = p.dark ?? "#000000";
  // For fourRow humanoids, rows 0-3 = walk dirs, 4-7 = attack dirs.
  const dir = def.dirMode === "fourRow" ? row % 4 : 0; // 0 down,1 up,2 left,3 right
  const isAttack = def.dirMode === "fourRow" && row >= 4;
  const f = col; // frame index within the row

  switch (p.kind) {
    case "humanoid":
      drawHumanoid(g, ox, oy, p, dark, dir, f, isAttack);
      break;
    case "critter":
      drawCritter(g, ox, oy, p, dark, dir, f, isAttack);
      break;
    case "blob":
      drawBlob(g, ox, oy, p, dark, row, f);
      break;
    case "wisp":
      drawWisp(g, ox, oy, p, row, f);
      break;
    case "flyer":
      drawFlyer(g, ox, oy, p, dark, row, f);
      break;
  }
}

function drawHumanoid(g: Ctx, ox: number, oy: number, p: SpriteDef["placeholder"], dark: string, dir: number, f: number, attack: boolean) {
  const skin = p.skin ?? "#e8c29a";
  const legShift = f % 2 === 0 ? 0 : 1;
  // shadow
  px(g, ox, oy, 4, 15, 8, 1, "rgba(0,0,0,0.25)");
  // legs
  px(g, ox, oy, 6, 12, 2, 3 - legShift, p.dark ?? dark);
  px(g, ox, oy, 8, 12, 2, 2 + legShift, p.dark ?? dark);
  // body
  px(g, ox, oy, 5, 7, 6, 5, p.main);
  // belt / trim
  px(g, ox, oy, 5, 11, 6, 1, p.accent);
  // head
  px(g, ox, oy, 5, 2, 6, 5, skin);
  // hair / hood
  px(g, ox, oy, 5, 1, 6, 2, p.accent);
  // face per direction
  if (dir === 0) {
    px(g, ox, oy, 6, 4, 1, 1, dark);
    px(g, ox, oy, 9, 4, 1, 1, dark);
  } else if (dir === 2) {
    px(g, ox, oy, 6, 4, 1, 1, dark); // left profile
    px(g, ox, oy, 5, 3, 1, 3, p.accent);
  } else if (dir === 3) {
    px(g, ox, oy, 9, 4, 1, 1, dark); // right profile
    px(g, ox, oy, 10, 3, 1, 3, p.accent);
  }
  // arms / weapon
  if (attack) {
    const reach = Math.min(f, 3);
    const ax = dir === 2 ? 4 - reach : dir === 3 ? 10 + reach : 11;
    px(g, ox, oy, ax, 7, 2, 1, p.accent);
    px(g, ox, oy, ax, 5 + (dir === 1 ? 0 : 0), 1, 3, "#cfd6e6");
  } else {
    px(g, ox, oy, 4, 8, 1, 3, p.main);
    px(g, ox, oy, 11, 8, 1, 3, p.main);
  }
}

function drawCritter(g: Ctx, ox: number, oy: number, p: SpriteDef["placeholder"], dark: string, _dir: number, f: number, attack: boolean) {
  const legShift = f % 2;
  px(g, ox, oy, 4, 14, 8, 1, "rgba(0,0,0,0.25)");
  // legs
  px(g, ox, oy, 3, 11 + legShift, 2, 2, dark);
  px(g, ox, oy, 11, 11 + (1 - legShift), 2, 2, dark);
  px(g, ox, oy, 4, 13 - legShift, 2, 1, dark);
  px(g, ox, oy, 10, 13 - (1 - legShift), 2, 1, dark);
  // body
  px(g, ox, oy, 4, 7, 8, 6, p.main);
  // shell
  px(g, ox, oy, 5, 6, 6, 3, p.accent);
  // eyes
  const flash = attack ? "#ffffff" : p.accent;
  px(g, ox, oy, 5, 9, 2, 2, flash);
  px(g, ox, oy, 9, 9, 2, 2, flash);
}

function drawBlob(g: Ctx, ox: number, oy: number, p: SpriteDef["placeholder"], dark: string, row: number, f: number) {
  const dying = row === 1;
  if (dying) {
    const s = 3 - Math.min(f, 3);
    px(g, ox, oy, 4 - s, 13, 8 + 2 * s, 2, p.main);
    return;
  }
  const squash = f % 2; // hop
  const top = 6 + squash;
  px(g, ox, oy, 3, 14, 10, 1, "rgba(0,0,0,0.25)");
  px(g, ox, oy, 4, top, 8, 14 - top, p.main);
  px(g, ox, oy, 3, top + 1, 10, 13 - top, p.main);
  px(g, ox, oy, 5, top + 1, 3, 2, p.accent); // sheen
  px(g, ox, oy, 6, 11, 1, 2, dark); // eyes
  px(g, ox, oy, 9, 11, 1, 2, dark);
}

function drawWisp(g: Ctx, ox: number, oy: number, p: SpriteDef["placeholder"], row: number, f: number) {
  const dying = row === 1;
  const r = dying ? Math.max(1, 4 - f) : 3 + (f % 2);
  const cx = 8;
  const cy = 7;
  // halo
  px(g, ox, oy, cx - r - 1, cy - r - 1, 2 * r + 2, 2 * r + 2, hexA(p.main, 0.25));
  // core
  px(g, ox, oy, cx - r, cy - r, 2 * r, 2 * r, p.main);
  px(g, ox, oy, cx - 1, cy - 1, 2, 2, p.accent);
  if (!dying) {
    px(g, ox, oy, cx - 2, cy, 1, 1, "#06121d");
    px(g, ox, oy, cx + 1, cy, 1, 1, "#06121d");
  }
}

function drawFlyer(g: Ctx, ox: number, oy: number, p: SpriteDef["placeholder"], dark: string, row: number, f: number) {
  const dying = row === 1;
  const flap = dying ? 3 : f % 2 === 0 ? 0 : 3; // wing height
  // wings
  px(g, ox, oy, 1, 6 + flap, 5, 2, p.main);
  px(g, ox, oy, 10, 6 + flap, 5, 2, p.main);
  // body
  px(g, ox, oy, 6, 6, 4, 4, p.main);
  px(g, ox, oy, 6, 5, 4, 1, dark); // ears
  if (!dying) {
    px(g, ox, oy, 6, 7, 1, 1, p.accent);
    px(g, ox, oy, 9, 7, 1, 1, p.accent);
  }
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
