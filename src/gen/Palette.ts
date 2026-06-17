/**
 * 16-bit-style palettes. Each palette is an array of CSS color strings indexed by
 * the small integers used in sprite "pixel maps". Index 0 is ALWAYS transparent so
 * generators can leave empty space. Index 1 is conventionally the dark outline.
 *
 * Keeping a small, deliberate ramp per material (dark shadow -> midtone -> highlight)
 * is what gives sprites the painterly SNES/JRPG read rather than flat blocks.
 */
export type Palette = (string | null)[];

const T = null; // transparent

export const PALETTES: Record<string, Palette> = {
  // Hero: cloak-wearing adventurer. [_, outline, skinShadow, skin, hairDark, hair,
  //   cloakDark, cloak, cloakHi, steel, gold]
  hero: [
    T,
    '#21161f',
    '#9c5a3c',
    '#d99a6c',
    '#3a2a4d',
    '#5e4a7a',
    '#27406b',
    '#3f6fc0',
    '#74a8f0',
    '#cfd6e6',
    '#f2c14e',
  ],

  // Bat: small fast flyer. [_, outline, wingDark, wing, body, eye]
  bat: [T, '#1a1024', '#3a2150', '#5a2d6e', '#7e3c8c', '#ff5a7a'],

  // Zombie: shambling grunt. [_, outline, fleshShadow, flesh, fleshHi, ragDark, rag, eye]
  zombie: [
    T,
    '#10210f',
    '#3f6b32',
    '#5f944a',
    '#7fb964',
    '#3a2e22',
    '#5e4a36',
    '#d7ff5a',
  ],

  // Slime: bouncy blob. [_, outline, bodyDark, body, bodyHi, shine, eye]
  slime: [T, '#0b2536', '#0f5b86', '#1488c0', '#3fb6e6', '#bff0ff', '#06202c'],

  // Skeleton: brittle tank. [_, outline, boneShadow, bone, boneHi, eye, cloth]
  skeleton: [T, '#1c1c24', '#7c7c8a', '#b6b6c4', '#e6e6f0', '#ff7a2a', '#5a2030'],

  // Boss "Revenant Lord": large, ominous. [_, outline, armorDark, armor, armorHi,
  //   cloakDark, cloak, glow, gold]
  boss: [
    T,
    '#160a14',
    '#4a1030',
    '#8a1e44',
    '#c43358',
    '#2a0e30',
    '#4a1e54',
    '#ff486a',
    '#ffcf5a',
  ],
  // Boss "Bone Warlock": sickly green sorcerer (same slot layout as boss).
  boss_warlock: [T, '#0a160a', '#1f3a10', '#3a6b1f', '#5a9a3a', '#1a0a30', '#3a1f5a', '#9aff5a', '#c0a8f0'],
  // Boss "Ashen Behemoth": molten brute (same slot layout as boss).
  boss_behemoth: [T, '#1a0a06', '#3a1a10', '#6b3018', '#9a4a20', '#2a1410', '#4a2418', '#ff6a2a', '#ffcf5a'],

  // --- Hero variants (same slot layout as `hero`) ---
  // [_, outline, skinShadow, skin, hairDark, hair, cloakDark, cloak, cloakHi, steel, gold]
  hero_mage: [T, '#1a1226', '#9c5a3c', '#d99a6c', '#b0b0c0', '#e8e8f4', '#3a1f6b', '#6b3fc0', '#a87af0', '#cfd6e6', '#f2c14e'],
  hero_ranger: [T, '#15210f', '#9c5a3c', '#d99a6c', '#3a2a1a', '#6b4a2a', '#1f4a27', '#3f8a4a', '#74d08a', '#cfd6e6', '#f2c14e'],
  hero_vampire: [T, '#1a0a12', '#b08a8a', '#e8cccc', '#2a1020', '#5a2030', '#3a0a14', '#7a1020', '#c43358', '#cfd6e6', '#f2c14e'],
  hero_warden: [T, '#1c1c24', '#9c5a3c', '#d99a6c', '#3a3a4a', '#5a5a6a', '#5a5a66', '#8a8a9a', '#cfd6e6', '#e6e6f0', '#f2c14e'],

  // --- New enemies ---
  // hound: [_, outline, furDark, fur, furHi, eye]
  hound: [T, '#1a0f0a', '#3a1f12', '#6b3a1f', '#8a5a2a', '#ff5a2a'],
  // blob (toxic): [_, outline, bodyDark, body, bodyHi, shine, eye]
  blob: [T, '#0b2e10', '#1f6b2a', '#2a9a3a', '#5fd06a', '#c8ffd0', '#0a200c'],
  // wisp (ghost): [_, outline, robeDark, robe, robeHi, glow]
  wisp: [T, '#101a2a', '#2a3a6a', '#4a6ad0', '#9ab0ff', '#eaf2ff'],
  // golem (rock): [_, outline, rockDark, rock, rockHi, rockTop, eye]
  golem: [T, '#14140f', '#3a3a30', '#5a5a4a', '#7a7a66', '#9aa088', '#ff9a3a'],
  // brute (ogre): [_, outline, skinDark, skin, skinHi, cloth, eye]
  brute: [T, '#1a0f14', '#3a1f2a', '#6b3a4a', '#8a5a6a', '#2a3a1a', '#ffd23a'],

  // --- Stage-themed enemies ---
  // Meadow. wolf (beast): [_, outline, furDark, fur, furHi, eye]
  wolf: [T, '#15151a', '#3a3a44', '#5e5e6c', '#8a8a98', '#ffd23a'],
  // spriggan (plant tank): [_, outline, barkDark, bark, barkHi, leaf, eye]
  spriggan: [T, '#0f1a0c', '#3a2a18', '#5e4226', '#86603a', '#3f8a3a', '#ffe23a'],
  // myconid (mushroom): [_, outline, capDark, cap, capHi, stalk, spot]
  myconid: [T, '#1a0f14', '#7a1f3a', '#b8324f', '#e85a72', '#e6d8c0', '#ffd6e0'],
  // spore (mini, toxic): [_, outline, bodyDark, body, bodyHi, shine, eye]
  spore: [T, '#0b2e10', '#2a6b1f', '#46a02a', '#7fd05a', '#d8ffc0', '#0a200c'],

  // Crypt. ghoul (rotting): [_, outline, fleshShadow, flesh, fleshHi, ragDark, rag, eye]
  ghoul: [T, '#120f1a', '#3a4a44', '#5e7068', '#86988c', '#241a2a', '#3a2a44', '#a8ff6a'],
  // wraith (ghost): [_, outline, robeDark, robe, robeHi, glow]
  wraith: [T, '#140a1a', '#3a1f5a', '#6b3f9a', '#a87ad0', '#eac8ff'],
  // boneknight (armored undead): [_, outline, boneDark, bone, boneHi, armorDark, armor, eye]
  boneknight: [T, '#16161c', '#7c7c8a', '#b6b6c4', '#e6e6f0', '#2a2a3a', '#4a4a5e', '#6ad8ff'],

  // Wastes. imp (demon flyer): [_, outline, wingDark, wing, body, eye]
  imp: [T, '#1a0a08', '#5a1810', '#8a2418', '#c4402a', '#ffe23a'],
  // cinder (ash wraith): [_, outline, robeDark, robe, robeHi, glow]
  cinder: [T, '#1a0c06', '#4a2410', '#7a3a16', '#aa5a26', '#ffb05a'],

  // --- Elites (champion recolors) ---
  // thornback (meadow plant champion): spriggan layout, gilded
  thornback: [T, '#0d160a', '#2a1f10', '#4a3818', '#6e5226', '#5ab84a', '#ffe66a'],
  // bone-colossus (crypt undead champion): boneknight layout, gold-trimmed
  'bone-colossus': [T, '#16161c', '#8a8a78', '#d0d0b8', '#f4f4e0', '#3a2e10', '#8a6a20', '#ff7a2a'],
  // magma-colossus (wastes molten champion): golem layout
  'magma-colossus': [T, '#1a0a06', '#3a1208', '#6b2410', '#a8421a', '#e87a2a', '#ffd23a'],

  // --- New stage bosses (boss layout: [_, outline, armorDark, armor, armorHi, cloakDark, cloak, glow, gold]) ---
  boss_moon: [T, '#0a0f1a', '#1f2a4a', '#3a5a8a', '#6a8ac4', '#1a2438', '#2a3a5a', '#cfe6ff', '#f2e08a'],
  boss_warden: [T, '#0d160a', '#1f3a18', '#3a6b2a', '#5e9a3a', '#2a1f10', '#4a3818', '#bfff8a', '#ffe23a'],
  boss_tyrant: [T, '#1a0604', '#5a160a', '#8a2410', '#c4401a', '#2a0c06', '#4a1810', '#ff8a2a', '#ffd23a'],
};
