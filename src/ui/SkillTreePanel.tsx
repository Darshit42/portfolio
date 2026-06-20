import { useGameStore } from "../store/useGameStore";
import {
  CAT_LABELS,
  SKILLS,
  SKILL_CATS,
  SKILL_H,
  SKILL_SVG,
  SKILL_W,
  xOfCol,
  type SkillCat,
} from "../data/skills";
import Modal from "./Modal";

/** The Shrine of Mastery — the stack as an RPG skill tree (branches + levels). */
export default function SkillTreePanel() {
  const close = useGameStore((s) => s.closeOverlay);
  const byId = (id: string) => SKILLS.find((s) => s.id === id);
  const cats = Object.keys(SKILL_CATS) as SkillCat[];

  return (
    <Modal
      title="Shrine of Mastery"
      subtitle="The stack, as a skill tree"
      accent="#9b8cff"
      onClose={close}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-realm-muted">
          {cats.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SKILL_CATS[c] }} />
              {CAT_LABELS[c]}
            </span>
          ))}
          <span className="ml-auto opacity-70">Lv = relative mastery, for flavour</span>
        </div>
      }
    >
      <div className="scroll-thin overflow-auto">
        <svg width={SKILL_SVG.w} height={SKILL_SVG.h} className="max-w-none">
          {/* connectors */}
          {SKILLS.map((n) => {
            if (!n.parent) return null;
            const p = byId(n.parent);
            if (!p) return null;
            const x1 = xOfCol(p.col) + SKILL_W;
            const y1 = p.y + SKILL_H / 2;
            const x2 = xOfCol(n.col);
            const y2 = n.y + SKILL_H / 2;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={`l-${n.id}`}
                d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none"
                stroke={SKILL_CATS[n.cat]}
                strokeWidth={2}
                strokeOpacity={0.45}
              />
            );
          })}

          {/* nodes */}
          {SKILLS.map((n) => {
            const x = xOfCol(n.col);
            const c = SKILL_CATS[n.cat];
            return (
              <g key={n.id}>
                <rect
                  x={x}
                  y={n.y}
                  width={SKILL_W}
                  height={SKILL_H}
                  rx={9}
                  fill={`${c}22`}
                  stroke={c}
                  strokeWidth={1.5}
                />
                <text x={x + 12} y={n.y + 19} fill="#e6ebf5" fontSize={13} fontWeight={600} fontFamily="Inter, sans-serif">
                  {n.label}
                </text>
                <text x={x + 12} y={n.y + 34} fill={c} fontSize={11} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                  Lv.{n.lv}
                </text>
                {/* mastery pip bar */}
                <rect x={x + SKILL_W - 30} y={n.y + 26} width={20} height={4} rx={2} fill="#ffffff14" />
                <rect
                  x={x + SKILL_W - 30}
                  y={n.y + 26}
                  width={Math.round((Math.min(n.lv, 52) / 52) * 20)}
                  height={4}
                  rx={2}
                  fill={c}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </Modal>
  );
}
