# Character sprites

Drop pixel-art sprite sheets here and the game uses them automatically. Until a
file exists, a **procedural placeholder** is drawn in code, so nothing breaks —
the moment you add the real PNG, it upgrades on the next reload.

## Expected files

One PNG per role (filenames must match `src/data/sprites.ts`):

```
player.png  barkeep.png  guildmaster.png  oracle.png  automaton.png
merchant.png  blacksmith.png  guard.png
bug.png  wisp.png  slime.png  critter.png  bat.png  skeleton.png
```

## Expected layout (the default — edit the manifest if your pack differs)

A uniform grid of **16×16** frames. For humanoids (`fourRow` in the manifest):

```
row 0: walk DOWN   (cols 0..3)
row 1: walk UP
row 2: walk LEFT
row 3: walk RIGHT
row 4: attack DOWN  (optional — falls back to walk if absent)
row 5: attack UP
row 6: attack LEFT
row 7: attack RIGHT
```

Mobs use simpler layouts (see each entry in `src/data/sprites.ts`).

## Using Ninja Adventure (CC0)

The pack ships characters under `Actor/Characters/<Name>/SpriteSheet.png`
(16×16). Copy the ones you want here and rename to the filenames above. If a
sheet's row order differs from the table, just tweak that role's `anims`
(`rowBase`/`count`) and `frameW/H`/`cols`/`rows` in `src/data/sprites.ts` — no
engine changes needed. The whole system is grid + frame-index driven, so any
uniform sheet works.

CC0 = no attribution required, but a credit line in the repo is appreciated.
