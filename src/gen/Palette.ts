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
};
