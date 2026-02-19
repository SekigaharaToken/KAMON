/**
 * Motion (Framer Motion) helpers for consistent animations.
 * Inspired by animate-ui.com patterns.
 *
 * All animations respect prefers-reduced-motion via the motion library's
 * built-in support (useReducedMotion).
 */

/** Fade-in + slide-up for cards and sections */
export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

/** Stagger children by index (multiply by delay) */
export function staggerDelay(index, base = 0.08) {
  return { delay: index * base };
}

/** Spring tap feedback for interactive elements */
export const tapSpring = {
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

/** Tab content swap animation */
export const tabContent = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.2, ease: "easeInOut" },
};

// --- KAMON-specific presets ---

/** Carousel swipe spring */
export const carouselSpring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/** Pop-in for celebrations (mint confirm, badge earn) */
export const popIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 400, damping: 15 },
};

/** Bounce alert for "streak at risk" warnings */
export const bounceAlert = {
  animate: { y: [0, -4, 0] },
  transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
};

/** Bar fill spring for score breakdowns */
export const barFill = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1 },
  transition: { type: "spring", stiffness: 200, damping: 20 },
};
