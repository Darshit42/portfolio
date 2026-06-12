import {
  CanvasTexture,
  DoubleSide,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { PALETTE } from "../data/config";

/**
 * Shared world materials — one per palette role, created once at module scope
 * and reused by every mesh (perf guardrail: never create materials in loops or
 * per frame). Anything that ANIMATES its material (forge maw, gate portal)
 * must own a unique instance instead — mutating these would change everything.
 */
export const MAT = {
  stone: new MeshStandardMaterial({ color: PALETTE.stone }),
  stoneDark: new MeshStandardMaterial({ color: "#2a2724" }),
  woodDark: new MeshStandardMaterial({ color: PALETTE.woodDark }),
  woodLight: new MeshStandardMaterial({ color: PALETTE.woodLight }),
  roof: new MeshStandardMaterial({ color: PALETTE.roof }),
  path: new MeshStandardMaterial({ color: PALETTE.path }),
  trunk: new MeshStandardMaterial({ color: "#3a2a1c" }),
  foliage: new MeshStandardMaterial({ color: PALETTE.foliage, flatShading: true }),
  /** White base for instanced meshes that carry per-instance colors (the
   *  instance color multiplies material.color — a tinted base would double-darken). */
  instWhite: new MeshStandardMaterial({ color: "#ffffff", flatShading: true }),
  rock: new MeshStandardMaterial({ color: "#33312e", flatShading: true }),
  metal: new MeshStandardMaterial({ color: "#15171d", metalness: 0.6, roughness: 0.4 }),
  paper: new MeshStandardMaterial({ color: "#cfc9b8" }),

  /** Lit windows — emissive past the bloom threshold so they glow (no lights). */
  window: new MeshStandardMaterial({
    color: "#3a2a14",
    emissive: PALETTE.warmLight,
    emissiveIntensity: 1.35,
    toneMapped: false,
  }),
  /** Torch / brazier flames. */
  flame: new MeshStandardMaterial({
    color: PALETTE.ember,
    emissive: PALETTE.ember,
    emissiveIntensity: 2.2,
    toneMapped: false,
  }),
  /** Spark motes popping off the forge. */
  spark: new MeshStandardMaterial({
    color: PALETTE.ember,
    emissive: PALETTE.ember,
    emissiveIntensity: 2.6,
    toneMapped: false,
  }),
  /** Warm inner glow for the plaza fountain core. */
  warmCore: new MeshStandardMaterial({
    color: PALETTE.warmLight,
    emissive: PALETTE.warmLight,
    emissiveIntensity: 1.6,
    toneMapped: false,
  }),
};

/**
 * Cached per-accent materials (banners, signs, runes, awnings…). Keyed by
 * color + intensity + sidedness so each variant exists exactly once. Bloom
 * picks up anything with intensity >= 1 (those are created tone-unmapped).
 */
const accentCache = new Map<string, MeshStandardMaterial>();

export function accentMat(hex: string, intensity = 0.5, doubleSided = false): MeshStandardMaterial {
  const key = `${hex}:${intensity}:${doubleSided ? 2 : 0}`;
  let m = accentCache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color: hex,
      emissive: hex,
      emissiveIntensity: intensity,
      toneMapped: intensity < 1, // strong emissives push past the bloom threshold
      side: doubleSided ? DoubleSide : undefined,
    });
    accentCache.set(key, m);
  }
  return m;
}

/**
 * Procedural town-ground texture: dark stone tiles with slightly varied tones
 * and thin darker grout lines. The 4×4-tile canvas maps to 8 world units, so
 * each tile is ~2 units. Deterministic — same ground every visit.
 */
export function makeGroundTexture(): CanvasTexture {
  const size = 256;
  const tiles = 4;
  const tile = size / tiles;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;

  // mulberry32 — deterministic variation
  let seed = 9001;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  g.fillStyle = PALETTE.ground;
  g.fillRect(0, 0, size, size);

  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      // per-tile tone variance around the base ground colour
      const v = (rand() - 0.5) * 14;
      const r = Math.max(0, 0x1a + v);
      const gg = Math.max(0, 0x18 + v);
      const b = Math.max(0, 0x12 + v * 0.8);
      g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
      g.fillRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);

      // a few darker speckles per tile
      g.fillStyle = "rgba(0,0,0,0.18)";
      for (let i = 0; i < 5; i++) {
        g.fillRect(x * tile + rand() * (tile - 4), y * tile + rand() * (tile - 4), 2 + rand() * 3, 2 + rand() * 2);
      }
    }
  }

  // grout lines
  g.strokeStyle = "#121008";
  g.lineWidth = 2;
  for (let i = 0; i <= tiles; i++) {
    g.beginPath();
    g.moveTo(i * tile, 0);
    g.lineTo(i * tile, size);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * tile);
    g.lineTo(size, i * tile);
    g.stroke();
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
