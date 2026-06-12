/**
 * Shared, off-React combat state (read/written every frame, like playerState).
 * Combat is deliberately light and forgiving — flavor, not a battle system.
 */
export const combat = {
  /** Set when the player swings; <Enemies> consumes it once per frame. */
  attackPending: false,
  /** Timestamp of the last swing (for the swing visual). */
  lastAttackAt: 0,
  /** Player i-frames: no damage taken until this ms timestamp. */
  invulnUntil: 0,
  /** Timestamp the player was last hit (drives the damage vignette). */
  lastHitAt: 0,
};

export function doAttack(): void {
  combat.attackPending = true;
  combat.lastAttackAt = performance.now();
}

export function consumeAttack(): boolean {
  const v = combat.attackPending;
  combat.attackPending = false;
  return v;
}
