import { useGameStore } from "../store/useGameStore";
import { SPIRE, CHAPTERS, CURRENT_WORK } from "../data/spire";
import Modal from "./Modal";
import { ArrowRightIcon } from "./icons";

/**
 * The Spire's Chronicle — Darshit's own-voice record. The journey (CHAPTERS,
 * shown as tomes) + what he's building now (CURRENT_WORK). Pure data render:
 * both lists come from data/spire.ts, so adding a chapter or editing the current
 * work is a one-line data edit. Opened by the wizard-seer's dialog branch.
 */
export default function SpireChronicle() {
  const close = useGameStore((s) => s.closeOverlay);
  const accent = SPIRE.accent;

  return (
    <Modal
      title={SPIRE.title}
      subtitle={SPIRE.subtitle}
      accent={accent}
      onClose={close}
      maxWidth="max-w-3xl"
      footer={
        <div className="text-xs text-realm-muted">
          My own voice — the road, and the work in progress. The guilds hold what I've shipped.
        </div>
      }
    >
      {/* Current work — the seer's hard-truth report, up top. */}
      <section className="mb-6">
        <h3
          className="mb-2 font-display text-sm font-bold uppercase tracking-wider"
          style={{ color: accent }}
        >
          What I'm building now
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {CURRENT_WORK.map((w) => (
            <div
              key={w.name}
              className="rounded-xl border border-realm-edge bg-realm-bg/50 p-3"
              style={{ boxShadow: `inset 0 2px 0 ${accent}55` }}
            >
              <div className="font-display font-bold text-realm-text">{w.name}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-realm-muted">{w.detail}</p>
              {w.link && (
                <a
                  href={w.link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: accent }}
                >
                  {w.link.label}
                  <ArrowRightIcon width={12} height={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* The journey — a shelf of tomes, oldest first. */}
      <section>
        <h3
          className="mb-3 font-display text-sm font-bold uppercase tracking-wider"
          style={{ color: accent }}
        >
          The road here
        </h3>
        <ol className="relative space-y-3 border-l border-realm-edge pl-5">
          {CHAPTERS.map((c) => (
            <li key={c.id} className="relative">
              <span
                className="absolute -left-[1.42rem] top-1.5 h-2.5 w-2.5 rounded-full"
                style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
              />
              <div className="flex items-baseline gap-2">
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: `${accent}22`, color: accent }}
                >
                  {c.era}
                </span>
                <span className="font-display font-bold text-realm-text">{c.title}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-realm-muted">{c.blurb}</p>
              {c.link && (
                <a
                  href={c.link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: accent }}
                >
                  {c.link.label}
                  <ArrowRightIcon width={12} height={12} />
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>
    </Modal>
  );
}
