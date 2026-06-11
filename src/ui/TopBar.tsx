import { FEATURES, OWNER } from "../data/config";
import { useGameStore } from "../store/useGameStore";
import {
  DownloadIcon,
  GithubIcon,
  HelpIcon,
  MailIcon,
  MapIcon,
  MuteIcon,
  VolumeIcon,
} from "./icons";
import type { ReactNode } from "react";

/** Always-visible top bar (F10): recruiter mode, fast-travel, help, mute, links. */
export default function TopBar() {
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);
  const toggleHelp = useGameStore((s) => s.toggleHelp);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const openRecruiter = useGameStore((s) => s.openRecruiter);

  return (
    <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5 animate-fade-in">
      <button onClick={openRecruiter} className="btn-ghost h-9 px-3 text-sm" title="Skip to the project index">
        <span className="hidden sm:inline">Recruiter mode</span>
        <span className="sm:hidden">Recruiter</span>
      </button>

      <div className="mx-0.5 hidden h-6 w-px bg-realm-edge sm:block" />

      <IconBtn label="Map / fast-travel (M)" onClick={() => setMode(mode === "fasttravel" ? "playing" : "fasttravel")}>
        <MapIcon width={18} height={18} />
      </IconBtn>
      <IconBtn label="Help (?)" onClick={toggleHelp}>
        <HelpIcon width={18} height={18} />
      </IconBtn>
      {FEATURES.audio && (
        <IconBtn label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
          {muted ? <MuteIcon width={18} height={18} /> : <VolumeIcon width={18} height={18} />}
        </IconBtn>
      )}

      <div className="mx-0.5 hidden h-6 w-px bg-realm-edge sm:block" />

      <LinkBtn href={OWNER.github} label="GitHub">
        <GithubIcon width={18} height={18} />
      </LinkBtn>
      <LinkBtn href={`mailto:${OWNER.email}`} label="Email">
        <MailIcon width={18} height={18} />
      </LinkBtn>
      <LinkBtn href={OWNER.resumeUrl} label="Résumé">
        <DownloadIcon width={18} height={18} />
      </LinkBtn>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="btn-ghost h-9 w-9 rounded-lg p-0">
      {children}
    </button>
  );
}

function LinkBtn({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      aria-label={label}
      className="btn-ghost flex h-9 w-9 items-center justify-center rounded-lg p-0"
    >
      {children}
    </a>
  );
}
