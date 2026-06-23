# Devhalla

**A playable RPG world that *is* a software portfolio.**

Devhalla is a browser game — a top-down, semi-3D RPG town you walk around. Each
building is a **skill-category guild** that enshrines an unbounded list of
projects. Step into a guild to claim its **sigil** and open its **Codex** — a
list of every project in that category; pick one for the full detail
(description, stack, links, live demo). Earn every guild's sigil to open the
**Gate of Contact**.

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

All content (projects, categories, buildings, NPCs, quests, links) lives in
`src/data` as typed objects. **Adding a project is a pure data append — zero
engine changes.**

```
src/
  data/    projects, categories (guilds), buildings, npcs, quests, config
  store/   useGameStore (Zustand) — UI mode, sigils, player state, settings
  ui/      DOM overlays: title, HUD, Codex list + detail, Recruiter Mode, ...
  game/    react-three-fiber world: World, Player, Buildings, Forge, camera...
```

Feature flags in `src/data/config.ts` keep every milestone shippable.

### Guilds & projects (the scalable spine)

A **category** (`src/data/categories.ts`) is a guild — it lives in one building
and holds an unbounded list of projects. A **project**
(`src/data/projects.ts`) belongs to a category. This is what makes the world
scale without engine work:

- **Add a project** → append one entry to `PROJECTS` with a `category` matching a
  guild. It instantly appears in that guild's in-world Codex list *and* Recruiter
  Mode. No building, no placement, no win-condition edit. For example:

  ```ts
  // src/data/projects.ts — one appended entry, nothing else changes:
  {
    id: "bitcoin-predictor",
    name: "BTC Price-Range Predictor",
    tier: "research",
    category: "products-data",      // ← the only wiring needed
    oneLiner: "95% next-hour BTC interval via Monte Carlo.",
    blurb: "…",
    stack: ["Python", "Streamlit", "Plotly"],
    links: [{ label: "GitHub", url: "…", kind: "github" }],
    accent: "#f2b94c",
  }
  ```

- **Add a category** → append a `Category` to `CATEGORIES` with a spare building
  id (e.g. `spire-of-training` or `oracles-booth`, currently unclaimed). That
  building becomes a guild with its own sigil; the Gate now requires the new
  sigil automatically (`TOTAL_SIGILS = CATEGORIES.length`).

Per-project behaviors are flags, not buildings: `demo: { type: "forge-live" }`
(live demo), `speaks: true` (TTS read-aloud), `arena: true` (combat). The story
spine is thin flavor — guild-master NPC lines + an opening premise — and **never
gates** seeing a project. Recruiter Mode stays a flat, instant, WebGL-free index.

## Accessibility & resilience

- One-click Recruiter Mode is also the **WebGL fallback** — if 3D fails to init,
  the site boots straight into the clean index. Never a white screen.
- Full keyboard play, visible focus, AA contrast, `prefers-reduced-motion`
  honored.
