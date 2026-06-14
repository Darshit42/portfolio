/**
 * Pack-agnostic sprite manifest. Every animated character (player, NPCs, mobs)
 * is described here, NOT in engine code — swapping art packs is a data edit.
 *
 * Each def points at a sheet in /public/sprites/<file>.png laid out as a uniform
 * grid of frameW×frameH cells. Animations reference a base row (+ the facing's
 * direction index for `fourRow` sheets) and a span of columns. Until the real
 * PNG is placed, the engine draws a procedural placeholder at the same grid, so
 * the world works immediately and auto-upgrades when the file appears.
 *
 * Default layout assumes a common top-down convention (e.g. Ninja Adventure):
 *   16×16 frames, rows 0..3 = walk Down/Up/Left/Right, optional rows 4..7 =
 *   attack Down/Up/Left/Right. If your pack differs, adjust frameW/H, cols,
 *   rows and each anim's rowBase/count here — nothing else changes.
 */

export type AnimName = "idle" | "walk" | "attack" | "hurt" | "die";
export type DirMode = "single" | "flipLR" | "fourRow";
export type Facing = "down" | "up" | "left" | "right";

/** fourRow row offset per facing (Down, Up, Left, Right). */
export const DIR_INDEX: Record<Facing, number> = { down: 0, up: 1, left: 2, right: 3 };

export interface AnimClip {
  rowBase: number;
  from?: number;
  count: number;
  fps?: number;
  loop?: boolean;
}

export interface PlaceholderSpec {
  kind: "humanoid" | "blob" | "wisp" | "critter" | "flyer";
  skin?: string;
  main: string;
  accent: string;
  dark?: string;
}

export interface SpriteDef {
  id: string;
  src: string;
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
  worldHeight: number;
  yOffset?: number;
  dirMode: DirMode;
  anims: { idle: AnimClip } & Partial<Record<AnimName, AnimClip>>;
  placeholder: PlaceholderSpec;
}

const humanoid = (
  id: string,
  file: string,
  pal: PlaceholderSpec,
  worldHeight = 2.3,
): SpriteDef => ({
  id,
  src: `/sprites/${file}.png`,
  frameW: 16,
  frameH: 16,
  cols: 4,
  rows: 8,
  worldHeight,
  dirMode: "fourRow",
  anims: {
    idle: { rowBase: 0, from: 0, count: 1, fps: 2 },
    walk: { rowBase: 0, from: 0, count: 4, fps: 9 },
    attack: { rowBase: 4, from: 0, count: 3, fps: 14, loop: false },
    hurt: { rowBase: 0, from: 0, count: 1, fps: 6, loop: false },
  },
  placeholder: pal,
});

