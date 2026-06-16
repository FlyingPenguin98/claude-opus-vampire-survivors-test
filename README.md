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

- **Prepare:** from the title, choose **Begin** → pick a **hero**, a **stage**, and a
  **difficulty** (Easy / Normal / Hard).
- **Move:** `WASD` or arrow keys
- **Dash:** `Shift` or `Space` — a quick dodge with brief invulnerability (short cooldown,
  shown by the HUD pip). Use it to punch out of a surround.
- **Touch / mobile:** drag the **left half of the screen** for a virtual movement joystick,
  and use the on-screen **⚡ dash** (bottom-right) and **❚❚ pause** (top-right) buttons.
- **Attack:** automatic — weapons fire on their own
- **Level up:** collect XP gems dropped by enemies; on level-up, pick **1 of 3** upgrades
  with the mouse or keys `1` / `2` / `3`
- **Evolve:** max a weapon, own its paired passive, then open a **treasure chest**
  (dropped by elites/bosses) to fuse it into a powered-up form.
- **Pause:** `Esc` / `P` (resume, settings, or quit)
- **Goal:** survive to the stage's dawn. Bosses arrive on a schedule.

## Gameplay features

- **5 playable characters** (Knight, Mage, Ranger, Vampire, Warden), each with a unique
  starting weapon and stat profile. Most are unlocked via achievements.
- **3 selectable stages** (Moonlit Meadow, Forgotten Crypt, Ashen Wastes) with their own
  palettes, enemy mixes, boss timelines, and a survive-to-dawn victory.
- **20 weapons + 13 evolutions** spanning many firing styles — the classic projectile/aura/orbit
  trio (Arcane Bolt, Fireball, Knives, Frost Aura, Orbit Blades, …) plus eight all-new behaviors:
  **Boomerang** (flies out and back), **Chain Lightning** (arcs between foes), **Shockwave**
  (knockback ring), **Meteor Storm** (AoE strikes from above), **Death Ray** (tracking beam),
  **Sentry Turret** (deployed auto-cannon), **Spirit Familiar** (a roaming ally), and
  **Singularity** (a black hole that pulls enemies in).
- **Difficulty modes** (Easy / Normal / Hard) scale enemy HP, damage, and spawn rate.
- **15 stacking passives** (damage, crit, area, cooldown, armor, regen, luck, XP, and more).
- **10 enemy types with real behaviors** — chargers that dash, splitters that burst into
  spawn, ranged shooters that fire back — plus **3 bosses** with barrage/charge patterns.
- **Meta shop:** spend earned gold on permanent powerups that apply to every run.
- **Achievements & unlocks** that gate extra characters and stages.
- **Procedural audio:** all SFX and music are synthesized at runtime via WebAudio
  (no audio files), with volume/mute in a settings panel.
- **Juice:** damage-number popups, enemy knockback, hit flashes, treasure chests, screen
  shake, and a revive option.
- HUD (HP, XP, level, timer, gold, kills, loadout), named boss health bar, run summary.
- Persistent meta (spendable/lifetime gold, best times, unlocks, settings) in `localStorage`.

## Project structure

```
src/
  main.ts            Phaser game config + scene registration
  config/            Tunable constants (GameConfig)
  scenes/            Boot, Preload, Title, CharacterSelect, Shop, Settings,
                     Game, UI, LevelUp, Pause, GameOver
  entities/          Player, Enemy, Projectile, EnemyProjectile, XPGem, Chest,
                     DamageNumber (pooled)
  systems/           Spawner, WeaponSystem, XPSystem, UpgradeSystem, AudioSystem
  gen/               Procedural art: PixelCanvas, Palette, SpriteFactory, generators/
  data/              Data-driven content: enemies, bosses, weapons (+ evolutions),
                     upgrades, powerups, characters, stages, achievements
  state/             RunState (per-run), MetaState (localStorage, versioned)
  types/             Shared interfaces
  util/              Math helpers, event names
```

### Tuning the game

Most balance lives in `src/data/` (enemy stats, weapon scaling, upgrade pool, wave
schedule) and `src/config/GameConfig.ts`. The look of any sprite lives in
`src/gen/generators/` and its palette in `src/gen/Palette.ts`.
