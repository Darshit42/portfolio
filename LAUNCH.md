# Devhalla — launch checklist (owner actions)

Everything below needs **Darshit** (real links, real devices); the engine work
is done. Tracked against PRD §12–§13.

## 1. Content to swap (placeholders are marked `unverified` in code)

All in `src/data/projects.ts` and `/public`:

- [ ] **Self-Healing Agent** — real repo URL (currently the profile link).
- [ ] **JEE Arena** — live URL and/or repo.
- [ ] **Voice Agent** — confirm `https://revrag.ai` and/or add a writeup link.
- [ ] **Nemotron RL** — real Kaggle notebook URL.
- [ ] **Finddder** — confirm `Darshit42/finddrrr` is the right repo and public.
- [ ] **Résumé** — replace `public/resume.pdf` (current file is a generated placeholder).
- [ ] Optional: LinkedIn URL in `src/data/config.ts` (`OWNER.linkedin`).
- [ ] Decide the name (PRD Q5): keep `Devhalla` or edit `WORLD_NAME` in `src/data/config.ts`.

## 2. Verification on real devices (can't be done headless)

- [ ] Walk the world on desktop: spawn → tavern door prompt → plaza → all 6 relics → Gate.
- [ ] Mid-tier Android: ≥30 fps in the world, joystick + tap-to-interact work, hints show.
- [ ] WebGL disabled (e.g. Chrome `--disable-webgl` or an old device): boots into Recruiter Mode with the polite note, no white screen.
- [ ] `prefers-reduced-motion` ON: no camera bob, no particles, dialogs type instantly.
- [ ] Keyboard-only run: tab focus visible in every overlay, all content reachable.
- [ ] Sound: unmute → ambient drone + relic chime; mute persists across reload.
- [ ] Lighthouse on the recruiter path: target ≥ 90 performance.

## 3. Deploy

Static host (Vercel/Netlify): build `npm run build`, publish `dist/`.
No env vars, no server. Single route, so no SPA-rewrite config is needed.

## 4. Feature flags as shipped (`src/data/config.ts`)

| Flag | State |
|---|---|
| combat | ON (generous, secondary; turn OFF to ship world-only) |
| audio | ON (default-muted, opt-in) |
| npcs / interiors / minimap / tts | ON |
| localSave / particles | ON |
| liveAgentWs | OFF (P2 — real agent feed over WebSocket) |

Flipping any flag is a one-line change and every combination is shippable.

## 5. Extensibility smoke test (PRD §12)

To add a 7th project: add a `Project` to `src/data/projects.ts` + a `Building`
(with `projectId`) to `src/data/buildings.ts`. Everything else — relic, codex,
tracker, fast travel, minimap, recruiter card, gate count — derives from data.
