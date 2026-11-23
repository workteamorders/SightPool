/**
 * Switches for the landing hero's live background (src/components/site/ambience.tsx, archive-folder.tsx and
 * hero-motion.tsx). Set a switch to false to remove that effect from the markup. Strengths and timings live as CSS
 * variables in src/styles/tokens.css (--amb-*). Every effect is decorative: none carries status or data.
 */
export const AMBIENCE = {
  /** Lamp cone, soft glow and the moving shade behind the folder. */
  light: true,
  /** Specks of dust drifting through the light. */
  dust: true,
  /** The ruler and coordinate marks (static) and the occasional traced line with a small marker. */
  sightlines: true,
  /** A small marker that travels up and down the ruler without pause (wide screens, with the ruler). */
  marker: true,
  /** The rope on the binder edge sways a fraction of a degree (wide screens). */
  rope: true,
  /** A small clock in UTC from the visitor's own browser, top right (from tablet width up). Not chain data. */
  clock: true,
  /** A blinking caret after the hero label. */
  caret: true,
  /** Outlined sheet silhouettes and registration marks behind the receipt. */
  depth: true,
  /** Cursor parallax on the decorative layers behind the receipt. Fine pointers only; never on touch. */
  parallax: true,
  /** Decorative layers drift at slightly different speeds while scrolling. */
  scroll: true,
} as const;
