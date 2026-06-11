# Devhalla

**A playable RPG world that *is* a software portfolio.**

Devhalla is a browser game — a top-down, semi-3D RPG town you walk around. Each
building enshrines one project as a glowing **Relic**; walk up and interact to
open a rich **Codex** panel (description, stack, links, live demo). Collect all
relics to open the **Gate of Contact**.

The single most important rule: a recruiter has ~30 seconds and may be on a
phone. There is a one-click **Recruiter Mode** that bypasses the game entirely
into a clean project index, resume, and contact. The game is the hook; it never
costs the signal.

## Stack

Vite · TypeScript (strict) · React · react-three-fiber (Three.js) · drei ·
Zustand · Tailwind. Static data, no backend.

## Develop

```bash
npm install
npm run dev        # start the dev server
npm run build      # typecheck + production build
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit
```

## Architecture

All content (projects, buildings, NPCs, quests, links) lives in `src/data` as
typed objects. **Adding a project is a data edit — zero engine changes.**

```
src/
  data/    projects, buildings, npcs, quests, config (feature flags + links)
  store/   useGameStore (Zustand) — UI mode, relics, player state, settings
  ui/      DOM overlays: title, HUD, Codex, Recruiter Mode, fast-travel, help
  game/    react-three-fiber world: World, Player, Buildings, Forge, camera...
```

Feature flags in `src/data/config.ts` keep every milestone shippable.

## Accessibility & resilience

- One-click Recruiter Mode is also the **WebGL fallback** — if 3D fails to init,
  the site boots straight into the clean index. Never a white screen.
- Full keyboard play, visible focus, AA contrast, `prefers-reduced-motion`
  honored.
