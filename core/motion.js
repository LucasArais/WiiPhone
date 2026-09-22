/**
 * Shared motion-processing helpers, used by the phone controller page.
 * Kept dependency-free so it can be loaded with a plain <script> tag.
 */
(function (global) {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Turns raw `deviceorientation` gamma (left/right tilt) into a steering
   * value in [-1, 1]. Calibrates against whatever angle the phone was at
   * when the player enabled motion, so it doesn't matter if they're not
   * holding it perfectly flat.
   */
  function createSteeringTracker({ sensitivityDeg = 30, smoothing = 0.25 } = {}) {
    let baseline = null;
    let smoothed = 0;

    return {
      calibrate(gamma) {
        baseline = gamma;
      },
      update(gamma) {
        if (baseline === null) baseline = gamma;
        const relative = clamp((gamma - baseline) / sensitivityDeg, -1, 1);
        smoothed = lerp(smoothed, relative, smoothing);
        return smoothed;
      },
      reset() {
        baseline = null;
        smoothed = 0;
      },
    };
  }

  global.WiiPhoneMotion = { clamp, lerp, createSteeringTracker };
})(window);
