# Nightfall Survivors

A top-down, **Vampire Survivors**-style auto-battler with a hi-res **16-bit JRPG**
aesthetic (think Pokémon Black/White and Final Fantasy VI). Move, dodge the swarm,
and let your weapons fire automatically while you level up and build a deadly loadout.

**Every sprite is generated procedurally in code** — there are no image assets. Sprites
are drawn pixel-by-pixel into Phaser canvas textures with limited palettes, dark
outlines, and shade ramps, then displayed with crisp nearest-neighbor scaling.

## Play online

- **GitHub Pages (auto-deployed):** https://flyingpenguin98.github.io/claude-opus-vampire-survivors-test/
  Built and published automatically by `.github/workflows/deploy.yml` on every push.
- **Instant preview via githack:** https://raw.githack.com/FlyingPenguin98/claude-opus-vampire-survivors-test/claude/vampire-survivors-topdown-h8y6t0/dist/index.html
  (serves the committed `dist/` — handy for quick sharing).

## Tech

- [Phaser 3](https://phaser.io/) (Arcade physics) + TypeScript
- [Vite](https://vitejs.dev/) for dev server and bundling

## Running

```bash
npm install
npm run dev      # start the dev server, then open the printed URL
```

Other commands:

```bash
npm run build    # typecheck (tsc) + production bundle into dist/
npm run preview  # serve the production build locally
```

## How to play

- **Move:** `WASD` or arrow keys
- **Attack:** automatic — weapons fire on their own
- **Level up:** collect XP gems dropped by enemies; on level-up, pick **1 of 3** upgrades
  with the mouse or keys `1` / `2` / `3`
- **Goal:** survive as long as you can. A **boss** arrives at the 3-minute mark.

## Gameplay features

- Player movement with walk/idle animation, facing flip, and post-hit i-frames
- Four enemy types (bat, zombie, slime, skeleton) plus a boss, all with idle animations
- Four weapons that scale with levels:
  - **Arcane Bolt** — homing projectile at the nearest foe
  - **Holy Spark** — spread of fast sparks
  - **Frost Aura** — damage field around you
  - **Orbit Blades** — rotating blades that slice nearby enemies
- Passive upgrades (damage, cooldown, move speed, pickup radius, max HP, extra projectiles)
- XP gems with a pickup-magnet radius, gold drops, time-based wave scaling
- HUD (HP, XP, level, timer, gold, kills), boss health bar, game-over summary
- Persistent meta (lifetime gold, best time) saved to `localStorage`

## Project structure

```
src/
  main.ts            Phaser game config + scene registration
  config/            Tunable constants (GameConfig)
  scenes/            Boot, Preload, Title, Game, UI, LevelUp, GameOver
  entities/          Player, Enemy, Projectile, XPGem (pooled)
  systems/           Spawner, WeaponSystem, XPSystem, UpgradeSystem
  gen/               Procedural art: PixelCanvas, Palette, SpriteFactory, generators/
  data/              Data-driven content: enemies, weapons, upgrades, waves
  state/             RunState (per-run), MetaState (localStorage)
  types/             Shared interfaces
  util/              Math helpers, event names
```

### Tuning the game

Most balance lives in `src/data/` (enemy stats, weapon scaling, upgrade pool, wave
schedule) and `src/config/GameConfig.ts`. The look of any sprite lives in
`src/gen/generators/` and its palette in `src/gen/Palette.ts`.
