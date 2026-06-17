/**
 * Thin wrapper around the Vibration API for mobile haptic feedback. No-ops on
 * devices without support or when the player has disabled haptics in settings.
 */
let enabled = true;

export const Haptics = {
  configure(on: boolean): void {
    enabled = on;
  },
  vibrate(pattern: number | number[]): void {
    if (!enabled) return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* unsupported — ignore */
    }
  },
};
