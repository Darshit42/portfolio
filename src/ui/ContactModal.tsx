import { OWNER } from "../data/config";
import { useGameStore } from "../store/useGameStore";
import Modal from "./Modal";
import { DownloadIcon, GithubIcon, MailIcon } from "./icons";

/** The Gate of Contact (F12) — reached at 6/6 relics, or from the top bar. */
export default function ContactModal() {
  const close = useGameStore((s) => s.closeOverlay);

  return (
    <Modal title="The Gate of Contact" subtitle="Every relic gathered." accent="#6ad0ff" onClose={close}>
      <div className="flex flex-col items-center gap-5 py-3 text-center">
        <p className="max-w-md leading-relaxed text-realm-text/90">
          You've walked the whole realm. If any of it resonated, the fastest way to reach me is
          email — I read every one. Let's build something.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={`mailto:${OWNER.email}`} className="btn-primary">
            <MailIcon width={18} height={18} /> {OWNER.email}
          </a>
          <a href={OWNER.github} target="_blank" rel="noreferrer noopener" className="btn-ghost">
            <GithubIcon width={18} height={18} /> @Darshit42
          </a>
          <a href={OWNER.resumeUrl} target="_blank" rel="noreferrer noopener" className="btn-ghost">
            <DownloadIcon width={18} height={18} /> Résumé
          </a>
        </div>
      </div>
    </Modal>
  );
}
