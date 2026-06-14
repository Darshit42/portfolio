import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { NearestFilter, SRGBColorSpace, Texture, type MeshBasicMaterial } from "three";
import { DIR_INDEX, type AnimName, type Facing, type SpriteDef } from "../data/sprites";
import { acquireSheet } from "./spriteEngine";
import { daynight } from "./daynight";

/**
 * One billboarded, UV-animated sprite. The parent positions the enclosing group
 * each frame and mutates a shared `SpriteCtrl` (move/facing/one-shot) — read
 * here in useFrame so nothing re-renders per frame. Faces the camera (crisp 2D
 * against the 3D town) and tints with the day/night cycle.
 */

export interface SpriteCtrl {
  move: "idle" | "walk";
  facing: Facing;
  oneShot: AnimName | null;
  oneShotSeq: number;
}

export function makeCtrl(facing: Facing = "down"): SpriteCtrl {
  return { move: "idle", facing, oneShot: null, oneShotSeq: 0 };
}

export default function SpriteActor({ def, ctrl }: { def: SpriteDef; ctrl: SpriteCtrl }) {
  const matRef = useRef<MeshBasicMaterial>(null);
  const grid = useRef({ cols: def.cols, rows: def.rows });

  const tex = useMemo(() => {
    const ref: { current: Texture | null } = { current: null };
    const setGrid = (w: number, h: number) =>
      (grid.current = {
        cols: Math.max(1, Math.round(w / def.frameW)),
        rows: Math.max(1, Math.round(h / def.frameH)),
      });
    const img = acquireSheet(def, (real) => {
      setGrid(real.naturalWidth, real.naturalHeight);
      if (ref.current) {
        ref.current.image = real;
        ref.current.needsUpdate = true;
      }
    });
    if (img instanceof HTMLImageElement && img.naturalWidth) setGrid(img.naturalWidth, img.naturalHeight);
    const t = new Texture(img);
    t.magFilter = NearestFilter;
    t.minFilter = NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = SRGBColorSpace;
    t.needsUpdate = true;
    ref.current = t;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def]);

  useEffect(() => () => tex.dispose(), [tex]);

  const st = useRef({ anim: "idle" as AnimName, t: 0, oneShot: false, lastSeq: ctrl.oneShotSeq });

  useFrame((_, dt) => {
    const c = ctrl;
    const s = st.current;

    if (c.oneShotSeq !== s.lastSeq) {
      s.lastSeq = c.oneShotSeq;
      if (c.oneShot && def.anims[c.oneShot]) {
        s.anim = c.oneShot;
        s.t = 0;
        s.oneShot = true;
      }
    }
    if (!s.oneShot) {
      const desired: AnimName = c.move === "walk" && def.anims.walk ? "walk" : "idle";
      if (s.anim !== desired) {
        s.anim = desired;
        s.t = 0;
      }
    }

    const clip = def.anims[s.anim] ?? def.anims.idle;
    s.t += Math.min(dt, 0.05);
    const fps = clip.fps ?? 6;
    const loop = clip.loop ?? (s.anim === "idle" || s.anim === "walk");
    let fi = Math.floor(s.t * fps);
    if (loop) fi = clip.count > 0 ? fi % clip.count : 0;
    else if (fi >= clip.count) {
      fi = clip.count - 1;
      if (s.oneShot) s.oneShot = false; // release back to locomotion
    }

    const { cols, rows } = grid.current;
    let row = clip.rowBase;
    if (def.dirMode === "fourRow") row += DIR_INDEX[c.facing];
    row = Math.min(Math.max(0, row), rows - 1);
    const col = Math.min((clip.from ?? 0) + fi, cols - 1);
    const flip = def.dirMode === "flipLR" && c.facing === "left";

    tex.repeat.set(flip ? -1 / cols : 1 / cols, 1 / rows);
    tex.offset.set(flip ? (col + 1) / cols : col / cols, 1 - (row + 1) / rows);

    if (matRef.current) matRef.current.color.setScalar(daynight.spriteTint);
  });

  const h = def.worldHeight;
  const w = h * (def.frameW / def.frameH);

  return (
    <Billboard position={[0, h / 2 + (def.yOffset ?? 0), 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial ref={matRef} map={tex} transparent alphaTest={0.5} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}
