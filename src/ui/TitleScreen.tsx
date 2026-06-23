import { OWNER, WORLD_NAME, WORLD_TAGLINE } from "../data/config";
import { TOTAL_SIGILS } from "../data/categories";
import { useGameStore } from "../store/useGameStore";
import { isTouchDevice } from "../game/webgl";
import { ArrowRightIcon, CompassIcon, GithubIcon, MailIcon, RelicIcon } from "./icons";

/**
 * Title screen (F1) — two doors. "Enter the realm" (the explorer's hook) and
 * "I'm a recruiter — show me everything" (the signal-safety net, one tap).
 * Pure DOM so it paints immediately; the heavy 3D world is lazy-loaded only
 * when the explorer commits.
 */
export default function TitleScreen() {
  const enterRealm = useGameStore((s) => s.enterRealm);
  const openRecruiter = useGameStore((s) => s.openRecruiter);
  const webglFailed = useGameStore((s) => s.webglFailed);
  const touch = isTouchDevice();

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Backdrop: torchlit dusk gradient + faint rune grid, no WebGL. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e14] via-[#0d1320] to-[#0a0c12]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#6ad0ff 1px, transparent 1px), linear-gradient(90deg, #6ad0ff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-realm-gold/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex h-full flex-col items-center justify-center px-5 text-center">
        <div className="mb-5 flex items-center gap-2 text-realm-gold animate-fade-in">
          <RelicIcon width={22} height={22} />
          <span className="font-mono text-xs uppercase tracking-[0.35em]">{OWNER.name}'s Portfolio</span>
        </div>

        <h1 className="font-display text-6xl font-bold tracking-tight text-realm-text drop-shadow-[0_0_30px_rgba(232,198,106,0.25)] sm:text-7xl animate-fade-in">
          {WORLD_NAME}
        </h1>
        <p className="mt-4 max-w-md text-balance text-realm-muted animate-fade-in">{WORLD_TAGLINE}</p>
        <p className="mt-2 max-w-lg text-sm text-realm-muted/80 animate-fade-in">
          A stranger arrives; the guilds hold the legends. Prove yourself at each, or skip straight to the work.
        </p>

        <div className="mt-9 flex w-full max-w-md flex-col gap-3 animate-fade-in">
          {!webglFailed && (
            <button onClick={enterRealm} className="btn-primary group py-3.5 text-base">
              <CompassIcon width={20} height={20} />
              Enter the realm
              <ArrowRightIcon
                width={18}
                height={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          )}
          <button
            onClick={openRecruiter}
            className={webglFailed ? "btn-primary py-3.5 text-base" : "btn-ghost py-3.5 text-base"}
          >
            I'm a recruiter — show me everything
          </button>
        </div>

        <div className="mt-7 flex items-center gap-4 text-realm-muted animate-fade-in">
          <a href={OWNER.github} target="_blank" rel="noreferrer noopener" className="transition hover:text-realm-gold" title="GitHub">
            <GithubIcon width={20} height={20} />
          </a>
          <a href={`mailto:${OWNER.email}`} className="transition hover:text-realm-gold" title="Email">
            <MailIcon width={20} height={20} />
          </a>
          <span className="text-realm-edge">·</span>
          <span className="font-mono text-xs">{TOTAL_SIGILS} guild sigils to earn</span>
        </div>

        {!webglFailed && (
          <p className="absolute bottom-6 font-mono text-[11px] text-realm-muted/60">
            {touch ? "Tap the joystick to move · tap glowing buildings to inspect" : "WASD / arrows to move · E to inspect · M for the map"}
          </p>
        )}
      </div>
    </div>
  );
}
