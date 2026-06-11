import { OWNER, WORLD_NAME } from "../data/config";
import { PROJECTS, type Project } from "../data/projects";
import { useGameStore } from "../store/useGameStore";
import ForgeDemo from "./ForgeDemo";
import { ProjectLinks, StackTags, TierBadge } from "./common";
import {
  ArrowRightIcon,
  CompassIcon,
  DownloadIcon,
  GithubIcon,
  MailIcon,
} from "./icons";

/**
 * Recruiter Mode (F9) — the signal-safety net. A clean, instant, WebGL-free
 * index of every project + resume + contact, reachable in one tap from the
 * title screen and the top bar. Also the WebGL fallback (PRD §4.7, §5).
 */
export default function RecruiterMode() {
  const enterRealm = useGameStore((s) => s.enterRealm);
  const setMode = useGameStore((s) => s.setMode);
  const webglFailed = useGameStore((s) => s.webglFailed);

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-realm-bg">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-6 border-b border-realm-edge pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 font-mono text-xs uppercase tracking-[0.25em] text-realm-muted">
              {WORLD_NAME} · Project Index
            </div>
            <h1 className="font-display text-3xl font-bold text-realm-text sm:text-4xl">
              {OWNER.name}
            </h1>
            <p className="mt-1 text-realm-gold">{OWNER.role}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-realm-muted">
              {OWNER.bio}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a href={OWNER.github} target="_blank" rel="noreferrer noopener" className="btn-ghost text-sm">
              <GithubIcon width={16} height={16} /> GitHub
            </a>
            <a href={`mailto:${OWNER.email}`} className="btn-ghost text-sm">
              <MailIcon width={16} height={16} /> Email
            </a>
            <a href={OWNER.resumeUrl} target="_blank" rel="noreferrer noopener" className="btn-primary text-sm">
              <DownloadIcon width={16} height={16} /> Résumé
            </a>
          </div>
        </header>

        {webglFailed && (
          <div className="mb-6 rounded-lg border border-realm-edge bg-realm-panelHi/50 px-4 py-3 text-sm text-realm-muted">
            Your device skipped the 3D world — here's everything, the fast way.
          </div>
        )}

        {/* Projects */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PROJECTS.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>

        {/* Contact CTA */}
        <footer className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-realm-edge bg-realm-panel/60 px-6 py-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-realm-text">Let's build something.</h2>
          <p className="max-w-xl text-sm text-realm-muted">
            If any of this resonates, I'd love to talk. The fastest way to reach me is email.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`mailto:${OWNER.email}`} className="btn-primary">
              <MailIcon width={18} height={18} /> {OWNER.email}
            </a>
            <a href={OWNER.github} target="_blank" rel="noreferrer noopener" className="btn-ghost">
              <GithubIcon width={18} height={18} /> @Darshit42
            </a>
          </div>

          {!webglFailed && (
            <button onClick={enterRealm} className="btn-ghost mt-2 text-sm">
              <CompassIcon width={16} height={16} /> Or explore the realm instead
              <ArrowRightIcon width={16} height={16} />
            </button>
          )}
          {webglFailed && (
            <button onClick={() => setMode("title")} className="text-xs text-realm-muted underline-offset-4 hover:underline">
              Back to title
            </button>
          )}
        </footer>

        <p className="mt-6 text-center font-mono text-[11px] text-realm-muted/60">
          {WORLD_NAME} — a playable portfolio. Built with React, Three.js & too much coffee.
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const isFlagship = project.tier === "flagship";
  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border bg-realm-panel/60 p-5 transition hover:border-realm-gold/40 ${
        isFlagship ? "border-realm-ember/40 md:col-span-2" : "border-realm-edge"
      }`}
      style={{ boxShadow: `inset 3px 0 0 ${project.accent}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-realm-text">{project.name}</h3>
          <p className="mt-0.5 text-sm text-realm-gold">{project.oneLiner}</p>
        </div>
        <TierBadge tier={project.tier} />
      </div>

      <p className="text-sm leading-relaxed text-realm-muted">{project.blurb}</p>

      {isFlagship && project.demo?.type === "forge-live" && (
        <div className="my-1">
          <ForgeDemo />
        </div>
      )}

      <StackTags stack={project.stack} />

      <div className="mt-auto pt-1">
        <ProjectLinks project={project} />
      </div>
    </article>
  );
}
