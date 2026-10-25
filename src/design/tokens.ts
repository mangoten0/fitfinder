/** Spacing scale on a 4pt grid. Use these instead of literal numbers for padding and gaps. */
export const space = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  /** Horizontal page margin. */
  gutter: 20,
} as const;

/**
 * Corner radii, chosen by what the thing is rather than one radius for everything.
 * Tags are cut paper (barely rounded), image wells are soft, boards are softer, controls are pills.
 */
export const radius = {
  tag: 4,
  control: 12,
  well: 20,
  board: 28,
  pill: 999,
} as const;

/** Fixed control sizes. */
export const metrics = {
  /** Minimum comfortable tap target on both platforms. */
  tapTarget: 44,
  buttonHeight: 54,
} as const;