export const SPRITES: Record<string, SpriteDef> = {
  // ---- player + NPCs (humanoid, 4-direction) ----
  player: humanoid("player", "player", {
    kind: "humanoid",
    skin: "#e8c29a",
    main: "#3b6ea5",
    accent: "#e8c66a",
    dark: "#22324a",
  }, 2.4),
  barkeep: humanoid("barkeep", "barkeep", { kind: "humanoid", skin: "#e8c29a", main: "#7a4a2c", accent: "#e8c66a", dark: "#3a2414" }),
  guildmaster: humanoid("guildmaster", "guildmaster", { kind: "humanoid", skin: "#e8c29a", main: "#27496b", accent: "#6ad0ff", dark: "#13243a" }),
  oracle: humanoid("oracle", "oracle", { kind: "humanoid", skin: "#e8c29a", main: "#5a3a86", accent: "#b06cff", dark: "#2c1c47" }),
  automaton: humanoid("automaton", "automaton", { kind: "humanoid", skin: "#9aa0ad", main: "#5a4632", accent: "#ff7a3c", dark: "#2a2018" }),
  merchant: humanoid("merchant", "merchant", { kind: "humanoid", skin: "#e8c29a", main: "#2c6b4a", accent: "#f2b94c", dark: "#143425" }),
  blacksmith: humanoid("blacksmith", "blacksmith", { kind: "humanoid", skin: "#d8a87a", main: "#444a52", accent: "#ff6622", dark: "#23262b" }),
  guard: humanoid("guard", "guard", { kind: "humanoid", skin: "#e8c29a", main: "#3a4452", accent: "#9aa6bf", dark: "#1c222c" }),

  // ---- mobs ----
  bug: {
    id: "bug",
    src: "/sprites/bug.png",
    frameW: 16,
    frameH: 16,
    cols: 4,
    rows: 6,
    worldHeight: 1.4,
    dirMode: "fourRow",
    anims: {
      idle: { rowBase: 0, from: 0, count: 2, fps: 4 },
      walk: { rowBase: 0, from: 0, count: 4, fps: 10 },
      hurt: { rowBase: 4, from: 0, count: 1, fps: 8, loop: false },
      die: { rowBase: 4, from: 0, count: 4, fps: 12, loop: false },
    },
    placeholder: { kind: "critter", main: "#2a1230", accent: "#ff5470", dark: "#160a1a" },
  },
  wisp: {
    id: "wisp",
    src: "/sprites/wisp.png",
    frameW: 16,
    frameH: 16,
    cols: 4,
    rows: 2,
    worldHeight: 1.5,
    dirMode: "single",
    anims: {
      idle: { rowBase: 0, from: 0, count: 4, fps: 8 },
      walk: { rowBase: 0, from: 0, count: 4, fps: 12 },
      die: { rowBase: 1, from: 0, count: 4, fps: 14, loop: false },
    },
    placeholder: { kind: "wisp", main: "#6ad0ff", accent: "#bfeeff", dark: "#1a4a66" },
  },
  slime: {
    id: "slime",
    src: "/sprites/slime.png",
    frameW: 16,
    frameH: 16,
    cols: 4,
    rows: 2,
    worldHeight: 1.3,
    dirMode: "flipLR",
    anims: {
      idle: { rowBase: 0, from: 0, count: 4, fps: 5 },
      walk: { rowBase: 0, from: 0, count: 4, fps: 8 },
      die: { rowBase: 1, from: 0, count: 4, fps: 12, loop: false },
    },
    placeholder: { kind: "blob", main: "#39d98a", accent: "#a8ffd6", dark: "#1a6a45" },
  },
  critter: {
    id: "critter",
    src: "/sprites/critter.png",
    frameW: 16,
    frameH: 16,
    cols: 4,
    rows: 6,
    worldHeight: 1.2,
    dirMode: "fourRow",
    anims: {
      idle: { rowBase: 0, from: 0, count: 2, fps: 4 },
      walk: { rowBase: 0, from: 0, count: 4, fps: 11 },
      die: { rowBase: 4, from: 0, count: 4, fps: 12, loop: false },
    },
    placeholder: { kind: "critter", main: "#4a3420", accent: "#f2b94c", dark: "#241810" },
  },
  bat: {
    id: "bat",
    src: "/sprites/bat.png",
    frameW: 16,
    frameH: 16,
    cols: 4,
    rows: 2,
    worldHeight: 1.2,
    dirMode: "flipLR",
    anims: {
      idle: { rowBase: 0, from: 0, count: 4, fps: 12 },
      walk: { rowBase: 0, from: 0, count: 4, fps: 16 },
      die: { rowBase: 1, from: 0, count: 4, fps: 14, loop: false },
    },
    placeholder: { kind: "flyer", main: "#4a3a5a", accent: "#b06cff", dark: "#241c30" },
  },
  skeleton: {
    id: "skeleton",
    src: "/sprites/skeleton.png",
    frameW: 16,
    frameH: 16,
    cols: 4,
    rows: 6,
    worldHeight: 1.9,
    dirMode: "fourRow",
    anims: {
      idle: { rowBase: 0, from: 0, count: 2, fps: 3 },
      walk: { rowBase: 0, from: 0, count: 4, fps: 8 },
      hurt: { rowBase: 4, from: 0, count: 1, fps: 8, loop: false },
      die: { rowBase: 4, from: 0, count: 4, fps: 10, loop: false },
    },
    placeholder: { kind: "humanoid", skin: "#e8e4d4", main: "#cfc9b8", accent: "#9aa6bf", dark: "#5a5648" },
  },
};

export const spriteDef = (id: string): SpriteDef => SPRITES[id] ?? SPRITES.player;
