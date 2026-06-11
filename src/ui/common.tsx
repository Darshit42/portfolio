import type { Project, ProjectLink, Tier } from "../data/projects";
import { tierLabel } from "../data/projects";
import { ExternalIcon, GithubIcon } from "./icons";

const TIER_STYLE: Record<Tier, string> = {
  flagship: "border-realm-ember/60 text-realm-ember bg-realm-ember/10",
  production: "border-realm-rune/50 text-realm-rune bg-realm-rune/10",
  "open source": "border-[#3aa0ff]/50 text-[#7cc0ff] bg-[#3aa0ff]/10",
  venture: "border-[#ff5470]/50 text-[#ff8aa0] bg-[#ff5470]/10",
  research: "border-[#39d98a]/50 text-[#6fe3ad] bg-[#39d98a]/10",
  product: "border-realm-gold/50 text-realm-gold bg-realm-gold/10",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TIER_STYLE[tier]}`}
    >
      {tier === "flagship" ? "★ " : ""}
      {tierLabel(tier)}
    </span>
  );
}

export function StackTags({ stack }: { stack: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {stack.map((s) => (
        <span key={s} className="tag">
          {s}
        </span>
      ))}
    </div>
  );
}

export function ProjectLinkButton({ link }: { link: ProjectLink }) {
  const Icon = link.kind === "github" ? GithubIcon : ExternalIcon;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer noopener"
      className="btn-ghost px-3 py-1.5 text-sm"
      title={link.unverified ? `${link.label} (link pending verification)` : link.label}
    >
      <Icon width={16} height={16} />
      {link.label}
    </a>
  );
}

export function ProjectLinks({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap gap-2">
      {project.links.map((l) => (
        <ProjectLinkButton key={l.url + l.label} link={l} />
      ))}
    </div>
  );
}
