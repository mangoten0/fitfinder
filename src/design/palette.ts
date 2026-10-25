/**
 * Color tokens. Every color in the app comes from here, never from a literal in a component.
 *
 * The palette borrows from a clothing store rather than a tech product: porcelain fitting-room
 * walls, black woven brand labels, yellow markdown stickers, denim. Each retail color has one job.
 */
export type Palette = {
  /** Page background. Cool porcelain, never cream. */
  paper: string;
  /** Raised surfaces: sheets, selected segments. */
  raised: string;
  /** Recessed areas: image wells, skeletons, slider track. */
  well: string;
  /** The selected segment in a segmented control, sitting on a well. */
  selected: string;
  /** Slider thumbs. Always the lightest thing on screen so it reads in both modes. */
  thumb: string;

  /** Primary text and icons. */
  ink: string;
  /** Secondary text. Passes contrast for body copy on paper. */
  ink2: string;
  /** Decorative only: placeholders, disabled glyphs. Too faint for reading text. */
  ink3: string;
  /** Text on an ink fill. */
  onInk: string;
  /** Dividers and outlines. */
  line: string;

  /** Strong emphasis: savings, destructive actions, errors. Used sparingly. */
  cherry: string;
  onCherry: string;
  /** The markdown-sticker yellow. Reserved for the Dupe tag so it always means "cheaper". */
  markdown: string;
  onMarkdown: string;
  /** Reserved for the Alternative tag (in-stock replacement). */
  denim: string;
  onDenim: string;

  /** Collage backdrops for sticker moments. Never used for text. */
  lilac: string;
  peach: string;
  mint: string;
  sky: string;

  /** Highlight band for loading skeletons. */
  shimmer: string;
  /** RGB triple used to build shadows, e.g. `rgba(${shadowRGB}, 0.2)`. */
  shadowRGB: string;
};

export const lightPalette: Palette = {
  paper: '#EEEDF1',
  raised: '#FFFFFF',
  well: '#E2E0E7',
  selected: '#FFFFFF',
  thumb: '#FFFFFF',

  ink: '#1B1922',
  ink2: '#5D5968',
  ink3: '#9A96A5',
  onInk: '#EEEDF1',
  line: 'rgba(27, 25, 34, 0.12)',

  cherry: '#D0243A',
  onCherry: '#FFFFFF',
  markdown: '#F4D23C',
  onMarkdown: '#1B1922',
  denim: '#2F52A0',
  onDenim: '#FFFFFF',

  lilac: '#D4CBF0',
  peach: '#F6C9AD',
  mint: '#C2E2D0',
  sky: '#BFD6F2',

  shimmer: 'rgba(255, 255, 255, 0.65)',
  shadowRGB: '27, 25, 34',
};

export const darkPalette: Palette = {
  paper: '#131218',
  raised: '#1E1C24',
  well: '#27252E',
  selected: '#423F4C',
  thumb: '#F2F0F6',

  ink: '#F2F0F6',
  ink2: '#ABA6B6',
  ink3: '#6D6878',
  onInk: '#131218',
  line: 'rgba(242, 240, 246, 0.13)',

  cherry: '#FF5468',
  onCherry: '#1B0A0D',
  markdown: '#F2CE38',
  onMarkdown: '#1B1922',
  denim: '#8EA8EC',
  onDenim: '#131218',

  lilac: '#4A4166',
  peach: '#6B4A38',
  mint: '#35503F',
  sky: '#34496A',

  shimmer: 'rgba(255, 255, 255, 0.07)',
  shadowRGB: '0, 0, 0',
};

/** Color tokens that are safe to use for text and icons. */
export type InkTone =
  | 'ink'
  | 'ink2'
  | 'ink3'
  | 'onInk'
  | 'cherry'
  | 'onCherry'
  | 'onMarkdown'
  | 'denim'
  | 'onDenim';
