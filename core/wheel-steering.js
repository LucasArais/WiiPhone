// Adapted from pattssun/OpenWii (MIT); see THIRD_PARTY_NOTICES.md.
const DEG = Math.PI / 180;
const clamp1 = v => Math.max(-1, Math.min(1, v));
export const STEER_FULL = 18;

/**
 * Tray-grip steering, ported unchanged from the cow it was proven on: the
 * phone lies flat, one hand on each end, and rolling it (right end down)
 * steers right. Everything is measured RELATIVE to a reference captured
 * when the run starts, and the axis-end signs are frozen at that moment.
 *
 * The capture decides which end of the long axis is under the right hand
 * from the screen's slight lean toward the face; the player's right is 90°
 * clockwise from the player→phone line — the textbook v×up, DEVICE-PINNED
 * (2026-08-24) after two earlier builds accidentally play-tested only
 * their fallbacks and briefly pinned a mirror of reality.
 */
export function captureTray(axes, prevRight = null) {
  const vx = -axes.z.x;                 // player→phone viewing direction,
  const vy = -axes.z.y;                 // horizontal part
  const m = Math.hypot(vx, vy);
  let right = prevRight || { x: 1, y: 0 };
  if (m > 0.05) right = { x: vy / m, y: -vx / m };

  const sy = axes.y.x * right.x + axes.y.y * right.y >= 0 ? 1 : -1;
  const ref = { right, sy, bank0: 0 };
  ref.bank0 = trayRead(axes, ref).bank;
  return ref;
}

/** Bank in degrees, + = right end down, relative to the captured neutral. */
export function trayRead(axes, ref) {
  const rightEndZ = ref.sy * axes.y.z;
  return { bank: -Math.asin(clamp1(rightEndZ)) / DEG - ref.bank0 };
}

export const STEER_DEADZONE = 2.5;   // degrees of hand tremor ignored
export const BIAS_HEAL_BAND = 4.5;   // neutral re-learns only inside this
export const BIAS_HEAL_TAU_S = 6;    // …and this slowly, once settled
export const BIAS_SETTLE_S = 2;      // fast heal right after capture
export const BIAS_SETTLE_TAU_S = 0.6;

/** Deadzone with the full-lock point preserved: 2.5° reads as 0, 18° as 18. */
export function shapeSteer(bankDeg) {
  const a = Math.abs(bankDeg);
  if (a <= STEER_DEADZONE) return 0;
  const sign = bankDeg < 0 ? -1 : 1;
  return sign * (a - STEER_DEADZONE) * (STEER_FULL / (STEER_FULL - STEER_DEADZONE));
}

/**
 * The anti-drift stage between the tray and the ship. A single-packet
 * neutral capture plus ordinary attitude wander leaves a degree or two of
 * standing bias — and at 18° full lock that is a constant slide. The
 * filter re-learns the resting bias whenever the corrected bank sits
 * inside a small band (a hand at rest), quickly during the settle window
 * right after capture and very slowly after, and never while the player
 * is clearly steering. Output is deadzoned and full-lock-preserving.
 */
export class SteerFilter {
  constructor() {
    this.bias = 0;
    this.ageS = 0;
  }

  update(rawBank, dt) {
    this.ageS += dt;
    const corrected = rawBank - this.bias;
    if (Math.abs(corrected) < BIAS_HEAL_BAND) {
      const tau = this.ageS < BIAS_SETTLE_S ? BIAS_SETTLE_TAU_S : BIAS_HEAL_TAU_S;
      this.bias += Math.min(1, dt / tau) * (rawBank - this.bias);
    }
    return shapeSteer(corrected);
  }
}

